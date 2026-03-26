import { useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
  Transition,
  Textarea,
} from "@headlessui/react";
import { supabase } from "../../lib/supabase";
import Input from "../../components/Input";
import Button from "../../components/Button";
import Loading from "../../components/Loading";
import { useEquipmentStore } from "../../store/equipmentStore";
import {
  ChevronLeft,
  ChevronDown,
  Check,
  Plus,
  Loader2,
  AlertCircle,
  Upload,
} from "lucide-react";

// Types
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

export default function AddEquipment() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  // Use Zustand store for form state
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
    setIsSubmitting,
    setErrors,
    setSubmitError,
    setSuccessMessage,
    reset,
  } = useEquipmentStore();

  // Get params from URL to initialize or preserve state
  const categoryFromUrl = searchParams.get("category") || "";
  const subcategoryFromUrl = searchParams.get("subcategory") || "";
  const modelFromUrl = searchParams.get("model") || "";

  // Condition options
  const conditionOptions = [
    { value: "excellent", label: "Excellent" },
    { value: "good", label: "Good" },
    { value: "fair", label: "Fair" },
    { value: "poor", label: "Poor" },
  ];

  // Status options
  const statusOptions = [
    { value: "available", label: "Available" },
    { value: "rented", label: "Rented" },
    { value: "deployed", label: "Deployed" },
    { value: "maintenance", label: "Maintenance" },
    { value: "retired", label: "Retired" },
  ];

  // Fetch categories
  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Category[];
    },
    staleTime: 30000,
  });

  // Find category ID from URL param using useMemo - no state setting in effect
  const categoryIdFromUrl = useMemo(() => {
    if (!categoryFromUrl || categories.length === 0) return "";
    const found = categories.find(
      (c) => c.name.toLowerCase() === categoryFromUrl.toLowerCase(),
    );
    return found ? found.id : "";
  }, [categoryFromUrl, categories]);

  // Use either user selection or URL param
  const effectiveCategoryId = categoryId || categoryIdFromUrl;

  // Fetch subcategories based on effective category
  const { data: subcategories = [], isLoading: loadingSubcategories } =
    useQuery({
      queryKey: ["subcategories", effectiveCategoryId],
      queryFn: async () => {
        if (!effectiveCategoryId) return [];
        const { data, error } = await supabase
          .from("subcategories")
          .select("*")
          .eq("category_id", effectiveCategoryId)
          .order("name");
        if (error) throw error;
        return data as Subcategory[];
      },
      enabled: !!effectiveCategoryId,
      staleTime: 30000,
    });

  // Find subcategory ID from URL param
  const subcategoryIdFromUrl = useMemo(() => {
    if (!subcategoryFromUrl || subcategories.length === 0) return "";
    const found = subcategories.find(
      (s) => s.name.toLowerCase() === subcategoryFromUrl.toLowerCase(),
    );
    return found ? found.id : "";
  }, [subcategoryFromUrl, subcategories]);

  const effectiveSubcategoryId = subcategoryId || subcategoryIdFromUrl;

  // Fetch storage locations
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

  // Fetch models based on effective subcategory
  const { data: models = [], isLoading: loadingModels } = useQuery({
    queryKey: ["models", effectiveSubcategoryId],
    queryFn: async () => {
      if (!effectiveSubcategoryId) return [];
      const { data, error } = await supabase
        .from("models")
        .select("*")
        .eq("subcategory_id", effectiveSubcategoryId)
        .order("name");
      if (error) throw error;
      return data as Model[];
    },
    enabled: !!effectiveSubcategoryId,
    staleTime: 30000,
  });

  // Find model ID from URL param
  const modelIdFromUrl = useMemo(() => {
    if (!modelFromUrl || models.length === 0) return "";
    const found = models.find(
      (m) => m.name.toLowerCase() === modelFromUrl.toLowerCase(),
    );
    return found ? found.id : "";
  }, [modelFromUrl, models]);

  const effectiveModelId = modelId || modelIdFromUrl;

  // Get selected objects
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

  // Generate SKU when category, subcategory, or model changes
  useEffect(() => {
    const generateSku = async () => {
      if (!selectedCategory || !selectedSubcategory || !selectedModel) {
        setGeneratedSku("");
        return;
      }

      const prefix = `${selectedCategory.code}-${selectedSubcategory.code}-${selectedModel.code}-`;

      // Find the last asset with this prefix
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

  // Reset dependent fields when parent changes
  const handleCategoryChange = (value: string) => {
    setCategoryId(value);
    setSubcategoryId("");
    setModelId("");
    setGeneratedSku("");
  };

  const handleSubcategoryChange = (value: string) => {
    setSubcategoryId(value);
    setModelId("");
    setGeneratedSku("");
  };

  const handleModelChange = (value: string) => {
    setModelId(value);
  };

  // Create asset mutation
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
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      reset();
      setSuccessMessage("Equipment added successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    },
    onError: (error) => {
      console.error("Error creating asset:", error);
      setSubmitError("Failed to create asset. Please try again.");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setErrors({});
    setSubmitError("");

    // Validation
    const newErrors: Record<string, string> = {};

    // Category, Subcategory, Model validation
    if (!effectiveCategoryId) {
      newErrors.category = "Category is required";
    }
    if (!effectiveSubcategoryId) {
      newErrors.subcategory = "Subcategory is required";
    }
    if (!effectiveModelId) {
      newErrors.model = "Model is required";
    }

    // Serial number is optional

    // SKU validation
    if (!generatedSku) {
      newErrors.sku = "SKU is required";
    }

    // Location validation
    if (!storageLocationId) {
      newErrors.location = "Location is required";
    }

    // Date validation
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

    // If there are errors, display them
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    createAssetMutation.mutate();
  };

  if (loadingCategories) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loading className="w-10 h-10 text-[#1769ff] mb-4" />
        <p className="text-gray-500 font-medium">Loading form...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-4xl mx-auto px-6 py-10 animate-in fade-in duration-500">
        {/* Breadcrumb and Title */}
        <Link
          to="/inventory-manager"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[#1769ff] transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Inventory
        </Link>

        <div className="mb-5">
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-4">
              <div className="flex items-center gap-2">
                <span>{successMessage}</span>
              </div>
            </div>
          )}
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Add New Equipment
          </h1>
          <p className="text-gray-500 mt-1">
            Fill in the details below to add equipment to your inventory
          </p>
          <div className="mt-5">
            <Link
              to="/inventory-manager/import-equipment"
              className="inline-flex items-center gap-1 text-sm text-[#1769ff] hover:text-[#1255d4] font-medium"
            >
              <Upload className="w-4 h-4" />
              Import from CSV
            </Link>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Selection */}
          <div className="bg-white border border-gray-200 rounded-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Category
            </h2>

            <div className="relative">
              <Listbox
                value={effectiveCategoryId || ""}
                onChange={handleCategoryChange}
              >
                <div className="relative">
                  <ListboxButton className="relative w-full cursor-default rounded-md bg-white py-2 pl-4 pr-10 text-left border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#1769ff]/20 focus:border-[#1769ff] disabled:bg-gray-100 disabled:cursor-not-allowed">
                    <span
                      className={
                        effectiveCategoryId ? "text-gray-900" : "text-gray-400"
                      }
                    >
                      {effectiveCategoryId
                        ? `${categories.find((c) => c.id === effectiveCategoryId)?.name} (${categories.find((c) => c.id === effectiveCategoryId)?.code})`
                        : "Select Category"}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    </span>
                  </ListboxButton>

                  <Transition
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                      {categories.length === 0 ? (
                        <div className="px-4 py-2 text-sm text-gray-500">
                          No categories found
                        </div>
                      ) : (
                        categories.map((cat) => (
                          <ListboxOption
                            key={cat.id}
                            value={cat.id}
                            className={({ active }) =>
                              `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                active
                                  ? "bg-[#1769ff]/10 text-[#1769ff]"
                                  : "text-gray-900"
                              }`
                            }
                          >
                            {({ selected }) => (
                              <>
                                <span
                                  className={`block truncate ${selected ? "font-medium" : "font-normal"}`}
                                >
                                  {cat.name} ({cat.code})
                                </span>
                                {selected && (
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#1769ff]">
                                    <Check className="h-5 w-5" />
                                  </span>
                                )}
                              </>
                            )}
                          </ListboxOption>
                        ))
                      )}
                    </ListboxOptions>
                  </Transition>
                </div>
              </Listbox>
            </div>

            {/* Manage Categories Button */}
            <div className="mt-3">
              <Link
                to="/inventory-manager/manage-categories"
                className="inline-flex items-center gap-1 text-sm text-[#1769ff] hover:text-[#1255d4] font-medium"
              >
                <Plus className="w-4 h-4" />
                Manage Category
              </Link>
            </div>

            {/* Inline Error */}
            {errors.category && (
              <p className="mt-2 text-sm text-red-600">{errors.category}</p>
            )}
          </div>

          {/* Subcategory Selection */}
          <div className="bg-white border border-gray-200 rounded-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Subcategory
            </h2>

            <div className="relative">
              <Listbox
                value={effectiveSubcategoryId || ""}
                onChange={handleSubcategoryChange}
                disabled={!effectiveCategoryId}
              >
                <div className="relative">
                  <ListboxButton className="relative w-full cursor-default rounded-md bg-white py-2 pl-4 pr-10 text-left border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#1769ff]/20 focus:border-[#1769ff] disabled:bg-gray-100 disabled:cursor-not-allowed">
                    <span
                      className={
                        effectiveSubcategoryId
                          ? "text-gray-900"
                          : "text-gray-400"
                      }
                    >
                      {loadingSubcategories ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading...
                        </span>
                      ) : effectiveSubcategoryId ? (
                        `${subcategories.find((s) => s.id === effectiveSubcategoryId)?.name} (${subcategories.find((s) => s.id === effectiveSubcategoryId)?.code})`
                      ) : (
                        "Select Subcategory"
                      )}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    </span>
                  </ListboxButton>

                  <Transition
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                      {subcategories.length === 0 ? (
                        <div className="px-4 py-2 text-sm text-gray-500">
                          No subcategories found
                        </div>
                      ) : (
                        subcategories.map((sub) => (
                          <ListboxOption
                            key={sub.id}
                            value={sub.id}
                            className={({ active }) =>
                              `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                active
                                  ? "bg-[#1769ff]/10 text-[#1769ff]"
                                  : "text-gray-900"
                              }`
                            }
                          >
                            {({ selected }) => (
                              <>
                                <span
                                  className={`block truncate ${selected ? "font-medium" : "font-normal"}`}
                                >
                                  {sub.name} ({sub.code})
                                </span>
                                {selected && (
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#1769ff]">
                                    <Check className="h-5 w-5" />
                                  </span>
                                )}
                              </>
                            )}
                          </ListboxOption>
                        ))
                      )}
                    </ListboxOptions>
                  </Transition>
                </div>
              </Listbox>
            </div>

            {/* Manage Subcategories Button */}
            <div className="mt-3">
              <Link
                to="/inventory-manager/manage-subcategories"
                className="inline-flex items-center gap-1 text-sm text-[#1769ff] hover:text-[#1255d4] font-medium"
              >
                <Plus className="w-4 h-4" />
                Manage Subcategory
              </Link>
            </div>

            {/* Inline Error */}
            {errors.subcategory && (
              <p className="mt-2 text-sm text-red-600">{errors.subcategory}</p>
            )}
          </div>

          {/* Model Selection */}
          <div className="bg-white border border-gray-200 rounded-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Model</h2>

            <div className="relative">
              <Listbox
                value={effectiveModelId || ""}
                onChange={handleModelChange}
                disabled={!effectiveSubcategoryId}
              >
                <div className="relative">
                  <ListboxButton className="relative w-full cursor-default rounded-md bg-white py-2 pl-4 pr-10 text-left border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#1769ff]/20 focus:border-[#1769ff] disabled:bg-gray-100 disabled:cursor-not-allowed">
                    <span
                      className={
                        effectiveModelId ? "text-gray-900" : "text-gray-400"
                      }
                    >
                      {loadingModels ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading...
                        </span>
                      ) : effectiveModelId ? (
                        `${models.find((m) => m.id === effectiveModelId)?.name} (${models.find((m) => m.id === effectiveModelId)?.code})`
                      ) : (
                        "Select Model"
                      )}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    </span>
                  </ListboxButton>

                  <Transition
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                      {models.length === 0 ? (
                        <div className="px-4 py-2 text-sm text-gray-500">
                          No models found
                        </div>
                      ) : (
                        models.map((model) => (
                          <ListboxOption
                            key={model.id}
                            value={model.id}
                            className={({ active }) =>
                              `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                active
                                  ? "bg-[#1769ff]/10 text-[#1769ff]"
                                  : "text-gray-900"
                              }`
                            }
                          >
                            {({ selected }) => (
                              <>
                                <span
                                  className={`block truncate ${selected ? "font-medium" : "font-normal"}`}
                                >
                                  {model.name} ({model.code})
                                </span>
                                {selected && (
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#1769ff]">
                                    <Check className="h-5 w-5" />
                                  </span>
                                )}
                              </>
                            )}
                          </ListboxOption>
                        ))
                      )}
                    </ListboxOptions>
                  </Transition>
                </div>
              </Listbox>
            </div>

            {/* Manage Models Button */}
            <div className="mt-3">
              <Link
                to="/inventory-manager/manage-models"
                className="inline-flex items-center gap-1 text-sm text-[#1769ff] hover:text-[#1255d4] font-medium"
              >
                <Plus className="w-4 h-4" />
                Manage Model
              </Link>
            </div>

            {/* Inline Error */}
            {errors.model && (
              <p className="mt-2 text-sm text-red-600">{errors.model}</p>
            )}
          </div>

          {/* Auto-generated SKU */}
          <div className="bg-white border border-gray-200 rounded-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              SKU Configuration
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auto-generated SKU
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={generatedSku}
                  readOnly
                  placeholder="Select category, subcategory, and model to generate SKU"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md font-mono bg-gray-50 cursor-default focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
                {generatedSku && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <span className="inline-flex items-center px-2 py-1 bg-[#00d26a]/10 text-[#00d26a] text-xs font-medium rounded">
                      Auto
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Example: LAP-DSK-LEN-001 (Category-Subcategory-Model-Number)
              </p>

              {/* Inline Error */}
              {errors.sku && (
                <p className="mt-2 text-sm text-red-600">{errors.sku}</p>
              )}
            </div>
          </div>

          {/* Equipment Details */}
          <div className="bg-white border border-gray-200 rounded-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Equipment Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Serial Number"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="Enter serial number"
              />

              {/* Storage Location Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <Listbox
                  value={storageLocationId || ""}
                  onChange={setStorageLocationId}
                >
                  <div className="relative">
                    <ListboxButton className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#1769ff]/20 focus:border-[#1769ff]">
                      <span
                        className={
                          storageLocationId ? "text-gray-900" : "text-gray-400"
                        }
                      >
                        {storageLocationId
                          ? storageLocations.find(
                              (l) => l.id === storageLocationId,
                            )?.name
                          : "Select Location"}
                      </span>
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      </span>
                    </ListboxButton>
                    <Transition
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                        {storageLocations.length === 0 ? (
                          <div className="px-4 py-1 text-sm text-gray-500">
                            No locations found
                          </div>
                        ) : (
                          storageLocations.map((loc) => (
                            <ListboxOption
                              key={loc.id}
                              value={loc.id}
                              className={({ active }) =>
                                `relative cursor-default select-none py-1 pl-10 pr-4 ${
                                  active
                                    ? "bg-[#1769ff]/10 text-[#1769ff]"
                                    : "text-gray-900"
                                }`
                              }
                            >
                              {({ selected }) => (
                                <>
                                  <span
                                    className={`block truncate ${selected ? "font-medium" : "font-normal"}`}
                                  >
                                    {loc.name}
                                  </span>
                                  {selected && (
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#1769ff]">
                                      <Check className="h-5 w-5" />
                                    </span>
                                  )}
                                </>
                              )}
                            </ListboxOption>
                          ))
                        )}
                      </ListboxOptions>
                    </Transition>
                  </div>
                </Listbox>
                <div className="mt-2">
                  <Link
                    to="/inventory-manager/add-storage-location"
                    className="inline-flex items-center gap-1 text-sm text-[#1769ff] hover:text-[#1255d4] font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Add Storage Location
                  </Link>
                </div>

                {/* Inline Error */}
                {errors.location && (
                  <p className="mt-2 text-sm text-red-600">{errors.location}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Condition <span className="text-red-500">*</span>
                </label>
                <Listbox value={condition} onChange={setCondition}>
                  <div className="relative">
                    <ListboxButton className="relative w-full cursor-default rounded-lg bg-white py-2 pl-4 pr-10 text-left border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#1769ff]/20 focus:border-[#1769ff]">
                      <span className="text-gray-900">
                        {conditionOptions.find((c) => c.value === condition)
                          ?.label || "Select condition"}
                      </span>
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      </span>
                    </ListboxButton>
                    <Transition
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                        {conditionOptions.map((cond) => (
                          <ListboxOption
                            key={cond.value}
                            value={cond.value}
                            className={({ active }) =>
                              `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                active
                                  ? "bg-[#1769ff]/10 text-[#1769ff]"
                                  : "text-gray-900"
                              }`
                            }
                          >
                            {({ selected }) => (
                              <>
                                <span
                                  className={`block truncate ${selected ? "font-medium" : "font-normal"}`}
                                >
                                  {cond.label}
                                </span>
                                {selected && (
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#1769ff]">
                                    <Check className="h-5 w-5" />
                                  </span>
                                )}
                              </>
                            )}
                          </ListboxOption>
                        ))}
                      </ListboxOptions>
                    </Transition>
                  </div>
                </Listbox>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <Listbox value={status} onChange={setStatus} disabled>
                  <div className="relative">
                    <ListboxButton className="relative w-full cursor-not-allowed rounded-lg bg-gray-100 py-2 pl-4 pr-10 text-left border border-gray-200 focus:outline-none">
                      <span className="text-gray-500">
                        {statusOptions.find((s) => s.value === status)?.label ||
                          "Available"}
                      </span>
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      </span>
                    </ListboxButton>
                  </div>
                </Listbox>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purchase Date
                </label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1769ff]/20 focus:border-[#1769ff]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasWarranty}
                    onChange={(e) => {
                      setHasWarranty(e.target.checked);
                      if (!e.target.checked) {
                        setWarrantyExpiry("");
                      }
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-[#1769ff] focus:ring-[#1769ff]"
                  />
                  Has Warranty
                </label>
                {hasWarranty && (
                  <div>
                    <input
                      type="date"
                      value={warrantyExpiry}
                      onChange={(e) => setWarrantyExpiry(e.target.value)}
                      min={purchaseDate}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1769ff]/20 focus:border-[#1769ff]"
                    />
                    {/* Inline Error */}
                    {errors.warrantyExpiry && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.warrantyExpiry}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <Textarea
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Add a description..."
                className="w-full px-3 py-2 min-h-30 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#1769ff]/20 focus:border-[#1769ff] resize-none"
              />
            </div>
          </div>

          {/* Submission Error */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <span>{submitError}</span>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4">
            <Link to="/inventory-manager/equipments">
              <Button variant="secondary" type="button">
                Cancel
              </Button>
            </Link>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              <Plus className="w-4 h-4 mr-1" />
              Add Equipment
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
