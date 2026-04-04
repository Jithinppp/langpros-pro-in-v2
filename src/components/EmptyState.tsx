import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  message: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({ icon: Icon, message, description, action, className = "" }: EmptyStateProps) {
  return (
    <div className={`p-10 text-center ${className}`}>
      <div className="w-14 h-14 rounded-[1.5rem] bg-slate-100 flex items-center justify-center mx-auto mb-5">
        <Icon className="w-7 h-7 text-slate-300" />
      </div>
      <p className="text-sm font-medium text-slate-600">{message}</p>
      {description && <p className="text-xs text-slate-400 mt-2">{description}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
