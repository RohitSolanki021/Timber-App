import React from "react";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export default function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false,
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.4em]">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage <= 1 || disabled}
        className="px-3 py-2 rounded-xl bg-slate-100 text-slate-500 disabled:opacity-40"
      >
        Previous
      </button>
      <span>{currentPage} / {totalPages}</span>
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage >= totalPages || disabled}
        className="px-3 py-2 rounded-xl bg-slate-100 text-slate-500 disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}
