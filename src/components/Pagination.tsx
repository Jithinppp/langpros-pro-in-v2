import Button from "./Button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  startItem?: number;
  endItem?: number;
  totalItems?: number;
  variant?: "simple" | "detailed";
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  startItem,
  endItem,
  totalItems,
  variant = "simple",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-8 pt-8 border-t border-slate-100">
      {variant === "detailed" && startItem !== undefined && endItem !== undefined && totalItems !== undefined ? (
        <div className="text-xs text-slate-400 uppercase tracking-wider">
          Showing <span className="text-slate-600 font-medium">{startItem}</span> to <span className="text-slate-600 font-medium">{endItem}</span> of <span className="text-slate-600 font-medium">{totalItems}</span> results
        </div>
      ) : (
        <div />
      )}
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <span className="text-xs text-slate-500 px-2 font-medium min-w-[80px] text-center">
          {currentPage} / {totalPages}
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
