import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export interface CategoryOption {
  id: string;
  name: string;
  code: string;
}

export interface SubcategoryOption {
  id: string;
  name: string;
  code: string;
  category_id: string;
}

export interface ModelOption {
  id: string;
  name: string;
  code: string;
  subcategory_id: string;
  brand: string;
}

export interface StorageLocationOption {
  id: string;
  name: string;
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, code")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as CategoryOption[];
    },
    staleTime: 60000,
  });
}

export function useSubcategories(categoryId?: string) {
  return useQuery({
    queryKey: ["subcategories", categoryId],
    queryFn: async () => {
      if (!categoryId) return [];
      const { data, error } = await supabase
        .from("subcategories")
        .select("id, name, code, category_id")
        .eq("category_id", categoryId)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as SubcategoryOption[];
    },
    enabled: !!categoryId,
    staleTime: 60000,
  });
}

export function useModels(subcategoryId?: string) {
  return useQuery({
    queryKey: ["models", subcategoryId],
    queryFn: async () => {
      if (!subcategoryId) return [];
      const { data, error } = await supabase
        .from("models")
        .select("id, name, code, subcategory_id, brand")
        .eq("subcategory_id", subcategoryId)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as ModelOption[];
    },
    enabled: !!subcategoryId,
    staleTime: 60000,
  });
}

export function useStorageLocations() {
  return useQuery({
    queryKey: ["storage_locations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("storage_locations")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data as StorageLocationOption[];
    },
    staleTime: 60000,
  });
}
