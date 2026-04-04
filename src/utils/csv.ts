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
  supplier_name: string | null;
  case_number: number | null;
  weight: number | null;
  invoice_number: string | null;
  remarks: string | null;
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
    "Supplier Name",
    "Case Number",
    "Weight",
    "Invoice Number",
    "Remarks",
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
    item.supplier_name || "",
    String(item.case_number ?? ""),
    String(item.weight ?? ""),
    item.invoice_number || "",
    item.remarks || "",
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

/**
 * Parse CSV text into an array of row objects.
 * Handles quoted fields that may contain commas.
 */
export function parseCSV(text: string): Record<string, string>[] {
  const lines: string[][] = [];
  let current: string[] = [];
  let inQuotes = false;
  let field = "";

  const pushField = () => {
    current.push(field.trim());
    field = "";
  };
  const pushLine = () => {
    if (current.length > 0) {
      lines.push(current);
      current = [];
    }
  };

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++; // skip escaped quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        pushField();
      } else if (char === "\n" || char === "\r") {
        if (char === "\r" && next === "\n") i++; // CRLF
        pushField();
        pushLine();
      } else {
        field += char;
      }
    }
  }

  pushField();
  pushLine();

  if (lines.length === 0) return [];

  const headers = lines[0].map((h) => h.toLowerCase().trim());
  const result: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].length === 1 && lines[i][0] === "") continue;
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = lines[i][idx] || "";
    });
    result.push(row);
  }
  return result;
}
