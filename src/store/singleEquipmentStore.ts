import { create } from "zustand";

interface SingleEquipmentFormState {
  showDeleteModal: boolean;
  deleteError: string;
  isEditing: boolean;
  editError: string;
  successMessage: string;
  editSerialNumber: string;
  editStatus: string;
  editCondition: string;
  editLocationId: string;
  editDescription: string;
  editErrors: Record<string, string>;

  setShowDeleteModal: (show: boolean) => void;
  setDeleteError: (error: string) => void;
  setIsEditing: (editing: boolean) => void;
  setEditError: (error: string) => void;
  setSuccessMessage: (msg: string) => void;
  setEditSerialNumber: (num: string) => void;
  setEditStatus: (status: string) => void;
  setEditCondition: (condition: string) => void;
  setEditLocationId: (id: string) => void;
  setEditDescription: (desc: string) => void;
  setEditErrors: (errors: Record<string, string>) => void;
  resetForm: () => void;
}

const initialState = {
  showDeleteModal: false,
  deleteError: "",
  isEditing: false,
  editError: "",
  successMessage: "",
  editSerialNumber: "",
  editStatus: "",
  editCondition: "",
  editLocationId: "",
  editDescription: "",
  editErrors: {},
};

export const useSingleEquipmentStore = create<SingleEquipmentFormState>((set) => ({
  ...initialState,

  setShowDeleteModal: (show) => set({ showDeleteModal: show }),
  setDeleteError: (error) => set({ deleteError: error }),
  setIsEditing: (editing) => set({ isEditing: editing }),
  setEditError: (error) => set({ editError: error }),
  setSuccessMessage: (msg) => set({ successMessage: msg }),
  setEditSerialNumber: (num) => set({ editSerialNumber: num }),
  setEditStatus: (status) => set({ editStatus: status }),
  setEditCondition: (condition) => set({ editCondition: condition }),
  setEditLocationId: (id) => set({ editLocationId: id }),
  setEditDescription: (desc) => set({ editDescription: desc }),
  setEditErrors: (errors) => set({ editErrors: errors }),
  resetForm: () => set({
    editSerialNumber: "",
    editStatus: "",
    editCondition: "",
    editLocationId: "",
    editDescription: "",
    editErrors: {},
  }),
}));
