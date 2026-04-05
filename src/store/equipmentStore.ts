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
  shippingAddress: string;
  trackingCode: string;
  deliveryDate: string;
  carrier: string;

  // UI state
  supplierName: string;
  invoiceNumber: string;
  weight: string;
  caseNumber: string;
  remarks: string;
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
  setShippingAddress: (address: string) => void;
  setTrackingCode: (code: string) => void;
  setDeliveryDate: (date: string) => void;
  setCarrier: (carrier: string) => void;
  setSupplierName: (name: string) => void;
  setInvoiceNumber: (num: string) => void;
  setWeight: (weight: string) => void;
  setCaseNumber: (caseNum: string) => void;
  setRemarks: (remarks: string) => void;
  setIsSubmitting: (submitting: boolean) => void;
  setErrors: (errors: Record<string, string>) => void;
  clearError: (key: string) => void;
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
  shippingAddress: "",
  trackingCode: "",
  deliveryDate: "",
  carrier: "",
  supplierName: "",
  invoiceNumber: "",
  weight: "",
  caseNumber: "",
  remarks: "",
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
  setShippingAddress: (address) => set({ shippingAddress: address }),
  setTrackingCode: (code) => set({ trackingCode: code }),
  setDeliveryDate: (date) => set({ deliveryDate: date }),
  setCarrier: (carrier) => set({ carrier }),
  setSupplierName: (name) => set({ supplierName: name }),
  setInvoiceNumber: (num) => set({ invoiceNumber: num }),
  setWeight: (weight) => set({ weight }),
  setCaseNumber: (caseNum) => set({ caseNumber: caseNum }),
  setRemarks: (remarks) => set({ remarks }),
  setIsSubmitting: (submitting) => set({ isSubmitting: submitting }),
  setErrors: (errors) => set({ errors }),
  clearError: (key) => set((state) => {
    const newErrors = { ...state.errors };
    delete newErrors[key];
    return { errors: newErrors };
  }),
  setSubmitError: (error) => set({ submitError: error }),
  setSuccessMessage: (msg) => set({ successMessage: msg }),
  reset: () => set(equipmentInitialState),
}));