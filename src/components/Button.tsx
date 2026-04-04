import type { ButtonHTMLAttributes, ReactNode } from "react";
import Loading from "./Loading";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost" | "warning";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const Button = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) => {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

  const variants = {
    primary:
      "bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-900/20 shadow-[0_4px_14px_-4px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_20px_-4px_rgba(0,0,0,0.2)]",
    secondary:
      "bg-white text-slate-700 border border-slate-200/60 hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.04)]",
    danger:
      "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500/20 shadow-[0_4px_14px_-4px_rgba(220,38,38,0.25)] active:bg-red-800",
    warning:
      "bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-500/20 shadow-[0_4px_14px_-4px_rgba(245,158,11,0.25)]",
    ghost:
      "bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-slate-500/20",
  };

  const sizes = {
    sm: "px-4 py-2 text-xs tracking-wide",
    md: "px-6 py-3 text-sm tracking-wide",
    lg: "px-8 py-4 text-base tracking-wide",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className} cursor-pointer`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loading className="-ml-1 mr-2 h-4 w-4" color="border-white" />
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
