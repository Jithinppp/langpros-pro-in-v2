import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import Button from "../../components/Button";
import Loading from "../../components/Loading";
import AlertBanner from "../../components/AlertBanner";
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
  Transition,
} from "@headlessui/react";

import {
  ChevronDown,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  Check,
  X,
} from "lucide-react";
import { parseCSV } from "../../utils/csv";

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

interface SelectOption {
  value: string;
  label: string;
}
interface ParsedRow {
  serial_number: string;
  location_name: string;
  condition: string;
  description: string;
  purchase_date: string;
  warranty_expiry: string;
  supplier_name: string;
  case_number: string;
  weight: string;
  invoice_number: string;
  remarks: string;
  rowNumber: number;
  locationId?: string;
  errors: string[];
  isValid: boolean;
}

const conditionOptions = ["excellent", "good", "fair", "poor"];
const MAX_IMPORT_ROWS = 5000;

export default function ImportEquipment() {
  const queryClient = useQueryClient();
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [modelId, setModelId] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
  } | null>(null);
  const [importing, setImporting] = useState(false);
  const [fileError, setFileError] = useState("");
  const [importError, setImportError] = useState("");
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

  const { data: subcategories = [] } = useQuery({
    queryKey: ["subcategories", categoryId],
    queryFn: async () => {
      if (!categoryId) return [];
      const { data, error } = await supabase
        .from("subcategories")
        .select("id, name, code, category_id")
        .eq("category_id", categoryId)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as Subcategory[];
    },
    enabled: !!categoryId,
    staleTime: 30000,
  });

  const { data: models = [] } = useQuery({
    queryKey: ["models", subcategoryId],
    queryFn: async () => {
      if (!subcategoryId) return [];
      const { data, error } = await supabase
        .from("models")
        .select("id, name, code, subcategory_id")
        .eq("subcategory_id", subcategoryId)
        .eq("is_active", true)
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

  const selectedModel = useMemo(
    () => models.find((m) => m.id === modelId),
    [models, modelId],
  );
  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === categoryId),
    [categories, categoryId],
  );
  const selectedSubcategory = useMemo(
    () => subcategories.find((s) => s.id === subcategoryId),
    [subcategories, subcategoryId],
  );

  const categoryOptions: SelectOption[] = useMemo(
    () =>
      categories.map((c) => ({ value: c.id, label: `${c.name} (${c.code})` })),
    [categories],
  );
  const subcategoryOptions: SelectOption[] = useMemo(
    () =>
      subcategories.map((s) => ({
        value: s.id,
        label: `${s.name} (${s.code})`,
      })),
    [subcategories],
  );
  const modelOptions: SelectOption[] = useMemo(
    () => models.map((m) => ({ value: m.id, label: `${m.name} (${m.code})` })),
    [models],
  );

  const handleCategoryChange = (id: string) => {
    setCategoryId(id);
    setSubcategoryId("");
    setModelId("");
    setImportError("");
  };

  const handleSubcategoryChange = (id: string) => {
    setSubcategoryId(id);
    setModelId("");
    setImportError("");
  };

  const handleModelChange = (id: string) => {
    setModelId(id);
    setImportError("");
  };

  const parseCSVData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCSV(text);

      if (rows.length === 0) {
        setFileError("CSV file is empty or has no data rows");
        return;
      }

      if (rows.length > MAX_IMPORT_ROWS) {
        setFileError(`Too many rows. Maximum allowed is ${MAX_IMPORT_ROWS}`);
        return;
      }

      const requiredHeaders = ["serial_number", "location_name", "condition"];
      const headers = Object.keys(rows[0]).map((h) => h.toLowerCase());
      const missingHeaders = requiredHeaders.filter(
        (h) => !headers.includes(h),
      );

      if (missingHeaders.length > 0) {
        setFileError(`Missing required headers: ${missingHeaders.join(", ")}`);
        return;
      }

      setFileError("");
      const data: ParsedRow[] = [];
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowErrors: string[] = [];
        const locationName = row.location_name;
        const location = storageLocations.find(
          (loc) => loc.name === locationName,
        );

        if (!locationName) {
          rowErrors.push("Location is required");
        } else if (!location) {
          rowErrors.push(`Location "${locationName}" not found`);
        }

        if (
          !row.condition ||
          !conditionOptions.includes(row.condition.toLowerCase())
        ) {
          rowErrors.push("Condition must be: excellent, good, fair, or poor");
        }

        data.push({
          serial_number: row.serial_number || "",
          location_name: row.location_name || "",
          condition: row.condition?.toLowerCase() || "",
          description: row.description || "",
          purchase_date: row.purchase_date || "",
          warranty_expiry: row.warranty_expiry || "",
          supplier_name: row.supplier_name || "",
          case_number: row.case_number || "",
          weight: row.weight || "",
          invoice_number: row.invoice_number || "",
          remarks: row.remarks || "",
          rowNumber: i + 1,
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
      parseCSVData(file);
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
    const headers =
      "serial_number,location_name,condition,description,purchase_date,warranty_expiry,supplier_name,case_number,weight,invoice_number,remarks";
    const exampleRow =
      ",Warehouse-A,excellent,Optional description,2024-01-01,2025-01-01,Supplier Co.,123,50,INV-001,Some remarks";
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
      if (
        !modelId ||
        !selectedModel ||
        !selectedCategory ||
        !selectedSubcategory
      ) {
        throw new Error("Model, category, and subcategory are required");
      }

      const validRows = parsedData.filter((row) => row.isValid);
      if (validRows.length === 0) {
        throw new Error("No valid rows to import");
      }

      const prefix = `${selectedCategory.code}-${selectedSubcategory.code}-${selectedModel.code}-`;

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
          supplier_name: row.supplier_name || null,
          case_number: row.case_number ? parseInt(row.case_number, 10) : null,
          weight: row.weight ? parseInt(row.weight, 10) : null,
          invoice_number: row.invoice_number || null,
          remarks: row.remarks || null,
          is_active: true,
        }));

        const { error } = await supabase.from("assets").insert(assets);

        if (error) {
          console.error("Insert error:", error);
          failedCount += batch.length;
        } else {
          successCount += batch.length;
        }

        setImportProgress(
          Math.min(((i + batchSize) / validRows.length) * 100, 100),
        );
      }

      return { success: successCount, failed: failedCount };
    },
    onSuccess: (result) => {
      setImportResult(result);
      setImporting(false);
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["assets_paginated"] });
      queryClient.invalidateQueries({ queryKey: ["assets-stats"] });
    },
    onError: (error) => {
      setImportError(
        error instanceof Error
          ? error.message
          : "Import failed. Check that all required fields are filled correctly.",
      );
      setImporting(false);
    },
  });

  const validRowsCount = parsedData.filter((r) => r.isValid).length;
  const invalidRowsCount = parsedData.filter((r) => !r.isValid).length;
  const canImport = modelId && validRowsCount > 0 && !importing;

  const csvTotalPages = Math.ceil(parsedData.length / CSV_PAGE_SIZE);
  const csvStartIndex = (csvPage - 1) * CSV_PAGE_SIZE;
  const csvPaginatedData = parsedData.slice(
    csvStartIndex,
    csvStartIndex + CSV_PAGE_SIZE,
  );

  const resetImport = () => {
    setCsvFile(null);
    setParsedData([]);
    setImportResult(null);
    setImportProgress(0);
    setFileError("");
    setImportError("");
    setCsvPage(1);
  };

  if (loadingCategories) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loading className="w-10 h-10 mb-4" />
        <p className="text-gray-500 font-medium">Loading form...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans p-4 py-12">
      <div className="w-full mx-auto rounded-2xl overflow-hidden ">
        <div className="p-6 md:p-10">
          {importResult && importResult.failed === 0 && (
            <AlertBanner
              variant="success"
              message={`Import completed: ${importResult.success} succeeded`}
              className="mb-8"
            />
          )}
          {importResult && importResult.failed > 0 && (
            <AlertBanner
              variant="error"
              message={`Import completed: ${importResult.success} succeeded, ${importResult.failed} failed`}
              className="mb-8"
            />
          )}
          {importError && (
            <AlertBanner
              variant="error"
              message={importError}
              className="mb-8"
            />
          )}

          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Import Equipment
          </h2>
          <p
            className="text-slate-500 mt-2 mb-4 text-sm
"
          >
            Upload a CSV file to import multiple equipment items at once.
          </p>

          {/* Select Model Section */}
          <h3 className="text-lg font-semibold text-slate-900 mb-6">
            Select Model
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-0">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <Listbox value={categoryId} onChange={handleCategoryChange}>
                <div className="relative">
                  <ListboxButton className="relative w-full rounded-lg bg-white py-2.5 pl-4 pr-10 text-left border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-400 disabled:bg-gray-50 transition-colors text-sm">
                    <span
                      className={categoryId ? "text-gray-900" : "text-gray-400"}
                    >
                      {categoryId
                        ? categoryOptions.find((o) => o.value === categoryId)
                            ?.label
                        : "Select Category"}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </span>
                  </ListboxButton>
                  <Transition
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 border border-gray-200 focus:outline-none text-sm">
                      {categoryOptions.map((opt) => (
                        <ListboxOption
                          key={opt.value}
                          value={opt.value}
                          className={({ active }) =>
                            `relative cursor-default select-none py-2.5 pl-10 pr-4 ${active ? "bg-gray-50 text-gray-900" : "text-gray-700"}`
                          }
                        >
                          {({ selected }) => (
                            <>
                              <span
                                className={`block truncate ${selected ? "font-medium text-gray-900" : "font-normal"}`}
                              >
                                {opt.label}
                              </span>
                              {selected && (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-900">
                                  <Check className="h-4 w-4" />
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

            {/* Subcategory */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subcategory
              </label>
              <Listbox
                value={subcategoryId}
                onChange={handleSubcategoryChange}
                disabled={!categoryId}
              >
                <div className="relative">
                  <ListboxButton className="relative w-full rounded-lg bg-white py-2.5 pl-4 pr-10 text-left border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-400 disabled:bg-gray-50 transition-colors text-sm">
                    <span
                      className={
                        subcategoryId ? "text-gray-900" : "text-gray-400"
                      }
                    >
                      {subcategoryId
                        ? subcategoryOptions.find(
                            (o) => o.value === subcategoryId,
                          )?.label
                        : "Select Subcategory"}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </span>
                  </ListboxButton>
                  <Transition
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 border border-gray-200 focus:outline-none text-sm">
                      {subcategoryOptions.map((opt) => (
                        <ListboxOption
                          key={opt.value}
                          value={opt.value}
                          className={({ active }) =>
                            `relative cursor-default select-none py-2.5 pl-10 pr-4 ${active ? "bg-gray-50 text-gray-900" : "text-gray-700"}`
                          }
                        >
                          {({ selected }) => (
                            <>
                              <span
                                className={`block truncate ${selected ? "font-medium text-gray-900" : "font-normal"}`}
                              >
                                {opt.label}
                              </span>
                              {selected && (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-900">
                                  <Check className="h-4 w-4" />
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

            {/* Model */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model
              </label>
              <Listbox
                value={modelId}
                onChange={handleModelChange}
                disabled={!subcategoryId}
              >
                <div className="relative">
                  <ListboxButton className="relative w-full rounded-lg bg-white py-2.5 pl-4 pr-10 text-left border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-400 disabled:bg-gray-50 transition-colors text-sm">
                    <span
                      className={modelId ? "text-gray-900" : "text-gray-400"}
                    >
                      {modelId
                        ? modelOptions.find((o) => o.value === modelId)?.label
                        : "Select Model"}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </span>
                  </ListboxButton>
                  <Transition
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 border border-gray-200 focus:outline-none text-sm">
                      {modelOptions.map((opt) => (
                        <ListboxOption
                          key={opt.value}
                          value={opt.value}
                          className={({ active }) =>
                            `relative cursor-default select-none py-2.5 pl-10 pr-4 ${active ? "bg-gray-50 text-gray-900" : "text-gray-700"}`
                          }
                        >
                          {({ selected }) => (
                            <>
                              <span
                                className={`block truncate ${selected ? "font-medium text-gray-900" : "font-normal"}`}
                              >
                                {opt.label}
                              </span>
                              {selected && (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-900">
                                  <Check className="h-4 w-4" />
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

            {/* Status - clean read-only display */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-500">
                Available (default)
              </div>
            </div>
          </div>

          {/* Upload CSV Section */}
          <div className="pt-4 border-t border-gray-100 mt-8">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">
              Upload CSV File
            </h3>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                Download a template, fill it and upload
              </p>
              <Button
                variant="secondary"
                size="md"
                onClick={downloadTemplate}
                className="flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Download Template
              </Button>
            </div>

            {/* File-level error */}
            {fileError && (
              <AlertBanner
                variant="error"
                message={fileError}
                className="mb-4"
              />
            )}

            {!csvFile ? (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center duration-300 transition-colors ${isDragging ? "border-[#0f172b] bg-blue-50" : "border-gray-300 hover:border-[#0f172b]"}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">
                  Drag and drop your CSV file here, or click to browse
                </p>
                <p className="text-sm text-gray-400">
                  Maximum {MAX_IMPORT_ROWS} rows per import
                </p>
                <label className="transition-all duration-300 inline-flex items-center justify-center px-4 py-2 font-medium rounded-xl mt-4 cursor-pointer bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-900/20 shadow-[0_4px_14px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_6px_20px_-4px_rgba(0,0,0,0.2)]">
                  Select File
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) =>
                      handleFileChange(e.target.files?.[0] || null)
                    }
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-8 h-8 text-[#0f172b]" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {csvFile?.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {parsedData.length} rows
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={resetImport}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {parsedData.length > 0 && (
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2 text-green-600">
                      <Check className="w-5 h-5" />
                      <span className="font-medium">
                        {validRowsCount} valid
                      </span>
                    </div>
                    {invalidRowsCount > 0 && (
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="w-5 h-5" />
                        <span className="font-medium">
                          {invalidRowsCount} invalid
                        </span>
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
                          <th className="px-4 py-2">Validation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {csvPaginatedData.map((row) => (
                          <tr
                            key={row.rowNumber}
                            className={row.isValid ? "" : "bg-red-50"}
                          >
                            <td className="px-4 py-2 text-gray-500">
                              {row.rowNumber}
                            </td>
                            <td className="px-4 py-2">
                              {row.serial_number || "-"}
                            </td>
                            <td className="px-4 py-2">{row.location_name}</td>
                            <td className="px-4 py-2 capitalize">
                              {row.condition}
                            </td>
                            <td className="px-4 py-2">available</td>
                            <td className="px-4 py-2">
                              {row.errors.length > 0 ? (
                                <span className="text-red-600 text-xs">
                                  {row.errors.join(", ")}
                                </span>
                              ) : (
                                <span className="text-green-600 text-xs">
                                  Valid
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {csvTotalPages > 1 && (
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                        <div className="text-sm text-gray-500">
                          Showing {csvStartIndex + 1} to{" "}
                          {Math.min(
                            csvStartIndex + CSV_PAGE_SIZE,
                            parsedData.length,
                          )}{" "}
                          of {parsedData.length} rows
                        </div>
                        <div className="flex items-center gap-2">
                          {csvPage > 1 && (
                            <button
                              onClick={() => setCsvPage((p) => p - 1)}
                              className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                              Previous
                            </button>
                          )}
                          {Array.from(
                            { length: csvTotalPages },
                            (_, i) => i + 1,
                          ).map((page) => (
                            <button
                              key={page}
                              onClick={() => setCsvPage(page)}
                              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                                csvPage === page
                                  ? "bg-[#0f172b] text-white border border-[#0f172b]"
                                  : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
                              }`}
                            >
                              {page}
                            </button>
                          ))}
                          {csvPage < csvTotalPages && (
                            <button
                              onClick={() => setCsvPage((p) => p + 1)}
                              className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                              Next
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {importResult ? (
                  <div>
                    {importResult.failed > 0 && (
                      <AlertBanner
                        variant="error"
                        message="Some items failed to import. This could be due to duplicate serial numbers, data validation errors, or database constraints."
                        className="mb-4"
                      />
                    )}
                    <Button variant="secondary" onClick={resetImport}>
                      Import More
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <Button
                      variant="primary"
                      onClick={() => {
                        setImporting(true);
                        setImportError("");
                        importMutation.mutate();
                      }}
                      disabled={!canImport}
                      className="flex items-center gap-2"
                    >
                      {importing ? (
                        <>
                          <Loading className="w-4 h-4" />
                          Importing... {Math.round(importProgress)}%
                        </>
                      ) : (
                        `Import ${validRowsCount} Items`
                      )}
                    </Button>
                    <Link to="/inventory-manager/add-equipment">
                      <Button variant="secondary">Cancel</Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* How to Use Section */}
      <div className="w-full mx-auto rounded-2xl overflow-hidden ">
        <div className="p-6 md:p-10">
          <h3 className="text-lg font-medium text-gray-900 mb-6">How to Use</h3>
          <div className="space-y-4 text-sm text-gray-700">
            <p>Follow these steps to import equipment from a CSV file:</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>
                Select the <strong>Category</strong>,{" "}
                <strong>Subcategory</strong>, and <strong>Model</strong> from
                the dropdowns above.
              </li>
              <li>
                Click <strong>"Download Template"</strong> to get a sample CSV
                file with the correct format.
              </li>
              <li>
                Open the template in Excel or any text editor and fill in your
                equipment data.
              </li>
              <li>
                Save the file as CSV format and upload it using the file
                selector above.
              </li>
              <li>
                Review the preview to ensure all rows are valid, then click{" "}
                <strong>"Import"</strong> to add the equipment.
              </li>
            </ol>

            <h4 className="font-semibold text-gray-900 mt-6 mb-2">
              CSV Column Reference
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-2 pr-4 font-medium">Column</th>
                    <th className="py-2 pr-4 font-medium">Required</th>
                    <th className="py-2 pr-4 font-medium">Type</th>
                    <th className="py-2 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-2 pr-4">
                      <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                        serial_number
                      </code>
                    </td>
                    <td className="py-2 pr-4 text-gray-500">No</td>
                    <td className="py-2 pr-4 text-gray-500">String</td>
                    <td className="py-2 text-gray-500">
                      Unique serial number for the equipment (optional)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">
                      <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                        location_name
                      </code>
                    </td>
                    <td className="py-2 pr-4 text-red-500">Yes</td>
                    <td className="py-2 pr-4 text-gray-500">String</td>
                    <td className="py-2 text-gray-500">
                      Must match an existing storage location name exactly.
                      Available:{" "}
                      {storageLocations.map((l, i) => (
                        <>
                          <code key={l.id} className="bg-gray-100 px-1 rounded">
                            {l.name}
                          </code>
                          {i < storageLocations.length - 1 && ", "}
                        </>
                      ))}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">
                      <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                        condition
                      </code>
                    </td>
                    <td className="py-2 pr-4 text-red-500">Yes</td>
                    <td className="py-2 pr-4 text-gray-500">String</td>
                    <td className="py-2 text-gray-500">
                      Valid values:{" "}
                      <code className="bg-gray-100 px-1 rounded">
                        excellent
                      </code>
                      , <code className="bg-gray-100 px-1 rounded">good</code>,{" "}
                      <code className="bg-gray-100 px-1 rounded">fair</code>,{" "}
                      <code className="bg-gray-100 px-1 rounded">poor</code>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">
                      <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                        description
                      </code>
                    </td>
                    <td className="py-2 pr-4 text-gray-500">No</td>
                    <td className="py-2 pr-4 text-gray-500">String</td>
                    <td className="py-2 text-gray-500">
                      Optional description for the equipment
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">
                      <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                        purchase_date
                      </code>
                    </td>
                    <td className="py-2 pr-4 text-gray-500">No</td>
                    <td className="py-2 pr-4 text-gray-500">Date</td>
                    <td className="py-2 text-gray-500">
                      Format:{" "}
                      <code className="bg-gray-100 px-1 rounded">
                        YYYY-MM-DD
                      </code>{" "}
                      (e.g., 2024-01-01)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">
                      <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                        warranty_expiry
                      </code>
                    </td>
                    <td className="py-2 pr-4 text-gray-500">No</td>
                    <td className="py-2 pr-4 text-gray-500">Date</td>
                    <td className="py-2 text-gray-500">
                      Format:{" "}
                      <code className="bg-gray-100 px-1 rounded">
                        YYYY-MM-DD
                      </code>{" "}
                      (e.g., 2025-01-01)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">
                      <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                        supplier_name
                      </code>
                    </td>
                    <td className="py-2 pr-4 text-gray-500">No</td>
                    <td className="py-2 pr-4 text-gray-500">String</td>
                    <td className="py-2 text-gray-500">
                      Name of the supplier/vendor
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">
                      <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                        case_number
                      </code>
                    </td>
                    <td className="py-2 pr-4 text-gray-500">No</td>
                    <td className="py-2 pr-4 text-gray-500">Integer</td>
                    <td className="py-2 text-gray-500">
                      Case or shipment number for reference
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">
                      <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                        weight
                      </code>
                    </td>
                    <td className="py-2 pr-4 text-gray-500">No</td>
                    <td className="py-2 pr-4 text-gray-500">Integer</td>
                    <td className="py-2 text-gray-500">
                      Weight of the equipment item in kg
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">
                      <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                        invoice_number
                      </code>
                    </td>
                    <td className="py-2 pr-4 text-gray-500">No</td>
                    <td className="py-2 pr-4 text-gray-500">String</td>
                    <td className="py-2 text-gray-500">
                      Invoice reference number
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">
                      <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                        remarks
                      </code>
                    </td>
                    <td className="py-2 pr-4 text-gray-500">No</td>
                    <td className="py-2 pr-4 text-gray-500">String</td>
                    <td className="py-2 text-gray-500">
                      Additional remarks or notes
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
              <strong>Note:</strong> The Status for all imported items will be
              set to "Available" by default. SKU will be auto-generated based on
              the model code.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
