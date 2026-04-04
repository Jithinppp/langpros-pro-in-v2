interface SectionTitleProps {
  title: string;
}

function SectionTitle({ title }: SectionTitleProps) {
  return <h3 className="text-lg font-medium text-slate-900 mb-4">{title}</h3>;
}

export default SectionTitle;
