import { create } from "zustand";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { UserRole } from "../lib/supabase";

interface AuthState {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  loading: boolean;
  initializeAuth: () => Promise<void>;
  signIn: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
}

let isInitialized = false;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  role: null,
  loading: true,

  initializeAuth: async () => {
    // Prevent duplicate listeners due to React 18 Strict Mode
    if (isInitialized) return;
    isInitialized = true;

    console.log("🚀 Initializing Zustand Auth singleton...");

    const checkRole = async (userEmail: string) => {
      console.log("📧 Fetching role for email:", userEmail);
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_role")
        .eq("user_email", userEmail)
        .single();

      if (error) {
        console.error("❌ Error fetching role:", error.message);
        return null;
      }
      return data?.user_role as UserRole | null;
    };

    const handleSession = async (session: Session | null) => {
      if (session) {
        const currentRole = get().role;
        const currentUser = get().user;
        
        // Only fetch role if we don't have it or the user changed
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

    // Initial session load
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) console.error("Session check error:", error);
    await handleSession(session);

    // Singleton listener for changes
    supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log("🔄 Global Auth event:", event);
      
      if (event === "SIGNED_IN") {
        set({ loading: true });
        await handleSession(newSession);
      } else if (event === "SIGNED_OUT") {
        set({ session: null, user: null, role: null, loading: false });
      } else if (event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        // Silently update session to avoid unmounting the UI and showing the loading screen
        const currentRole = get().role;
        if (!currentRole) {
           await handleSession(newSession);
        } else {
           set({ session: newSession, user: newSession?.user ?? null });
        }
      }
    });
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error("Authentication failed");
  },

  signOut: async () => {
    console.log("🚪 Signing out...");
    await supabase.auth.signOut();
    set({ user: null, session: null, role: null, loading: false });
    window.location.href = "/";
  },
}));
