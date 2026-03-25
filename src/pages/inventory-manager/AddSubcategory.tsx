import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
  Transition,
} from "@headlessui/react";
import { supabase } from "../../lib/supabase";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { ChevronLeft, ChevronDown, Check, Plus, Loader2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  code: string;
}

export default function AddSubcategory() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Get category from URL params if passed
  const categoryFromUrl = searchParams.get("category");

  // Fetch categories
  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Category[];
    },
  });

  // Set category from URL if available
  useEffect(() => {
    if (categoryFromUrl && categories.length > 0) {
      const found = categories.find(
        (c) => c.name.toLowerCase() === categoryFromUrl.toLowerCase(),
      );
      if (found) {
        setCategoryId(found.id);
      }
    }
  }, [categoryFromUrl, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !code.trim() || !categoryId) {
      setError("Name, code, and category are required");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: insertError } = await supabase
        .from("subcategories")
        .insert({
          name: name.trim(),
          code: code.trim().toUpperCase(),
          category_id: categoryId,
        });

      if (insertError) throw insertError;

      // Invalidate queries to refresh the lists
      queryClient.invalidateQueries({ queryKey: ["subcategories"] });

      // Get category name for navigation
      const selectedCategory = categories.find((c) => c.id === categoryId);

      // Navigate back to add page with the category and subcategory selected
      navigate(
        `/inventory-manager/add-equipment?category=${encodeURIComponent(selectedCategory?.name || "")}&subcategory=${encodeURIComponent(name.trim())}`,
      );
    } catch (err) {
      console.error("Error creating subcategory:", err);
      setError("Failed to create subcategory. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-3xl mx-auto px-6 py-10 animate-in fade-in duration-500">
        {/* Breadcrumb and Title */}
        <Link
          to="/inventory-manager/add-equipment"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[#1769ff] transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Add Equipment
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Add New Subcategory
          </h1>
          <p className="text-gray-500 mt-1">
            Create a new subcategory for your inventory
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Selection */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Select Category <span className="text-red-500">*</span>
            </h2>

            {loadingCategories ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading categories...
              </div>
            ) : (
              <Listbox value={categoryId || ""} onChange={setCategoryId}>
                <div className="relative">
                  <ListboxButton className="relative w-full cursor-default rounded-lg bg-white py-3 pl-4 pr-10 text-left border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#1769ff]/20 focus:border-[#1769ff]">
                    <span
                      className={categoryId ? "text-gray-900" : "text-gray-400"}
                    >
                      {categoryId
                        ? `${categories.find((c) => c.id === categoryId)?.name} (${categories.find((c) => c.id === categoryId)?.code})`
                        : "Select category..."}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    </span>
                  </ListboxButton>

                  <Transition
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none">
                      {categories.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-500">
                          No categories found
                        </div>
                      ) : (
                        categories.map((cat) => (
                          <ListboxOption
                            key={cat.id}
                            value={cat.id}
                            className={({ active }) =>
                              `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                active
                                  ? "bg-[#1769ff]/10 text-[#1769ff]"
                                  : "text-gray-900"
                              }`
                            }
                          >
                            {({ selected }) => (
                              <>
                                <span
                                  className={`block truncate ${selected ? "font-medium" : "font-normal"}`}
                                >
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
                        ))
                      )}
                    </ListboxOptions>
                  </Transition>
                </div>
              </Listbox>
            )}
          </div>

          {/* Add New Subcategory Form */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Subcategory Details
            </h2>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Subcategory Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Camera"
                required
              />

              <Input
                label="Subcategory Code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g., CAM"
                required
                maxLength={10}
              />
            </div>

            <p className="text-xs text-gray-500 mt-2">
              Code will be converted to uppercase automatically
            </p>

            <div className="mt-6 flex items-center justify-end gap-4">
              <Link to="/inventory-manager/add-equipment">
                <Button variant="secondary" type="button">
                  Cancel
                </Button>
              </Link>
              <Button
                variant="primary"
                type="submit"
                isLoading={isSubmitting}
                disabled={!name.trim() || !code.trim() || !categoryId}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Subcategory
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
