import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "../../lib/supabase";
import {
  Edit,
  Trash2,
  AlertCircle,
  Save,
  X,
  ChevronDown,
  Check,
} from "lucide-react";
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
  Transition,
} from "@headlessui/react";
import Button from "../../components/Button";
import Loading from "../../components/Loading";
import AlertBanner from "../../components/AlertBanner";
import ConfirmModal from "../../components/ConfirmModal";
import Input from "../../components/Input";
import Textarea from "../../components/Textarea";
import { getStatusColor, getConditionColor } from "../../utils/theme";

const conditionOptions = [
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
];

const editSchema = z.object({
  serial_number: z
    .string()
    .max(100, "Serial number must be 100 characters or less")
    .optional()
    .or(z.literal("")),
  status: z.enum(["available", "rented", "deployed", "maintenance", "retired"]),
  condition: z.enum(["excellent", "good", "fair", "poor"]),
  location: z.string().optional().or(z.literal("")),
  description: z
    .string()
    .max(2000, "Description must be 2000 characters or less")
    .optional()
    .or(z.literal("")),
  supplier_name: z
    .string()
    .max(200, "Supplier name must be 200 characters or less")
    .optional()
    .or(z.literal("")),
  invoice_number: z
    .string()
    .max(50, "Invoice number must be 50 characters or less")
    .optional()
    .or(z.literal("")),
  case_number: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || /^\d+$/.test(v), {
      message: "Must be a positive whole number",
    }),
  weight: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || /^\d+$/.test(v), {
      message: "Must be a positive whole number",
    }),
  remarks: z
    .string()
    .max(1000, "Remarks must be 1000 characters or less")
    .optional()
    .or(z.literal("")),
});

type EditFormValues = z.infer<typeof editSchema>;

export default function SingleEquipment() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const editForm = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      serial_number: "",
      status: "available",
      condition: "excellent",
      location: "",
      description: "",
      supplier_name: "",
      invoice_number: "",
      case_number: "",
      weight: "",
      remarks: "",
    },
  });

  useEffect(() => {
    setShowDeleteModal(false);
  }, [id]);

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
          `*, models:model_id(name, brand, code, subcategories:subcategory_id(name, code, categories:category_id(name, code))), storage_locations:location(name)`,
        )
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
    staleTime: 30000,
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
    staleTime: 30000,
  });

  const locationOptions = storageLocations.map(
    (l: { id: string; name: string }) => ({ value: l.id, label: l.name }),
  );

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error("No asset ID");
      const { error } = await supabase.rpc("soft_delete_asset", { p_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["assets_paginated"] });
      queryClient.invalidateQueries({ queryKey: ["archived-assets"] });
      queryClient.invalidateQueries({ queryKey: ["archived-assets-count"] });
      queryClient.invalidateQueries({ queryKey: ["assets-stats"] });
      navigate("/inventory-manager/equipments");
    },
    onError: () => {},
  });

  const updateMutation = useMutation({
    mutationFn: async (data: EditFormValues) => {
      if (!id) throw new Error("No asset ID");
      const { error } = await supabase
        .from("assets")
        .update({
          serial_number: data.serial_number?.trim(),
          status: data.status,
          condition: data.condition,
          location: data.location || null,
          description: data.description?.trim() || null,
          supplier_name: data.supplier_name || null,
          invoice_number: data.invoice_number || null,
          case_number: data.case_number ? parseInt(data.case_number, 10) : null,
          weight: data.weight ? parseInt(data.weight, 10) : null,
          remarks: data.remarks?.trim() || null,
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
    onError: (error) => {
      console.error("Update error:", error);
      editForm.setError("root", {
        message:
          error instanceof Error ? error.message : "Failed to update equipment",
      });
    },
  });

  const handleEdit = () => {
    editForm.reset({
      serial_number: asset.serial_number || "",
      status: asset.status || "available",
      condition: asset.condition || "excellent",
      location: asset.location || "",
      description: asset.description || "",
      supplier_name: asset.supplier_name || "",
      invoice_number: asset.invoice_number || "",
      case_number: asset.case_number ?? "",
      weight: asset.weight ?? "",
      remarks: asset.remarks || "",
    });
    editForm.clearErrors();
    setIsEditing(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loading className="w-10 h-10 mb-4" />
        <p className="text-gray-500 font-medium">Loading equipment...</p>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="border w-full border-dashed border-gray-300 rounded-3xl p-16 text-center bg-gray-50/50">
          <div className="w-16 h-16 bg-white border border-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-[slate-900]" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Equipment not found
          </h3>
          <p className="mb-6 max-w-sm mx-auto text-slate-500 mt-2 text-sm">
            The equipment you are looking for does not exist or has been
            removed.
          </p>
          <Link to="/inventory-manager/equipments">
            <Button variant="primary">Back to Equipments</Button>
          </Link>
        </div>
      </div>
    );
  }

  const modelData = Array.isArray(asset.models)
    ? asset.models[0]
    : asset.models;
  const assetTitle = modelData?.name || asset.sku;
  const brandName = modelData?.brand || "Unknown Brand";

  const fmtDate = (d: string) => (d ? new Date(d).toLocaleDateString() : "—");

  return (
    <div className="min-h-screen font-sans p-4 py-12">
      <div className="w-full mx-auto rounded-2xl overflow-hidden ">
        <div className="p-6 md:p-10">
          {successMessage && (
            <AlertBanner
              variant="success"
              message={successMessage}
              className="mb-8"
            />
          )}

          <h2 className="text-2xl font-semibold text-gray-900 tracking-tight mb-2">
            {assetTitle}
          </h2>
          <p className="text-gray-500 mt-2 text-sm">
            {brandName}
            {modelData?.code && (
              <span className="text-gray-300"> · {modelData.code}</span>
            )}
          </p>

          {/* Status / Condition badges row */}
          <div className="flex items-center gap-4 mt-4 mb-8">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium capitalize ${getStatusColor(asset.status)}`}
            >
              {asset.status || "Available"}
            </span>
            {isEditing ? (
              <Listbox
                value={editForm.watch("condition")}
                onChange={(v) => editForm.setValue("condition", v)}
              >
                <div className="relative">
                  <ListboxButton className="relative rounded-lg bg-white py-2.5 pl-4 pr-10 text-left border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-400 transition-colors text-xs font-medium capitalize">
                    <span
                      className={
                        editForm.watch("condition")
                          ? "text-gray-900"
                          : "text-gray-400"
                      }
                    >
                      {conditionOptions.find(
                        (o) => o.value === editForm.watch("condition"),
                      )?.label || "—"}
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
                    <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-48 overflow-auto rounded-lg bg-white py-1 border border-gray-200 focus:outline-none text-sm shadow-lg">
                      {conditionOptions.map((opt) => (
                        <ListboxOption
                          key={opt.value}
                          value={opt.value}
                          className={({ active }) =>
                            `relative cursor-default select-none py-2.5 pl-10 pr-4 ${active ? "bg-gray-50 text-gray-900" : "text-gray-700"}`
                          }
                        >
                          {({ selected }) => (
                            <>
                              <span
                                className={`block truncate capitalize ${selected ? "font-medium text-gray-900" : "font-normal"}`}
                              >
                                {opt.label}
                              </span>
                              {selected && (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-900">
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
            ) : (
              <span
                className={`text-xs font-medium capitalize ${getConditionColor(asset.condition)}`}
              >
                {asset.condition
                  ? asset.condition.replace("_", " ")
                  : "Unknown"}
              </span>
            )}
          </div>

          {/* Equipment Identity */}
          <h3 className="text-lg font-semibold text-slate-900 mb-6">
            Equipment Identity
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SKU
              </label>
              <div className="w-full pr-4 font-semibold py-2.5 text-sm text-gray-500 font-mono">
                {asset.sku}
              </div>
            </div>
            {isEditing ? (
              <Input
                label="Serial Number"
                type="text"
                placeholder="Enter serial number"
                error={editForm.formState.errors.serial_number?.message}
                {...editForm.register("serial_number")}
              />
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Serial Number
                </label>
                <div className="w-full pr-4 py-2.5 text-sm font-semibold text-gray-500">
                  {asset.serial_number || "—"}
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model
              </label>
              <div className="w-full pr-4 font-semibold text-sm text-gray-500">
                {modelData?.name || "—"}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subcategory
              </label>
              <div className="w-full pr-4 font-semibold text-sm text-gray-500">
                {modelData?.subcategories?.name || "—"}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <div className="w-full pr-4 font-semibold text-sm text-gray-500">
                {modelData?.subcategories?.categories?.name || "—"}
              </div>
            </div>
            {isEditing ? (
              <div className="sm:col-span-2">
                <Textarea
                  label="Description"
                  rows={3}
                  placeholder="Enter description"
                  error={editForm.formState.errors.description?.message}
                  {...editForm.register("description")}
                />
              </div>
            ) : (
              asset.description && (
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <div className="w-full pr-4 font-semibold text-sm text-gray-500 leading-relaxed whitespace-pre-wrap">
                    {asset.description}
                  </div>
                </div>
              )
            )}
          </div>

          {/* Status field (edit mode only) */}
          {isEditing && (
            <div className="pt-4 border-t border-gray-100 mt-8">
              <h3 className="text-lg font-semibold text-slate-900 mb-6">
                Status
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-500 capitalize">
                    {editForm.watch("status")} (default)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Location & Lifecycle */}
          <div className="pt-4 border-t border-gray-100 mt-8">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">
              Location & Lifecycle
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {isEditing ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <Listbox
                      value={editForm.watch("location") || ""}
                      onChange={(v) => editForm.setValue("location", v)}
                    >
                      <div className="relative">
                        <ListboxButton className="relative w-full rounded-lg bg-white py-2.5 pl-4 pr-10 text-left border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-400 disabled:bg-gray-50 transition-colors text-sm">
                          <span
                            className={
                              editForm.watch("location")
                                ? "text-gray-900"
                                : "text-gray-400"
                            }
                          >
                            {locationOptions.find(
                              (o) => o.value === editForm.watch("location"),
                            )?.label || "Select Location"}
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
                          <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 border border-gray-200 focus:outline-none text-sm">
                            {locationOptions.map((opt) => (
                              <ListboxOption
                                key={opt.value}
                                value={opt.value}
                                className={({ active }) =>
                                  `relative cursor-default select-none py-2.5 pl-10 pr-4 ${active ? "bg-gray-50 text-gray-900" : "text-gray-700"}`
                                }
                              >
                                {({ selected }) => (
                                  <>
                                    <span
                                      className={`block truncate ${selected ? "font-medium text-gray-900" : "font-normal"}`}
                                    >
                                      {opt.label}
                                    </span>
                                    {selected && (
                                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-900">
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
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <div className="w-full pr-4 font-semibold  text-sm text-gray-500">
                    {asset.storage_locations?.name || "Unassigned"}
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purchase Date
                </label>
                <div className="w-full pr-4 font-semibold  text-sm text-gray-500">
                  {fmtDate(asset.purchase_date)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Warranty Expiry
                </label>
                <div className="w-full pr-4 font-semibold text-sm text-gray-500">
                  {fmtDate(asset.warranty_expiry)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Service
                </label>
                <div className="w-full pr-4 font-semibold text-sm text-gray-500">
                  {fmtDate(asset.last_maintenance)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Next Due
                </label>
                <div className="w-full pr-4 font-semibold text-sm text-gray-500">
                  {fmtDate(asset.next_maintenance)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Entry Date
                </label>
                <div className="w-full pr-4 font-semibold text-sm text-gray-500">
                  {fmtDate(asset.created_at)}
                </div>
              </div>
            </div>
          </div>

          {/* Shipment & Supplier Details */}
          <div className="pt-4 border-t border-gray-100 mt-8">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">
              Shipment & Supplier Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {isEditing ? (
                <Input
                  label="Supplier Name"
                  type="text"
                  placeholder="Supplier name"
                  error={editForm.formState.errors.supplier_name?.message}
                  {...editForm.register("supplier_name")}
                />
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supplier Name
                  </label>
                  <div className="w-full pr-4 font-semibold text-sm text-gray-500">
                    {asset.supplier_name || "—"}
                  </div>
                </div>
              )}
              {isEditing ? (
                <Input
                  label="Invoice Number"
                  type="text"
                  placeholder="Invoice number"
                  error={editForm.formState.errors.invoice_number?.message}
                  {...editForm.register("invoice_number")}
                />
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invoice Number
                  </label>
                  <div className="w-full pr-4 font-semibold text-sm text-gray-500 font-mono">
                    {asset.invoice_number || "—"}
                  </div>
                </div>
              )}
              {isEditing ? (
                <Input
                  label="Case Number"
                  type="text"
                  inputMode="numeric"
                  placeholder="Case number"
                  error={editForm.formState.errors.case_number?.message}
                  {...editForm.register("case_number")}
                />
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Case Number
                  </label>
                  <div className="w-full pr-4 font-semibold text-sm text-gray-500">
                    {asset.case_number ?? "—"}
                  </div>
                </div>
              )}
              {isEditing ? (
                <Input
                  label="Weight (kg)"
                  type="text"
                  inputMode="numeric"
                  placeholder="Weight"
                  error={editForm.formState.errors.weight?.message}
                  {...editForm.register("weight")}
                />
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weight
                  </label>
                  <div className="w-full pr-4 font-semibold text-sm text-gray-500">
                    {asset.weight !== null ? `${asset.weight} kg` : "—"}
                  </div>
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="mt-6">
                <Textarea
                  label="Shipment remarks"
                  placeholder="Add remarks..."
                  rows={2}
                  error={editForm.formState.errors.remarks?.message}
                  {...editForm.register("remarks")}
                />
              </div>
            ) : asset.remarks ? (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shipment remarks
                </label>
                <div className="w-full pr-4 font-semibold text-sm text-gray-500 whitespace-pre-wrap">
                  {asset.remarks}
                </div>
              </div>
            ) : null}
          </div>

          {/* Cancel + Save (edit mode) */}
          {isEditing && (
            <div className="pt-4 border-t border-gray-100 mt-8 flex items-center justify-end gap-3">
              {editForm.formState.errors.root && (
                <p className="text-xs text-red-500">
                  {editForm.formState.errors.root.message}
                </p>
              )}
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  setIsEditing(false);
                  editForm.reset();
                  editForm.clearErrors();
                }}
              >
                <X className="w-4 h-4 mr-1.5" />
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                isLoading={updateMutation.isPending}
                onClick={() =>
                  editForm.handleSubmit((data) => updateMutation.mutate(data))()
                }
              >
                <Save className="w-4 h-4 mr-1.5" />
                Save Changes
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom action section */}
      {!isEditing && (
        <div className="w-full mx-auto rounded-2xl overflow-hidden ">
          <div className="p-6 md:p-10">
            <div className="pt-4 border-t border-gray-100 mt-8 flex items-center justify-end py-12">
              <div className="flex items-center gap-4">
                <Button variant="primary" onClick={handleEdit}>
                  <Edit className="w-4 h-4 mr-1.5" />
                  Edit Equipment
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setShowDeleteModal(true)}
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Equipment"
        message={`Are you sure you want to delete "${assetTitle}" (${asset.sku})?`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setShowDeleteModal(false)}
        variant="danger"
      />
    </div>
  );
}
