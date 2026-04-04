import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "../../lib/supabase";
import Button from "../../components/Button";
import Input from "../../components/Input";
import Textarea from "../../components/Textarea";
import ConfirmModal from "../../components/ConfirmModal";
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
  Transition,
} from "@headlessui/react";

interface SelectOption {
  value: string;
  label: string;
}
import {
  ChevronLeft,
  Trash2,
  Folder,
  Pencil,
  Save,
  ChevronFirst,
  ChevronLast,
  ChevronRight,
  Check,
  ChevronDown,
  AlertCircle,
} from "lucide-react";

interface Subcategory {
  id: string;
  name: string;
  code: string;
  category_id: string;
  description: string | null;
  created_at: string;
  categories?: { name: string; code: string };
}

interface Category {
  id: string;
  name: string;
  code: string;
}

const subcategorySchema = z.object({
  name: z.string().nonempty("Subcategory name is required"),
  code: z.string().nonempty("Subcategory code is required"),
  category_id: z.string().nonempty("Please select a category"),
  description: z.string().optional(),
});

type SubcategoryFormValues = z.infer<typeof subcategorySchema>;

export default function ManageSubcategories() {
  const queryClient = useQueryClient();
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [subcategoryToDelete, setSubcategoryToDelete] =
    useState<Subcategory | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Add form
  const addForm = useForm<SubcategoryFormValues>({
    resolver: zodResolver(subcategorySchema),
    defaultValues: { name: "", code: "", category_id: "", description: "" },
  });

  // Edit form
  const [editCategoryId, setEditCategoryId] = useState("");
  const editForm = useForm<SubcategoryFormValues>({
    resolver: zodResolver(subcategorySchema),
    defaultValues: { name: "", code: "", category_id: "", description: "" },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, code")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as Category[];
    },
    staleTime: 30000,
  });

  const { data: subcategories = [], isLoading } = useQuery({
    queryKey: ["subcategories", selectedCategoryId],
    queryFn: async () => {
      if (!selectedCategoryId) return [];
      const { data, error } = await supabase
        .from("subcategories")
        .select("*, categories:categories(name, code)")
        .eq("category_id", selectedCategoryId)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as Subcategory[];
    },
    enabled: !!selectedCategoryId,
    staleTime: 30000,
  });

  const addSubcategoryOptions: SelectOption[] = categories.map((c) => ({
    value: c.id,
    label: `${c.name} (${c.code})`,
  }));
  const editCategoryOptions: SelectOption[] = categories.map((c) => ({
    value: c.id,
    label: `${c.name} (${c.code})`,
  }));
  const handleCategoryChange = (id: string) => {
    setSelectedCategoryId(id);
    setCurrentPage(1);
    addForm.setValue("category_id", id);
  };

  const totalPages = Math.ceil(subcategories.length / itemsPerPage);
  const paginatedSubcategories = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return subcategories.slice(start, start + itemsPerPage);
  }, [subcategories, currentPage, itemsPerPage]);

  const addMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      code: string;
      category_id: string;
      description: string;
    }) => {
      const { error } = await supabase.from("subcategories").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subcategories"] });
      queryClient.invalidateQueries({ queryKey: ["models"] });
      queryClient.invalidateQueries({ queryKey: ["assets-stats"] });
      setSuccessMessage("Subcategory added successfully!");
      addForm.reset({
        name: "",
        code: "",
        category_id: selectedCategoryId,
        description: "",
      });
      setTimeout(() => setSuccessMessage(""), 3000);
    },
    onError: (err: Error) => {
      addForm.setError("root", {
        message: err.message || "Failed to add subcategory",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      name,
      code,
      category_id,
      description,
    }: {
      id: string;
      name: string;
      code: string;
      category_id: string;
      description: string;
    }) => {
      const { error } = await supabase
        .from("subcategories")
        .update({ name, code, category_id, description })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subcategories"] });
      queryClient.invalidateQueries({ queryKey: ["models"] });
      queryClient.invalidateQueries({ queryKey: ["assets-stats"] });
      setEditingId(null);
    },
    onError: (err: Error) => {
      editForm.setError("root", {
        message: err.message || "Failed to update subcategory",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("soft_delete_subcategory", {
        p_id: id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subcategories"] });
      queryClient.invalidateQueries({ queryKey: ["models"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["assets_paginated"] });
      queryClient.invalidateQueries({ queryKey: ["archived-subcategories"] });
      queryClient.invalidateQueries({
        queryKey: ["archived-subcategories-count"],
      });
      queryClient.invalidateQueries({ queryKey: ["assets-stats"] });
    },
    onError: (err: Error) => {
      setDeleteError(err.message || "Failed to delete subcategory");
      setShowDeleteModal(false);
    },
  });

  const handleEdit = (subcategory: Subcategory) => {
    setEditingId(subcategory.id);
    setEditCategoryId(subcategory.category_id);
    editForm.reset({
      name: subcategory.name,
      code: subcategory.code,
      category_id: subcategory.category_id,
      description: subcategory.description || "",
    });
  };

  const handleDelete = (subcategory: Subcategory) => {
    setSubcategoryToDelete(subcategory);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (subcategoryToDelete) {
      deleteMutation.mutate(subcategoryToDelete.id);
      setShowDeleteModal(false);
      setSubcategoryToDelete(null);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#FAFAFA] font-['system-ui','SF_Pro_Display','Geist_Sans','Helvetica_Neue',sans-serif]">
      <div className="max-w-3xl mx-auto px-4">
        <Link
          to="/inventory-manager"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors mb-8 uppercase tracking-[0.1em]"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {successMessage && (
          <div className="bg-emerald-50/80 border border-emerald-200/50 text-emerald-700 px-5 py-4 rounded-[1.25rem] mb-8 flex items-center gap-3">
            <Check className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{successMessage}</span>
          </div>
        )}

        {addForm.formState.errors.root && (
          <div className="bg-red-50/80 border border-red-200/50 text-red-700 px-5 py-4 rounded-[1.25rem] mb-8 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">
              {addForm.formState.errors.root.message}
            </span>
          </div>
        )}

        <div className="mb-10">
          <h2 className="text-3xl font-semibold text-slate-900 tracking-tight">
            Manage Subcategories
          </h2>
          <p className="text-slate-500 mt-2 text-sm">
            Add, edit, and manage subcategories for your inventory.
          </p>
        </div>

        {/* Add Form Card */}
        <div className="bg-white border border-slate-200/60 rounded-[2rem] overflow-hidden mb-8 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.04)]">
          <div className="p-8">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">
              Add New Subcategory
            </h3>

            <form
              onSubmit={addForm.handleSubmit((data) =>
                addMutation.mutate({
                  name: data.name.trim(),
                  code: data.code.trim().toUpperCase(),
                  category_id: data.category_id,
                  description: data.description?.trim() || "",
                }),
              )}
              className="space-y-6"
            >
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-[0.1em] mb-3">
                  Category <span className="text-red-500">*</span>
                </label>
                <Listbox
                  value={addForm.watch("category_id")}
                  onChange={handleCategoryChange}
                >
                  <div className="relative">
                    <ListboxButton className="relative w-full rounded-[1.25rem] bg-white py-4 pl-5 pr-14 text-left border border-slate-200/60 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 disabled:bg-slate-50 transition-all text-sm shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)]">
                      <span
                        className={
                          addForm.watch("category_id")
                            ? "text-slate-900"
                            : "text-slate-400"
                        }
                      >
                        {addForm.watch("category_id")
                          ? addSubcategoryOptions.find(
                              (o) => o.value === addForm.watch("category_id"),
                            )?.label
                          : "Select a category"}
                      </span>
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-5">
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      </span>
                    </ListboxButton>
                    <Transition
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <ListboxOptions className="absolute z-20 mt-2 max-h-60 w-full overflow-auto rounded-[1.25rem] bg-white py-2 border border-slate-200/60 focus:outline-none text-sm shadow-[0_8px_30px_-10px_rgba(0,0,0,0.15)]">
                        {addSubcategoryOptions.map((opt) => (
                          <ListboxOption
                            key={opt.value}
                            value={opt.value}
                            className={({ active }) =>
                              `relative cursor-default select-none py-3 pl-12 pr-5 transition-colors ${
                                active ? "bg-slate-50 text-slate-900" : "text-slate-600"
                              }`
                            }
                          >
                            {({ selected }) => (
                              <>
                                <span
                                  className={`block truncate ${selected ? "font-medium text-slate-900" : "font-normal"}`}
                                >
                                  {opt.label}
                                </span>
                                {selected && (
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-5 text-slate-900">
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
                {addForm.formState.errors.category_id && (
                  <p className="text-xs font-medium text-red-500 mt-2 ml-1">
                    {addForm.formState.errors.category_id.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input
                  label="Subcategory Name"
                  type="text"
                  placeholder="e.g., Laptops"
                  {...addForm.register("name")}
                  error={addForm.formState.errors.name?.message}
                />
                <Input
                  label="Subcategory Code"
                  type="text"
                  placeholder="e.g., LAPTOP"
                  maxLength={10}
                  {...addForm.register("code")}
                  error={addForm.formState.errors.code?.message}
                />
              </div>

              <Textarea
                label="Description"
                {...addForm.register("description")}
                placeholder="Enter subcategory description (optional)"
                rows={3}
              />

              <Button
                type="submit"
                variant="primary"
                disabled={addMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {addMutation.isPending ? "Saving..." : "Save Subcategory"}
              </Button>
            </form>
          </div>
        </div>

        {/* Delete Modal */}
        <ConfirmModal
          isOpen={showDeleteModal}
          title="Delete Subcategory"
          message={`Are you sure you want to delete "${subcategoryToDelete?.name}"? All models and assets under this subcategory will also be soft-deleted and moved to the archive.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setSubcategoryToDelete(null);
          }}
          variant="danger"
        />

        {/* List Card */}
        <div className="bg-white border border-slate-200/60 rounded-[2rem] overflow-hidden shadow-[0_2px_20px_-8px_rgba(0,0,0,0.04)]">
          <div className="p-8 pb-0">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">
              Subcategories
            </h3>
          </div>

          {deleteError && (
            <div className="bg-red-50/80 border border-red-200/50 text-red-700 px-8 py-4 mb-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{deleteError}</span>
            </div>
          )}

          {!selectedCategoryId ? (
            <div className="p-12 text-center">
              <div className="w-14 h-14 rounded-[1.5rem] bg-slate-100 flex items-center justify-center mx-auto mb-5">
                <Folder className="w-7 h-7 text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-500">Select a category to see its subcategories</p>
            </div>
          ) : isLoading ? (
            <div className="p-12 text-center">
              <p className="text-sm text-slate-400">Loading subcategories...</p>
            </div>
          ) : subcategories.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-14 h-14 rounded-[1.5rem] bg-slate-100 flex items-center justify-center mx-auto mb-5">
                <Folder className="w-7 h-7 text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-500">No subcategories found for this category.</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-100">
                {paginatedSubcategories.map((subcategory) => (
                  <div
                    key={subcategory.id}
                    className="px-8 py-5 hover:bg-slate-50/50 transition-colors"
                  >
                    {editingId === subcategory.id ? (
                      <form
                        onSubmit={editForm.handleSubmit((data) =>
                          updateMutation.mutate({
                            id: subcategory.id,
                            name: data.name.trim(),
                            code: data.code.trim().toUpperCase(),
                            category_id: editCategoryId || data.category_id,
                            description: data.description?.trim() || "",
                          }),
                        )}
                        className="space-y-6"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <Input
                            label="Name"
                            type="text"
                            placeholder="Name"
                            {...editForm.register("name")}
                            error={editForm.formState.errors.name?.message}
                          />
                          <Input
                            label="Code"
                            type="text"
                            placeholder="Code"
                            maxLength={10}
                            {...editForm.register("code")}
                            error={editForm.formState.errors.code?.message}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 uppercase tracking-[0.1em] mb-3">
                            Parent Category
                          </label>
                          <Listbox
                            value={
                              editCategoryId ||
                              editForm.watch("category_id") ||
                              ""
                            }
                            onChange={(val) => {
                              setEditCategoryId(val);
                              editForm.setValue("category_id", val);
                            }}
                          >
                            <div className="relative">
                              <ListboxButton className="relative w-full rounded-[1.25rem] bg-white py-4 pl-5 pr-14 text-left border border-slate-200/60 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 disabled:bg-slate-50 transition-all text-sm shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)]">
                                <span
                                  className={
                                    editCategoryId ||
                                    editForm.watch("category_id")
                                      ? "text-slate-900"
                                      : "text-slate-400"
                                  }
                                >
                                  {editCategoryId ||
                                  editForm.watch("category_id")
                                    ? editCategoryOptions.find(
                                        (o) =>
                                          o.value ===
                                          (editCategoryId ||
                                            editForm.watch("category_id")),
                                      )?.label
                                    : "Select a category"}
                                </span>
                                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-5">
                                  <ChevronDown className="h-4 w-4 text-slate-400" />
                                </span>
                              </ListboxButton>
                              <Transition
                                leave="transition ease-in duration-100"
                                leaveFrom="opacity-100"
                                leaveTo="opacity-0"
                              >
                                <ListboxOptions className="absolute z-20 mt-2 max-h-60 w-full overflow-auto rounded-[1.25rem] bg-white py-2 border border-slate-200/60 text-sm shadow-[0_8px_30px_-10px_rgba(0,0,0,0.15)]">
                                  {editCategoryOptions.map((opt) => (
                                    <ListboxOption
                                      key={opt.value}
                                      value={opt.value}
                                      className={({ active }) =>
                                        `relative cursor-default select-none py-3 pl-12 pr-5 transition-colors ${
                                          active ? "bg-slate-50 text-slate-900" : "text-slate-600"
                                        }`
                                      }
                                    >
                                      {({ selected }) => (
                                        <>
                                          <span
                                            className={`block truncate ${selected ? "font-medium text-slate-900" : "font-normal"}`}
                                          >
                                            {opt.label}
                                          </span>
                                          {selected && (
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-5 text-slate-900">
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
                        <Textarea
                          label="Description"
                          {...editForm.register("description")}
                          placeholder="Description (optional)"
                          rows={3}
                        />
                        <div className="flex items-center gap-3">
                          <Button type="submit" variant="primary" size="sm" disabled={updateMutation.isPending}>
                            <Save className="w-4 h-4 mr-1" /> {updateMutation.isPending ? "Saving..." : "Save"}
                          </Button>
                          <Button type="button" variant="secondary" size="sm" onClick={() => setEditingId(null)}>Cancel</Button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="text-base font-semibold text-slate-900">{subcategory.name}</span>
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">{subcategory.code}</span>
                          </div>
                          {subcategory.categories && (
                            <p className="text-xs text-slate-500 mt-2">
                              {subcategory.categories.name} ({subcategory.categories.code})
                            </p>
                          )}
                          {subcategory.description && (
                            <p className="text-sm text-slate-500 mt-1">
                              {subcategory.description}
                            </p>
                          )}
                          <p className="text-xs text-slate-400 mt-2">
                            Created: {" "}
                            {new Date(
                              subcategory.created_at,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEdit(subcategory)}
                            className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                            title="Edit subcategory"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(subcategory)}
                            disabled={deleteMutation.isPending}
                            className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                            title="Delete subcategory"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-8 py-5 border-t border-slate-100">
                  <div className="text-xs text-slate-400">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                    {Math.min(currentPage * itemsPerPage, subcategories.length)} of {subcategories.length}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="p-2.5 text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-full hover:bg-slate-100 transition-colors"
                    >
                      <ChevronFirst className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => p - 1)}
                      disabled={currentPage === 1}
                      className="p-2.5 text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-full hover:bg-slate-100 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-4 py-2 text-xs text-slate-600 font-medium">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => p + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2.5 text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-full hover:bg-slate-100 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="p-2.5 text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-full hover:bg-slate-100 transition-colors"
                    >
                      <ChevronLast className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
