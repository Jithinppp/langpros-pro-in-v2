import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import {
  ChevronLeft,
  Edit,
  Trash2,
  MapPin,
  Wrench,
  Package,
  Info,
  Calendar,
  AlertCircle,
} from "lucide-react";
import Button from "../../components/Button";
import Loading from "../../components/Loading";
import { getStatusColor, getConditionColor } from "../../utils/theme";

export default function SingleEquipment() {
  const { id } = useParams<{ id: string }>();

  const {
    data: asset,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["asset", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select(
          `
          *,
          models:model_id(name, brand, code),
          storage_locations:location(name)
        `,
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loading className="w-10 h-10 text-[#1769ff] mb-4" />
        <p className="text-gray-500 font-medium">Loading asset details...</p>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="py-12 px-6">
        <div className="max-w-4xl mx-auto border border-red-200 bg-red-50 rounded-xl p-6 text-red-600 flex items-start gap-4">
          <div className="p-2 bg-red-100 rounded-lg shrink-0">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-red-800">Cannot load equipment</h3>
            <p className="text-sm text-red-700 mt-1">
              {error instanceof Error
                ? error.message
                : "The asset you are looking for does not exist or was removed."}
            </p>
            <div className="mt-4">
              <Link to="/inventory-manager/equipments">
                <Button variant="secondary">Back to Equipment List</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback string extraction for the joined models array if it behaves as a single element or object
  const modelData = Array.isArray(asset.models)
    ? asset.models[0]
    : asset.models;
  const assetTitle = modelData?.name || asset.sku;
  const brandName = modelData?.brand || "Unknown Brand";

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-16">
      <div className="max-w-6xl mx-auto px-6 py-10 animate-in fade-in duration-500">
        {/* Navigation & Header Actions */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            {/* Breadcrumb */}
            <Link
              to="/inventory-manager/equipments"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[#1769ff] transition-colors mb-4"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Equipments
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              {assetTitle}
            </h1>
            <p className="text-gray-500 mt-1 flex items-center gap-2">
              <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-xs font-mono font-medium tracking-wide">
                {asset.sku}
              </span>
              <span>•</span>
              {brandName}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              className="flex items-center gap-2 bg-white"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
              <span className="text-red-600">Delete</span>
            </Button>
            <Button variant="primary" className="flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Edit Asset
            </Button>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info Columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Status Bar */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-wrap items-center gap-8">
              <div>
                <p className="text-sm text-gray-500 font-medium mb-1">
                  System Status
                </p>
                <span
                  className={`inline-flex items-center px-3 py-1 text-sm font-bold rounded-md capitalize ${getStatusColor(asset.status)}`}
                >
                  {asset.status || "Available"}
                </span>
              </div>
              <div className="w-px h-10 bg-gray-200 hidden sm:block"></div>
              <div>
                <p className="text-sm text-gray-500 font-medium mb-1">
                  Condition
                </p>
                <span
                  className={`inline-flex items-center text-sm font-bold capitalize ${getConditionColor(asset.condition)}`}
                >
                  {asset.condition
                    ? asset.condition.replace("_", " ")
                    : "Unknown"}
                </span>
              </div>
              <div className="w-px h-10 bg-gray-200 hidden sm:block"></div>
              <div>
                <p className="text-sm text-gray-500 font-medium mb-1">
                  Current Location
                </p>
                <div className="flex items-center gap-1.5 text-gray-900 font-medium">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {asset.storage_locations?.name || "Unassigned"}
                </div>
              </div>
            </div>

            {/* Core Details Grids */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-gray-400" />
                <h2 className="font-semibold text-gray-900">
                  Identity Details
                </h2>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Serial Number</p>
                  <p className="font-mono text-gray-900">
                    {asset.serial_number || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Model ID</p>
                  <p className="font-mono text-gray-900 break-all">
                    {asset.model_id || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">SKU Tag</p>
                  <p className="font-mono text-gray-900">{asset.sku}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Database ID</p>
                  <p className="font-mono text-gray-500 text-sm">{asset.id}</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-gray-400" />
                <h2 className="font-semibold text-gray-900">
                  Additional Description
                </h2>
              </div>
              <div className="p-6">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {asset.description || (
                    <span className="text-gray-400 italic">
                      No description for this equipment
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-6">
            {/* Lifecycle Card */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                <h2 className="font-semibold text-gray-900">Lifecycle</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                  <span className="text-sm text-gray-500">Purchase Date</span>
                  <span className="font-medium text-gray-900">
                    {asset.purchase_date
                      ? new Date(asset.purchase_date).toLocaleDateString()
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                  <span className="text-sm text-gray-500">Warranty Expiry</span>
                  <span className="font-medium text-gray-900">
                    {asset.warranty_expiry
                      ? new Date(asset.warranty_expiry).toLocaleDateString()
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">System Entry</span>
                  <span className="font-medium text-gray-900">
                    {new Date(asset.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Maintenance Settings */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-gray-400" />
                <h2 className="font-semibold text-gray-900">
                  Maintenance Logs
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Last Service</span>
                  <span className="font-medium text-gray-900">
                    {asset.last_maintenance
                      ? new Date(asset.last_maintenance).toLocaleDateString()
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Next Due</span>
                  <span className="font-medium text-gray-900">
                    {asset.next_maintenance
                      ? new Date(asset.next_maintenance).toLocaleDateString()
                      : "-"}
                  </span>
                </div>
                <Button
                  variant="secondary"
                  className="w-full mt-4 justify-center bg-gray-50"
                >
                  Log Maintenance
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
