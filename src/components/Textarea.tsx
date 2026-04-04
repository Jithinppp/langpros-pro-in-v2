import type { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Textarea = ({
  label,
  error,
  helperText,
  className = "",
  id,
  ...props
}: TextareaProps) => {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`w-full px-5 py-4 rounded-lg text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-0 resize-none ${
          error
            ? "border-2 border-red-300 focus:border-red-400 focus:ring-red-500/10 bg-red-50/30"
            : "border border-slate-200/60 focus:border-slate-400 focus:ring-slate-900/5 bg-white shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)]"
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="text-xs font-medium text-red-500 ml-1">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-xs text-slate-400 ml-1">{helperText}</p>
      )}
    </div>
  );
};

export default Textarea;
