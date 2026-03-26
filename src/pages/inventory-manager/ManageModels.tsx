import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Listbox, ListboxButton, ListboxOptions, ListboxOption, Transition } from "@headlessui/react";
import { supabase } from "../../lib/supabase";
import Button from "../../components/Button";
import Input from "../../components/Input";
import ConfirmModal from "../../components/ConfirmModal";
import { useModelStore } from "../../store/modelStore";
import { ChevronLeft, ChevronRight, ChevronFirst, ChevronLast, Trash2, Package, Pencil, Save, ChevronDown, Check } from "lucide-react";

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
        .select(
          "*, subcategories:subcategories(id, name, code, category_id)",
        )
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
    if (!formSubcategoryId) newErrors.subcategoryId = "Please select a subcategory";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateEdit = () => {
    const newErrors: Record<string, string> = {};
    if (!editName.trim()) newErrors.name = "Model name is required";
    if (!editCode.trim())
      newErrors.code = "Model code is required";
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
            Manage Models
          </h1>
          <p className="text-gray-500 mt-1">
            Add, edit, and delete models from your inventory
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Add New Model
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Category <span className="text-red-500">*</span>
                </label>
                <Listbox value={formCategoryId} onChange={handleCategoryChange}>
                  <div className="relative">
                    <ListboxButton className="relative w-full cursor-default rounded-lg bg-white py-2.5 pl-4 pr-10 text-left border focus:outline-none focus:ring-1 focus:ring-[#1769ff]/20 focus:border-[#1769ff] bg-white border-gray-300">
                      <span className={formCategoryId ? "text-gray-900" : "text-gray-400"}>
                        {formCategoryId
                          ? categories.find((c) => c.id === formCategoryId)?.name + " (" + categories.find((c) => c.id === formCategoryId)?.code + ")"
                          : "Select a category"}
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
                        {categories.map((cat) => (
                          <ListboxOption
                            key={cat.id}
                            value={cat.id}
                            className={({ active }) =>
                              `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                active ? "bg-blue-50 text-[#1769ff]" : "text-gray-900"
                              }`
                            }
                          >
                            {({ selected }) => (
                              <>
                                <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>
                                  {cat.name} ({cat.code})
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
                {errors.categoryId && (
                  <p className="mt-1.5 text-sm text-red-500">
                    {errors.categoryId}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Subcategory <span className="text-red-500">*</span>
                </label>
                <Listbox value={formSubcategoryId} onChange={setFormSubcategoryId}>
                  <div className="relative">
                    <ListboxButton className={`relative w-full cursor-default rounded-lg bg-white py-2.5 pl-4 pr-10 text-left border focus:outline-none focus:ring-1 focus:ring-[#1769ff]/20 focus:border-[#1769ff] bg-white border-gray-300 ${!formCategoryId ? "bg-gray-100 cursor-not-allowed opacity-50" : ""}`} disabled={!formCategoryId}>
                      <span className={formSubcategoryId ? "text-gray-900" : "text-gray-400"}>
                        {formSubcategoryId
                          ? subcategories.find((s) => s.id === formSubcategoryId)?.name + " (" + subcategories.find((s) => s.id === formSubcategoryId)?.code + ")"
                          : "Select a subcategory"}
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
                        {subcategories.map((sub) => (
                          <ListboxOption
                            key={sub.id}
                            value={sub.id}
                            className={({ active }) =>
                              `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                active ? "bg-blue-50 text-[#1769ff]" : "text-gray-900"
                              }`
                            }
                          >
                            {({ selected }) => (
                              <>
                                <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>
                                  {sub.name} ({sub.code})
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
                {errors.subcategoryId && (
                  <p className="mt-1.5 text-sm text-red-500">
                    {errors.subcategoryId}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <Input
                label="Model Name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.name}
                placeholder="e.g., Aputure 300x"
                required
              />
              <Input
                label="Model Code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                error={errors.code}
                placeholder="e.g., 300X"
                required
                helperText="No spaces or special characters. Example: 300X"
              />
              <Input
                label="Brand"
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                error={errors.brand}
                placeholder="e.g., Aputure"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description <span className="text-gray-400">(Optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter model description"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1769ff] focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? "Saving..." : "Save Model"}
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

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {!formCategoryId || !formSubcategoryId ? (
            <div className="p-8 text-center text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Select a category and subcategory to see models</p>
            </div>
          ) : isLoading ? (
            <div className="p-8 text-center text-gray-500">
              Loading models...
            </div>
          ) : models.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No models found for this selection.</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-100">
                {paginatedModels.map((model) => (
                  <div
                    key={model.id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                  {editingId === model.id ? (
                    <form onSubmit={handleUpdate} className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category
                          </label>
                          <select
                            value={editSubcategoryId ? allSubcategories.find(s => s.id === editSubcategoryId)?.category_id || "" : ""}
                            onChange={(e) => {
                              const newCatId = e.target.value;
                              const filteredSubs = allSubcategories.filter(s => s.category_id === newCatId);
                              setEditSubcategoryId(filteredSubs[0]?.id || "");
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1769ff] bg-white"
                          >
                            <option value="">Select a category</option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name} ({cat.code})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Subcategory
                          </label>
                          <select
                            value={editSubcategoryId}
                            onChange={(e) => setEditSubcategoryId(e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1769ff] bg-white ${
                              editErrors.subcategoryId
                                ? "border-red-300"
                                : "border-gray-300"
                            }`}
                          >
                            <option value="">Select a subcategory</option>
                            {allSubcategories.filter(s => s.category_id === (allSubcategories.find(s => s.id === editSubcategoryId)?.category_id || allSubcategories.find(s => s.id === editSubcategoryId)?.category_id)).map((sub) => (
                              <option key={sub.id} value={sub.id}>
                                {sub.name} ({sub.code})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <Input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        error={editErrors.name}
                        placeholder="Model name"
                        label="Model Name"
                      />
                      <Input
                        type="text"
                        value={editCode}
                        onChange={(e) => setEditCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                        error={editErrors.code}
                        placeholder="Model code"
                        label="Model Code"
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
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-lg font-medium text-gray-900">
                            {model.name}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                            {model.code}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700">
                            {model.brand}
                          </span>
                          {model.subcategories && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-600">
                              {model.subcategories.name} (
                              {model.subcategories.code})
                            </span>
                          )}
                        </div>
                        {model.description && (
                          <p className="text-sm text-gray-500 mt-1">
                            {model.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          Created:{" "}
                          {new Date(model.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(model)}
                          className="p-2 text-gray-400 hover:text-[#1769ff] hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit model"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(model)}
                          disabled={deleteId === model.id}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete model"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                  <div className="text-sm text-gray-500">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, models.length)} of {models.length} models
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                      className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="First page"
                    >
                      <ChevronFirst className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Previous page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-3 py-1 text-sm text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Next page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                      className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Last page"
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
