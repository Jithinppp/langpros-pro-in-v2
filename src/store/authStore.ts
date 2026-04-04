import { create } from "zustand";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { UserRole } from "../lib/supabase";

interface AuthState {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  loading: boolean;
  navigate: ((path: string) => void) | null;
  initializeAuth: () => Promise<() => void>;
  signIn: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
  setNavigate: (fn: (path: string) => void) => void;
}

let authCleanup: (() => void) | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  role: null,
  loading: true,
  navigate: null,

  setNavigate: (fn) => set({ navigate: fn }),

  initializeAuth: async () => {
    if (authCleanup) {
      authCleanup();
      authCleanup = null;
    }

    const checkRole = async (userEmail: string) => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_role")
        .eq("user_email", userEmail)
        .single();

      if (error) {
        return null;
      }
      return data?.user_role as UserRole | null;
    };

    const handleSession = async (session: Session | null) => {
      if (session) {
        const currentRole = get().role;
        const currentUser = get().user;

        if (!currentRole || currentUser?.email !== session.user.email) {
          const role = await checkRole(session.user.email || "");
          set({ session, user: session.user, role, loading: false });
        } else {
          set({ session, user: session.user, loading: false });
        }
      } else {
        set({ session: null, user: null, role: null, loading: false });
      }
    };

    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Session check error:", error);
    }
    await handleSession(session);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (event === "SIGNED_IN") {
        set({ loading: true });
        await handleSession(newSession);
      } else if (event === "SIGNED_OUT") {
        set({ session: null, user: null, role: null, loading: false });
      } else if (event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        const currentRole = get().role;
        if (!currentRole) {
          await handleSession(newSession);
        } else {
          set({ session: newSession, user: newSession?.user ?? null });
        }
      }
    });

    authCleanup = () => {
      subscription.unsubscribe();
      authCleanup = null;
    };
    return authCleanup;
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error("Authentication failed");
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, role: null, loading: false });
    const navigate = get().navigate;
    if (navigate) {
      navigate("/");
    } else {
      window.location.href = "/";
    }
  },
}));