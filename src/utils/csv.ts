export interface ExportAsset {
  sku: string;
  serial_number: string | null;
  category: string;
  category_code: string;
  subcategory: string;
  subcategory_code: string;
  model: string;
  model_code: string;
  brand: string;
  location: string | null;
  status: string;
  condition: string;
  purchase_date: string | null;
  warranty_expiry: string | null;
  description: string | null;
}

export function convertToCSV(data: ExportAsset[]): string {
  if (data.length === 0) return "";

  const headers = [
    "SKU",
    "Serial Number",
    "Category",
    "Category Code",
    "Subcategory",
    "Subcategory Code",
    "Model",
    "Model Code",
    "Brand",
    "Location",
    "Status",
    "Condition",
    "Purchase Date",
    "Warranty Expiry",
    "Description",
  ];

  const rows = data.map((item) => [
    item.sku,
    item.serial_number || "",
    item.category,
    item.category_code,
    item.subcategory,
    item.subcategory_code,
    item.model,
    item.model_code,
    item.brand,
    item.location || "",
    item.status,
    item.condition,
    item.purchase_date || "",
    item.warranty_expiry || "",
    item.description || "",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => {
        const escaped = String(cell).replace(/"/g, '""');
        return escaped.includes(",") || escaped.includes('"') || escaped.includes("\n")
          ? `"${escaped}"`
          : escaped;
      }).join(",")
    ),
  ].join("\n");

  return csvContent;
}

export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
