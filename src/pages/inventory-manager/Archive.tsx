import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, ChevronDown } from "lucide-react";
import { useState, useMemo } from "react";
import { Listbox, ListboxButton, ListboxOptions, ListboxOption, Transition } from "@headlessui/react";

interface ArchivedAsset {
  id: string;
  sku: string;
  serial_number: string | null;
  status: string;
  condition: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  model_id: string | null;
  location_id: string | null;
  models?: {
    name: string;
  };
  storage_locations?: {
    name: string;
  };
}

interface ArchivedCategory {
  id: string;
  name: string;
  code: string;
  description: string | null;
  created_at: string;
}

interface ArchivedSubcategory {
  id: string;
  name: string;
  code: string;
  description: string | null;
  created_at: string;
  category_id: string;
  categories?: {
    name: string;
    code: string;
  };
}

interface ArchivedModel {
  id: string;
  name: string;
  code: string;
  brand: string;
  description: string | null;
  created_at: string;
  subcategory_id: string;
  subcategories?: {
    name: string;
    code: string;
  };
}

type TabType = "assets" | "categories" | "subcategories" | "models";

export default function Archive() {
  const [activeTab, setActiveTab] = useState<TabType>("assets");
  const [page, setPage] = useState(1);
  const limit = 20;
  const offset = (page - 1) * limit;

  // All queries fetch only when their tab is active - reduces unnecessary fetching
  const { data: assetsData, isLoading: assetsLoading } = useQuery<ArchivedAsset[]>({
    queryKey: ["archived-assets", page],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select(
          `*,
          models:model_id(name),
          storage_locations:location(name)`
        )
        .eq("is_active", false)
        .order("updated_at", { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) throw error;
      return data || [];
    },
    enabled: activeTab === "assets",
  });

  const { data: assetsCount } = useQuery({
    queryKey: ["archived-assets-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("assets")
        .select("*", { count: "exact", head: true })
        .eq("is_active", false);
      return count || 0;
    },
    enabled: activeTab === "assets",
  });

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery<ArchivedCategory[]>({
    queryKey: ["archived-categories", page],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", false)
        .order("name")
        .range(offset, offset + limit - 1);
      if (error) throw error;
      return data || [];
    },
    enabled: activeTab === "categories",
  });

  const { data: categoriesCount } = useQuery({
    queryKey: ["archived-categories-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("categories")
        .select("*", { count: "exact", head: true })
        .eq("is_active", false);
      return count || 0;
    },
    enabled: activeTab === "categories",
  });

  const { data: subcategoriesData, isLoading: subcategoriesLoading } = useQuery<ArchivedSubcategory[]>({
    queryKey: ["archived-subcategories", page],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subcategories")
        .select("*, categories:categories(name, code)")
        .eq("is_active", false)
        .order("name")
        .range(offset, offset + limit - 1);
      if (error) throw error;
      return data || [];
    },
    enabled: activeTab === "subcategories",
  });

  const { data: subcategoriesCount } = useQuery({
    queryKey: ["archived-subcategories-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("subcategories")
        .select("*", { count: "exact", head: true })
        .eq("is_active", false);
      return count || 0;
    },
    enabled: activeTab === "subcategories",
  });

  const { data: modelsData, isLoading: modelsLoading } = useQuery<ArchivedModel[]>({
    queryKey: ["archived-models", page],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("models")
        .select("*, subcategories:subcategories(name, code)")
        .eq("is_active", false)
        .order("name")
        .range(offset, offset + limit - 1);
      if (error) throw error;
      return data || [];
    },
    enabled: activeTab === "models",
  });

  const { data: modelsCount } = useQuery({
    queryKey: ["archived-models-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("models")
        .select("*", { count: "exact", head: true })
        .eq("is_active", false);
      return count || 0;
    },
    enabled: activeTab === "models",
  });

  const tabs = useMemo(() => [
    { key: "assets" as const, label: "Assets", count: assetsCount },
    { key: "categories" as const, label: "Categories", count: categoriesCount },
    { key: "subcategories" as const, label: "Subcategories", count: subcategoriesCount },
    { key: "models" as const, label: "Models", count: modelsCount },
  ], [assetsCount, categoriesCount, subcategoriesCount, modelsCount]);

  const currentTab = useMemo(() => tabs.find(t => t.key === activeTab), [tabs, activeTab]);

  const currentCount =
    activeTab === "assets" ? assetsCount :
    activeTab === "categories" ? categoriesCount :
    activeTab === "subcategories" ? subcategoriesCount :
    modelsCount;

  const currentLoading =
    activeTab === "assets" ? assetsLoading :
    activeTab === "categories" ? categoriesLoading :
    activeTab === "subcategories" ? subcategoriesLoading :
    modelsLoading;

  const totalPages = Math.ceil((currentCount || 0) / limit);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setPage(1);
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Link
            to="/inventory-manager"
            className="inline-flex items-center text-gray-500 hover:text-gray-700 text-sm mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Archive</h1>
          <p className="text-gray-500 mt-1">
            View and restore deleted items
          </p>
        </div>

        {/* Tab Dropdown */}
        <div className="mb-6">
          <Listbox value={activeTab} onChange={handleTabChange}>
            <div className="relative w-full max-w-xs">
              <ListboxButton className="relative w-full cursor-default rounded-lg bg-white py-2.5 pl-4 pr-10 text-left border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#1769ff]/20 focus:border-[#1769ff]">
                <span className="text-gray-900 font-medium">
                  {currentTab?.label}
                  {currentTab?.count !== undefined && currentTab?.count > 0 && (
                    <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                      {currentTab?.count}
                    </span>
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
                <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none">
                  {tabs.map((tab) => (
                    <ListboxOption
                      key={tab.key}
                      value={tab.key}
                      className={({ active }) =>
                        `relative cursor-default select-none py-2.5 pl-10 pr-4 ${
                          active ? "bg-blue-50 text-[#1769ff]" : "text-gray-900"
                        }`
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>
                            {tab.label}
                            {tab.count !== undefined && tab.count > 0 && (
                              <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                                {tab.count}
                              </span>
                            )}
                          </span>
                          {selected && (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#1769ff]">
                              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
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

        {currentLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            {/* Assets Tab */}
            {activeTab === "assets" && (
              <>
                {assetsData?.length === 0 ? (
                  <div className="text-center py-12 border border-gray-100 rounded-lg">
                    <p className="text-gray-500">No archived assets</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-gray-100 rounded-lg">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">SKU</th>
                          <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Model</th>
                          <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Serial Number</th>
                          <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Location</th>
                          <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Status</th>
                          <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Deleted Date</th>
                          <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {assetsData?.map((asset) => (
                          <tr key={asset.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900 font-mono">{asset.sku}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{asset.models?.name || "-"}</td>
                            <td className="px-4 py-3 text-sm text-gray-500 font-mono">{asset.serial_number || "-"}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{asset.storage_locations?.name || "-"}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{asset.status}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{new Date(asset.updated_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* Categories Tab */}
            {activeTab === "categories" && (
              <>
                {categoriesData?.length === 0 ? (
                  <div className="text-center py-12 border border-gray-100 rounded-lg">
                    <p className="text-gray-500">No archived categories</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-gray-100 rounded-lg">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Name</th>
                          <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Code</th>
                          <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Description</th>
                          <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Created</th>
                          <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {categoriesData?.map((cat) => (
                          <tr key={cat.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900 font-medium">{cat.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-500 font-mono">{cat.code}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{cat.description || "-"}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{new Date(cat.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* Subcategories Tab */}
            {activeTab === "subcategories" && (
              <>
                {subcategoriesData?.length === 0 ? (
                  <div className="text-center py-12 border border-gray-100 rounded-lg">
                    <p className="text-gray-500">No archived subcategories</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-gray-100 rounded-lg">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Name</th>
                          <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Code</th>
                          <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Category</th>
                          <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Description</th>
                          <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Created</th>
                          <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {subcategoriesData?.map((sub) => (
                          <tr key={sub.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900 font-medium">{sub.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-500 font-mono">{sub.code}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {sub.categories ? `${sub.categories.name} (${sub.categories.code})` : "-"}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">{sub.description || "-"}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{new Date(sub.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* Models Tab */}
            {activeTab === "models" && (
              <>
                {modelsData?.length === 0 ? (
                  <div className="text-center py-12 border border-gray-100 rounded-lg">
                    <p className="text-gray-500">No archived models</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-gray-100 rounded-lg">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Name</th>
                          <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Code</th>
                          <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Brand</th>
                          <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Subcategory</th>
                          <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Description</th>
                          <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Created</th>
                          <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {modelsData?.map((model) => (
                          <tr key={model.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900 font-medium">{model.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-500 font-mono">{model.code}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{model.brand}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {model.subcategories ? `${model.subcategories.name} (${model.subcategories.code})` : "-"}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">{model.description || "-"}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{new Date(model.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 text-sm border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
