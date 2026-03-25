import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";
import { Archive, ShieldAlert, CheckCircle, List, Plus } from "lucide-react";

export interface Asset {
  id: string;
  name?: string;
  serial_number?: string;
  model_id?: string;
  status?: string;
  [key: string]: unknown;
}

export default function InventoryManagerDashboard() {
  const { user } = useAuthStore();

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ["assets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }
      return data || [];
    },
  });

  const totalItems = isLoading ? "-" : assets.length;
  // Based on the reference: "Damaged Items"
  const damagedItems = isLoading
    ? "-"
    : assets.filter(
        (a: Asset) =>
          a.status?.toLowerCase() === "maintenance" ||
          a.status?.toLowerCase() === "damaged",
      ).length;
  // Based on the reference: "Available Items"
  const availableItems = isLoading
    ? "-"
    : assets.filter(
        (a: Asset) => a.status?.toLowerCase() === "available" || !a.status,
      ).length;

  const roleTitle = user?.email?.split("@")[0] || "Manager";

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {roleTitle}
          </h1>
          <p className="text-gray-500 mt-1">Track and manage your inventory</p>
        </div>

        {/* Stats cards - style grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="border border-gray-100 rounded-lg p-6 hover:border-gray-200 transition-all">
            <div className="w-12 h-12 bg-[#00d26a]/10 rounded-lg flex items-center justify-center mb-4">
              <Archive className="w-6 h-6 text-[#00d26a]" />
            </div>
            <p className="text-4xl font-bold text-gray-900">{totalItems}</p>
            <p className="text-sm text-gray-500 mt-1">Total Items</p>
          </div>
          <div className="border border-gray-100 rounded-lg p-6 hover:border-gray-200 transition-all">
            <div className="w-12 h-12 bg-[#ffbd2e]/10 rounded-lg flex items-center justify-center mb-4">
              <ShieldAlert className="w-6 h-6 text-[#ffbd2e]" />
            </div>
            <p className="text-4xl font-bold text-gray-900">{damagedItems}</p>
            <p className="text-sm text-gray-500 mt-1">Damaged Items</p>
          </div>
          <div className="border border-gray-100 rounded-lg p-6 hover:border-gray-200 transition-all">
            <div className="w-12 h-12 bg-[#1769ff]/10 rounded-lg flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-[#1769ff]" />
            </div>
            <p className="text-4xl font-bold text-gray-900">{availableItems}</p>
            <p className="text-sm text-gray-500 mt-1">Available Items</p>
          </div>
        </div>

        {/* Quick Access Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <Link
            to="/inventory-manager/equipments"
            className="flex items-center justify-between p-6 border border-gray-100 rounded-lg hover:border-gray-200 transition-all group"
          >
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-[#1769ff] transition-colors">
                View All Equipment
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                See the complete inventory list
              </p>
            </div>
            <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center group-hover:bg-[#1769ff]/10 transition-colors">
              <List className="w-5 h-5 text-gray-400 group-hover:text-[#1769ff]" />
            </div>
          </Link>
          <Link
            to="/inventory-manager/add-equipment"
            className="flex items-center justify-between p-6 border border-gray-100 rounded-lg hover:border-gray-200 transition-all group"
          >
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-[#1769ff] transition-colors">
                Add New Item
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Add equipment to inventory
              </p>
            </div>
            <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center group-hover:bg-[#1769ff]/10 transition-colors">
              <Plus className="w-5 h-5 text-gray-400 group-hover:text-[#1769ff]" />
            </div>
          </Link>
        </div>

        {/* Welcome card */}
        <div className="bg-[#00d26a] rounded-lg p-8 text-white">
          <h2 className="text-2xl font-semibold mb-2">Welcome back! 👋</h2>
          <p className="text-white/80">
            You have full access to the Inventory Manager dashboard.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded text-sm font-medium">
            Role: Inventory Manager
          </div>
        </div>
      </div>
    </div>
  );
}
