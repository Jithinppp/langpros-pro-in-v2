import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { ChevronLeft, Plus } from "lucide-react";

export default function AddStorageLocation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: insertError } = await supabase
        .from("storage_locations")
        .insert({ name: name.trim() });

      if (insertError) throw insertError;

      // Invalidate storage_locations query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["storage_locations"] });

      // Navigate back to add page
      navigate("/inventory-manager/add-equipment");
    } catch (err) {
      console.error("Error creating storage location:", err);
      setError("Failed to create storage location. Please try again.");
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
            Add New Storage Location
          </h1>
          <p className="text-gray-500 mt-1">
            Create a new storage location for your inventory
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Add Storage Location Form */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Storage Location Details
            </h2>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Input
              label="Location Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., OF (Office)"
              required
            />

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
                disabled={!name.trim()}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Storage Location
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
