import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "../../lib/supabase";
import {
  ChevronLeft,
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
  serial_number: z.string().optional(),
  status: z.string(),
  condition: z.string(),
  location: z.string().optional(),
  description: z.string().optional(),
  supplier_name: z.string().optional(),
  invoice_number: z.string().optional(),
  case_number: z.string().optional(),
  weight: z.string().optional(),
  remarks: z.string().optional(),
});

type EditFormValues = z.infer<typeof editSchema>;

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-0.5 tracking-wide uppercase">{label}</p>
      <p className="text-sm text-gray-900">{value}</p>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pt-8">
      <h3 className="text-xs font-medium text-gray-500 mb-3 tracking-widest uppercase">{title}</h3>
      <div className="grid grid-cols-2 gap-x-6 gap-y-5">{children}</div>
    </div>
  );
}

export default function SingleEquipment() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const editForm = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { serial_number: "", status: "available", condition: "excellent", location: "", description: "", supplier_name: "", invoice_number: "", case_number: "", weight: "", remarks: "" },
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
        .select(`*, models:model_id(name, brand, code, subcategories:subcategory_id(name, code, categories:category_id(name, code))), storage_locations:location(name)`)
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

  const locationOptions = storageLocations.map((l: { id: string; name: string }) => ({ value: l.id, label: l.name }));

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
    onError: () => {
      editForm.setError("root", { message: "Failed to update equipment" });
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
      <div className="min-h-screen flex items-center justify-center">
        <Loading className="w-8 h-8 text-gray-300" />
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Equipment not found</p>
          <Link to="/inventory-manager/equipments" className="text-sm text-[#1769ff] mt-2 inline-block">
            Back to Equipments
          </Link>
        </div>
      </div>
    );
  }

  const modelData = Array.isArray(asset.models) ? asset.models[0] : asset.models;
  const assetTitle = modelData?.name || asset.sku;
  const brandName = modelData?.brand || "Unknown Brand";

  return (
    <div className="min-h-screen bg-gray-50 font-sans p-4 py-12">
      <div className="w-full max-w-[800px] mx-auto bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-6 md:p-10">

          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-8 flex items-center gap-2">
              <Check className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{successMessage}</span>
            </div>
          )}

          {/* Header */}
          {isEditing && (
            <form
              onSubmit={editForm.handleSubmit((data) => updateMutation.mutate(data))}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-6">
                <button
                  type="button"
                  onClick={() => { setIsEditing(false); editForm.reset(); editForm.clearErrors(); }}
                  className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancel Edit
                </button>
                {editForm.formState.errors.root && (
                  <p className="text-xs text-red-500">{editForm.formState.errors.root.message}</p>
                )}
                <Button type="submit" variant="primary" size="sm" disabled={updateMutation.isPending}>
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  Save
                </Button>
              </div>

              <h3 className="text-lg font-medium text-gray-900 mb-2">Edit Equipment</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Input
                  label="Serial Number"
                  type="text"
                  placeholder="Enter serial number"
                  {...editForm.register("serial_number")}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <input
                    value={editForm.watch("status")}
                    readOnly
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed capitalize text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
                  <Listbox value={editForm.watch("condition")} onChange={(v) => editForm.setValue("condition", v)}>
                    <div className="relative">
                      <ListboxButton className="relative w-full rounded-lg bg-white py-2.5 pl-4 pr-10 text-left border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-400 disabled:bg-gray-50 transition-colors text-sm">
                        <span className={editForm.watch("condition") ? "text-gray-900" : "text-gray-400"}>
                          {conditionOptions.find(o => o.value === editForm.watch("condition"))?.label || "—"}
                        </span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        </span>
                      </ListboxButton>
                      <Transition leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 border border-gray-200 focus:outline-none text-sm">
                          {conditionOptions.map((opt) => (
                            <ListboxOption key={opt.value} value={opt.value} className={({ active }) => `relative cursor-default select-none py-2.5 pl-10 pr-4 ${active ? "bg-gray-50 text-gray-900" : "text-gray-700"}`}>
                              {({ selected }) => (
                                <>
                                  <span className={`block truncate ${selected ? "font-medium text-gray-900" : "font-normal"}`}>{opt.label}</span>
                                  {selected && <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-900"><Check className="h-4 w-4" /></span>}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <Listbox value={editForm.watch("location") || ""} onChange={(v) => editForm.setValue("location", v)}>
                    <div className="relative">
                      <ListboxButton className="relative w-full rounded-lg bg-white py-2.5 pl-4 pr-10 text-left border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-400 disabled:bg-gray-50 transition-colors text-sm">
                        <span className={editForm.watch("location") ? "text-gray-900" : "text-gray-400"}>
                          {locationOptions.find(o => o.value === editForm.watch("location"))?.label || "—"}
                        </span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        </span>
                      </ListboxButton>
                      <Transition leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 border border-gray-200 focus:outline-none text-sm">
                          {locationOptions.map((opt) => (
                            <ListboxOption key={opt.value} value={opt.value} className={({ active }) => `relative cursor-default select-none py-2.5 pl-10 pr-4 ${active ? "bg-gray-50 text-gray-900" : "text-gray-700"}`}>
                              {({ selected }) => (
                                <>
                                  <span className={`block truncate ${selected ? "font-medium text-gray-900" : "font-normal"}`}>{opt.label}</span>
                                  {selected && <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-900"><Check className="h-4 w-4" /></span>}
                                </>
                              )}
                            </ListboxOption>
                          ))}
                        </ListboxOptions>
                      </Transition>
                    </div>
                  </Listbox>
                </div>
                <div className="sm:col-span-2">
                  <Textarea
                    label="Description"
                    rows={3}
                    placeholder="Enter description"
                    {...editForm.register("description")}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Shipment & Supplier Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Input label="Supplier Name" type="text" placeholder="Supplier name" {...editForm.register("supplier_name")} />
                  <Input label="Invoice Number" type="text" placeholder="Invoice number" {...editForm.register("invoice_number")} />
                  <Input label="Case Number" type="number" placeholder="Case number" {...editForm.register("case_number")} />
                  <Input label="Weight (kg)" type="number" placeholder="Weight" {...editForm.register("weight")} />
                </div>
                <div className="mt-6">
                  <Textarea label="Remarks" placeholder="Add remarks..." rows={2} {...editForm.register("remarks")} />
                </div>
              </div>
            </form>
          )}

          {/* View mode */}
          {!isEditing && (
            <>
              {/* Top bar: back + title + actions */}
              <div className="flex items-start justify-between mb-8">
                <div>
                  <Link
                    to="/inventory-manager/equipments"
                    className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-6"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Back
                  </Link>

                  <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">{assetTitle}</h1>
                  <p className="text-sm text-gray-400 mt-1">{brandName} {modelData?.code && <span className="text-gray-300">· {modelData.code}</span>}</p>
                  <div className="flex items-center gap-4 mt-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium capitalize ${getStatusColor(asset.status)}`}>
                      {asset.status || "Available"}
                    </span>
                    <span className={`text-xs font-medium capitalize ${getConditionColor(asset.condition)}`}>
                      {asset.condition ? asset.condition.replace("_", " ") : "Unknown"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-6">
                  <button
                    onClick={handleEdit}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Details */}
              <DetailSection title="Identity">
                <DetailRow label="SKU" value={<code className="text-xs font-mono bg-gray-50 px-1.5 py-0.5 rounded">{asset.sku}</code>} />
                <DetailRow label="Serial" value={asset.serial_number || "—"} />
                <DetailRow label="Model" value={modelData?.name || "—"} />
                <DetailRow label="Subcategory" value={modelData?.subcategories?.name || "—"} />
                <DetailRow label="Category" value={modelData?.subcategories?.categories?.name || "—"} />
              </DetailSection>

              {/* Location & Dates */}
              <div className="h-px bg-gray-100 mt-8" />
              <DetailSection title="Location & Lifecycle">
                <DetailRow label="Location" value={asset.storage_locations?.name || "Unassigned"} />
                <DetailRow label="Purchase" value={asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : "—"} />
                <DetailRow label="Warranty" value={asset.warranty_expiry ? new Date(asset.warranty_expiry).toLocaleDateString() : "—"} />
                <DetailRow label="Last Service" value={asset.last_maintenance ? new Date(asset.last_maintenance).toLocaleDateString() : "—"} />
                <DetailRow label="Next Due" value={asset.next_maintenance ? new Date(asset.next_maintenance).toLocaleDateString() : "—"} />
                <DetailRow label="Entry Date" value={new Date(asset.created_at).toLocaleDateString()} />
              </DetailSection>

              {/* Shipment */}
              {(asset.supplier_name || asset.invoice_number || asset.case_number || asset.weight || asset.remarks) && (
                <>
                  <div className="h-px bg-gray-100 mt-8" />
                  <DetailSection title="Shipment">
                    <DetailRow label="Supplier" value={asset.supplier_name || "—"} />
                    <DetailRow label="Invoice" value={asset.invoice_number ? <code className="text-xs font-mono">{asset.invoice_number}</code> : "—"} />
                    <DetailRow label="Case No." value={asset.case_number ?? "—"} />
                    <DetailRow label="Weight" value={asset.weight !== null ? `${asset.weight} kg` : "—"} />
                  </DetailSection>
                  {asset.remarks && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1 tracking-wide uppercase">Remarks</p>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{asset.remarks}</p>
                    </div>
                  )}
                </>
              )}

              {/* Description */}
              {asset.description && (
                <>
                  <div className="h-px bg-gray-100 mt-8" />
                  <div className="pt-8">
                    <p className="text-xs font-medium text-gray-500 mb-3 tracking-widest uppercase">Description</p>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{asset.description}</p>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

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
