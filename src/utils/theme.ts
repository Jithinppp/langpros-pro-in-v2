export const getStatusColor = (status?: string | null) => {
  switch (status?.toLowerCase()) {
    case "available":
      return "bg-[#00d26a]/10 text-[#00d26a]";
    case "rented":
    case "deployed":
      return "bg-[#1769ff]/10 text-[#1769ff]";
    case "maintenance":
      return "bg-[#ffbd2e]/10 text-[#ffbd2e]";
    case "retired":
      return "bg-gray-100 text-gray-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

export const getConditionColor = (condition?: string | null) => {
  switch (condition?.toLowerCase()) {
    case "new":
      return "text-[#1769ff]";
    case "good":
      return "text-[#00d26a]";
    case "damaged":
      return "text-red-500";
    case "under_repair":
      return "text-[#ffbd2e]";
    default:
      return "text-gray-600";
  }
};
