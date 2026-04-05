import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? "";
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY ?? "";

export const supabase = createClient(supabaseUrl, supabaseKey);

// Role types
export type UserRole =
  | "admin"
  | "tech"
  | "inventory-manager"
  | "project-manager";

// Route to role mapping
export const routeRoles: Record<string, UserRole[]> = {
  "/admin": ["admin"],
  "/tech": ["tech"],
  "/inventory-manager": ["inventory-manager"],
  "/project-manager": ["project-manager"],
};
