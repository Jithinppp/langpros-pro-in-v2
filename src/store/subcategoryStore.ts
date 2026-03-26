import { create } from "zustand";

interface SubcategoryFormState {
  selectedCategoryId: string;
  formName: string;
  formCode: string;
  formDescription: string;
  formErrors: Record<string, string>;
  formIsSubmitting: boolean;
  formSubmitError: string;
  editingId: string | null;
  editName: string;
  editCode: string;
  editCategoryId: string;
  editDescription: string;
  editErrors: Record<string, string>;
  isEditing: boolean;

  setSelectedCategoryId: (id: string) => void;
  setFormName: (name: string) => void;
  setFormCode: (code: string) => void;
  setFormDescription: (desc: string) => void;
  setFormErrors: (errors: Record<string, string>) => void;
  setFormIsSubmitting: (submitting: boolean) => void;
  setFormSubmitError: (error: string) => void;
  setEditingId: (id: string | null) => void;
  setEditName: (name: string) => void;
  setEditCode: (code: string) => void;
  setEditCategoryId: (id: string) => void;
  setEditDescription: (desc: string) => void;
  setEditErrors: (errors: Record<string, string>) => void;
  setIsEditing: (editing: boolean) => void;
  resetForm: () => void;
}

const initialState = {
  selectedCategoryId: "",
  formName: "",
  formCode: "",
  formDescription: "",
  formErrors: {},
  formIsSubmitting: false,
  formSubmitError: "",
  editingId: null,
  editName: "",
  editCode: "",
  editCategoryId: "",
  editDescription: "",
  editErrors: {},
  isEditing: false,
};

export const useSubcategoryStore = create<SubcategoryFormState>((set) => ({
  ...initialState,

  setSelectedCategoryId: (id) => set({ selectedCategoryId: id }),
  setFormName: (name) => set({ formName: name }),
  setFormCode: (code) => set({ formCode: code }),
  setFormDescription: (desc) => set({ formDescription: desc }),
  setFormErrors: (errors) => set({ formErrors: errors }),
  setFormIsSubmitting: (submitting) => set({ formIsSubmitting: submitting }),
  setFormSubmitError: (error) => set({ formSubmitError: error }),
  setEditingId: (id) => set({ editingId: id }),
  setEditName: (name) => set({ editName: name }),
  setEditCode: (code) => set({ editCode: code }),
  setEditCategoryId: (id) => set({ editCategoryId: id }),
  setEditDescription: (desc) => set({ editDescription: desc }),
  setEditErrors: (errors) => set({ editErrors: errors }),
  setIsEditing: (editing) => set({ isEditing: editing }),
  resetForm: () => set(initialState),
}));
