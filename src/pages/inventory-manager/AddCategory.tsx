import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { ChevronLeft, Plus } from "lucide-react";

export default function AddCategory() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !code.trim()) {
      setError("Name and code are required");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: insertError } = await supabase.from("categories").insert({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim() || null,
      });

      if (insertError) throw insertError;

      // Invalidate categories query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["categories"] });

      // Navigate back to add page with the new category selected
      navigate(
        `/inventory-manager/add-equipment?category=${encodeURIComponent(name.trim())}`,
      );
    } catch (err) {
      console.error("Error creating category:", err);
      setError("Failed to create category. Please try again.");
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
            Add New Category
          </h1>
          <p className="text-gray-500 mt-1">
            Create a new category for your inventory
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Add New Category Form */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Category Details
            </h2>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Category Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Video"
                required
              />

              <Input
                label="Category Code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g., VID"
                required
                maxLength={10}
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Add a description..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1769ff]/20 focus:border-[#1769ff] resize-none"
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
                disabled={!name.trim() || !code.trim()}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
