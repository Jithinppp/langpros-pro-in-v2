import { AlertCircle, Check, Info } from "lucide-react";
import type { ReactNode } from "react";

interface AlertBannerProps {
  variant?: "success" | "error" | "info" | "warning";
  message: string;
  onDismiss?: () => void;
  className?: string;
  icon?: ReactNode;
}

const variants = {
  success: {
    wrapper: "bg-emerald-50/80 border border-emerald-200/50 text-emerald-700",
    icon: <Check className="w-5 h-5 flex-shrink-0" />,
  },
  error: {
    wrapper: "bg-red-50/80 border border-red-200/50 text-red-700",
    icon: <AlertCircle className="w-5 h-5 flex-shrink-0" />,
  },
  info: {
    wrapper: "bg-slate-50/80 border border-slate-200/50 text-slate-700",
    icon: <Info className="w-5 h-5 flex-shrink-0" />,
  },
  warning: {
    wrapper: "bg-amber-50/80 border border-amber-200/50 text-amber-700",
    icon: <AlertCircle className="w-5 h-5 flex-shrink-0" />,
  },
};

export default function AlertBanner({
  variant = "info",
  message,
  onDismiss,
  className = "",
  icon,
}: AlertBannerProps) {
  const v = variants[variant];
  const Icon = icon || v.icon;

  return (
    <div
      className={`border ${v.wrapper} px-5 py-4 rounded-lg flex items-center gap-3 ${className}`}
    >
      {Icon}
      <span className="text-sm font-medium flex-1">{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-auto text-xs font-medium opacity-60 hover:opacity-100 transition-opacity"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}
