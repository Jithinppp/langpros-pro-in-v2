import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState } from "react";

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

  // All queries fetch on mount so tab counts and data are always fresh
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
  });

  const tabs: { key: TabType; label: string; count: number | undefined }[] = [
    { key: "assets", label: "Assets", count: assetsCount },
    { key: "categories", label: "Categories", count: categoriesCount },
    { key: "subcategories", label: "Subcategories", count: subcategoriesCount },
    { key: "models", label: "Models", count: modelsCount },
  ];

  const currentCount =
    activeTab === "assets" ? assetsCount :
    activeTab === "categories" ? categoriesCount :
    activeTab === "subcategories" ? subcategoriesCount :
    modelsCount;

  const isLoading =
    (activeTab === "assets" && assetsLoading) ||
    (activeTab === "categories" && categoriesLoading) ||
    (activeTab === "subcategories" && subcategoriesLoading) ||
    (activeTab === "models" && modelsLoading);

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

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.key
                  ? "border-[#1769ff] text-[#1769ff]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-1.5 bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {isLoading ? (
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
