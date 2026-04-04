import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backTo?: string;
  backLabel?: string;
  action?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, backTo, backLabel = "Back", action }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div>
        {backTo && (
          <Link
            to={backTo}
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors mb-5 uppercase tracking-[0.1em]"
          >
            <ChevronLeft className="w-4 h-4" />
            {backLabel}
          </Link>
        )}
        <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight leading-[1.05]">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-2">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
