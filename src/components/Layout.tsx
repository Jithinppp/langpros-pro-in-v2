import { Outlet, Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import Button from "./Button";
import { useState } from "react";

const Layout = () => {
  const { user, signOut, loading } = useAuthStore();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
      setIsSigningOut(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#FAFAFA] font-['system-ui','SF_Pro_Display','Geist_Sans','Helvetica_Neue',sans-serif]">
      {/* Noise overlay - fixed */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] z-50 mix-blend-multiply">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Top Navigation Bar - Floating centered pill */}
      <header className="fixed top-6 left-0 right-0 z-40">
        <div className="flex justify-center">
          <div className="flex items-center gap-4 px-6 py-3 bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-full shadow-[0_8px_32px_-8px_rgba(0,0,0,0.12)]">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-2 h-2 bg-slate-900 rounded-full" />
              <span className="font-semibold text-sm tracking-[0.2em] uppercase text-slate-800">
                LangPros
              </span>
            </Link>

            <div className="w-px h-4 bg-slate-200" />

            {/* User info */}
            {user && !loading && (
              <span className="text-xs text-slate-500 hidden sm:block">
                {user.email}
              </span>
            )}

            <div className="w-px h-4 bg-slate-200" />

            {/* Sign out */}
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSignOut}
              disabled={loading || isSigningOut}
              className="text-xs"
            >
              {loading || isSigningOut ? "Signing out..." : "Sign out"}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 lg:pt-24 pb-12">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
