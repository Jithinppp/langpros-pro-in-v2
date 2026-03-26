import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
  Transition,
} from "@headlessui/react";
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
  ChevronDown,
  Check,
  Save,
  X,
} from "lucide-react";
import Button from "../../components/Button";
import Loading from "../../components/Loading";
import ConfirmModal from "../../components/ConfirmModal";
import Input from "../../components/Input";
import { useSingleEquipmentStore } from "../../store/singleEquipmentStore";
import { getStatusColor, getConditionColor } from "../../utils/theme";

export default function SingleEquipment() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const store = useSingleEquipmentStore();

  const {
    showDeleteModal,
    deleteError,
    isEditing,
    editError,
    successMessage,
    editSerialNumber,
    editStatus,
    editCondition,
    editLocationId,
    editDescription,
    editErrors,
    setShowDeleteModal,
    setDeleteError,
    setIsEditing,
    setEditError,
    setSuccessMessage,
    setEditSerialNumber,
    setEditStatus,
    setEditCondition,
    setEditLocationId,
    setEditDescription,
    setEditErrors,
  } = store;

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
          `*,
          models:model_id(name, brand, code),
          storage_locations:location(name)`
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: storageLocations = [] } = useQuery({
    queryKey: ["storage_locations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("storage_locations")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error("No asset ID");
      const { error } = await supabase.from("assets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      navigate("/inventory-manager/equipments");
    },
    onError: (err: Error) => {
      setDeleteError(err.message || "Failed to delete equipment");
      setShowDeleteModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error("No asset ID");
      const { error } = await supabase
        .from("assets")
        .update({
          serial_number: editSerialNumber.trim(),
          status: editStatus,
          condition: editCondition,
          location: editLocationId || null,
          description: editDescription.trim() || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset", id] });
      setIsEditing(false);
      setSuccessMessage("Equipment updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    },
    onError: (err: Error) => {
      setEditError(err.message || "Failed to update equipment");
    },
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

  const modelData = Array.isArray(asset.models) ? asset.models[0] : asset.models;
  const assetTitle = modelData?.name || asset.sku;
  const brandName = modelData?.brand || "Unknown Brand";

  const handleEdit = () => {
    setEditSerialNumber(asset.serial_number || "");
    setEditStatus(asset.status || "available");
    setEditCondition(asset.condition || "excellent");
    setEditLocationId(asset.location || "");
    setEditDescription(asset.description || "");
    setEditErrors({});
    setEditError("");
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditErrors({});
    setEditError("");
  };

  const validateEdit = () => {
    const newErrors: Record<string, string> = {};
    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-16">
      <div className="max-w-6xl mx-auto px-6 py-10 animate-in fade-in duration-500">
        {deleteError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{deleteError}</p>
          </div>
        )}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
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
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 className="w-4 h-4 text-red-500" />
              <span className="text-red-600">Delete</span>
            </Button>
            <Button variant="primary" className="flex items-center gap-2" onClick={handleEdit}>
              <Edit className="w-4 h-4" />
              Edit Asset
            </Button>
          </div>
        </div>

        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-600">{successMessage}</p>
          </div>
        )}

        {editError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{editError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {isEditing ? (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Edit Equipment</h2>
                  <Button variant="secondary" size="sm" onClick={cancelEdit}>
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (validateEdit()) updateMutation.mutate();
                  }}
                  className="space-y-4"
                >
                  <Input
                    label="Serial Number"
                    type="text"
                    value={editSerialNumber}
                    onChange={(e) => setEditSerialNumber(e.target.value)}
                    error={editErrors.serialNumber}
                    placeholder="Enter serial number"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                      <Listbox value={editStatus} onChange={setEditStatus}>
                        <div className="relative">
                          <ListboxButton className="relative w-full cursor-default rounded-lg bg-white py-2.5 pl-4 pr-10 text-left border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#1769ff]/20 focus:border-[#1769ff] disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50" disabled>
                            <span className="text-gray-900 capitalize">{editStatus || "Select status"}</span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                              <ChevronDown className="h-5 w-5 text-gray-400" />
                            </span>
                          </ListboxButton>
                          <Transition
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                          >
                            <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                              {["available", "in_use", "maintenance", "retired"].map((status) => (
                                <ListboxOption
                                  key={status}
                                  value={status}
                                  className={({ active }) =>
                                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                      active ? "bg-blue-50 text-[#1769ff]" : "text-gray-900"
                                    }`
                                  }
                                >
                                  {({ selected }) => (
                                    <>
                                      <span
                                        className={`block truncate capitalize ${
                                          selected ? "font-medium" : "font-normal"
                                        }`}
                                      >
                                        {status.replace("_", " ")}
                                      </span>
                                      {selected && (
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#1769ff]">
                                          <Check className="h-5 w-5" />
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Condition</label>
                      <Listbox value={editCondition} onChange={setEditCondition}>
                        <div className="relative">
                          <ListboxButton className="relative w-full cursor-default rounded-lg bg-white py-2.5 pl-4 pr-10 text-left border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#1769ff]/20 focus:border-[#1769ff]">
                            <span className="text-gray-900 capitalize">
                              {editCondition || "Select condition"}
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
                            <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                              {["excellent", "good", "fair", "poor"].map((condition) => (
                                <ListboxOption
                                  key={condition}
                                  value={condition}
                                  className={({ active }) =>
                                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                      active ? "bg-blue-50 text-[#1769ff]" : "text-gray-900"
                                    }`
                                  }
                                >
                                  {({ selected }) => (
                                    <>
                                      <span
                                        className={`block truncate capitalize ${
                                          selected ? "font-medium" : "font-normal"
                                        }`}
                                      >
                                        {condition}
                                      </span>
                                      {selected && (
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#1769ff]">
                                          <Check className="h-5 w-5" />
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
                    <Listbox value={editLocationId} onChange={setEditLocationId}>
                      <div className="relative">
                        <ListboxButton className="relative w-full cursor-default rounded-lg bg-white py-2.5 pl-4 pr-10 text-left border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#1769ff]/20 focus:border-[#1769ff]">
                          <span className={editLocationId ? "text-gray-900" : "text-gray-400"}>
                            {editLocationId
                              ? storageLocations.find((l) => l.id === editLocationId)?.name
                              : "Select location"}
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
                          <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                            <ListboxOption
                              value=""
                              className={({ active }) =>
                                `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                  active ? "bg-blue-50 text-[#1769ff]" : "text-gray-900"
                                }`
                              }
                            >
                              {({ selected }) => (
                                <>
                                  <span
                                    className={`block truncate ${
                                      selected ? "font-medium" : "font-normal"
                                    }`}
                                  >
                                    No Location
                                  </span>
                                  {selected && (
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#1769ff]">
                                      <Check className="h-5 w-5" />
                                    </span>
                                  )}
                                </>
                              )}
                            </ListboxOption>
                            {storageLocations.map((loc) => (
                              <ListboxOption
                                key={loc.id}
                                value={loc.id}
                                className={({ active }) =>
                                  `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                    active ? "bg-blue-50 text-[#1769ff]" : "text-gray-900"
                                  }`
                                }
                              >
                                {({ selected }) => (
                                  <>
                                    <span
                                      className={`block truncate ${
                                        selected ? "font-medium" : "font-normal"
                                      }`}
                                    >
                                      {loc.name}
                                    </span>
                                    {selected && (
                                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#1769ff]">
                                        <Check className="h-5 w-5" />
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Enter description"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1769ff] focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Button type="submit" variant="primary" disabled={updateMutation.isPending}>
                      <Save className="w-4 h-4 mr-2" />
                      {updateMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </div>
            ) : (
              <>
                <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-wrap items-center gap-8">
                  <div>
                    <p className="text-sm text-gray-500 font-medium mb-1">System Status</p>
                    <span
                      className={`inline-flex items-center px-3 py-1 text-sm font-bold rounded-md capitalize ${getStatusColor(
                        asset.status
                      )}`}
                    >
                      {asset.status || "Available"}
                    </span>
                  </div>
                  <div className="w-px h-10 bg-gray-200 hidden sm:block"></div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium mb-1">Condition</p>
                    <span
                      className={`inline-flex items-center text-sm font-bold capitalize ${getConditionColor(
                        asset.condition
                      )}`}
                    >
                      {asset.condition ? asset.condition.replace("_", " ") : "Unknown"}
                    </span>
                  </div>
                  <div className="w-px h-10 bg-gray-200 hidden sm:block"></div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium mb-1">Current Location</p>
                    <div className="flex items-center gap-1.5 text-gray-900 font-medium">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {asset.storage_locations?.name || "Unassigned"}
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-gray-400" />
                    <h2 className="font-semibold text-gray-900">Identity Details</h2>
                  </div>
                  <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Serial Number</p>
                      <p className="font-mono text-gray-900">{asset.serial_number || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Model ID</p>
                      <p className="font-mono text-gray-900 break-all">{asset.model_id || "-"}</p>
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
                    <h2 className="font-semibold text-gray-900">Additional Description</h2>
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
              </>
            )}
          </div>

          <div className="space-y-6">
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

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-gray-400" />
                <h2 className="font-semibold text-gray-900">Maintenance Logs</h2>
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
                <Button variant="secondary" className="w-full mt-4 justify-center bg-gray-50">
                  Log Maintenance
                </Button>
              </div>
            </div>
          </div>
        </div>

        <ConfirmModal
          isOpen={showDeleteModal}
          title="Delete Equipment"
          message={`Are you sure you want to delete "${assetTitle}"? This action cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={() => deleteMutation.mutate()}
          onCancel={() => setShowDeleteModal(false)}
          variant="danger"
        />
      </div>
    </div>
  );
}
