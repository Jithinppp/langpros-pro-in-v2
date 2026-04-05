import { useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Textarea } from "@headlessui/react";
import { supabase } from "../../lib/supabase";
import Input from "../../components/Input";
import Button from "../../components/Button";
import SelectDropdown from "../../components/SelectDropdown";
import Loading from "../../components/Loading";
import AlertBanner from "../../components/AlertBanner";
import { useEquipmentStore } from "../../store/equipmentStore";
import { Plus, Upload } from "lucide-react";

interface Category {
  id: string;
  name: string;
  code: string;
}

interface Subcategory {
  id: string;
  name: string;
  code: string;
  category_id: string;
}

interface Model {
  id: string;
  name: string;
  code: string;
  subcategory_id: string;
}

interface StorageLocation {
  id: string;
  name: string;
}

const conditionOptions = [
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
];

const statusOptions = [
  { value: "available", label: "Available" },
  { value: "rented", label: "Rented" },
  { value: "deployed", label: "Deployed" },
  { value: "maintenance", label: "Maintenance" },
  { value: "retired", label: "Retired" },
];

export default function AddEquipment() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const {
    categoryId,
    subcategoryId,
    modelId,
    serialNumber,
    storageLocationId,
    condition,
    status,
    description,
    purchaseDate,
    warrantyExpiry,
    hasWarranty,
    generatedSku,
    supplierName,
    invoiceNumber,
    weight,
    caseNumber,
    remarks,
    isSubmitting,
    errors,
    submitError,
    successMessage,
    setCategoryId,
    setSubcategoryId,
    setModelId,
    setSerialNumber,
    setStorageLocationId,
    setCondition,
    setStatus,
    setDescription,
    setPurchaseDate,
    setWarrantyExpiry,
    setHasWarranty,
    setGeneratedSku,
    setSupplierName,
    setInvoiceNumber,
    setWeight,
    setCaseNumber,
    setRemarks,
    setIsSubmitting,
    setErrors,
    clearError,
    setSubmitError,
    setSuccessMessage,
    reset,
  } = useEquipmentStore();

  const categoryFromUrl = searchParams.get("category") || "";
  const subcategoryFromUrl = searchParams.get("subcategory") || "";
  const modelFromUrl = searchParams.get("model") || "";

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as Category[];
    },
    staleTime: 30000,
  });

  const categoryIdFromUrl = useMemo(() => {
    if (!categoryFromUrl || categories.length === 0) return "";
    const found = categories.find(
      (c) => c.name.toLowerCase() === categoryFromUrl.toLowerCase(),
    );
    return found ? found.id : "";
  }, [categoryFromUrl, categories]);

  const effectiveCategoryId = categoryId || categoryIdFromUrl;

  const { data: subcategories = [], isLoading: loadingSubcategories } =
    useQuery({
      queryKey: ["subcategories", effectiveCategoryId],
      queryFn: async () => {
        if (!effectiveCategoryId) return [];
        const { data, error } = await supabase
          .from("subcategories")
          .select("*")
          .eq("category_id", effectiveCategoryId)
          .eq("is_active", true)
          .order("name");
        if (error) throw error;
        return data as Subcategory[];
      },
      enabled: !!effectiveCategoryId,
      staleTime: 30000,
    });

  const subcategoryIdFromUrl = useMemo(() => {
    if (!subcategoryFromUrl || subcategories.length === 0) return "";
    const found = subcategories.find(
      (s) => s.name.toLowerCase() === subcategoryFromUrl.toLowerCase(),
    );
    return found ? found.id : "";
  }, [subcategoryFromUrl, subcategories]);

  const effectiveSubcategoryId = subcategoryId || subcategoryIdFromUrl;

  const { data: storageLocations = [] } = useQuery({
    queryKey: ["storage_locations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("storage_locations")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as StorageLocation[];
    },
    staleTime: 30000,
  });

  const { data: models = [], isLoading: loadingModels } = useQuery({
    queryKey: ["models", effectiveSubcategoryId],
    queryFn: async () => {
      if (!effectiveSubcategoryId) return [];
      const { data, error } = await supabase
        .from("models")
        .select("*")
        .eq("subcategory_id", effectiveSubcategoryId)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as Model[];
    },
    enabled: !!effectiveSubcategoryId,
    staleTime: 30000,
  });

  const modelIdFromUrl = useMemo(() => {
    if (!modelFromUrl || models.length === 0) return "";
    const found = models.find(
      (m) => m.name.toLowerCase() === modelFromUrl.toLowerCase(),
    );
    return found ? found.id : "";
  }, [modelFromUrl, models]);

  const effectiveModelId = modelId || modelIdFromUrl;

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === effectiveCategoryId),
    [categories, effectiveCategoryId],
  );

  const selectedSubcategory = useMemo(
    () => subcategories.find((s) => s.id === effectiveSubcategoryId),
    [subcategories, effectiveSubcategoryId],
  );

  const selectedModel = useMemo(
    () => models.find((m) => m.id === effectiveModelId),
    [models, effectiveModelId],
  );

  useEffect(() => {
    const generateSku = async () => {
      if (!selectedCategory || !selectedSubcategory || !selectedModel) {
        setGeneratedSku("");
        return;
      }

      const prefix = `${selectedCategory.code}-${selectedSubcategory.code}-${selectedModel.code}-`;

      const { data: existingAssets, error } = await supabase
        .from("assets")
        .select("sku")
        .ilike("sku", `${prefix}%`)
        .order("sku", { ascending: false })
        .limit(1);

      if (error) {
        console.error("Error fetching last SKU:", error);
        setGeneratedSku(`${prefix}0001`);
        return;
      }

      let nextSequence = 1;
      if (existingAssets && existingAssets.length > 0) {
        const lastSku = existingAssets[0].sku;
        const sequenceMatch = lastSku?.match(/-(\d+)$/);
        if (sequenceMatch) {
          const lastSequence = parseInt(sequenceMatch[1], 10);
          nextSequence = lastSequence + 1;
        }
      }

      const sequenceStr = nextSequence.toString().padStart(4, "0");
      setGeneratedSku(`${prefix}${sequenceStr}`);
    };

    generateSku();
  }, [selectedCategory, selectedSubcategory, selectedModel, setGeneratedSku]);

  const handleCategoryChange = (value: string) => {
    setCategoryId(value);
    setSubcategoryId("");
    setModelId("");
    setGeneratedSku("");
    clearError("category");
    clearError("subcategory");
    clearError("model");
    clearError("sku");
  };

  useEffect(() => {
    if (categories.length > 0 && effectiveCategoryId) {
      const categoryExists = categories.some(
        (c) => c.id === effectiveCategoryId,
      );
      if (!categoryExists) {
        setCategoryId("");
        setSubcategoryId("");
        setModelId("");
        setGeneratedSku("");
      }
    }
  }, [
    categories,
    effectiveCategoryId,
    setCategoryId,
    setSubcategoryId,
    setModelId,
    setGeneratedSku,
  ]);

  useEffect(() => {
    if (subcategories.length > 0 && effectiveSubcategoryId) {
      const subcategoryExists = subcategories.some(
        (s) => s.id === effectiveSubcategoryId,
      );
      if (!subcategoryExists) {
        setModelId("");
        setGeneratedSku("");
      }
    }
  }, [subcategories, effectiveSubcategoryId, setModelId, setGeneratedSku]);

  useEffect(() => {
    if (models.length > 0 && effectiveModelId) {
      const modelExists = models.some((m) => m.id === effectiveModelId);
      if (!modelExists) {
        setGeneratedSku("");
      }
    }
  }, [models, effectiveModelId, setGeneratedSku]);

  const handleSubcategoryChange = (value: string) => {
    setSubcategoryId(value);
    setModelId("");
    setGeneratedSku("");
    clearError("subcategory");
    clearError("model");
    clearError("sku");
  };

  const handleModelChange = (value: string) => {
    setModelId(value);
    clearError("model");
    clearError("sku");
  };

  const createAssetMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("assets").insert({
        sku: generatedSku,
        serial_number: serialNumber,
        model_id: effectiveModelId,
        location: storageLocationId || null,
        condition,
        status,
        description: description || null,
        purchase_date: purchaseDate || null,
        warranty_expiry: warrantyExpiry || null,
        supplier_name: supplierName || null,
        invoice_number: invoiceNumber || null,
        weight: weight ? parseFloat(weight) : null,
        case_number: caseNumber ? parseInt(caseNumber, 10) : null,
        remarks: remarks || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      reset();
      setSuccessMessage("Equipment added successfully!");
      window.scrollTo(0, 0);
      setTimeout(() => setSuccessMessage(""), 3000);
    },
    onError: (error) => {
      console.error("Error creating asset:", error);
      setSubmitError("Failed to create asset. Please try again.");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitError("");

    const newErrors: Record<string, string> = {};

    if (!effectiveCategoryId) {
      newErrors.category = "Category is required";
    }
    if (!effectiveSubcategoryId) {
      newErrors.subcategory = "Subcategory is required";
    }
    if (!effectiveModelId) {
      newErrors.model = "Model is required";
    }
    if (!generatedSku) {
      newErrors.sku = "SKU is required";
    }
    if (!storageLocationId) {
      newErrors.location = "Location is required";
    }
    if (hasWarranty && !warrantyExpiry) {
      newErrors.warrantyExpiry =
        "Warranty expiry date is required when warranty is enabled";
    }
    if (purchaseDate && warrantyExpiry) {
      const purchase = new Date(purchaseDate);
      const warranty = new Date(warrantyExpiry);
      if (warranty < purchase) {
        newErrors.warrantyExpiry =
          "Warranty date must be greater than or equal to purchase date";
      }
    }
    if (weight && isNaN(parseFloat(weight))) {
      newErrors.weight = "Weight must be a valid number";
    }
    if (weight && parseFloat(weight) < 0) {
      newErrors.weight = "Weight cannot be negative";
    }
    if (caseNumber && isNaN(parseInt(caseNumber, 10))) {
      newErrors.caseNumber = "Case number must be a valid integer";
    }
    if (caseNumber && parseInt(caseNumber, 10) < 0) {
      newErrors.caseNumber = "Case number cannot be negative";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    createAssetMutation.mutate();
  };

  if (loadingCategories) {
    return (
      <div className="min-h-dvh bg-[#FAFAFA] flex flex-col items-center justify-center">
        <Loading className="w-10 h-10" color="border-slate-900" />
        <p className="text-sm text-slate-400 mt-4">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans p-4 py-12">
      <div className="w-full mx-auto rounded-2xl overflow-hidden  p-6 md:p-10">
        {successMessage && (
          <AlertBanner
            variant="success"
            message={successMessage}
            className="mb-8"
          />
        )}

        {submitError && (
          <AlertBanner variant="error" message={submitError} className="mb-8" />
        )}

        <div className="mb-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Add New Equipment
          </h2>
          <p className="text-slate-500 mt-2 text-sm">
            Fill in the details below to add equipment to your inventory.
          </p>
        </div>

        <Link
          to="/inventory-manager/import-equipment"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 font-medium mb-10"
        >
          <Upload className="w-4 h-4" />
          Import from CSV
        </Link>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Section 1: Basic Details */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-6">
              Basic Details
            </h3>
            <div className="space-y-6">
              {/* Line 1: Category + Subcategory */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <SelectDropdown
                  label="Category"
                  value={effectiveCategoryId || ""}
                  onChange={handleCategoryChange}
                  options={categories.map((c) => ({
                    value: c.id,
                    label: `${c.name} (${c.code})`,
                  }))}
                  placeholder="Select Category"
                  error={errors.category}
                  emptyMessage="No categories found"
                />
                <SelectDropdown
                  label="Subcategory"
                  value={effectiveSubcategoryId || ""}
                  onChange={handleSubcategoryChange}
                  options={subcategories.map((s) => ({
                    value: s.id,
                    label: `${s.name} (${s.code})`,
                  }))}
                  placeholder="Select Subcategory"
                  disabled={!effectiveCategoryId}
                  loading={loadingSubcategories}
                  error={errors.subcategory}
                  emptyMessage="No subcategories found"
                />
              </div>

              {/* Line 2: Model (full width) */}
              <div>
                <SelectDropdown
                  label="Model"
                  value={effectiveModelId || ""}
                  onChange={handleModelChange}
                  options={models.map((m) => ({
                    value: m.id,
                    label: `${m.name} (${m.code})`,
                  }))}
                  placeholder="Select Model"
                  disabled={!effectiveSubcategoryId}
                  loading={loadingModels}
                  error={errors.model}
                  emptyMessage="No models found"
                />
              </div>

              {/* Line 3: SKU (full width) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Auto-generated SKU
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    value={generatedSku}
                    readOnly
                    placeholder="Select category, subcategory, and model to generate SKU"
                    className="shadow-none border-none"
                  />
                  {generatedSku && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <span className="inline-flex items-center px-2.5 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-md">
                        AUTO
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Format: CAT-SUB-MOD-0001
                </p>
                {errors.sku && (
                  <p className="text-sm text-red-500 mt-2">{errors.sku}</p>
                )}
              </div>

              {/* Line 4: Serial Number + Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input
                  label="Serial Number"
                  value={serialNumber}
                  onChange={(e) => {
                    setSerialNumber(e.target.value);
                  }}
                  placeholder="Enter serial number"
                />
                <SelectDropdown
                  label="Location"
                  value={storageLocationId || ""}
                  onChange={(value) => {
                    setStorageLocationId(value);
                    clearError("location");
                  }}
                  options={storageLocations.map((l) => ({
                    value: l.id,
                    label: l.name,
                  }))}
                  placeholder="Select Location"
                  error={errors.location}
                  emptyMessage="No locations found"
                />
              </div>

              {/* Line 5: Condition + Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <SelectDropdown
                  label="Condition"
                  value={condition}
                  onChange={setCondition}
                  options={conditionOptions}
                  placeholder="Select Condition"
                />
                <div>
                  <SelectDropdown
                    label="Status"
                    value={status}
                    onChange={setStatus}
                    options={statusOptions}
                    placeholder="Select Status"
                    disabled
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Status defaults to Available
                  </p>
                </div>
              </div>

              {/* Line 6: Purchase Date (half width) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-900/5 transition-all duration-300"
                  />
                </div>
                <div></div>
              </div>

              {/* Line 7: Has Warranty */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-3">
                  <label className="flex items-center gap-3 text-sm font-medium text-slate-700 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={hasWarranty}
                        onChange={(e) => {
                          setHasWarranty(e.target.checked);
                          if (!e.target.checked) {
                            setWarrantyExpiry("");
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 rounded-full bg-slate-200 peer-checked:bg-slate-900 transition-colors duration-300"></div>
                      <div className="absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow-md peer-checked:translate-x-5 transition-transform duration-300"></div>
                    </div>
                    Has Warranty
                  </label>
                </div>
                <div></div>
              </div>

              {/* Line 8: Warranty Expiry Date (half width when shown) */}
              {hasWarranty && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                      Warranty Expiry
                    </label>
                    <input
                      type="date"
                      value={warrantyExpiry}
                      onChange={(e) => {
                        setWarrantyExpiry(e.target.value);
                        clearError("warrantyExpiry");
                      }}
                      min={purchaseDate}
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-900/5 transition-all duration-300"
                    />
                  </div>
                  {errors.warrantyExpiry && (
                    <p className="text-sm text-red-500 mt-2">
                      {errors.warrantyExpiry}
                    </p>
                  )}
                  <div></div>
                </div>
              )}

              {/* Line 8: Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <Textarea
                  name="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Add a description..."
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-900/5 transition-all duration-300 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Shipment and Delivery */}
          <div className="pt-6 border-t border-slate-200/60">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">
              Shipment and Delivery
            </h3>
            <div className="space-y-6">
              {/* Line 1: Supplier Name + Invoice Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input
                  label="Supplier Name"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="Enter supplier name"
                />
                <Input
                  label="Invoice Number"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="Enter invoice number"
                />
              </div>

              {/* Line 2: Weight + Case Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input
                  label="Weight (kg)"
                  type="number"
                  step="0.01"
                  min="0"
                  value={weight}
                  onChange={(e) => {
                    setWeight(e.target.value);
                    clearError("weight");
                  }}
                  placeholder="Enter weight in kg"
                  error={errors.weight}
                />
                <Input
                  label="Case Number"
                  type="number"
                  min="0"
                  value={caseNumber}
                  onChange={(e) => {
                    setCaseNumber(e.target.value);
                    clearError("caseNumber");
                  }}
                  placeholder="Enter case number"
                  error={errors.caseNumber}
                />
              </div>

              {/* Line 3: Remarks (full width textarea) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Remarks
                </label>
                <Textarea
                  name="remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                  placeholder="Add any additional remarks..."
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-900/5 transition-all duration-300 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Quick Manage */}
          <div className="pt-6 border-t border-slate-200/60">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">
              Quick Manage
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Link
                to="/inventory-manager/manage-categories"
                className="flex items-center gap-2 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <Plus className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-600">
                  Add Category
                </span>
              </Link>
              <Link
                to="/inventory-manager/manage-subcategories"
                className="flex items-center gap-2 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <Plus className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-600">
                  Add Subcategory
                </span>
              </Link>
              <Link
                to="/inventory-manager/manage-models"
                className="flex items-center gap-2 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <Plus className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-600">
                  Add Model
                </span>
              </Link>
              <Link
                to="/inventory-manager/add-storage-location"
                className="flex items-center gap-2 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <Plus className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-600">
                  Add Location
                </span>
              </Link>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-200/60">
            <Link to="/inventory-manager">
              <Button variant="secondary" type="button">
                Cancel
              </Button>
            </Link>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              <Plus className="w-4 h-4 mr-2" />
              {isSubmitting ? "Adding..." : "Add Equipment"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
