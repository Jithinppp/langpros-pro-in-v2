import { create } from "zustand";

interface CategoryFormState {
  editingId: string | null;
  deleteId: string | null;
  deleteError: string;
  showDeleteModal: boolean;
  name: string;
  code: string;
  description: string;
  errors: Record<string, string>;
  isSubmitting: boolean;
  submitError: string;
  successMessage: string;
  editName: string;
  editCode: string;
  editDescription: string;
  editErrors: Record<string, string>;
  isEditing: boolean;

  setEditingId: (id: string | null) => void;
  setDeleteId: (id: string | null) => void;
  setDeleteError: (error: string) => void;
  setShowDeleteModal: (show: boolean) => void;
  setName: (name: string) => void;
  setCode: (code: string) => void;
  setDescription: (desc: string) => void;
  setErrors: (errors: Record<string, string>) => void;
  setIsSubmitting: (submitting: boolean) => void;
  setSubmitError: (error: string) => void;
  setSuccessMessage: (msg: string) => void;
  setEditName: (name: string) => void;
  setEditCode: (code: string) => void;
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
  description: "",
  errors: {},
  isSubmitting: false,
  submitError: "",
  successMessage: "",
  editName: "",
  editCode: "",
  editDescription: "",
  editErrors: {},
  isEditing: false,
};

export const useCategoryStore = create<CategoryFormState>((set) => ({
  ...initialState,

  setEditingId: (id) => set({ editingId: id }),
  setDeleteId: (id) => set({ deleteId: id }),
  setDeleteError: (error) => set({ deleteError: error }),
  setShowDeleteModal: (show) => set({ showDeleteModal: show }),
  setName: (name) => set({ name }),
  setCode: (code) => set({ code }),
  setDescription: (desc) => set({ description: desc }),
  setErrors: (errors) => set({ errors }),
  setIsSubmitting: (submitting) => set({ isSubmitting: submitting }),
  setSubmitError: (error) => set({ submitError: error }),
  setSuccessMessage: (msg) => set({ successMessage: msg }),
  setEditName: (name) => set({ editName: name }),
  setEditCode: (code) => set({ editCode: code }),
  setEditDescription: (desc) => set({ editDescription: desc }),
  setEditErrors: (errors) => set({ editErrors: errors }),
  setIsEditing: (editing) => set({ isEditing: editing }),
  resetForm: () => set({
    name: "",
    code: "",
    description: "",
    errors: {},
    submitError: "",
    isSubmitting: false,
  }),
}));
