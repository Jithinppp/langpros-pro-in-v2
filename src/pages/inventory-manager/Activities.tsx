import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import SelectDropdown from "../../components/SelectDropdown";
import { ChevronLeft, Search, Loader2 } from "lucide-react";

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

interface ActivityRecord {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  created_at: string;
}

interface ActivityResponse {
  records: ActivityRecord[];
  totalCount: number;
}

const TABLE_LABELS: Record<string, string> = {
  assets: "Equipment",
  categories: "Category",
  subcategories: "Subcategory",
  models: "Model",
  storage_locations: "Storage Location",
};

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  create: { label: "Created", color: "bg-green-100 text-green-700" },
  update: { label: "Updated", color: "bg-blue-100 text-blue-700" },
  delete: { label: "Deleted", color: "bg-red-100 text-red-700" },
  restore: { label: "Restored", color: "bg-purple-100 text-purple-700" },
};

export default function Activities() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [tableFilter, setTableFilter] = useState<string>("");
  const [actionFilter, setActionFilter] = useState<string>("");
  const limit = 20;
  const offset = (page - 1) * limit;

  const debouncedSearch = useDebounce(searchQuery, 300);

  const tableOptions = [
    { value: "", label: "All Tables" },
    ...Object.entries(TABLE_LABELS).map(([key, label]) => ({
      value: key,
      label,
    })),
  ];

  const actionOptions = [
    { value: "", label: "All Actions" },
    ...Object.entries(ACTION_LABELS).map(([key, { label }]) => ({
      value: key,
      label,
    })),
  ];

  const { data, isLoading } = useQuery<ActivityResponse>({
    queryKey: ["activities", page, debouncedSearch, tableFilter, actionFilter],
    queryFn: async () => {
      let query = supabase
        .from("activity_logs")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (tableFilter) {
        query = query.eq("entity_type", tableFilter);
      }

      if (actionFilter) {
        query = query.eq("action", actionFilter);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      let records = data || [];

      if (debouncedSearch.trim()) {
        const search = debouncedSearch.toLowerCase();
        records = records.filter((r) => {
          const newStr = JSON.stringify(r.new_values || {}).toLowerCase();
          const oldStr = JSON.stringify(r.old_values || {}).toLowerCase();
          return newStr.includes(search) || oldStr.includes(search);
        });
      }

      return { records, totalCount: count || 0 };
    },
  });

  const totalPages = Math.ceil((data?.totalCount || 0) / limit);

  const formatTimestamp = (ts: string) => {
    const date = new Date(ts);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAction = (action: string) => {
    const act = ACTION_LABELS[action] || {
      label: action,
      color: "bg-gray-100 text-gray-700",
    };
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${act.color}`}
      >
        {act.label}
      </span>
    );
  };

  const getEntityName = (
    record: Record<string, unknown> | null,
    tableName: string,
  ): string => {
    if (!record) return "-";

    if (tableName === "assets") {
      return (
        (record.sku as string) ||
        (record.name as string) ||
        (record.id as string)?.slice(0, 8)
      );
    }
    if (
      tableName === "categories" ||
      tableName === "subcategories" ||
      tableName === "models"
    ) {
      return (record.name as string) || (record.id as string)?.slice(0, 8);
    }
    if (tableName === "storage_locations") {
      return (record.name as string) || (record.id as string)?.slice(0, 8);
    }
    return (record.id as string)?.slice(0, 8) || "-";
  };

  const getChanges = (
    newValues: Record<string, unknown> | null,
    oldValues: Record<string, unknown> | null,
    action: string,
  ) => {
    if (action === "create") {
      return <span className="text-green-600">Created new record</span>;
    }
    if (action === "delete") {
      return <span className="text-red-600">Record deleted</span>;
    }
    if (action === "restore") {
      return <span className="text-purple-600">Record restored</span>;
    }

    if (!oldValues) return null;

    const changes: string[] = [];
    for (const key of Object.keys(newValues || {})) {
      if (key === "id" || key === "created_at" || key === "updated_at")
        continue;
      if ((newValues || {})[key] !== oldValues[key]) {
        changes.push(
          `${key}: ${oldValues[key]} \u2192 ${(newValues || {})[key]}`,
        );
      }
    }
    return changes.length > 0 ? (
      <span className="text-gray-600">{changes.join(", ")}</span>
    ) : (
      <span className="text-gray-400">No changes</span>
    );
  };

  return (
    <div className="min-h-screen font-sans p-4 py-12">
      <div className="w-full mx-auto rounded-2xl overflow-hidden">
        <div className="p-6 md:p-10">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Activities
            </h2>
            <p className="text-sm text-gray-500">
              View all changes made to your inventory ({data?.totalCount || 0}{" "}
              records)
            </p>
          </div>
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search changes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-400 transition-colors placeholder:text-gray-400"
                />
              </div>
            </div>

            <div className="w-40">
              <SelectDropdown
                value={tableFilter}
                onChange={(val) => {
                  setTableFilter(val);
                  setPage(1);
                }}
                options={tableOptions}
                placeholder="All Tables"
                size="md"
              />
            </div>

            <div className="w-36">
              <SelectDropdown
                value={actionFilter}
                onChange={(val) => {
                  setActionFilter(val);
                  setPage(1);
                }}
                options={actionOptions}
                placeholder="All Actions"
                size="md"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : data?.records.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-sm text-gray-300 mb-2">No activities found</p>
              <p className="text-sm text-gray-400 mb-6">
                Activity logs will appear here as changes are made
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto border border-gray-200 rounded-2xl">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3 tracking-wider">
                        Time
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3 tracking-wider">
                        Action
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3 tracking-wider">
                        Type
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3 tracking-wider">
                        Item
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3 tracking-wider">
                        Changes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data?.records.map((record) => (
                      <tr
                        key={record.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatTimestamp(record.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          {formatAction(record.action)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {TABLE_LABELS[record.entity_type] ||
                            record.entity_type}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                          {getEntityName(
                            record.action === "delete"
                              ? record.old_values
                              : record.new_values,
                            record.entity_type,
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm max-w-xs truncate">
                          {getChanges(
                            record.new_values,
                            record.old_values,
                            record.action,
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6 pt-6 border-t border-gray-100">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-500">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
