import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
  Transition,
} from "@headlessui/react";
import { supabase } from "../../lib/supabase";
import Button from "../../components/Button";
import Loading from "../../components/Loading";
import {
  ChevronLeft,
  ChevronDown,
  Check,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  X,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  code: string;
}

interface Subcategory {
  id: string;
  name: string;
  code: string;
  category_id: string;
}

interface Model {
  id: string;
  name: string;
  code: string;
  subcategory_id: string;
}

interface StorageLocation {
  id: string;
  name: string;
}

interface ParsedRow {
  serial_number: string;
  location_name: string;
  condition: string;
  description: string;
  purchase_date: string;
  warranty_expiry: string;
  rowNumber: number;
  locationId?: string;
  errors: string[];
  isValid: boolean;
}

const conditionOptions = ["excellent", "good", "fair", "poor"];

export default function ImportEquipment() {
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [modelId, setModelId] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);
  const [importing, setImporting] = useState(false);
  const [fileError, setFileError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [csvPage, setCsvPage] = useState(1);
  const CSV_PAGE_SIZE = 50;

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, code")
        .order("name");
      if (error) throw error;
      return data as Category[];
    },
    staleTime: 30000,
  });

  const { data: subcategories = [], isLoading: loadingSubcategories } = useQuery({
    queryKey: ["subcategories", categoryId],
    queryFn: async () => {
      if (!categoryId) return [];
      const { data, error } = await supabase
        .from("subcategories")
        .select("id, name, code, category_id")
        .eq("category_id", categoryId)
        .order("name");
      if (error) throw error;
      return data as Subcategory[];
    },
    enabled: !!categoryId,
    staleTime: 30000,
  });

  const { data: models = [], isLoading: loadingModels } = useQuery({
    queryKey: ["models", subcategoryId],
    queryFn: async () => {
      if (!subcategoryId) return [];
      const { data, error } = await supabase
        .from("models")
        .select("id, name, code, subcategory_id")
        .eq("subcategory_id", subcategoryId)
        .order("name");
      if (error) throw error;
      return data as Model[];
    },
    enabled: !!subcategoryId,
    staleTime: 30000,
  });

  const { data: storageLocations = [] } = useQuery({
    queryKey: ["storage_locations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("storage_locations")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data as StorageLocation[];
    },
    staleTime: 30000,
  });

  const selectedModel = useMemo(() => models.find((m) => m.id === modelId), [models, modelId]);
  const selectedCategory = useMemo(() => categories.find((c) => c.id === categoryId), [categories, categoryId]);
  const selectedSubcategory = useMemo(() => subcategories.find((s) => s.id === subcategoryId), [subcategories, subcategoryId]);

  const handleCategoryChange = (id: string) => {
    setCategoryId(id);
    setSubcategoryId("");
    setModelId("");
  };

  const handleSubcategoryChange = (id: string) => {
    setSubcategoryId(id);
    setModelId("");
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter((line) => line.trim());
      
      if (lines.length < 2) {
        alert("CSV file is empty or has no data rows");
        return;
      }

      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const requiredHeaders = ["serial_number", "location_name", "condition"];
      const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        alert(`Missing required headers: ${missingHeaders.join(", ")}`);
        return;
      }

      const data: ParsedRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || "";
        });

        const rowErrors: string[] = [];
        const locationName = row.location_name;
        const location = storageLocations.find((loc) => loc.name === locationName);
        
        if (!locationName) {
          rowErrors.push("Location is required");
        } else if (!location) {
          rowErrors.push(`Location "${locationName}" not found`);
        }

        if (!row.condition || !conditionOptions.includes(row.condition.toLowerCase())) {
          rowErrors.push("Condition must be: excellent, good, fair, or poor");
        }

        data.push({
          serial_number: row.serial_number || "",
          location_name: row.location_name || "",
          condition: row.condition?.toLowerCase() || "",
          description: row.description || "",
          purchase_date: row.purchase_date || "",
          warranty_expiry: row.warranty_expiry || "",
          rowNumber: i,
          locationId: location?.id,
          errors: rowErrors,
          isValid: rowErrors.length === 0,
        });
      }

      setParsedData(data);
    };
    reader.readAsText(file);
  };

  const handleFileChange = (file: File | null) => {
    setFileError("");
    setCsvPage(1);
    if (file) {
      if (!file.name.toLowerCase().endsWith(".csv")) {
        setFileError("Only CSV files are accepted. Please upload a CSV file.");
        return;
      }
      setCsvFile(file);
      parseCSV(file);
      setImportResult(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileChange(files[0]);
    }
  };

  const downloadTemplate = () => {
    const headers = "serial_number,location_name,condition,description,purchase_date,warranty_expiry";
    const exampleRow = ",Warehouse-A,excellent,Optional description,2024-01-01,2025-01-01";
    const csv = `${headers}\n${exampleRow}`;
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "equipment_import_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!modelId || !selectedModel) {
        throw new Error("Model is required");
      }

      const validRows = parsedData.filter((row) => row.isValid);
      if (validRows.length === 0) {
        throw new Error("No valid rows to import");
      }

      const prefix = `${selectedCategory?.code}-${selectedSubcategory?.code}-${selectedModel.code}-`;
      
      const { data: existingAssets } = await supabase
        .from("assets")
        .select("sku")
        .like("sku", `${prefix}%`)
        .order("sku", { ascending: false })
        .limit(1);

      let startSequence = 1;
      if (existingAssets && existingAssets.length > 0) {
        const lastSku = existingAssets[0].sku;
        const match = lastSku?.match(/-(\d+)$/);
        if (match) {
          startSequence = parseInt(match[1], 10) + 1;
        }
      }

      const batchSize = 100;
      let successCount = 0;
      let failedCount = 0;

      for (let i = 0; i < validRows.length; i += batchSize) {
        const batch = validRows.slice(i, i + batchSize);
        const assets = batch.map((row, index) => ({
          model_id: modelId,
          sku: `${prefix}${(startSequence + i + index).toString().padStart(4, "0")}`,
          serial_number: row.serial_number || null,
          location: row.locationId || null,
          condition: row.condition,
          status: "available",
          description: row.description || null,
          purchase_date: row.purchase_date ? row.purchase_date : null,
          warranty_expiry: row.warranty_expiry ? row.warranty_expiry : null,
          is_active: true,
        }));

        const { error } = await supabase.from("assets").insert(assets);
        
        if (error) {
          console.error("Insert error:", error);
          failedCount += batch.length;
        } else {
          successCount += batch.length;
        }

        setImportProgress(Math.min(((i + batchSize) / validRows.length) * 100, 100));
      }

      return { success: successCount, failed: failedCount };
    },
    onSuccess: (result) => {
      setImportResult(result);
      setImporting(false);
    },
    onError: (error) => {
      alert(error instanceof Error ? error.message : "Import failed");
      setImporting(false);
    },
  });

  const validRowsCount = parsedData.filter((r) => r.isValid).length;
  const invalidRowsCount = parsedData.filter((r) => !r.isValid).length;
  const canImport = modelId && validRowsCount > 0 && !importing;
  
  const csvTotalPages = Math.ceil(parsedData.length / CSV_PAGE_SIZE);
  const csvStartIndex = (csvPage - 1) * CSV_PAGE_SIZE;
  const csvPaginatedData = parsedData.slice(csvStartIndex, csvStartIndex + CSV_PAGE_SIZE);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <Link
          to="/inventory-manager"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[#1769ff] transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Inventory
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Import Equipment
          </h1>
          <p className="text-gray-500 mt-1">
            Upload a CSV file to import multiple equipment items at once
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Select Model
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <Listbox value={categoryId} onChange={handleCategoryChange}>
                <div className="relative">
                  <ListboxButton className="relative w-full cursor-default rounded-md bg-white py-2 pl-4 pr-10 text-left border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#1769ff]/20 focus:border-[#1769ff]">
                    <span className={categoryId ? "text-gray-900" : "text-gray-400"}>
                      {loadingCategories ? "Loading..." : categoryId
                        ? `${categories.find((c) => c.id === categoryId)?.name} (${categories.find((c) => c.id === categoryId)?.code})`
                        : "Select Category"}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      {loadingCategories ? (
                        <Loading className="h-4 w-4 text-gray-400 animate-spin" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </span>
                  </ListboxButton>
                  <Transition leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none">
                      {categories.map((cat) => (
                        <ListboxOption key={cat.id} value={cat.id} className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? "bg-[#1769ff]/10 text-[#1769ff]" : "text-gray-900"}`
                        }>
                          {({ selected }) => (
                            <>
                              <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>
                                {cat.name} ({cat.code})
                              </span>
                              {selected && (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#1769ff]">
                                  <Check className="h-5 w-5" />
                                </span>
                              )}
                            </>
                          )}
                        </ListboxOption>
                      ))}
                    </ListboxOptions>
                  </Transition>
                </div>
              </Listbox>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subcategory
              </label>
              <Listbox value={subcategoryId} onChange={handleSubcategoryChange} disabled={!categoryId}>
                <div className="relative">
                  <ListboxButton className="relative w-full cursor-default rounded-md bg-white py-2 pl-4 pr-10 text-left border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#1769ff]/20 focus:border-[#1769ff] disabled:bg-gray-100 disabled:cursor-not-allowed">
                    <span className={subcategoryId ? "text-gray-900" : "text-gray-400"}>
                      {loadingSubcategories ? "Loading..." : subcategoryId
                        ? `${subcategories.find((s) => s.id === subcategoryId)?.name} (${subcategories.find((s) => s.id === subcategoryId)?.code})`
                        : "Select Subcategory"}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      {loadingSubcategories ? (
                        <Loading className="h-4 w-4 text-gray-400 animate-spin" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </span>
                  </ListboxButton>
                  <Transition leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none">
                      {subcategories.map((sub) => (
                        <ListboxOption key={sub.id} value={sub.id} className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? "bg-[#1769ff]/10 text-[#1769ff]" : "text-gray-900"}`
                        }>
                          {({ selected }) => (
                            <>
                              <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>
                                {sub.name} ({sub.code})
                              </span>
                              {selected && (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#1769ff]">
                                  <Check className="h-5 w-5" />
                                </span>
                              )}
                            </>
                          )}
                        </ListboxOption>
                      ))}
                    </ListboxOptions>
                  </Transition>
                </div>
              </Listbox>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model
              </label>
              <Listbox value={modelId} onChange={setModelId} disabled={!subcategoryId}>
                <div className="relative">
                  <ListboxButton className="relative w-full cursor-default rounded-md bg-white py-2 pl-4 pr-10 text-left border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#1769ff]/20 focus:border-[#1769ff] disabled:bg-gray-100 disabled:cursor-not-allowed">
                    <span className={modelId ? "text-gray-900" : "text-gray-400"}>
                      {loadingModels ? "Loading..." : modelId
                        ? `${models.find((m) => m.id === modelId)?.name} (${models.find((m) => m.id === modelId)?.code})`
                        : "Select Model"}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      {loadingModels ? (
                        <Loading className="h-4 w-4 text-gray-400 animate-spin" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </span>
                  </ListboxButton>
                  <Transition leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none">
                      {models.map((m) => (
                        <ListboxOption key={m.id} value={m.id} className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? "bg-[#1769ff]/10 text-[#1769ff]" : "text-gray-900"}`
                        }>
                          {({ selected }) => (
                            <>
                              <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>
                                {m.name} ({m.code})
                              </span>
                              {selected && (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#1769ff]">
                                  <Check className="h-5 w-5" />
                                </span>
                              )}
                            </>
                          )}
                        </ListboxOption>
                      ))}
                    </ListboxOptions>
                  </Transition>
                </div>
              </Listbox>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <input
                type="text"
                value="Available"
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Upload CSV File
            </h2>
            <Button variant="secondary" size="sm" onClick={downloadTemplate} className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Download Template
            </Button>
          </div>

          {!csvFile ? (
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging ? "border-[#1769ff] bg-blue-50" : "border-gray-300 hover:border-[#1769ff]"}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                Drag and drop your CSV file here, or click to browse
              </p>
              <p className="text-sm text-gray-400">
                Maximum 5000 rows per import
              </p>
              {fileError && (
                <p className="text-sm text-red-600 mt-2">{fileError}</p>
              )}
              <label className="inline-flex items-center justify-center px-4 py-2 bg-[#1769ff] text-white font-medium rounded-md hover:bg-[#1255d4] transition-colors mt-4 cursor-pointer">
                Select File
                <input type="file" accept=".csv" onChange={(e) => handleFileChange(e.target.files?.[0] || null)} className="hidden" />
              </label>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg mb-4">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-8 h-8 text-[#1769ff]" />
                  <div>
                    <p className="font-medium text-gray-900">{csvFile?.name}</p>
                    <p className="text-sm text-gray-500">{parsedData.length} rows</p>
                  </div>
                </div>
                <button onClick={() => { setCsvFile(null); setParsedData([]); setFileError(""); setCsvPage(1); }} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {parsedData.length > 0 && (
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">{validRowsCount} valid</span>
                  </div>
                  {invalidRowsCount > 0 && (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-medium">{invalidRowsCount} invalid</span>
                    </div>
                  )}
                </div>
              )}

              {parsedData.length > 0 && (
                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500">
                      <tr>
                        <th className="px-4 py-2">#</th>
                        <th className="px-4 py-2">Serial Number</th>
                        <th className="px-4 py-2">Location</th>
                        <th className="px-4 py-2">Condition</th>
                        <th className="px-4 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {csvPaginatedData.map((row) => (
                        <tr key={row.rowNumber} className={row.isValid ? "" : "bg-red-50"}>
                          <td className="px-4 py-2 text-gray-500">{row.rowNumber}</td>
                          <td className="px-4 py-2">{row.serial_number || "-"}</td>
                          <td className="px-4 py-2">{row.location_name}</td>
                          <td className="px-4 py-2 capitalize">{row.condition}</td>
                          <td className="px-4 py-2">available</td>
                          <td className="px-4 py-2">
                            {row.errors.length > 0 ? (
                              <span className="text-red-600 text-xs">{row.errors.join(", ")}</span>
                            ) : (
                              <span className="text-green-600 text-xs">Valid</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {csvTotalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <div className="text-sm text-gray-500">
                        Showing {csvStartIndex + 1} to {Math.min(csvStartIndex + CSV_PAGE_SIZE, parsedData.length)} of {parsedData.length} rows
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => setCsvPage(p => Math.max(1, p - 1))}
                          disabled={csvPage === 1}
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-gray-600">
                          Page {csvPage} of {csvTotalPages}
                        </span>
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => setCsvPage(p => Math.min(csvTotalPages, p + 1))}
                          disabled={csvPage === csvTotalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {importResult ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">
                      Import completed: {importResult?.success} succeeded, {importResult?.failed} failed
                    </span>
                  </div>
                  <Button variant="secondary" className="mt-4" onClick={() => { setCsvFile(null); setParsedData([]); setImportResult(null); setImportProgress(0); }}>
                    Import More
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <Button variant="primary" onClick={() => { setImporting(true); importMutation.mutate(); }} disabled={!canImport} className="flex items-center gap-2">
                    {importing ? (<><Loading className="w-4 h-4" />Importing... {Math.round(importProgress)}%</>) : (`Import ${validRowsCount} Items`)}
                  </Button>
                  <Link to="/inventory-manager/add-equipment">
                    <Button variant="secondary">Cancel</Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* How to Use Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            How to Use
          </h2>
          <div className="space-y-4 text-sm text-gray-700">
            <p>
              Follow these steps to import equipment from a CSV file:
            </p>
            <ol className="list-decimal list-inside space-y-2">
              <li>Select the <strong>Category</strong>, <strong>Subcategory</strong>, and <strong>Model</strong> from the dropdowns above.</li>
              <li>Click <strong>"Download Template"</strong> to get a sample CSV file with the correct format.</li>
              <li>Open the template in Excel or any text editor and fill in your equipment data.</li>
              <li>Save the file as CSV format and upload it using the file selector above.</li>
              <li>Review the preview to ensure all rows are valid, then click <strong>"Import"</strong> to add the equipment.</li>
            </ol>

            <h3 className="font-semibold text-gray-900 mt-4 mb-2">CSV Column Reference</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="py-2 pr-4 font-medium">Column</th>
                    <th className="py-2 pr-4 font-medium">Required</th>
                    <th className="py-2 pr-4 font-medium">Type</th>
                    <th className="py-2 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="py-2 pr-4">serial_number</td>
                    <td className="py-2 pr-4 text-gray-500">No</td>
                    <td className="py-2 pr-4 text-gray-500">String</td>
                    <td className="py-2">Unique serial number for the equipment (optional)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">location_name</td>
                    <td className="py-2 pr-4 text-red-600">Yes</td>
                    <td className="py-2 pr-4 text-gray-500">String</td>
                    <td className="py-2">Must match an existing storage location name exactly. Available: {storageLocations.map((l, i) => <><code key={l.id} className="bg-gray-100 px-1 rounded">{l.name}</code>{i < storageLocations.length - 1 && ", "}</>)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">condition</td>
                    <td className="py-2 pr-4 text-red-600">Yes</td>
                    <td className="py-2 pr-4 text-gray-500">String</td>
                    <td className="py-2">Valid values: <code className="bg-gray-100 px-1 rounded">excellent</code>, <code className="bg-gray-100 px-1 rounded">good</code>, <code className="bg-gray-100 px-1 rounded">fair</code>, <code className="bg-gray-100 px-1 rounded">poor</code></td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">description</td>
                    <td className="py-2 pr-4 text-gray-500">No</td>
                    <td className="py-2 pr-4 text-gray-500">String</td>
                    <td className="py-2">Optional description for the equipment</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">purchase_date</td>
                    <td className="py-2 pr-4 text-gray-500">No</td>
                    <td className="py-2 pr-4 text-gray-500">Date</td>
                    <td className="py-2">Format: <code className="bg-gray-100 px-1 rounded">YYYY-MM-DD</code> (e.g., 2024-01-01)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">warranty_expiry</td>
                    <td className="py-2 pr-4 text-gray-500">No</td>
                    <td className="py-2 pr-4 text-gray-500">Date</td>
                    <td className="py-2">Format: <code className="bg-gray-100 px-1 rounded">YYYY-MM-DD</code> (e.g., 2025-01-01)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
              <strong>Note:</strong> The Status for all imported items will be set to "Available" by default. SKU will be auto-generated based on the model code.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}