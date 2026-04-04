import { useState } from "react";
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
import { ChevronLeft, Trash2, Package, Pencil, Save, Check, AlertCircle } from "lucide-react";

interface Category {
  id: string;
  name: string;
  code: string;
  description: string | null;
  created_at: string;
}

const categorySchema = z.object({
  name: z.string().nonempty("Category name is required"),
  code: z.string().nonempty("Category code is required"),
  description: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export default function ManageCategories() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const addForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", code: "", description: "" },
  });

  const editForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", code: "", description: "" },
  });

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as Category[];
    },
    staleTime: 30000,
  });

  const addMutation = useMutation({
    mutationFn: async (data: { name: string; code: string; description: string }) => {
      const { error } = await supabase.from("categories").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["assets-stats"] });
      setSuccessMessage("Category added successfully!");
      addForm.reset();
      setTimeout(() => setSuccessMessage(""), 3000);
    },
    onError: (err: Error) => {
      addForm.setError("root", { message: err.message || "Failed to add category" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; code: string; description: string }) => {
      const { error } = await supabase
        .from("categories")
        .update({ name: data.name, code: data.code, description: data.description })
        .eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["assets-stats"] });
      setEditingId(null);
    },
    onError: (err: Error) => {
      editForm.setError("root", { message: err.message || "Failed to update category" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("soft_delete_category", { p_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
    onError: (err: Error) => {
      setDeleteError(err.message || "Failed to delete category");
      setShowDeleteModal(false);
    },
  });

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    editForm.reset({
      name: category.name,
      code: category.code,
      description: category.description || "",
    });
  };

  const handleDelete = (category: Category) => {
    setCategoryToDelete(category);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (categoryToDelete) {
      deleteMutation.mutate(categoryToDelete.id);
      setShowDeleteModal(false);
      setCategoryToDelete(null);
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
            <span className="text-sm font-medium">{addForm.formState.errors.root.message}</span>
          </div>
        )}

        <div className="mb-10">
          <h2 className="text-3xl font-semibold text-slate-900 tracking-tight">
            Manage Categories
          </h2>
          <p className="text-slate-500 mt-2 text-sm">
            Add, edit, and manage categories in your inventory.
          </p>
        </div>

        <h3 className="text-lg font-semibold text-slate-900 mb-6">Add New Category</h3>
        <form
          onSubmit={addForm.handleSubmit((data) =>
            addMutation.mutate({
              name: data.name.trim(),
              code: data.code.trim().toUpperCase(),
              description: data.description?.trim() || "",
            })
          )}
          className="space-y-6 mb-10"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              label="Category Name"
              type="text"
              placeholder="e.g., Laptops"
              {...addForm.register("name")}
              error={addForm.formState.errors.name?.message}
            />
            <Input
              label="Category Code"
              type="text"
              placeholder="e.g., LAP"
              maxLength={10}
              helperText="No spaces or special characters"
              {...addForm.register("code")}
              error={addForm.formState.errors.code?.message}
            />
          </div>
          <Textarea
            label="Description"
            {...addForm.register("description")}
            placeholder="Enter category description (optional)"
            rows={3}
          />
          <Button
            type="submit"
            variant="primary"
            disabled={addMutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            {addMutation.isPending ? "Saving..." : "Save Category"}
          </Button>
        </form>

        <div className="pt-6 border-t border-slate-200/60">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Categories</h3>

          {deleteError && (
            <div className="bg-red-50/80 border border-red-200/50 text-red-700 px-5 py-4 rounded-[1.25rem] mb-6 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{deleteError}</span>
            </div>
          )}

          {isLoading ? (
            <div className="p-12 text-center">
              <p className="text-sm text-slate-400">Loading categories...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-14 h-14 rounded-[1.5rem] bg-slate-100 flex items-center justify-center mx-auto mb-5">
                <Package className="w-7 h-7 text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-500">No categories found.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {categories.map((category) => (
                <div key={category.id} className="py-5 hover:bg-slate-50/50 transition-colors">
                  {editingId === category.id ? (
                    <form
                      onSubmit={editForm.handleSubmit((data) =>
                        updateMutation.mutate({
                          id: category.id,
                          name: data.name.trim(),
                          code: data.code.trim().toUpperCase(),
                          description: data.description?.trim() || "",
                        })
                      )}
                      className="space-y-6"
                    >
                      {editForm.formState.errors.root && (
                        <p className="text-sm text-red-500">{editForm.formState.errors.root.message}</p>
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
                          helperText="e.g., LAP"
                          {...editForm.register("code")}
                          error={editForm.formState.errors.code?.message}
                        />
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
                          <span className="text-base font-semibold text-slate-900">{category.name}</span>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">{category.code}</span>
                        </div>
                        {category.description && <p className="text-sm text-slate-500 mt-2">{category.description}</p>}
                        <p className="text-xs text-slate-400 mt-2">Created: {new Date(category.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleEdit(category)} className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors" title="Edit category">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(category)} disabled={deleteMutation.isPending} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50" title="Delete category">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <ConfirmModal
          isOpen={showDeleteModal}
          title="Delete Category"
          message={`Are you sure you want to delete "${categoryToDelete?.name}"? All subcategories, models, and assets under this category will also be soft-deleted and moved to the archive.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={confirmDelete}
          onCancel={() => { setShowDeleteModal(false); setCategoryToDelete(null); }}
          variant="danger"
        />
      </div>
    </div>
  );
}
