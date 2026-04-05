import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useState, useMemo } from "react";
import Loading from "../../components/Loading";

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

  const { data: assetsData, isLoading: assetsLoading } = useQuery<
    ArchivedAsset[]
  >({
    queryKey: ["archived-assets", page],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select(
          `*,
          models:model_id(name),
          storage_locations:location(name)`,
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

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery<
    ArchivedCategory[]
  >({
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

  const { data: subcategoriesData, isLoading: subcategoriesLoading } = useQuery<
    ArchivedSubcategory[]
  >({
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

  const { data: modelsData, isLoading: modelsLoading } = useQuery<
    ArchivedModel[]
  >({
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

  const tabs = useMemo(
    () => [
      { key: "assets" as const, label: "Assets", count: assetsCount },
      {
        key: "categories" as const,
        label: "Categories",
        count: categoriesCount,
      },
      {
        key: "subcategories" as const,
        label: "Subcategories",
        count: subcategoriesCount,
      },
      { key: "models" as const, label: "Models", count: modelsCount },
    ],
    [assetsCount, categoriesCount, subcategoriesCount, modelsCount],
  );

  const currentCount =
    activeTab === "assets"
      ? assetsCount
      : activeTab === "categories"
        ? categoriesCount
        : activeTab === "subcategories"
          ? subcategoriesCount
          : modelsCount;

  const currentLoading =
    activeTab === "assets"
      ? assetsLoading
      : activeTab === "categories"
        ? categoriesLoading
        : activeTab === "subcategories"
          ? subcategoriesLoading
          : modelsLoading;

  const totalPages = Math.ceil((currentCount || 0) / limit);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setPage(1);
  };

  return (
    <div className="min-h-screen font-sans p-4 py-12">
      <div className="w-full mx-auto rounded-2xl overflow-hidden p-6 md:p-10">
        <div className="mb-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Archive</h2>
          <p className="text-slate-500 mt-2 text-sm">
            View and restore deleted items
          </p>
        </div>

        <div className="flex items-center gap-1 border-b border-slate-200/60 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
              {tab.count ? ` (${tab.count})` : ""}
            </button>
          ))}
        </div>

        {currentLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loading className="w-10 h-10" color="border-slate-900" />
            <p className="text-sm text-slate-400 mt-4">Loading...</p>
          </div>
        ) : (
          <>
            {activeTab === "assets" && (
              <>
                {assetsData?.length === 0 ? (
                  <div className="py-20 text-center">
                    <p className="text-sm font-medium text-slate-500">
                      No archived assets
                    </p>
                    <p className="text-sm text-slate-400 mt-2">
                      Deleted assets will appear here
                    </p>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg border border-slate-200/60 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                          <tr>
                            <th className="text-left text-xs font-medium text-slate-500 uppercase px-5 py-3 tracking-wider">
                              SKU
                            </th>
                            <th className="text-left text-xs font-medium text-slate-500 uppercase px-5 py-3 tracking-wider">
                              Model
                            </th>
                            <th className="text-left text-xs font-medium text-slate-500 uppercase px-5 py-3 tracking-wider">
                              Serial Number
                            </th>
                            <th className="text-left text-xs font-medium text-slate-500 uppercase px-5 py-3 tracking-wider">
                              Location
                            </th>
                            <th className="text-left text-xs font-medium text-slate-500 uppercase px-5 py-3 tracking-wider">
                              Status
                            </th>
                            <th className="text-left text-xs font-medium text-slate-500 uppercase px-5 py-3 tracking-wider">
                              Deleted Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {assetsData?.map((asset) => (
                            <tr
                              key={asset.id}
                              className="hover:bg-slate-50/50 transition-colors"
                            >
                              <td className="px-5 py-3 text-sm text-slate-900 font-mono">
                                {asset.sku}
                              </td>
                              <td className="px-5 py-3 text-sm text-slate-900">
                                {asset.models?.name || "-"}
                              </td>
                              <td className="px-5 py-3 text-sm text-slate-500 font-mono">
                                {asset.serial_number || "-"}
                              </td>
                              <td className="px-5 py-3 text-sm text-slate-500">
                                {asset.storage_locations?.name || "-"}
                              </td>
                              <td className="px-5 py-3 text-sm text-slate-500">
                                {asset.status}
                              </td>
                              <td className="px-5 py-3 text-sm text-slate-500">
                                {new Date(
                                  asset.updated_at,
                                ).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === "categories" && (
              <>
                {categoriesData?.length === 0 ? (
                  <div className="py-20 text-center">
                    <p className="text-sm font-medium text-slate-500">
                      No archived categories
                    </p>
                    <p className="text-sm text-slate-400 mt-2">
                      Deleted categories will appear here
                    </p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                          <tr>
                            <th className="text-left text-xs font-medium text-slate-500 uppercase px-5 py-3 tracking-wider">
                              Name
                            </th>
                            <th className="text-left text-xs font-medium text-slate-500 uppercase px-5 py-3 tracking-wider">
                              Code
                            </th>
                            <th className="text-left text-xs font-medium text-slate-500 uppercase px-5 py-3 tracking-wider">
                              Description
                            </th>
                            <th className="text-left text-xs font-medium text-slate-500 uppercase px-5 py-3 tracking-wider">
                              Created
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {categoriesData?.map((cat) => (
                            <tr
                              key={cat.id}
                              className="hover:bg-slate-50/50 transition-colors"
                            >
                              <td className="px-5 py-3 text-sm text-slate-900 font-medium">
                                {cat.name}
                              </td>
                              <td className="px-5 py-3 text-sm text-slate-500 font-mono">
                                {cat.code}
                              </td>
                              <td className="px-5 py-3 text-sm text-slate-500">
                                {cat.description || "-"}
                              </td>
                              <td className="px-5 py-3 text-sm text-slate-500">
                                {new Date(cat.created_at).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === "subcategories" && (
              <>
                {subcategoriesData?.length === 0 ? (
                  <div className="py-20 text-center">
                    <p className="text-sm font-medium text-slate-500">
                      No archived subcategories
                    </p>
                    <p className="text-sm text-slate-400 mt-2">
                      Deleted subcategories will appear here
                    </p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                          <tr>
                            <th className="text-left text-xs font-medium text-slate-500 uppercase px-5 py-3 tracking-wider">
                              Name
                            </th>
                            <th className="text-left text-xs font-medium text-slate-500 uppercase px-5 py-3 tracking-wider">
                              Code
                            </th>
                            <th className="text-left text-xs font-medium text-slate-500 uppercase px-5 py-3 tracking-wider">
                              Category
                            </th>
                            <th className="text-left text-xs font-medium text-slate-500 uppercase px-5 py-3 tracking-wider">
                              Description
                            </th>
                            <th className="text-left text-xs font-medium text-slate-500 uppercase px-5 py-3 tracking-wider">
                              Created
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {subcategoriesData?.map((sub) => (
                            <tr
                              key={sub.id}
                              className="hover:bg-slate-50/50 transition-colors"
                            >
                              <td className="px-5 py-3 text-sm text-slate-900 font-medium">
                                {sub.name}
                              </td>
                              <td className="px-5 py-3 text-sm text-slate-500 font-mono">
                                {sub.code}
                              </td>
                              <td className="px-5 py-3 text-sm text-slate-500">
                                {sub.categories
                                  ? `${sub.categories.name} (${sub.categories.code})`
                                  : "-"}
                              </td>
                              <td className="px-5 py-3 text-sm text-slate-500">
                                {sub.description || "-"}
                              </td>
                              <td className="px-5 py-3 text-sm text-slate-500">
                                {new Date(sub.created_at).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === "models" && (
              <>
                {modelsData?.length === 0 ? (
                  <div className="py-20 text-center">
                    <p className="text-sm font-medium text-slate-500">
                      No archived models
                    </p>
                    <p className="text-sm text-slate-400 mt-2">
                      Deleted models will appear here
                    </p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                          <tr>
                            <th className="text-left text-xs font-medium text-slate-500 uppercase px-5 py-3 tracking-wider">
                              Name
                            </th>
                            <th className="text-left text-xs font-medium text-slate-500 uppercase px-5 py-3 tracking-wider">
                              Code
                            </th>
                            <th className="text-left text-xs font-medium text-slate-500 uppercase px-5 py-3 tracking-wider">
                              Brand
                            </th>
                            <th className="text-left text-xs font-medium text-slate-500 uppercase px-5 py-3 tracking-wider">
                              Subcategory
                            </th>
                            <th className="text-left text-xs font-medium text-slate-500 uppercase px-5 py-3 tracking-wider">
                              Description
                            </th>
                            <th className="text-left text-xs font-medium text-slate-500 uppercase px-5 py-3 tracking-wider">
                              Created
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {modelsData?.map((model) => (
                            <tr
                              key={model.id}
                              className="hover:bg-slate-50/50 transition-colors"
                            >
                              <td className="px-5 py-3 text-sm text-slate-900 font-medium">
                                {model.name}
                              </td>
                              <td className="px-5 py-3 text-sm text-slate-500 font-mono">
                                {model.code}
                              </td>
                              <td className="px-5 py-3 text-sm text-slate-500">
                                {model.brand}
                              </td>
                              <td className="px-5 py-3 text-sm text-slate-500">
                                {model.subcategories
                                  ? `${model.subcategories.name} (${model.subcategories.code})`
                                  : "-"}
                              </td>
                              <td className="px-5 py-3 text-sm text-slate-500">
                                {model.description || "-"}
                              </td>
                              <td className="px-5 py-3 text-sm text-slate-500">
                                {new Date(
                                  model.created_at,
                                ).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 mt-8 pt-6 border-t border-slate-200/60">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-5 py-2.5 text-sm font-medium border border-slate-200/60 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-500">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-5 py-2.5 text-sm font-medium border border-slate-200/60 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
