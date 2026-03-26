import { create } from "zustand";

interface EquipmentFormState {
  // Form fields
  categoryId: string;
  subcategoryId: string;
  modelId: string;
  serialNumber: string;
  storageLocationId: string;
  condition: string;
  status: string;
  description: string;
  purchaseDate: string;
  warrantyExpiry: string;
  hasWarranty: boolean;
  generatedSku: string;

  // UI state
  isSubmitting: boolean;
  errors: Record<string, string>;
  submitError: string;
  successMessage: string;

  // Actions
  setCategoryId: (id: string) => void;
  setSubcategoryId: (id: string) => void;
  setModelId: (id: string) => void;
  setSerialNumber: (serial: string) => void;
  setStorageLocationId: (id: string) => void;
  setCondition: (condition: string) => void;
  setStatus: (status: string) => void;
  setDescription: (description: string) => void;
  setPurchaseDate: (date: string) => void;
  setWarrantyExpiry: (date: string) => void;
  setHasWarranty: (has: boolean) => void;
  setGeneratedSku: (sku: string) => void;
  setIsSubmitting: (submitting: boolean) => void;
  setErrors: (errors: Record<string, string>) => void;
  setSubmitError: (error: string) => void;
  setSuccessMessage: (msg: string) => void;
  reset: () => void;
}

const equipmentInitialState = {
  categoryId: "",
  subcategoryId: "",
  modelId: "",
  serialNumber: "",
  storageLocationId: "",
  condition: "excellent",
  status: "available",
  description: "",
  purchaseDate: "",
  warrantyExpiry: "",
  hasWarranty: false,
  generatedSku: "",
  isSubmitting: false,
  errors: {},
  submitError: "",
  successMessage: "",
};

export const useEquipmentStore = create<EquipmentFormState>((set) => ({
  ...equipmentInitialState,

  setCategoryId: (id) =>
    set({ categoryId: id, subcategoryId: "", modelId: "" }),
  setSubcategoryId: (id) => set({ subcategoryId: id, modelId: "" }),
  setModelId: (id) => set({ modelId: id }),
  setSerialNumber: (serial) => set({ serialNumber: serial }),
  setStorageLocationId: (id) => set({ storageLocationId: id }),
  setCondition: (condition) => set({ condition }),
  setStatus: (status) => set({ status }),
  setDescription: (description) => set({ description }),
  setPurchaseDate: (date) => set({ purchaseDate: date }),
  setWarrantyExpiry: (date) => set({ warrantyExpiry: date }),
  setHasWarranty: (has) => set({ hasWarranty: has }),
  setGeneratedSku: (sku) => set({ generatedSku: sku }),
  setIsSubmitting: (submitting) => set({ isSubmitting: submitting }),
  setErrors: (errors) => set({ errors }),
  setSubmitError: (error) => set({ submitError: error }),
  setSuccessMessage: (msg) => set({ successMessage: msg }),
  reset: () => set(equipmentInitialState),
}));
