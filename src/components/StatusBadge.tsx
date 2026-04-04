import { getStatusColor, getConditionColor } from "../utils/theme";

interface StatusBadgeProps {
  status: string;
  variant?: "status" | "condition";
}

export default function StatusBadge({ status, variant = "status" }: StatusBadgeProps) {
  const colorFn = variant === "condition" ? getConditionColor : getStatusColor;
  const color = colorFn(status);

  if (variant === "status") {
    return (
      <span className={`inline-flex items-center px-3 py-1.5 text-[10px] font-semibold rounded-full uppercase tracking-[0.08em] ${color}`}>
        {status || "Unknown"}
      </span>
    );
  }

  return (
    <span className={`text-xs font-medium capitalize ${color}`}>
      {status ? status.replace("_", " ") : "Unknown"}
    </span>
  );
}
