import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import Button from "../../components/Button";
import Input from "../../components/Input";
import Textarea from "../../components/Textarea";
import SelectDropdown from "../../components/SelectDropdown";
import ConfirmModal from "../../components/ConfirmModal";
import AlertBanner from "../../components/AlertBanner";
import { useModelStore } from "../../store/modelStore";
import {
  ChevronLeft,
  ChevronRight,
  ChevronFirst,
  ChevronLast,
  Trash2,
  Package,
  Pencil,
  Save,
} from "lucide-react";

interface Model {
  id: string;
  name: string;
  code: string;
  brand: string;
  subcategory_id: string;
  description: string | null;
  created_at: string;
  subcategories?: {
    id: string;
    name: string;
    code: string;
    category_id: string;
  };
}

interface Subcategory {
  id: string;
  name: string;
  code: string;
  category_id: string;
}

interface Category {
  id: string;
  name: string;
  code: string;
}

export default function ManageModels() {
  const queryClient = useQueryClient();
  const store = useModelStore();
  const [modelToDelete, setModelToDelete] = useState<Model | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const {
    editingId,
    deleteId,
    deleteError,
    showDeleteModal,
    name,
    code,
    brand,
    description,
    errors,
    isSubmitting,
    submitError,
    successMessage,
    formCategoryId,
    formSubcategoryId,
    editName,
    editCode,
    editBrand,
    editSubcategoryId,
    editDescription,
    editErrors,
    isEditing,
    setEditingId,
    setDeleteId,
    setDeleteError,
    setShowDeleteModal,
    setName,
    setCode,
    setBrand,
    setDescription,
    setErrors,
    clearError,
    setIsSubmitting,
    setSubmitError,
    setSuccessMessage,
    setFormCategoryId,
    setFormSubcategoryId,
    setEditName,
    setEditCode,
    setEditBrand,
    setEditSubcategoryId,
    setEditDescription,
    setEditErrors,
    setIsEditing,
    resetForm,
  } = store;

  const { data: models = [], isLoading } = useQuery({
    queryKey: ["models", formCategoryId, formSubcategoryId],
    queryFn: async () => {
      if (!formCategoryId || !formSubcategoryId) return [];
      const { data, error } = await supabase
        .from("models")
        .select("*, subcategories:subcategories(id, name, code, category_id)")
        .eq("subcategory_id", formSubcategoryId)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as Model[];
    },
    enabled: !!formCategoryId && !!formSubcategoryId,
    staleTime: 30000,
  });

  const totalPages = Math.ceil(models.length / itemsPerPage);
  const paginatedModels = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return models.slice(start, start + itemsPerPage);
  }, [models, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleCategoryChange = (id: string) => {
    setFormCategoryId(id);
    setCurrentPage(1);
    clearError("categoryId");
    clearError("subcategoryId");
  };

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

  const { data: allSubcategories = [] } = useQuery({
    queryKey: ["subcategories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subcategories")
        .select("id, name, code, category_id")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as Subcategory[];
    },
    staleTime: 30000,
  });

  const subcategories = useMemo(() => {
    if (!formCategoryId) return allSubcategories;
    return allSubcategories.filter((sub) => sub.category_id === formCategoryId);
  }, [allSubcategories, formCategoryId]);

  const addMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      code: string;
      brand: string;
      subcategory_id: string;
      description: string;
    }) => {
      const { error } = await supabase.from("models").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["models"] });
      setSuccessMessage("Model added successfully!");
      resetForm();
      setTimeout(() => setSuccessMessage(""), 3000);
    },
    onError: (err: Error) => {
      setSubmitError(err.message || "Failed to add model");
      setIsSubmitting(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: {
      id: string;
      name: string;
      code: string;
      brand: string;
      subcategory_id: string;
      description: string;
    }) => {
      const { error } = await supabase
        .from("models")
        .update({
          name: data.name,
          code: data.code,
          brand: data.brand,
          subcategory_id: data.subcategory_id,
          description: data.description,
        })
        .eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["models"] });
      setEditingId(null);
      setIsEditing(false);
    },
    onError: (err: Error) => {
      setSubmitError(err.message || "Failed to update model");
      setIsEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("soft_delete_model", { p_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["models"] });
      setDeleteId(null);
    },
    onError: (err: Error) => {
      setDeleteError(err.message || "Failed to delete model");
      setDeleteId(null);
    },
  });

  const validateAdd = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Model name is required";
    if (!code.trim()) newErrors.code = "Model code is required";
    if (!brand.trim()) newErrors.brand = "Brand is required";
    if (!formCategoryId) newErrors.categoryId = "Please select a category";
    if (!formSubcategoryId)
      newErrors.subcategoryId = "Please select a subcategory";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateEdit = () => {
    const newErrors: Record<string, string> = {};
    if (!editName.trim()) newErrors.name = "Model name is required";
    if (!editCode.trim()) newErrors.code = "Model code is required";
    if (!editBrand.trim()) newErrors.brand = "Brand is required";
    if (!editSubcategoryId)
      newErrors.subcategoryId = "Please select a subcategory";
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
      code: code.trim(),
      brand: brand.trim(),
      subcategory_id: formSubcategoryId,
      description: description.trim(),
    });
  };

  const handleEdit = (model: Model) => {
    setEditingId(model.id);
    setEditName(model.name);
    setEditCode(model.code);
    setEditBrand(model.brand);
    setEditSubcategoryId(model.subcategory_id);
    setEditDescription(model.description || "");
    setEditErrors({});
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !validateEdit()) return;
    setIsEditing(true);
    updateMutation.mutate({
      id: editingId,
      name: editName.trim(),
      code: editCode.trim(),
      brand: editBrand.trim(),
      subcategory_id: editSubcategoryId,
      description: editDescription.trim(),
    });
  };

  const handleDelete = (model: Model) => {
    setModelToDelete(model);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (modelToDelete) {
      setDeleteId(modelToDelete.id);
      setDeleteError("");
      deleteMutation.mutate(modelToDelete.id);
      setShowDeleteModal(false);
      setModelToDelete(null);
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

        {submitError && (
          <AlertBanner variant="error" message={submitError} className="mb-8" />
        )}

        <div className="mb-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Manage Models
          </h2>
          <p className="text-slate-500 mt-2 text-sm">
            Add, edit, and delete models from your inventory.
          </p>
        </div>

        <h3 className="text-lg font-semibold text-slate-900 mb-6">
          Add New Model
        </h3>
        <form onSubmit={handleAdd} className="space-y-6 mb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <SelectDropdown
              label="Category"
              value={formCategoryId}
              onChange={handleCategoryChange}
              options={categories.map((c) => ({
                value: c.id,
                label: `${c.name} (${c.code})`,
              }))}
              placeholder="Select a category"
              error={errors.categoryId}
            />
            <SelectDropdown
              label="Subcategory"
              value={formSubcategoryId}
              onChange={(value) => { setFormSubcategoryId(value); clearError("subcategoryId"); }}
              options={subcategories.map((s) => ({
                value: s.id,
                label: `${s.name} (${s.code})`,
              }))}
              placeholder="Select a subcategory"
              disabled={!formCategoryId}
              error={errors.subcategoryId}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              label="Model Name"
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); clearError("name"); }}
              error={errors.name}
              placeholder="e.g., Aputure 300x"
            />
            <Input
              label="Model Code"
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replaceAll(" ", ""));
                clearError("code");
              }}
              onBlur={(e) =>
                setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
              }
              className="uppercase font-mono"
              error={errors.code}
              placeholder="e.g., 300X"
              helperText="No spaces or special characters"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              label="Brand"
              type="text"
              value={brand}
              onChange={(e) => { setBrand(e.target.value); clearError("brand"); }}
              error={errors.brand}
              placeholder="e.g., Aputure"
            />
            <div></div>
          </div>

          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter model description (optional)"
            rows={3}
          />

          <Button type="submit" variant="primary" disabled={isSubmitting}>
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? "Saving..." : "Save Model"}
          </Button>
        </form>

        <div className="pt-6 border-t border-slate-200/60">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Models</h3>

          {deleteError && (
            <AlertBanner
              variant="error"
              message={deleteError}
              className="mb-6"
            />
          )}

          {!formCategoryId || !formSubcategoryId ? (
            <div className="p-12 text-center">
              <div className="w-14 h-14 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-5">
                <Package className="w-7 h-7 text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-500">
                Select a category and subcategory to see models
              </p>
            </div>
          ) : isLoading ? (
            <div className="p-12 text-center">
              <p className="text-sm text-slate-400">Loading models...</p>
            </div>
          ) : models.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-14 h-14 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-5">
                <Package className="w-7 h-7 text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-500">
                No models found for this selection.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {paginatedModels.map((model) => (
                <div
                  key={model.id}
                  className="py-5 hover:bg-slate-50/50 transition-colors"
                >
                  {editingId === model.id ? (
                    <form onSubmit={handleUpdate} className="space-y-6">
                      {editErrors.root && (
                        <p className="text-sm text-red-500">
                          {editErrors.root}
                        </p>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <SelectDropdown
                          label="Category"
                          value={
                            editSubcategoryId
                              ? allSubcategories.find(
                                  (s) => s.id === editSubcategoryId,
                                )?.category_id || ""
                              : ""
                          }
                          onChange={(newCatId) => {
                            const filteredSubs = allSubcategories.filter(
                              (s) => s.category_id === newCatId,
                            );
                            setEditSubcategoryId(filteredSubs[0]?.id || "");
                          }}
                          options={categories.map((c) => ({
                            value: c.id,
                            label: `${c.name} (${c.code})`,
                          }))}
                          placeholder="Select a category"
                        />
                        <SelectDropdown
                          label="Subcategory"
                          value={editSubcategoryId}
                          onChange={setEditSubcategoryId}
                          options={
                            editSubcategoryId
                              ? allSubcategories
                                  .filter(
                                    (s) =>
                                      s.category_id ===
                                      allSubcategories.find(
                                        (s) => s.id === editSubcategoryId,
                                      )?.category_id,
                                  )
                                  .map((s) => ({
                                    value: s.id,
                                    label: `${s.name} (${s.code})`,
                                  }))
                              : []
                          }
                          placeholder="Select a subcategory"
                          error={editErrors.subcategoryId}
                        />
                      </div>
                      <Input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        error={editErrors.name}
                        placeholder="Model name"
                        label="Name"
                      />
                      <Input
                        type="text"
                        value={editCode}
                        onChange={(e) =>
                          setEditCode(e.target.value.replaceAll(" ", ""))
                        }
                        onBlur={(e) =>
                          setEditCode(
                            e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""),
                          )
                        }
                        className="uppercase font-mono"
                        error={editErrors.code}
                        placeholder="Model code"
                        label="Code"
                        helperText="e.g., 300X"
                      />
                      <Input
                        type="text"
                        value={editBrand}
                        onChange={(e) => setEditBrand(e.target.value)}
                        error={editErrors.brand}
                        placeholder="Brand"
                        label="Brand"
                      />
                      <div className="flex items-center gap-3">
                        <Button
                          type="submit"
                          variant="primary"
                          size="sm"
                          disabled={isEditing}
                        >
                          <Save className="w-4 h-4 mr-1" />
                          {isEditing ? "Saving..." : "Save"}
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
                            {model.name}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                            {model.code}
                          </span>
                        </div>
                        {model.description && (
                          <p className="text-sm text-slate-500 mt-2">
                            {model.description}
                          </p>
                        )}
                        <p className="text-xs text-slate-400 mt-2">
                          Created:{" "}
                          {new Date(model.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(model)}
                          className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                          title="Edit model"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(model)}
                          disabled={deleteId === model.id}
                          className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                          title="Delete model"
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
                {Math.min(currentPage * itemsPerPage, models.length)} of{" "}
                {models.length} models
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
          title="Delete Model"
          message={`Are you sure you want to delete "${modelToDelete?.name}"? All assets under this model will also be soft-deleted and moved to the archive.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setModelToDelete(null);
          }}
          variant="danger"
        />
      </div>
    </div>
  );
}
