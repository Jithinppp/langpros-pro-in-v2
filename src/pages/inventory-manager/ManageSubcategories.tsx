import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "../../lib/supabase";
import Button from "../../components/Button";
import Input from "../../components/Input";
import Textarea from "../../components/Textarea";
import SelectDropdown from "../../components/SelectDropdown";
import ConfirmModal from "../../components/ConfirmModal";
import AlertBanner from "../../components/AlertBanner";
import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Folder,
  Pencil,
  Save,
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

  const addForm = useForm<SubcategoryFormValues>({
    resolver: zodResolver(subcategorySchema),
    defaultValues: { name: "", code: "", category_id: "", description: "" },
  });

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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

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
    <div className="min-h-screen font-sans p-4 py-12">
      <div className="w-full mx-auto rounded-2xl overflow-hidden p-6 md:p-10">
        {successMessage && (
          <AlertBanner
            variant="success"
            message={successMessage}
            className="mb-8"
          />
        )}

        {addForm.formState.errors.root && (
          <AlertBanner
            variant="error"
            message={
              addForm.formState.errors.root.message || "An error occurred"
            }
            className="mb-8"
          />
        )}

        <div className="mb-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Manage Subcategories
          </h2>
          <p className="text-slate-500 mt-2 text-sm">
            Add, edit, and manage subcategories in your inventory.
          </p>
        </div>

        <SelectDropdown
          label="Select Category"
          value={selectedCategoryId}
          onChange={handleCategoryChange}
          options={categories.map((c) => ({ value: c.id, label: `${c.name} (${c.code})` }))}
          placeholder="Select a category to see its subcategories"
          className="mb-8"
        />

        <h3 className="text-lg font-semibold text-slate-900 mb-6">
          Add New Subcategory
        </h3>
        <form
          onSubmit={addForm.handleSubmit((data) =>
            addMutation.mutate({
              name: data.name.trim(),
              code: data.code.trim().toUpperCase(),
              category_id: selectedCategoryId,
              description: data.description?.trim() || "",
            }),
          )}
          className="space-y-6 mb-10"
        >
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
              helperText="No spaces or special characters"
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
            disabled={addMutation.isPending || !selectedCategoryId}
          >
            <Save className="w-4 h-4 mr-2" />
            {addMutation.isPending ? "Saving..." : "Save Subcategory"}
          </Button>
        </form>

        <div className="pt-6 border-t border-slate-200/60">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">
            Subcategories
          </h3>

          {deleteError && (
            <AlertBanner variant="error" message={deleteError} className="mb-6" />
          )}

          {!selectedCategoryId ? (
            <div className="p-12 text-center">
              <div className="w-14 h-14 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-5">
                <Folder className="w-7 h-7 text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-500">
                Select a category to see its subcategories
              </p>
            </div>
          ) : isLoading ? (
            <div className="p-12 text-center">
              <p className="text-sm text-slate-400">Loading subcategories...</p>
            </div>
          ) : subcategories.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-14 h-14 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-5">
                <Folder className="w-7 h-7 text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-500">
                No subcategories found for this category.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {paginatedSubcategories.map((subcategory) => (
                <div
                  key={subcategory.id}
                  className="py-5 hover:bg-slate-50/50 transition-colors"
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
                      {editForm.formState.errors.root && (
                        <p className="text-sm text-red-500">
                          {editForm.formState.errors.root.message}
                        </p>
                      )}
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
                          helperText="e.g., LAPTOP"
                          {...editForm.register("code")}
                          error={editForm.formState.errors.code?.message}
                        />
                      </div>
                      <SelectDropdown
                        label="Category"
                        value={editCategoryId || editForm.watch("category_id") || ""}
                        onChange={(val) => {
                          setEditCategoryId(val);
                          editForm.setValue("category_id", val);
                        }}
                        options={categories.map((c) => ({ value: c.id, label: `${c.name} (${c.code})` }))}
                        placeholder="Select a category"
                      />
                      <Textarea
                        label="Description"
                        {...editForm.register("description")}
                        placeholder="Description (optional)"
                        rows={3}
                      />
                      <div className="flex items-center gap-3">
                        <Button
                          type="submit"
                          variant="primary"
                          size="sm"
                          disabled={updateMutation.isPending}
                        >
                          <Save className="w-4 h-4 mr-1" />
                          {updateMutation.isPending ? "Saving..." : "Save"}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-base font-semibold text-slate-900">
                            {subcategory.name}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                            {subcategory.code}
                          </span>
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
                          Created:{" "}
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
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-8 py-5 border-t border-slate-100">
              <div className="text-xs text-slate-400">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, subcategories.length)} of {subcategories.length}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className="p-2.5 text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-full hover:bg-slate-100 transition-colors"
                  title="First page"
                >
                  <ChevronFirst className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2.5 text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-full hover:bg-slate-100 transition-colors"
                  title="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-4 py-2 text-xs text-slate-600 font-medium">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2.5 text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-full hover:bg-slate-100 transition-colors"
                  title="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-2.5 text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-full hover:bg-slate-100 transition-colors"
                  title="Last page"
                >
                  <ChevronLast className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

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
      </div>
    </div>
  );
}
