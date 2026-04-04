import type { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  rightAdornment?: ReactNode;
}

const Input = ({
  label,
  error,
  helperText,
  rightAdornment,
  className = "",
  id,
  ...props
}: InputProps) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          className={`w-full px-5 py-2.5 rounded-lg text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-0 ${
            error
              ? "border-2 border-red-300 focus:border-red-400 focus:ring-red-500/10 bg-red-50/30"
              : "border border-slate-200/60 focus:border-slate-400 focus:ring-slate-900/5 bg-white shadow-[0_2px_12px_-4px_rgba(0,0,0,0.02)]"
          } ${rightAdornment ? "pr-12" : ""} ${className}`}
          {...props}
        />
        {rightAdornment && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
            {rightAdornment}
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs font-medium text-red-500 ml-1">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-xs text-slate-400 ml-1">{helperText}</p>
      )}
    </div>
  );
};

export default Input;
