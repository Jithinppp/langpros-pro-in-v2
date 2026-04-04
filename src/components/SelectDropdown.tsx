import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
  Transition,
} from "@headlessui/react";
import { ChevronDown, Check, Loader2 } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  showCheckmark?: boolean;
  emptyMessage?: string;
  size?: "xs" | "sm" | "md";
  label?: string;
  error?: string;
}

export default function SelectDropdown({
  value,
  onChange,
  options,
  placeholder = "Select...",
  className = "",
  disabled = false,
  loading = false,
  showCheckmark = true,
  emptyMessage = "No options available",
  size = "md",
  label,
  error,
}: SelectDropdownProps) {
  const selected = options.find((o) => o.value === value);
  const isDisabled = disabled || loading;

  const btnSizeClasses = {
    xs: "py-1.5 pl-4 pr-8 text-xs min-h-[34px]",
    sm: "py-2 pl-4 pr-10 text-sm",
    md: "py-2.5 pl-4 pr-10 text-sm",
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <Listbox value={value} onChange={onChange} disabled={isDisabled}>
        <div className="relative">
          <ListboxButton
            className={`relative w-full cursor-default rounded-lg bg-white border text-left outline-none transition-all duration-300 focus:ring-1 focus:ring-gray-300 focus:border-gray-400 ${
              isDisabled 
                ? "bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200" 
                : error
                  ? "border-red-300 focus:border-red-400 focus:ring-red-500/10"
                  : "border-gray-300"
            } ${selected ? "text-gray-900" : "text-gray-400"} ${btnSizeClasses[size]}`}
          >
            <span className="block truncate">
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </span>
              ) : selected ? (
                selected.label
              ) : (
                placeholder
              )}
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
              {options.length === 0 ? (
                <div className="text-gray-500 py-3 px-5 text-sm">{emptyMessage}</div>
              ) : (
                options.map((opt) => (
                  <ListboxOption
                    key={opt.value}
                    value={opt.value}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2.5 pl-10 pr-4 transition-colors ${
                        active ? "bg-gray-50 text-gray-900" : "text-gray-700"
                      }`
                    }
                  >
                    {({ selected: isSelected }) => (
                      <>
                        <span className={`block truncate ${isSelected ? "font-medium text-gray-900" : "font-normal"}`}>
                          {opt.label}
                        </span>
                        {isSelected && showCheckmark && (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-900">
                            <Check className="h-4 w-4" />
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
      {error && <p className="text-xs font-medium text-red-500 ml-1">{error}</p>}
    </div>
  );
}
