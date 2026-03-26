import { create } from "zustand";

interface ModelFormState {
  editingId: string | null;
  deleteId: string | null;
  deleteError: string;
  showDeleteModal: boolean;
  name: string;
  code: string;
  brand: string;
  description: string;
  errors: Record<string, string>;
  isSubmitting: boolean;
  submitError: string;
  successMessage: string;
  formCategoryId: string;
  formSubcategoryId: string;
  editName: string;
  editCode: string;
  editBrand: string;
  editSubcategoryId: string;
  editDescription: string;
  editErrors: Record<string, string>;
  isEditing: boolean;

  setEditingId: (id: string | null) => void;
  setDeleteId: (id: string | null) => void;
  setDeleteError: (error: string) => void;
  setShowDeleteModal: (show: boolean) => void;
  setName: (name: string) => void;
  setCode: (code: string) => void;
  setBrand: (brand: string) => void;
  setDescription: (desc: string) => void;
  setErrors: (errors: Record<string, string>) => void;
  setIsSubmitting: (submitting: boolean) => void;
  setSubmitError: (error: string) => void;
  setSuccessMessage: (msg: string) => void;
  setFormCategoryId: (id: string) => void;
  setFormSubcategoryId: (id: string) => void;
  setEditName: (name: string) => void;
  setEditCode: (code: string) => void;
  setEditBrand: (brand: string) => void;
  setEditSubcategoryId: (id: string) => void;
  setEditDescription: (desc: string) => void;
  setEditErrors: (errors: Record<string, string>) => void;
  setIsEditing: (editing: boolean) => void;
  resetForm: () => void;
}

const initialState = {
  editingId: null,
  deleteId: null,
  deleteError: "",
  showDeleteModal: false,
  name: "",
  code: "",
  brand: "",
  description: "",
  errors: {},
  isSubmitting: false,
  submitError: "",
  successMessage: "",
  formCategoryId: "",
  formSubcategoryId: "",
  editName: "",
  editCode: "",
  editBrand: "",
  editSubcategoryId: "",
  editDescription: "",
  editErrors: {},
  isEditing: false,
};

export const useModelStore = create<ModelFormState>((set) => ({
  ...initialState,

  setEditingId: (id) => set({ editingId: id }),
  setDeleteId: (id) => set({ deleteId: id }),
  setDeleteError: (error) => set({ deleteError: error }),
  setShowDeleteModal: (show) => set({ showDeleteModal: show }),
  setName: (name) => set({ name }),
  setCode: (code) => set({ code }),
  setBrand: (brand) => set({ brand }),
  setDescription: (desc) => set({ description: desc }),
  setErrors: (errors) => set({ errors }),
  setIsSubmitting: (submitting) => set({ isSubmitting: submitting }),
  setSubmitError: (error) => set({ submitError: error }),
  setSuccessMessage: (msg) => set({ successMessage: msg }),
  setFormCategoryId: (id) => set({ formCategoryId: id, formSubcategoryId: "" }),
  setFormSubcategoryId: (id) => set({ formSubcategoryId: id }),
  setEditName: (name) => set({ editName: name }),
  setEditCode: (code) => set({ editCode: code }),
  setEditBrand: (brand) => set({ editBrand: brand }),
  setEditSubcategoryId: (id) => set({ editSubcategoryId: id }),
  setEditDescription: (desc) => set({ editDescription: desc }),
  setEditErrors: (errors) => set({ editErrors: errors }),
  setIsEditing: (editing) => set({ isEditing: editing }),
  resetForm: () => set({
    name: "",
    code: "",
    brand: "",
    description: "",
    errors: {},
    submitError: "",
    isSubmitting: false,
  }),
}));
