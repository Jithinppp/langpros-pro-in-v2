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
RETURNS void AS $$
BEGIN
    UPDATE categories SET is_active = true WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;

-- Subcategory restore (restores parent category if inactive)
CREATE OR REPLACE FUNCTION restore_subcategory(p_id uuid)
RETURNS void AS $$
DECLARE
    v_category_id uuid;
BEGIN
    SELECT category_id INTO v_category_id FROM subcategories WHERE id = p_id;
    IF v_category_id IS NOT NULL THEN
        UPDATE categories SET is_active = true WHERE id = v_category_id AND is_active = false;
    END IF;
    UPDATE subcategories SET is_active = true WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;

-- Model restore (restores parent subcategory and category if inactive)
CREATE OR REPLACE FUNCTION restore_model(p_id uuid)
RETURNS void AS $$
DECLARE
    v_subcategory_id uuid;
    v_category_id uuid;
BEGIN
    SELECT subcategory_id INTO v_subcategory_id FROM models WHERE id = p_id;
    IF v_subcategory_id IS NOT NULL THEN
        SELECT category_id INTO v_category_id FROM subcategories WHERE id = v_subcategory_id;
        IF v_category_id IS NOT NULL THEN
            UPDATE categories SET is_active = true WHERE id = v_category_id AND is_active = false;
        END IF;
        UPDATE subcategories SET is_active = true WHERE id = v_subcategory_id AND is_active = false;
    END IF;
    UPDATE models SET is_active = true WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;

-- Asset restore (restores parent model, subcategory, and category if inactive)
CREATE OR REPLACE FUNCTION restore_asset(p_id uuid)
RETURNS void AS $$
DECLARE
    v_model_id uuid;
    v_subcategory_id uuid;
    v_category_id uuid;
BEGIN
    SELECT model_id INTO v_model_id FROM assets WHERE id = p_id;
    IF v_model_id IS NOT NULL THEN
        SELECT subcategory_id INTO v_subcategory_id FROM models WHERE id = v_model_id;
        IF v_subcategory_id IS NOT NULL THEN
            SELECT category_id INTO v_category_id FROM subcategories WHERE id = v_subcategory_id;
            IF v_category_id IS NOT NULL THEN
                UPDATE categories SET is_active = true WHERE id = v_category_id AND is_active = false;
            END IF;
            UPDATE subcategories SET is_active = true WHERE id = v_subcategory_id AND is_active = false;
        END IF;
        UPDATE models SET is_active = true WHERE id = v_model_id AND is_active = false;
    END IF;
    UPDATE assets SET is_active = true, updated_at = now() WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;
