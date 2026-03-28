import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
  Transition,
} from "@headlessui/react";
import { supabase } from "../../lib/supabase";
import Button from "../../components/Button";
import Input from "../../components/Input";
import ConfirmModal from "../../components/ConfirmModal";
import { useSubcategoryStore } from "../../store/subcategoryStore";
import {
  ChevronLeft,
  Trash2,
  Folder,
  Pencil,
  Save,
  ChevronDown,
  Check,
  ChevronRight,
  ChevronFirst,
  ChevronLast,
} from "lucide-react";

interface Subcategory {
  id: string;
  name: string;
  code: string;
  category_id: string;
  description: string | null;
  created_at: string;
  categories?: {
    name: string;
    code: string;
  };
}

interface Category {
  id: string;
  name: string;
  code: string;
}

export default function ManageSubcategories() {
  const queryClient = useQueryClient();
  const store = useSubcategoryStore();

  const {
    selectedCategoryId,
    formName,
    formCode,
    formDescription,
    formErrors,
    formIsSubmitting,
    formSubmitError,
    editingId,
    editName,
    editCode,
    editCategoryId,
    editDescription,
    editErrors,
    isEditing,
    setSelectedCategoryId,
    setFormName,
    setFormCode,
    setFormDescription,
    setFormErrors,
    setFormIsSubmitting,
    setFormSubmitError,
    setEditingId,
    setEditName,
    setEditCode,
    setEditCategoryId,
    setEditDescription,
    setEditErrors,
    setIsEditing,
  } = store;

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [subcategoryToDelete, setSubcategoryToDelete] =
    useState<Subcategory | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
      setSuccessMessage("Subcategory added successfully!");
      resetAddForm();
      setTimeout(() => setSuccessMessage(""), 3000);
    },
    onError: (err: Error) => {
      setFormSubmitError(err.message || "Failed to add subcategory");
      setFormIsSubmitting(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: {
      id: string;
      name: string;
      code: string;
      category_id: string;
      description: string;
    }) => {
      const { error } = await supabase
        .from("subcategories")
        .update({
          name: data.name,
          code: data.code,
          category_id: data.category_id,
          description: data.description,
        })
        .eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subcategories"] });
      setEditingId(null);
      setIsEditing(false);
    },
    onError: (err: Error) => {
      setFormSubmitError(err.message || "Failed to update subcategory");
      setIsEditing(false);
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
      setDeleteId(null);
    },
    onError: (err: Error) => {
      setDeleteError(err.message || "Failed to delete subcategory");
      setDeleteId(null);
    },
  });

  const resetAddForm = () => {
    setFormName("");
    setFormCode("");
    setFormDescription("");
    setSelectedCategoryId("");
    setFormErrors({});
    setFormSubmitError("");
    setFormIsSubmitting(false);
  };

  const validateAdd = () => {
    const newErrors: Record<string, string> = {};
    if (!formName.trim()) newErrors.name = "Subcategory name is required";
    if (!formCode.trim()) newErrors.code = "Subcategory code is required";
    if (!selectedCategoryId) newErrors.categoryId = "Please select a category";
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateEdit = () => {
    const newErrors: Record<string, string> = {};
    if (!editName.trim()) newErrors.name = "Subcategory name is required";
    if (!editCode.trim()) newErrors.code = "Subcategory code is required";
    if (!editCategoryId) newErrors.categoryId = "Please select a category";
    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitError("");
    if (!validateAdd()) return;
    setFormIsSubmitting(true);
    addMutation.mutate({
      name: formName.trim(),
      code: formCode.trim().toUpperCase(),
      category_id: selectedCategoryId,
      description: formDescription.trim(),
    });
  };

  const handleEdit = (subcategory: Subcategory) => {
    setEditingId(subcategory.id);
    setEditName(subcategory.name);
    setEditCode(subcategory.code);
    setEditCategoryId(subcategory.category_id);
    setEditDescription(subcategory.description || "");
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
      category_id: editCategoryId,
      description: editDescription.trim(),
    });
  };

  const handleDelete = (subcategory: Subcategory) => {
    setSubcategoryToDelete(subcategory);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (subcategoryToDelete) {
      setDeleteId(subcategoryToDelete.id);
      setDeleteError("");
      deleteMutation.mutate(subcategoryToDelete.id);
      setShowDeleteModal(false);
      setSubcategoryToDelete(null);
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
            Manage Subcategories
          </h1>
          <p className="text-gray-500 mt-1">
            Add, edit, and delete subcategories from your inventory
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Add New Subcategory
            </h2>
          </div>

          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">{successMessage}</p>
            </div>
          )}

          {formSubmitError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{formSubmitError}</p>
            </div>
          )}

          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Category <span className="text-red-500">*</span>
              </label>
              <Listbox
                value={selectedCategoryId}
                onChange={handleCategoryChange}
              >
                <div className="relative">
                  <ListboxButton className="relative w-full cursor-default rounded-lg bg-white py-2.5 pl-4 pr-10 text-left border focus:outline-none focus:ring-1 focus:ring-[#1769ff]/20 focus:border-[#1769ff] bg-white border-gray-300">
                    <span
                      className={
                        selectedCategoryId ? "text-gray-900" : "text-gray-400"
                      }
                    >
                      {selectedCategoryId
                        ? categories.find((c) => c.id === selectedCategoryId)
                            ?.name +
                          " (" +
                          categories.find((c) => c.id === selectedCategoryId)
                            ?.code +
                          ")"
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
                              active
                                ? "bg-blue-50 text-[#1769ff]"
                                : "text-gray-900"
                            }`
                          }
                        >
                          {({ selected }) => (
                            <>
                              <span
                                className={`block truncate ${selected ? "font-medium" : "font-normal"}`}
                              >
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
              {formErrors.categoryId && (
                <p className="mt-1.5 text-sm text-red-500">
                  {formErrors.categoryId}
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Subcategory Name"
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                error={formErrors.name}
                placeholder="e.g., Gaming Laptops"
                required
              />
              <Input
                label="Subcategory Code"
                type="text"
                value={formCode}
                onChange={(e) =>
                  setFormCode(
                    e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""),
                  )
                }
                error={formErrors.code}
                placeholder="e.g., GAM-LAP"
                required
                maxLength={10}
                helperText="No spaces or special characters. Example: GAM-LAP"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description <span className="text-gray-400">(Optional)</span>
              </label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Enter subcategory description"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1769ff] focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="submit"
                variant="primary"
                disabled={formIsSubmitting}
              >
                <Save className="w-4 h-4 mr-2" />
                {formIsSubmitting ? "Saving..." : "Save Subcategory"}
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

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {!selectedCategoryId ? (
            <div className="p-8 text-center text-gray-500">
              <Folder className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Select a category to see its subcategories</p>
            </div>
          ) : isLoading ? (
            <div className="p-8 text-center text-gray-500">
              Loading subcategories...
            </div>
          ) : subcategories.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Folder className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No subcategories found for this category.</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-100">
                {paginatedSubcategories.map((subcategory) => (
                  <div
                    key={subcategory.id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    {editingId === subcategory.id ? (
                      <form onSubmit={handleUpdate} className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                            onChange={(e) =>
                              setEditCode(
                                e.target.value
                                  .toUpperCase()
                                  .replace(/[^A-Z0-9-]/g, ""),
                              )
                            }
                            error={editErrors.code}
                            placeholder="Code"
                            className="mb-0"
                            helperText="e.g., GAM-LAP"
                          />
                        </div>
                        <div>
                          <Listbox
                            value={editCategoryId}
                            onChange={setEditCategoryId}
                          >
                            <div className="relative">
                              <ListboxButton className="relative w-full cursor-default rounded-lg bg-white py-2 pl-4 pr-10 text-left border focus:outline-none focus:ring-1 focus:ring-[#1769ff]/20 focus:border-[#1769ff] bg-white border-gray-300">
                                <span
                                  className={
                                    editCategoryId
                                      ? "text-gray-900"
                                      : "text-gray-400"
                                  }
                                >
                                  {editCategoryId
                                    ? categories.find(
                                        (c) => c.id === editCategoryId,
                                      )?.name +
                                      " (" +
                                      categories.find(
                                        (c) => c.id === editCategoryId,
                                      )?.code +
                                      ")"
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
                                <ListboxOptions className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                  {categories.map((cat) => (
                                    <ListboxOption
                                      key={cat.id}
                                      value={cat.id}
                                      className={({ active }) =>
                                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                          active
                                            ? "bg-blue-50 text-[#1769ff]"
                                            : "text-gray-900"
                                        }`
                                      }
                                    >
                                      {({ selected }) => (
                                        <>
                                          <span
                                            className={`block truncate ${selected ? "font-medium" : "font-normal"}`}
                                          >
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
                          {editErrors.categoryId && (
                            <p className="mt-1.5 text-sm text-red-500">
                              {editErrors.categoryId}
                            </p>
                          )}
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
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-lg font-medium text-gray-900">
                              {subcategory.name}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                              {subcategory.code}
                            </span>
                            {subcategory.categories && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-600">
                                {subcategory.categories.name} (
                                {subcategory.categories.code})
                              </span>
                            )}
                          </div>
                          {subcategory.description && (
                            <p className="text-sm text-gray-500 mt-1">
                              {subcategory.description}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            Created:{" "}
                            {new Date(
                              subcategory.created_at,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEdit(subcategory)}
                            className="p-2 text-gray-400 hover:text-[#1769ff] hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit subcategory"
                          >
                            <Pencil className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(subcategory)}
                            disabled={deleteId === subcategory.id}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete subcategory"
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
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                    {Math.min(currentPage * itemsPerPage, subcategories.length)}{" "}
                    of {subcategories.length} subcategories
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
