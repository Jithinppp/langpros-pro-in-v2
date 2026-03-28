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
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-3">
                <span className="font-semibold text-xl tracking-wider">
                  LANGRPROS
                </span>
              </Link>
            </div>

            {/* Right side - User info & Logout */}
            <div className="flex items-center gap-4">
              {user && !loading && (
                <span className="text-sm text-gray-600 hidden sm:block">
                  {user.email}
                </span>
              )}
              <Button
                size="md"
                variant="secondary"
                onClick={handleSignOut}
                disabled={loading || isSigningOut}
              >
                {loading || isSigningOut ? "Signing out..." : "Sign out"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
