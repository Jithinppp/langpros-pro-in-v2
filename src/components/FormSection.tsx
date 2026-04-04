interface FormSectionProps {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export default function FormSection({ title, action, children, className = "" }: FormSectionProps) {
  return (
    <div className={`bg-white border border-slate-200/60 rounded-[2rem] p-8 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.04)] ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-slate-900 tracking-tight">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}
