-- Soft Delete Cascade Migration
-- Run this in the Supabase SQL Editor

-- 1. Alter Foreign Keys to use ON DELETE NO ACTION
-- assets.model_id -> models.id
ALTER TABLE assets DROP CONSTRAINT IF EXISTS items_model_id_fkey;
ALTER TABLE assets ADD CONSTRAINT items_model_id_fkey
    FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE NO ACTION;

-- models.subcategory_id -> subcategories.id
ALTER TABLE models DROP CONSTRAINT IF EXISTS models_subcategory_id_fkey;
ALTER TABLE models ADD CONSTRAINT models_subcategory_id_fkey
    FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE NO ACTION;

-- subcategories.category_id -> categories.id
ALTER TABLE subcategories DROP CONSTRAINT IF EXISTS subcategories_category_id_fkey;
ALTER TABLE subcategories ADD CONSTRAINT subcategories_category_id_fkey
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE NO ACTION;

-- 2. Ensure is_active columns exist on all tables
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE models ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
-- assets.is_active already exists

-- 3. Create Soft Delete Functions

-- Asset soft delete (leaf node)
CREATE OR REPLACE FUNCTION soft_delete_asset(p_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE assets SET is_active = false, updated_at = now() WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;

-- Model soft delete (cascades to assets)
CREATE OR REPLACE FUNCTION soft_delete_model(p_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE assets SET is_active = false, updated_at = now() WHERE model_id = p_id;
    UPDATE models SET is_active = false WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;

-- Subcategory soft delete (cascades to models and assets)
CREATE OR REPLACE FUNCTION soft_delete_subcategory(p_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE assets SET is_active = false, updated_at = now()
        WHERE model_id IN (SELECT id FROM models WHERE subcategory_id = p_id);
    UPDATE models SET is_active = false WHERE subcategory_id = p_id;
    UPDATE subcategories SET is_active = false WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;

-- Category soft delete (cascades to subcategories, models, assets)
CREATE OR REPLACE FUNCTION soft_delete_category(p_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE assets SET is_active = false, updated_at = now()
        WHERE model_id IN (
            SELECT id FROM models
            WHERE subcategory_id IN (
                SELECT id FROM subcategories WHERE category_id = p_id
            )
        );
    UPDATE models SET is_active = false
        WHERE subcategory_id IN (
            SELECT id FROM subcategories WHERE category_id = p_id
        );
    UPDATE subcategories SET is_active = false WHERE category_id = p_id;
    UPDATE categories SET is_active = false WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;

-- 4. Create Restore Functions (with parent cascade restore)

-- Category restore (no parent)
CREATE OR REPLACE FUNCTION restore_category(p_id uuid)
RETURNS jsonb AS $$
BEGIN
    UPDATE categories SET is_active = true WHERE id = p_id;
    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql;

-- Subcategory restore (requires parent category to be active, then restores parent chain)
-- Returns: JSON with missing_parent info if parent is deleted
CREATE OR REPLACE FUNCTION restore_subcategory(p_id uuid)
RETURNS jsonb AS $$
DECLARE
    v_category_id uuid;
    v_category_active boolean;
    v_category_name text;
BEGIN
    SELECT category_id INTO v_category_id FROM subcategories WHERE id = p_id;
    
    IF v_category_id IS NULL THEN
        RETURN jsonb_build_object('error', 'Subcategory has no category assigned');
    END IF;
    
    SELECT is_active, name INTO v_category_active, v_category_name FROM categories WHERE id = v_category_id;
    IF v_category_active IS NULL OR v_category_active = false THEN
        RETURN jsonb_build_object(
            'error', 'Cannot restore subcategory: parent category is deleted',
            'missing_parent', jsonb_build_object(
                'type', 'category',
                'id', v_category_id,
                'name', v_category_name
            )
        );
    END IF;
    
    -- Restore the subcategory
    UPDATE subcategories SET is_active = true WHERE id = p_id;
    
    -- Restore parent (category)
    UPDATE categories SET is_active = true WHERE id = v_category_id;
    
    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql;

-- Model restore (requires parent subcategory to be active, then restores entire parent chain)
-- Returns: JSON with missing_parent info if parent is deleted
CREATE OR REPLACE FUNCTION restore_model(p_id uuid)
RETURNS jsonb AS $$
DECLARE
    v_subcategory_id uuid;
    v_category_id uuid;
    v_subcategory_active boolean;
    v_category_active boolean;
    v_subcategory_name text;
    v_category_name text;
BEGIN
    SELECT subcategory_id INTO v_subcategory_id FROM models WHERE id = p_id;
    
    IF v_subcategory_id IS NULL THEN
        RETURN jsonb_build_object('error', 'Model has no subcategory assigned');
    END IF;
    
    SELECT is_active, name INTO v_subcategory_active, v_subcategory_name FROM subcategories WHERE id = v_subcategory_id;
    IF v_subcategory_active IS NULL OR v_subcategory_active = false THEN
        RETURN jsonb_build_object(
            'error', 'Cannot restore model: parent subcategory is deleted',
            'missing_parent', jsonb_build_object(
                'type', 'subcategory',
                'id', v_subcategory_id,
                'name', v_subcategory_name
            )
        );
    END IF;
    
    SELECT category_id INTO v_category_id FROM subcategories WHERE id = v_subcategory_id;
    IF v_category_id IS NOT NULL THEN
        SELECT is_active, name INTO v_category_active, v_category_name FROM categories WHERE id = v_category_id;
        IF v_category_active IS NULL OR v_category_active = false THEN
            RETURN jsonb_build_object(
                'error', 'Cannot restore model: parent category is deleted',
                'missing_parent', jsonb_build_object(
                    'type', 'category',
                    'id', v_category_id,
                    'name', v_category_name
                )
            );
        END IF;
    END IF;
    
    -- Restore the model
    UPDATE models SET is_active = true WHERE id = p_id;
    
    -- Restore parent chain (subcategory, category)
    UPDATE subcategories SET is_active = true WHERE id = v_subcategory_id;
    IF v_category_id IS NOT NULL THEN
        UPDATE categories SET is_active = true WHERE id = v_category_id;
    END IF;
    
    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql;

-- Asset restore: ONLY restores asset (requires parent model to be active)
-- Does NOT auto-restore parents - user must restore parents manually
CREATE OR REPLACE FUNCTION restore_asset(p_id uuid)
RETURNS jsonb AS $$
DECLARE
    v_model_id uuid;
    v_model_active boolean;
    v_model_name text;
BEGIN
    SELECT model_id INTO v_model_id FROM assets WHERE id = p_id;
    
    IF v_model_id IS NULL THEN
        RETURN jsonb_build_object('error', 'Asset has no model assigned');
    END IF;
    
    SELECT is_active, name INTO v_model_active, v_model_name FROM models WHERE id = v_model_id;
    IF v_model_active IS NULL OR v_model_active = false THEN
        RETURN jsonb_build_object(
            'error', 'Cannot restore asset: parent model is deleted',
            'missing_parent', jsonb_build_object('type', 'model', 'id', v_model_id, 'name', v_model_name)
        );
    END IF;
    
    UPDATE assets SET is_active = true, updated_at = now() WHERE id = p_id;
    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql;

-- Model restore: ONLY restores model (requires parent subcategory to be active)
CREATE OR REPLACE FUNCTION restore_model(p_id uuid)
RETURNS jsonb AS $$
DECLARE
    v_subcategory_id uuid;
    v_subcategory_active boolean;
    v_subcategory_name text;
BEGIN
    SELECT subcategory_id INTO v_subcategory_id FROM models WHERE id = p_id;
    
    IF v_subcategory_id IS NULL THEN
        RETURN jsonb_build_object('error', 'Model has no subcategory assigned');
    END IF;
    
    SELECT is_active, name INTO v_subcategory_active, v_subcategory_name FROM subcategories WHERE id = v_subcategory_id;
    IF v_subcategory_active IS NULL OR v_subcategory_active = false THEN
        RETURN jsonb_build_object(
            'error', 'Cannot restore model: parent subcategory is deleted',
            'missing_parent', jsonb_build_object('type', 'subcategory', 'id', v_subcategory_id, 'name', v_subcategory_name)
        );
    END IF;
    
    UPDATE models SET is_active = true WHERE id = p_id;
    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql;

-- Subcategory restore: ONLY restores subcategory (requires parent category to be active)
CREATE OR REPLACE FUNCTION restore_subcategory(p_id uuid)
RETURNS jsonb AS $$
DECLARE
    v_category_id uuid;
    v_category_active boolean;
    v_category_name text;
BEGIN
    SELECT category_id INTO v_category_id FROM subcategories WHERE id = p_id;
    
    IF v_category_id IS NULL THEN
        RETURN jsonb_build_object('error', 'Subcategory has no category assigned');
    END IF;
    
    SELECT is_active, name INTO v_category_active, v_category_name FROM categories WHERE id = v_category_id;
    IF v_category_active IS NULL OR v_category_active = false THEN
        RETURN jsonb_build_object(
            'error', 'Cannot restore subcategory: parent category is deleted',
            'missing_parent', jsonb_build_object('type', 'category', 'id', v_category_id, 'name', v_category_name)
        );
    END IF;
    
    UPDATE subcategories SET is_active = true WHERE id = p_id;
    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql;

-- Category restore: ONLY restores category (no parent)
CREATE OR REPLACE FUNCTION restore_category(p_id uuid)
RETURNS jsonb AS $$
BEGIN
    UPDATE categories SET is_active = true WHERE id = p_id;
    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql;



-- log_activity 
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO activity_logs (action, entity_type, entity_id, new_values)
    VALUES ('create', TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_active = true AND NEW.is_active = false THEN
      INSERT INTO activity_logs (action, entity_type, entity_id, old_values, new_values)
      VALUES ('delete', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    ELSEIF OLD.is_active = false AND NEW.is_active = true THEN
      INSERT INTO activity_logs (action, entity_type, entity_id, old_values, new_values)
      VALUES ('restore', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    ELSE
      INSERT INTO activity_logs (action, entity_type, entity_id, old_values, new_values)
      VALUES ('update', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;


-- restore_asset
BEGIN
    UPDATE assets SET is_active = true, updated_at = now() WHERE id = p_id;
END;

-- restore_category
BEGIN
    UPDATE categories SET is_active = true WHERE id = p_id;
END;

-- restore_model
BEGIN
    UPDATE models SET is_active = true WHERE id = p_id;
END;

-- restore_subcategory
BEGIN
    UPDATE subcategories SET is_active = true WHERE id = p_id;
END;


-- soft_delete_asset
BEGIN
    UPDATE assets SET is_active = false, updated_at = now() WHERE id = p_id;
END;

-- soft_delete_category
BEGIN
    UPDATE assets SET is_active = false, updated_at = now()
        WHERE model_id IN (
            SELECT id FROM models
            WHERE subcategory_id IN (
                SELECT id FROM subcategories WHERE category_id = p_id
            )
        );
    UPDATE models SET is_active = false
        WHERE subcategory_id IN (
            SELECT id FROM subcategories WHERE category_id = p_id
        );
    UPDATE subcategories SET is_active = false WHERE category_id = p_id;
    UPDATE categories SET is_active = false WHERE id = p_id;
END;

-- soft_delete_model
BEGIN
    UPDATE assets SET is_active = false, updated_at = now() WHERE model_id = p_id;
    UPDATE models SET is_active = false WHERE id = p_id;
END;

-- soft_delete_subcategory
BEGIN
    UPDATE assets SET is_active = false, updated_at = now()
        WHERE model_id IN (SELECT id FROM models WHERE subcategory_id = p_id);
    UPDATE models SET is_active = false WHERE subcategory_id = p_id;
    UPDATE subcategories SET is_active = false WHERE id = p_id;
END;

-- update_updated_at
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
