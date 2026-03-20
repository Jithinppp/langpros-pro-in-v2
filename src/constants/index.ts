import type { UserRole } from "../lib/supabase";

// Role to path mapping
export const roleToPath: Record<UserRole, string> = {
  admin: "/admin",
  "inventory-manager": "/inventory-manager",
  "project-manager": "/project-manager",
  tech: "/tech",
};

// Path to role mapping (reverse)
export const pathToRole: Record<string, UserRole> = {
  "/admin": "admin",
  "/inventory-manager": "inventory-manager",
  "/project-manager": "project-manager",
  "/tech": "tech",
};

// Get all allowed roles
export const allowedRoles: UserRole[] = [
  "admin",
  "inventory-manager",
  "project-manager",
  "tech",
];
