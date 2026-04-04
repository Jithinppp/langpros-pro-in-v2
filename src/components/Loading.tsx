interface LoadingProps {
  className?: string;
}

const Loading = ({ className = "h-5 w-5" }: LoadingProps) => {
  return (
    <svg
      className={`animate-spin ${className} text-slate-400`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-75"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        d="M4 12a8 8 0 018-8"
      />
    </svg>
  );
};

export default Loading;
