import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import Button from "../../components/Button";
import Loading from "../../components/Loading";
import { getStatusColor, getConditionColor } from "../../utils/theme";
import {
  Search,
  Plus,
  MapPin,
  Archive,
  AlertCircle,
  ChevronLeft,
} from "lucide-react";
import Input from "../../components/Input";

export interface Asset {
  id: string;
  sku: string;
  name?: string; // fallback
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
  }[];
  storage_locations?: {
    name: string;
  };
  [key: string]: unknown;
}

const ITEMS_PER_PAGE = 15;

export default function EquipmentsPage() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["assets_paginated", currentPage, searchQuery],
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
          models:model_id(name, brand, code),
          storage_locations:location(name)
        `,
          { count: "exact" },
        )
        .order("created_at", { ascending: false });

      if (searchQuery.trim()) {
        const searchTerm = searchQuery.trim();
        query = query.or(
          `sku.ilike.%${searchTerm}%,serial_number.ilike.%${searchTerm}%`,
        );
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
  });

  const assets = data?.assets || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Main content */}
      <div className="max-w-6xl mx-auto px-6 py-12 animate-in fade-in duration-500">
        {/* Breadcrumb and Title */}
        <Link
          to="/inventory-manager"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[#1769ff] transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Inventory
        </Link>

        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              All Equipments
            </h1>
            <p className="text-gray-500 mt-1">
              View and manage your inventory ({totalCount} total)
            </p>
          </div>
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

        {/* Search Bar */}
        <div className="mb-8">
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

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
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
              <h3 className="font-bold text-red-800">
                Error loading equipment
              </h3>
              <p className="text-sm text-red-700/80 mt-1">
                {error instanceof Error
                  ? error.message
                  : "An unknown error occurred"}
              </p>
            </div>
          </div>
        )}

        {/* Assets Table */}
        {!loading && !error && assets.length > 0 && (
          <div className="border border-gray-100 rounded-md overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/80 border-b border-gray-100">
                  <tr>
                    <th className="text-xs font-semibold text-gray-500 uppercase tracking-widest px-6 py-4">
                      Asset / SKU
                    </th>

                    <th className="text-xs font-semibold text-gray-500 uppercase tracking-widest px-6 py-4">
                      Location
                    </th>
                    <th className="text-xs font-semibold text-gray-500 uppercase tracking-widest px-6 py-4">
                      Condition
                    </th>
                    <th className="text-xs font-semibold text-gray-500 uppercase tracking-widest px-6 py-4">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {assets.map((asset) => (
                    <tr
                      key={asset.id}
                      className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                      onClick={() =>
                        navigate(`/inventory-manager/equipments/${asset.id}`)
                      }
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900 group-hover:text-[#1769ff] transition-colors">
                          {asset.name ||
                            asset.sku ||
                            `Asset #${asset.id.slice(0, 6)}`}
                        </div>
                        <div className="text-sm font-medium text-gray-400 mt-0.5 font-mono">
                          {asset.serial_number || asset.sku || "-"}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-500">
                        {asset.storage_locations ? (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            {asset.storage_locations.name}
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-sm font-semibold capitalize ${getConditionColor(asset.condition)}`}
                        >
                          {asset.condition
                            ? asset.condition.replace("_", " ")
                            : "Unknown"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-md capitalize tracking-wide ${getStatusColor(asset.status)}`}
                        >
                          {asset.status || "Available"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
              {searchQuery
                ? "We couldn't find anything matching your search query. Try adjusting your filters."
                : "Your inventory is currently empty. Get started by adding your first asset to the system."}
            </p>
            {!searchQuery && (
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-8 gap-4 px-2">
            <div className="text-sm font-medium text-gray-500">
              Showing{" "}
              <span className="text-gray-900 font-bold">
                {(currentPage - 1) * ITEMS_PER_PAGE + 1}
              </span>{" "}
              to{" "}
              <span className="text-gray-900 font-bold">
                {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)}
              </span>{" "}
              of <span className="text-gray-900 font-bold">{totalCount}</span>{" "}
              results
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>

              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => {
                    // Simple pagination logic to only show nearby pages to avoid overflow
                    if (
                      totalPages > 5 &&
                      page !== 1 &&
                      page !== totalPages &&
                      Math.abs(page - currentPage) > 1
                    ) {
                      if (page === 2 || page === totalPages - 1)
                        return (
                          <span key={page} className="px-2 text-gray-400">
                            ...
                          </span>
                        );
                      return null;
                    }

                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`w-9 h-9 text-sm font-medium rounded-lg transition-colors ${
                          page === currentPage
                            ? "bg-[#1769ff] text-white"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  },
                )}
              </div>

              <Button
                variant="secondary"
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
