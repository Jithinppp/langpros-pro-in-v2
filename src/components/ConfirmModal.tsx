import { X } from "lucide-react";
import Button from "./Button";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "primary" | "warning";
  onConfirmCustom?: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  variant = "danger",
  onConfirmCustom,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirmCustom) {
      onConfirmCustom();
    } else {
      onConfirm();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
        onClick={onCancel}
      />

      {/* Modal - Double bezel architecture */}
      <div className="relative bg-white rounded-xl w-full max-w-md mx-4 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)] overflow-hidden">
        <div className="absolute inset-0 border border-slate-200/60 rounded-xl" />

        <div className="relative p-8">
          <button
            onClick={onCancel}
            className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
              {title}
            </h2>
            <p className="text-slate-500 mt-3 text-sm leading-relaxed">
              {message}
            </p>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={onCancel}>
              {cancelLabel}
            </Button>
            <Button
              variant={variant === "warning" ? "primary" : variant}
              onClick={handleConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
