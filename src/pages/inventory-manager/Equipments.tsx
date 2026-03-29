import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
  Transition,
} from "@headlessui/react";
import { supabase } from "../../lib/supabase";
import Button from "../../components/Button";
import Loading from "../../components/Loading";
import { getStatusColor, getConditionColor } from "../../utils/theme";
import { convertToCSV, downloadCSV, type ExportAsset } from "../../utils/csv";
import {
  Search,
  Plus,
  Archive,
  AlertCircle,
  ChevronDown,
  Check,
  Filter,
  X,
  Loader2,
  Download,
} from "lucide-react";
import Input from "../../components/Input";
import { useEquipmentFilters } from "../../store/equipmentFiltersStore";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export interface Asset {
  id: string;
  sku: string;
  name?: string;
  serial_number: string;
  status: string;
  condition: string;
  location: string | null;
  purchase_date: string;
  warranty_expiry: string;
  description: string;
  created_at: string;
  model_id: string;
  models?: {
    name: string;
    brand: string;
    code: string;
  };
  storage_locations?: {
    name: string;
  };
  [key: string]: unknown;
}

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
  brand: string;
  code: string;
  subcategory_id: string;
}

interface StorageLocation {
  id: string;
  name: string;
}

const ITEMS_PER_PAGE = 50;

const statusOptions = [
  { value: "", label: "All Status" },
  { value: "available", label: "Available" },
  { value: "rented", label: "Rented" },
  { value: "deployed", label: "Deployed" },
  { value: "maintenance", label: "Maintenance" },
  { value: "retired", label: "Retired" },
];

const conditionOptions = [
  { value: "", label: "All Condition" },
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
];

export default function EquipmentsPage() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Filter states from store
  const {
    categoryId,
    subcategoryId,
    modelId,
    locationId,
    statusFilter,
    conditionFilter,
    showFilters,
    setCategoryId,
    setSubcategoryId,
    setModelId,
    setLocationId,
    setStatusFilter,
    setConditionFilter,
    setShowFilters,
    clearAll,
  } = useEquipmentFilters();

  // Fetch filter options
  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, code")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as Category[];
    },
    staleTime: 60000,
  });

  const { data: subcategories = [], isLoading: loadingSubcategories } = useQuery({
    queryKey: ["subcategories", categoryId],
    queryFn: async () => {
      if (!categoryId) return [];
      const { data, error } = await supabase
        .from("subcategories")
        .select("id, name, code, category_id")
        .eq("category_id", categoryId)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as Subcategory[];
    },
    enabled: !!categoryId,
    staleTime: 60000,
  });

  const { data: models = [], isLoading: loadingModels } = useQuery({
    queryKey: ["models", subcategoryId],
    queryFn: async () => {
      if (!subcategoryId) return [];
      const { data, error } = await supabase
        .from("models")
        .select("id, name, brand, code, subcategory_id")
        .eq("subcategory_id", subcategoryId)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as Model[];
    },
    enabled: !!subcategoryId,
    staleTime: 60000,
  });

  const { data: storageLocations = [], isLoading: loadingLocations } = useQuery({
    queryKey: ["storage_locations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("storage_locations")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data as StorageLocation[];
    },
    staleTime: 60000,
  });

  // Fetch assets with filters
  const { data, isLoading: loading, error } = useQuery({
    queryKey: ["assets_paginated", currentPage, debouncedSearch, categoryId, subcategoryId, modelId, locationId, statusFilter, conditionFilter],
    queryFn: async () => {
      let query = supabase
        .from("assets")
        .select(
          `
          id,
          sku,
          serial_number,
          status,
          condition,
          location,
          purchase_date,
          warranty_expiry,
          description,
          created_at,
          model_id,
          models:model_id(name, brand, code, subcategory_id),
          storage_locations:location(name)
        `,
          { count: "exact" },
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      // Search filter
      if (debouncedSearch.trim()) {
        const searchTerm = debouncedSearch.trim();
        query = query.or(
          `sku.ilike.%${searchTerm}%,serial_number.ilike.%${searchTerm}%`,
        );
      }

      // Category filter - get valid model IDs via subcategory
      if (categoryId && !subcategoryId) {
        const { data: subcats } = await supabase
          .from("subcategories")
          .select("id")
          .eq("category_id", categoryId)
          .eq("is_active", true);
        
        if (subcats && subcats.length > 0) {
          const subcategoryIds = subcats.map(s => s.id);
          const { data: modelData } = await supabase
            .from("models")
            .select("id")
            .in("subcategory_id", subcategoryIds)
            .eq("is_active", true);
          
          if (modelData && modelData.length > 0) {
            const validModelIds = modelData.map(m => m.id);
            query = query.in("model_id", validModelIds);
          }
        }
      }

      // Subcategory filter
      if (subcategoryId && !modelId) {
        const { data: modelData } = await supabase
          .from("models")
          .select("id")
          .eq("subcategory_id", subcategoryId)
          .eq("is_active", true);
        
        if (modelData && modelData.length > 0) {
          const validModelIds = modelData.map(m => m.id);
          query = query.in("model_id", validModelIds);
        }
      }

      // Model filter
      if (modelId) {
        query = query.eq("model_id", modelId);
      }

      // Location filter
      if (locationId) {
        query = query.eq("location", locationId);
      }

      // Status filter
      if (statusFilter) {
        query = query.eq("status", statusFilter);
      }

      // Condition filter
      if (conditionFilter) {
        query = query.eq("condition", conditionFilter);
      }

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, count, error } = await query.range(from, to);

      if (error) {
        throw error;
      }
      return {
        assets: (data as unknown as Asset[]) || [],
        totalCount: count || 0,
      };
    },
    staleTime: 30000,
  });

  const assets = data?.assets || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle category change - reset dependent filters
  const handleCategoryChange = (id: string) => {
    setCategoryId(id);
    setSubcategoryId("");
    setModelId("");
  };

  // Handle subcategory change - reset model
  const handleSubcategoryChange = (id: string) => {
    setSubcategoryId(id);
    setModelId("");
  };

  // Check if any filter is active
  const hasActiveFilters = categoryId || subcategoryId || modelId || locationId || statusFilter || conditionFilter;

  // Export to CSV
  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Fetch all active assets with related data
      let query = supabase
        .from("assets")
        .select(`
          sku,
          serial_number,
          status,
          condition,
          purchase_date,
          warranty_expiry,
          description,
          model_id,
          location,
          models:model_id(
            name,
            code,
            brand,
            subcategories:subcategory_id(
              name,
              code,
              categories:category_id(name, code)
            )
          ),
          storage_locations:location(name)
        `)
        .eq("is_active", true);

      // Apply filters if any
      if (debouncedSearch.trim()) {
        const search = debouncedSearch.trim().toLowerCase();
        query = query.or(`sku.ilike.%${search}%,serial_number.ilike.%${search}%`);
      }

      if (statusFilter) {
        query = query.eq("status", statusFilter);
      }

      if (conditionFilter) {
        query = query.eq("condition", conditionFilter);
      }

      if (locationId) {
        query = query.eq("location", locationId);
      }

      // For category/subcategory/model filters, we need to filter after fetching
      // since they require joins
      const { data: assets, error } = await query;

      if (error) throw error;

      // Transform data to export format
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const exportData: ExportAsset[] = (assets || []).map((asset: any) => {
        const model = asset.models;
        const subcategory = model?.subcategories;
        const category = subcategory?.categories;

        return {
          sku: asset.sku || "",
          serial_number: asset.serial_number || "",
          category: category?.name || "",
          category_code: category?.code || "",
          subcategory: subcategory?.name || "",
          subcategory_code: subcategory?.code || "",
          model: model?.name || "",
          model_code: model?.code || "",
          brand: model?.brand || "",
          location: asset.storage_locations?.name || "",
          status: asset.status || "",
          condition: asset.condition || "",
          purchase_date: asset.purchase_date || "",
          warranty_expiry: asset.warranty_expiry || "",
          description: asset.description || "",
        };
      });

      // If category filter is active, filter the results
      let filteredExportData = exportData;
      if (categoryId && subcategories.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subcategoryIds = subcategories.map((s: any) => s.id);
        filteredExportData = exportData.filter((item: ExportAsset) => 
          subcategoryIds.includes(item.model_code)
        );
      }

      // Convert to CSV and download
      const csv = convertToCSV(filteredExportData);
      const date = new Date().toISOString().split("T")[0];
      downloadCSV(csv, `assets-export-${date}.csv`);
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  // Filter subcategories by selected category
  const filteredSubcategories = categoryId ? subcategories : [];

  // Filter models by selected subcategory
  const filteredModels = subcategoryId ? models : [];

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-8">
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              All Equipments
            </h1>
            <p className="text-gray-500 mt-1">
              View and manage your inventory ({totalCount} total)
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="md"
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-1 w-full md:w-auto"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Export
            </Button>
            <Link to="/inventory-manager/add-equipment">
              <Button
                variant="primary"
                size="md"
                className="flex items-center gap-1 w-full md:w-auto"
              >
                <Plus className="w-4 h-4" />
                Add Equipment
              </Button>
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by SKU, asset name, or serial number..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-12 pr-4 py-3"
            />
          </div>
        </div>

        {/* Filter Toggle */}
        <div className="mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm transition-colors ${
              showFilters || hasActiveFilters
                ? "border-[#1769ff] bg-[#1769ff]/5 text-[#1769ff]"
                : "border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
            {hasActiveFilters && (
              <span className="bg-[#1769ff] text-white text-xs px-1.5 py-0.5 rounded-full">
                {[categoryId, subcategoryId, modelId, locationId, statusFilter, conditionFilter].filter(Boolean).length}
              </span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                <Listbox value={categoryId} onChange={handleCategoryChange}>
                  <div className="relative">
                    <ListboxButton className="relative w-full cursor-default rounded-md bg-white py-2 pl-10 pr-8 text-left border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-[#1769ff]/20 focus:border-[#1769ff]">
                      <span className={categoryId ? "text-gray-900" : "text-gray-400"}>
                        {loadingCategories ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading...
                          </span>
                        ) : categoryId
                          ? categories.find((c) => c.id === categoryId)?.name
                          : "All Categories"}
                      </span>
                      {categoryId && !loadingCategories && (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#1769ff]">
                          <Check className="h-4 w-4" />
                        </span>
                      )}
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      </span>
                    </ListboxButton>
                    <Transition leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                      <ListboxOptions className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none">
                        <ListboxOption value="" className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-10 pr-4 text-sm ${active ? "bg-[#1769ff]/10 text-[#1769ff]" : "text-gray-900"}`
                        }>
                          <span className="block truncate">All Categories</span>
                        </ListboxOption>
                        {categories.map((cat) => (
                          <ListboxOption key={cat.id} value={cat.id} className={({ active }) =>
                            `relative cursor-default select-none py-2 pl-10 pr-4 text-sm ${active ? "bg-[#1769ff]/10 text-[#1769ff]" : "text-gray-900"}`
                          }>
                            {({ selected }) => (
                              <>
                                <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>
                                  {cat.name}
                                </span>
                                {selected && (
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#1769ff]">
                                    <Check className="h-4 w-4" />
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

              {/* Subcategory */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Subcategory</label>
                <Listbox value={subcategoryId} onChange={handleSubcategoryChange} disabled={!categoryId}>
                  <div className="relative">
                    <ListboxButton className="relative w-full cursor-default rounded-md bg-white py-2 pl-10 pr-8 text-left border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-[#1769ff]/20 focus:border-[#1769ff] disabled:bg-gray-100 disabled:cursor-not-allowed">
                      <span className={subcategoryId ? "text-gray-900" : "text-gray-400"}>
                        {loadingSubcategories ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading...
                          </span>
                        ) : subcategoryId
                          ? subcategories.find((s) => s.id === subcategoryId)?.name
                          : "All Subcategories"}
                      </span>
                      {subcategoryId && !loadingSubcategories && (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#1769ff]">
                          <Check className="h-4 w-4" />
                        </span>
                      )}
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      </span>
                    </ListboxButton>
                    <Transition leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                      <ListboxOptions className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none">
                        <ListboxOption value="" className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-10 pr-4 text-sm ${active ? "bg-[#1769ff]/10 text-[#1769ff]" : "text-gray-900"}`
                        }>
                          <span className="block truncate">All Subcategories</span>
                        </ListboxOption>
                        {filteredSubcategories.map((sub) => (
                          <ListboxOption key={sub.id} value={sub.id} className={({ active }) =>
                            `relative cursor-default select-none py-2 pl-10 pr-4 text-sm ${active ? "bg-[#1769ff]/10 text-[#1769ff]" : "text-gray-900"}`
                          }>
                            {({ selected }) => (
                              <>
                                <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>
                                  {sub.name}
                                </span>
                                {selected && (
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#1769ff]">
                                    <Check className="h-4 w-4" />
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

              {/* Model */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Model</label>
                <Listbox value={modelId} onChange={setModelId} disabled={!subcategoryId}>
                  <div className="relative">
                    <ListboxButton className="relative w-full cursor-default rounded-md bg-white py-2 pl-10 pr-8 text-left border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-[#1769ff]/20 focus:border-[#1769ff] disabled:bg-gray-100 disabled:cursor-not-allowed">
                      <span className={modelId ? "text-gray-900" : "text-gray-400"}>
                        {loadingModels ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading...
                          </span>
                        ) : modelId
                          ? models.find((m) => m.id === modelId)?.name
                          : "All Models"}
                      </span>
                      {modelId && !loadingModels && (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#1769ff]">
                          <Check className="h-4 w-4" />
                        </span>
                      )}
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      </span>
                    </ListboxButton>
                    <Transition leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                      <ListboxOptions className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none">
                        <ListboxOption value="" className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-10 pr-4 text-sm ${active ? "bg-[#1769ff]/10 text-[#1769ff]" : "text-gray-900"}`
                        }>
                          <span className="block truncate">All Models</span>
                        </ListboxOption>
                        {filteredModels.map((m) => (
                          <ListboxOption key={m.id} value={m.id} className={({ active }) =>
                            `relative cursor-default select-none py-2 pl-10 pr-4 text-sm ${active ? "bg-[#1769ff]/10 text-[#1769ff]" : "text-gray-900"}`
                          }>
                            {({ selected }) => (
                              <>
                                <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>
                                  {m.name} ({m.brand})
                                </span>
                                {selected && (
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#1769ff]">
                                    <Check className="h-4 w-4" />
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

              {/* Location */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Location</label>
                <Listbox value={locationId} onChange={(val) => { setLocationId(val); setCurrentPage(1); }}>
                  <div className="relative">
                    <ListboxButton className="relative w-full cursor-default rounded-md bg-white py-2 pl-10 pr-8 text-left border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-[#1769ff]/20 focus:border-[#1769ff]">
                      <span className={locationId ? "text-gray-900" : "text-gray-400"}>
                        {loadingLocations ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading...
                          </span>
                        ) : locationId
                          ? storageLocations.find((l) => l.id === locationId)?.name
                          : "All Locations"}
                      </span>
                      {locationId && !loadingLocations && (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#1769ff]">
                          <Check className="h-4 w-4" />
                        </span>
                      )}
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      </span>
                    </ListboxButton>
                    <Transition leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                      <ListboxOptions className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none">
                        <ListboxOption value="" className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-10 pr-4 text-sm ${active ? "bg-[#1769ff]/10 text-[#1769ff]" : "text-gray-900"}`
                        }>
                          <span className="block truncate">All Locations</span>
                        </ListboxOption>
                        {storageLocations.map((loc) => (
                          <ListboxOption key={loc.id} value={loc.id} className={({ active }) =>
                            `relative cursor-default select-none py-2 pl-10 pr-4 text-sm ${active ? "bg-[#1769ff]/10 text-[#1769ff]" : "text-gray-900"}`
                          }>
                            {({ selected }) => (
                              <>
                                <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>
                                  {loc.name}
                                </span>
                                {selected && (
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#1769ff]">
                                    <Check className="h-4 w-4" />
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

              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                <Listbox value={statusFilter} onChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}>
                  <div className="relative">
                    <ListboxButton className="relative w-full cursor-default rounded-md bg-white py-2 pl-10 pr-8 text-left border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-[#1769ff]/20 focus:border-[#1769ff]">
                      <span className={statusFilter ? "text-gray-900" : "text-gray-400"}>
                        {statusOptions.find((s) => s.value === statusFilter)?.label || "All Status"}
                      </span>
                      {statusFilter && (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#1769ff]">
                          <Check className="h-4 w-4" />
                        </span>
                      )}
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      </span>
                    </ListboxButton>
                    <Transition leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                      <ListboxOptions className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none">
                        {statusOptions.map((opt) => (
                          <ListboxOption key={opt.value} value={opt.value} className={({ active }) =>
                            `relative cursor-default select-none py-2 pl-10 pr-4 text-sm ${active ? "bg-[#1769ff]/10 text-[#1769ff]" : "text-gray-900"}`
                          }>
                            {({ selected }) => (
                              <>
                                <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>
                                  {opt.label}
                                </span>
                                {selected && (
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#1769ff]">
                                    <Check className="h-4 w-4" />
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

              {/* Condition */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Condition</label>
                <Listbox value={conditionFilter} onChange={(val) => { setConditionFilter(val); setCurrentPage(1); }}>
                  <div className="relative">
                    <ListboxButton className="relative w-full cursor-default rounded-md bg-white py-2 pl-10 pr-8 text-left border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-[#1769ff]/20 focus:border-[#1769ff]">
                      <span className={conditionFilter ? "text-gray-900" : "text-gray-400"}>
                        {conditionOptions.find((c) => c.value === conditionFilter)?.label || "All Condition"}
                      </span>
                      {conditionFilter && (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#1769ff]">
                          <Check className="h-4 w-4" />
                        </span>
                      )}
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      </span>
                    </ListboxButton>
                    <Transition leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                      <ListboxOptions className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none">
                        {conditionOptions.map((opt) => (
                          <ListboxOption key={opt.value} value={opt.value} className={({ active }) =>
                            `relative cursor-default select-none py-2 pl-10 pr-4 text-sm ${active ? "bg-[#1769ff]/10 text-[#1769ff]" : "text-gray-900"}`
                          }>
                            {({ selected }) => (
                              <>
                                <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>
                                  {opt.label}
                                </span>
                                {selected && (
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#1769ff]">
                                    <Check className="h-4 w-4" />
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
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearAll}
                  className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="min-h-screen flex flex-col items-center justify-center">
            <Loading className="w-10 h-10 text-[#1769ff] mb-4" />
            <p className="text-gray-500 font-medium">Loading catalog...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="border border-red-200 bg-red-50 rounded-xl p-6 text-red-600 flex items-start gap-4 mb-6">
            <div className="p-2 bg-red-100 rounded-lg shrink-0">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-red-800">Error loading equipment</h3>
              <p className="text-sm text-red-700/80 mt-1">
                {error instanceof Error ? error.message : "An unknown error occurred"}
              </p>
            </div>
          </div>
        )}

        {/* Assets Table */}
        {!loading && !error && assets.length > 0 && (
          <div className="overflow-x-auto border border-gray-100 rounded-lg">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">
                    SKU
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">
                    Model
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">
                    Location
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">
                    Condition
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {assets.map((asset) => (
                  <tr
                    key={asset.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() =>
                      navigate(`/inventory-manager/equipments/${asset.id}`)
                    }
                  >
                    <td className="px-4 py-3 text-sm text-gray-900 font-mono font-semibold">
                      {asset.sku}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {asset.models
                        ? `${asset.models.name} (${asset.models.brand})`
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {asset.storage_locations?.name || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={getConditionColor(asset.condition)}>
                        {asset.condition
                          ? asset.condition.replace("_", " ")
                          : "Unknown"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-md capitalize tracking-wide ${getStatusColor(asset.status)}`}
                      >
                        {asset.status || "Unknown"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && assets.length === 0 && (
          <div className="border border-dashed border-gray-300 rounded-[24px] p-16 text-center bg-gray-50/50">
            <div className="w-16 h-16 bg-white border border-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Archive className="w-8 h-8 text-[#1769ff]" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No assets found
            </h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              {searchQuery || hasActiveFilters
                ? "We couldn't find anything matching your search or filters. Try adjusting your filters."
                : "Your inventory is currently empty. Get started by adding your first asset to the system."}
            </p>
            {!searchQuery && !hasActiveFilters && (
              <Link to="/inventory-manager/add-equipment">
                <Button variant="primary" className="">
                  Add First Asset
                </Button>
              </Link>
            )}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
            <div className="text-sm text-gray-500">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} results
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600 px-2">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}