
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import Loading from "./Loading";
import type { UserRole } from "../lib/supabase";

interface ProtectedRouteProps {
  children?: React.ReactNode;
  allowedRoles?: UserRole[];
}

function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, session, role, loading } = useAuthStore();

  // Show loading while checking session
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading className="h-8 w-8" />
      </div>
    );
  }

  // Redirect to home if not logged in
  if (!session || !user) {
    return <Navigate to="/" replace />;
  }

  // If roles are specified, check user role
  if (allowedRoles && allowedRoles.length > 0) {
    if (!role || !allowedRoles.includes(role)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children ? <>{children}</> : <Outlet />;
}

export default ProtectedRoute;
