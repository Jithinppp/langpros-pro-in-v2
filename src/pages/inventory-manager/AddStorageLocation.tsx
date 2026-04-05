import { useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "../../lib/supabase";
import Input from "../../components/Input";
import Button from "../../components/Button";
import AlertBanner from "../../components/AlertBanner";
import { Plus } from "lucide-react";

const storageLocationSchema = z.object({
  name: z.string().nonempty("Location name is required"),
});

type StorageLocationFormValues = z.infer<typeof storageLocationSchema>;

export default function AddStorageLocation() {
  const queryClient = useQueryClient();
  const [successMessage, setSuccessMessage] = useState("");

  const form = useForm<StorageLocationFormValues>({
    resolver: zodResolver(storageLocationSchema),
    defaultValues: { name: "" },
  });

  const onSubmit = async (data: StorageLocationFormValues) => {
    const { error } = await supabase
      .from("storage_locations")
      .insert({ name: data.name.trim() });

    if (error) {
      form.setError("root", {
        message: "Failed to create storage location. Please try again.",
      });
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["storage_locations"] });
    setSuccessMessage("Storage location added successfully!");
    form.reset();
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  return (
    <div className=" min-h-screen font-sans p-4 py-12">
      <div className="w-full mx-auto rounded-2xl overflow-hidden p-6 md:p-10">
        {successMessage && (
          <AlertBanner
            variant="success"
            message={successMessage}
            className="mb-8"
          />
        )}

        {form.formState.errors.root && (
          <AlertBanner
            variant="error"
            message={form.formState.errors.root.message || "An error occurred"}
            className="mb-8"
          />
        )}

        <div className="mb-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Add New Storage Location
          </h2>
          <p className="text-slate-500 mt-2 text-sm">
            Create a new storage location for your inventory
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Input
            label="Location Name"
            placeholder="e.g., OF (Office)"
            error={form.formState.errors.name?.message}
            {...form.register("name")}
          />

          <p className="text-sm text-slate-500">
            Example:{" "}
            <code className="bg-slate-100 px-2 py-1 rounded">
              WH (Warehouse)
            </code>
            ,{" "}
            <code className="bg-slate-100 px-2 py-1 rounded">
              WH-1 (Warehouse Cabin 1)
            </code>
            ,{" "}
            <code className="bg-slate-100 px-2 py-1 rounded">OF (Office)</code>
          </p>

          <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-200/60">
            <Link to="/inventory-manager/add-equipment">
              <Button variant="secondary" type="button">
                Cancel
              </Button>
            </Link>
            <Button
              variant="primary"
              type="submit"
              isLoading={form.formState.isSubmitting}
              disabled={!form.watch("name")?.trim()}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Storage Location
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
