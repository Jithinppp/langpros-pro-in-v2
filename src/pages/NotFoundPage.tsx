import { Link } from "react-router-dom";

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-white">
      <div className="text-center">
        {/* 404 Number */}
        <h1 className="text-[120px] font-bold text-[#1769ff] leading-none">
          404
        </h1>

        {/* Message */}
        <h2 className="text-2xl font-semibold text-gray-900 mt-4">
          Page not found
        </h2>
        <p className="text-gray-500 mt-2 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Back to Home */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#1769ff] hover:bg-[#0052cc] text-white font-medium rounded-lg transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to home
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
