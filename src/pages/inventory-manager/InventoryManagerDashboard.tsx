import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";
import {
  Archive as ArchiveIcon,
  ShieldAlert,
  CheckCircle,
  List,
  Plus,
  Activity,
} from "lucide-react";

interface Stats {
  total: number;
  damaged: number;
  available: number;
}

export default function InventoryManagerDashboard() {
  const { user } = useAuthStore();

  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["assets-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("status")
        .eq("is_active", true);

      if (error) throw error;

      const allStatuses = data?.map((d) => d.status) || [];
      const maintenanceCount = allStatuses.filter(
        (s) => s === "maintenance",
      ).length;
      const damagedCount = allStatuses.filter((s) => s === "damaged").length;
      const availableCount = allStatuses.filter(
        (s) => s === "available",
      ).length;

      return {
        total: allStatuses.length,
        damaged: damagedCount + maintenanceCount,
        available: availableCount,
      };
    },
    staleTime: 60000,
  });

  const renderStat = (value: number | undefined) => {
    if (isLoading) {
      return <span className="text-sm text-gray-400">loading...</span>;
    }
    return value ?? 0;
  };

  const roleTitle = user?.email?.split("@")[0] || "Manager";

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-6xl mx-auto sm:px-2 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {roleTitle}
          </h1>
          <p className="text-gray-500 mt-1">Track and manage your inventory</p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="border border-gray-100 rounded-lg p-6 hover:border-gray-200 transition-all">
            <div className="w-12 h-12 bg-[#00d26a]/10 rounded-lg flex items-center justify-center mb-4">
              <ArchiveIcon className="w-6 h-6 text-[#00d26a]" />
            </div>
            <p className="text-4xl font-bold text-gray-900">
              {renderStat(stats?.total)}
            </p>
            <p className="text-sm text-gray-500 mt-1">Total Items</p>
          </div>
          <div className="border border-gray-100 rounded-lg p-6 hover:border-gray-200 transition-all">
            <div className="w-12 h-12 bg-[#ffbd2e]/10 rounded-lg flex items-center justify-center mb-4">
              <ShieldAlert className="w-6 h-6 text-[#ffbd2e]" />
            </div>
            <p className="text-4xl font-bold text-gray-900">
              {renderStat(stats?.damaged)}
            </p>
            <p className="text-sm text-gray-500 mt-1">Damaged Items</p>
          </div>
          <div className="border border-gray-100 rounded-lg p-6 hover:border-gray-200 transition-all">
            <div className="w-12 h-12 bg-[#1769ff]/10 rounded-lg flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-[#1769ff]" />
            </div>
            <p className="text-4xl font-bold text-gray-900">
              {renderStat(stats?.available)}
            </p>
            <p className="text-sm text-gray-500 mt-1">Available Items</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            to="/inventory-manager/add-equipment"
            className="flex items-center gap-4 p-6 border border-gray-100 rounded-lg hover:border-[#1769ff] hover:bg-[#1769ff]/5 transition-all group"
          >
            <div className="w-12 h-12 bg-[#1769ff]/10 rounded-lg flex items-center justify-center group-hover:bg-[#1769ff] transition-all">
              <Plus className="w-6 h-6 text-[#1769ff] group-hover:text-white transition-all" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Add New Equipment</h3>
              <p className="text-sm text-gray-500">
                Register new equipment to your inventory
              </p>
            </div>
          </Link>

          <Link
            to="/inventory-manager/equipments"
            className="flex items-center gap-4 p-6 border border-gray-100 rounded-lg hover:border-[#1769ff] hover:bg-[#1769ff]/5 transition-all group"
          >
            <div className="w-12 h-12 bg-[#1769ff]/10 rounded-lg flex items-center justify-center group-hover:bg-[#1769ff] transition-all">
              <List className="w-6 h-6 text-[#1769ff] group-hover:text-white transition-all" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                View All Equipment
              </h3>
              <p className="text-sm text-gray-500">
                Browse and manage your equipment catalog
              </p>
            </div>
          </Link>

          <Link
            to="/inventory-manager/archive"
            className="flex items-center gap-4 p-6 border border-gray-100 rounded-lg hover:border-[#1769ff] hover:bg-[#1769ff]/5 transition-all group"
          >
            <div className="w-12 h-12 bg-[#ffbd2e]/10 rounded-lg flex items-center justify-center group-hover:bg-[#ffbd2e] transition-all">
              <ArchiveIcon className="w-6 h-6 text-[#ffbd2e] group-hover:text-white transition-all" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Archive</h3>
              <p className="text-sm text-gray-500">
                View and restore deleted items
              </p>
            </div>
          </Link>

          <Link
            to="/inventory-manager/activities"
            className="flex items-center gap-4 p-6 border border-gray-100 rounded-lg hover:border-[#1769ff] hover:bg-[#1769ff]/5 transition-all group"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-500 transition-all">
              <Activity className="w-6 h-6 text-purple-600 group-hover:text-white transition-all" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Activity Log</h3>
              <p className="text-sm text-gray-500">
                View all changes and activities
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
