import { create } from "zustand";

interface EquipmentFilters {
  categoryId: string;
  subcategoryId: string;
  modelId: string;
  locationId: string;
  statusFilter: string;
  conditionFilter: string;
  showFilters: boolean;
  setCategoryId: (id: string) => void;
  setSubcategoryId: (id: string) => void;
  setModelId: (id: string) => void;
  setLocationId: (id: string) => void;
  setStatusFilter: (status: string) => void;
  setConditionFilter: (condition: string) => void;
  setShowFilters: (show: boolean) => void;
  clearAll: () => void;
}

const initialState = {
  categoryId: "",
  subcategoryId: "",
  modelId: "",
  locationId: "",
  statusFilter: "",
  conditionFilter: "",
  showFilters: false,
};

export const useEquipmentFilters = create<EquipmentFilters>((set) => ({
  ...initialState,

  setCategoryId: (id) => set({ categoryId: id, subcategoryId: "", modelId: "" }),
  setSubcategoryId: (id) => set({ subcategoryId: id, modelId: "" }),
  setModelId: (id) => set({ modelId: id }),
  setLocationId: (id) => set({ locationId: id }),
  setStatusFilter: (status) => set({ statusFilter: status }),
  setConditionFilter: (condition) => set({ conditionFilter: condition }),
  setShowFilters: (show) => set({ showFilters: show }),
  clearAll: () => set(initialState),
}));