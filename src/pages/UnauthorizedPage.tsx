import { Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import Button from "../components/Button";

const UnauthorizedPage = () => {
  const { user } = useAuthStore();
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className=" p-16 text-center bg-gray-50/50">
        <div className="w-16 h-16 bg-white border border-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h3>
        <p className="mb-4 max-w-sm mx-auto text-slate-500 mt-2 text-sm">
          You do not have permission to access this page. This area is
          restricted to authorized personnel only.
        </p>

        {user && (
          <p className="text-xs text-gray-500 mb-6">
            Logged in as:{" "}
            <span className="font-medium text-gray-900">{user.email}</span>
          </p>
        )}

        <Link to="/">
          <Button variant="primary">
            {user ? "Go to My Dashboard" : "Sign In"}
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
