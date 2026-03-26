import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import Button from "../../components/Button";
import Input from "../../components/Input";
import ConfirmModal from "../../components/ConfirmModal";
import { useCategoryStore } from "../../store/categoryStore";
import { ChevronLeft, Trash2, Package, Pencil, Save } from "lucide-react";

interface Category {
  id: string;
  name: string;
  code: string;
  description: string | null;
  created_at: string;
}

export default function ManageCategories() {
  const queryClient = useQueryClient();
  const store = useCategoryStore();
  
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const {
    editingId,
    deleteId,
    deleteError,
    showDeleteModal,
    name,
    code,
    description,
    errors,
    isSubmitting,
    submitError,
    successMessage,
    editName,
    editCode,
    editDescription,
    editErrors,
    isEditing,
    setEditingId,
    setDeleteId,
    setDeleteError,
    setShowDeleteModal,
    setName,
    setCode,
    setDescription,
    setErrors,
    setIsSubmitting,
    setSubmitError,
    setSuccessMessage,
    setEditName,
    setEditCode,
    setEditDescription,
    setEditErrors,
    setIsEditing,
    resetForm,
  } = store;

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Category[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      code: string;
      description: string;
    }) => {
      const { error } = await supabase.from("categories").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setSuccessMessage("Category added successfully!");
      resetForm();
      setTimeout(() => setSuccessMessage(""), 3000);
    },
    onError: (err: Error) => {
      setSubmitError(err.message || "Failed to add category");
      setIsSubmitting(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: {
      id: string;
      name: string;
      code: string;
      description: string;
    }) => {
      const { error } = await supabase
        .from("categories")
        .update({
          name: data.name,
          code: data.code,
          description: data.description,
        })
        .eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setEditingId(null);
      setIsEditing(false);
    },
    onError: (err: Error) => {
      setSubmitError(err.message || "Failed to update category");
      setIsEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setDeleteId(null);
    },
    onError: (err: Error) => {
      setDeleteError(err.message || "Failed to delete category");
      setDeleteId(null);
    },
  });

  const validateAdd = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Category name is required";
    if (!code.trim()) newErrors.code = "Category code is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateEdit = () => {
    const newErrors: Record<string, string> = {};
    if (!editName.trim()) newErrors.name = "Category name is required";
    if (!editCode.trim()) newErrors.code = "Category code is required";
    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    if (!validateAdd()) return;
    setIsSubmitting(true);
    addMutation.mutate({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description.trim(),
    });
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditCode(category.code);
    setEditDescription(category.description || "");
    setEditErrors({});
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !validateEdit()) return;
    setIsEditing(true);
    updateMutation.mutate({
      id: editingId,
      name: editName.trim(),
      code: editCode.trim().toUpperCase(),
      description: editDescription.trim(),
    });
  };

  const handleDelete = (category: Category) => {
    setCategoryToDelete(category);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (categoryToDelete) {
      setDeleteId(categoryToDelete.id);
      setDeleteError("");
      deleteMutation.mutate(categoryToDelete.id);
      setShowDeleteModal(false);
      setCategoryToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-4xl mx-auto px-6 py-10 animate-in fade-in duration-500">
        <Link
          to="/inventory-manager/add-equipment"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[#1769ff] transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Add Equipment
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Manage Categories
          </h1>
          <p className="text-gray-500 mt-1">
            Add, edit, and delete categories from your inventory
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Add New Category
            </h2>
          </div>

          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">{successMessage}</p>
            </div>
          )}

          {submitError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{submitError}</p>
            </div>
          )}

          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Category Name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.name}
                placeholder="e.g., Laptops"
                required
              />
              <Input
                label="Category Code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                error={errors.code}
                placeholder="e.g., LAP"
                required
                maxLength={10}
                helperText="No spaces or special characters. Example: LAP"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description <span className="text-gray-400">(Optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter category description"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1769ff] focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? "Saving..." : "Save Category"}
              </Button>
            </div>
          </form>
        </div>

        {deleteError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{deleteError}</p>
          </div>
        )}

        <ConfirmModal
          isOpen={showDeleteModal}
          title="Delete Category"
          message={`Are you sure you want to delete "${categoryToDelete?.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setCategoryToDelete(null);
          }}
          variant="danger"
        />

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">
              Loading categories...
            </div>
          ) : categories.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>
                No categories found. Create your first category to get started.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  {editingId === category.id ? (
                    <form onSubmit={handleUpdate} className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          error={editErrors.name}
                          placeholder="Name"
                          className="mb-0"
                        />
                        <Input
                          type="text"
                          value={editCode}
                          onChange={(e) => setEditCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                          error={editErrors.code}
                          placeholder="Code"
                          className="mb-0"
                          helperText="e.g., LAP"
                        />
                        <input
                          type="text"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="Description (optional)"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1769ff] focus:border-transparent"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="submit"
                          variant="primary"
                          size="sm"
                          disabled={isEditing}
                        >
                          <Save className="w-4 h-4 mr-1" />
                          Save
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
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-medium text-gray-900">
                            {category.name}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                            {category.code}
                          </span>
                        </div>
                        {category.description && (
                          <p className="text-sm text-gray-500 mt-1">
                            {category.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          Created:{" "}
                          {new Date(category.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(category)}
                          className="p-2 text-gray-400 hover:text-[#1769ff] hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit category"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(category)}
                          disabled={deleteId === category.id}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete category"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
