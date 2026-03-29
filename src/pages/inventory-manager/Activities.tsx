import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Listbox, ListboxButton, ListboxOptions, ListboxOption, Transition } from "@headlessui/react";
import { supabase } from "../../lib/supabase";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, Loader2, ChevronDown, Check } from "lucide-react";
import Input from "../../components/Input";

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
    const act = ACTION_LABELS[action] || { label: action, color: "bg-gray-100 text-gray-700" };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${act.color}`}>
        {act.label}
      </span>
    );
  };

  const getEntityName = (record: Record<string, unknown> | null, tableName: string): string => {
    if (!record) return "-";
    
    if (tableName === "assets") {
      return (record.sku as string) || (record.name as string) || (record.id as string)?.slice(0, 8);
    }
    if (tableName === "categories" || tableName === "subcategories" || tableName === "models") {
      return (record.name as string) || (record.id as string)?.slice(0, 8);
    }
    if (tableName === "storage_locations") {
      return (record.name as string) || (record.id as string)?.slice(0, 8);
    }
    return (record.id as string)?.slice(0, 8) || "-";
  };

  const getChanges = (newValues: Record<string, unknown> | null, oldValues: Record<string, unknown> | null, action: string) => {
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
      if (key === "id" || key === "created_at" || key === "updated_at") continue;
      if ((newValues || {})[key] !== oldValues[key]) {
        changes.push(`${key}: ${oldValues[key]} → ${(newValues || {})[key]}`);
      }
    }
    return changes.length > 0 ? <span className="text-gray-600">{changes.join(", ")}</span> : <span className="text-gray-400">No changes</span>;
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-8">
        <div className="mb-6">
          <Link
            to="/inventory-manager"
            className="inline-flex items-center text-gray-500 hover:text-gray-700 text-sm mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Activities</h1>
          <p className="text-gray-500 mt-1">
            View all changes made to your inventory ({data?.totalCount || 0} records)
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search changes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2"
              />
            </div>
          </div>

          <Listbox value={tableFilter} onChange={(val) => { setTableFilter(val); setPage(1); }}>
            <div className="relative w-40">
              <ListboxButton className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-[#1769ff]/20 focus:border-[#1769ff]">
                <span className={tableFilter ? "text-gray-900" : "text-gray-500"}>
                  {tableFilter ? TABLE_LABELS[tableFilter] || tableFilter : "All Tables"}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </span>
              </ListboxButton>
              <Transition
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <ListboxOptions className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  <ListboxOption
                    value=""
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? "bg-blue-50 text-[#1769ff]" : "text-gray-900"}`
                    }
                  >
                    {({ selected }) => (
                      <>
                        <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>All Tables</span>
                        {selected && (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#1769ff]">
                            <Check className="h-4 w-4" />
                          </span>
                        )}
                      </>
                    )}
                  </ListboxOption>
                  {Object.entries(TABLE_LABELS).map(([key, label]) => (
                    <ListboxOption
                      key={key}
                      value={key}
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? "bg-blue-50 text-[#1769ff]" : "text-gray-900"}`
                    }
                    >
                      {({ selected }) => (
                        <>
                          <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>{label}</span>
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

          <Listbox value={actionFilter} onChange={(val) => { setActionFilter(val); setPage(1); }}>
            <div className="relative w-36">
              <ListboxButton className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-[#1769ff]/20 focus:border-[#1769ff]">
                <span className={actionFilter ? "text-gray-900" : "text-gray-500"}>
                  {actionFilter ? ACTION_LABELS[actionFilter]?.label || actionFilter : "All Actions"}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </span>
              </ListboxButton>
              <Transition
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <ListboxOptions className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  <ListboxOption
                    value=""
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? "bg-blue-50 text-[#1769ff]" : "text-gray-900"}`
                    }
                  >
                    {({ selected }) => (
                      <>
                        <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>All Actions</span>
                        {selected && (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#1769ff]">
                            <Check className="h-4 w-4" />
                          </span>
                        )}
                      </>
                    )}
                  </ListboxOption>
                  {Object.entries(ACTION_LABELS).map(([key, { label }]) => (
                    <ListboxOption
                      key={key}
                      value={key}
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? "bg-blue-50 text-[#1769ff]" : "text-gray-900"}`
                    }
                    >
                      {({ selected }) => (
                        <>
                          <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>{label}</span>
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

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : data?.records.length === 0 ? (
          <div className="text-center py-12 border border-gray-100 rounded-lg">
            <p className="text-gray-500">No activities found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto border border-gray-100 rounded-lg">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">
                      Time
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">
                      Action
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">
                      Type
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">
                      Item
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">
                      Changes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data?.records.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatTimestamp(record.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        {formatAction(record.action)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {TABLE_LABELS[record.entity_type] || record.entity_type}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                        {getEntityName(record.action === "delete" ? record.old_values : record.new_values, record.entity_type)}
                      </td>
                      <td className="px-4 py-3 text-sm max-w-xs truncate">
                        {getChanges(record.new_values, record.old_values, record.action)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

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
