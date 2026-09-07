import Button from "./Button";
export default function Pagination({ pagination, onPage }) {
  if (!pagination || pagination.totalPages <= 1) return null;
  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-3 border-t border-[#c9b86a]/20 p-4"
    >
      <span className="text-sm">
        Page {pagination.page} of {pagination.totalPages}
      </span>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          disabled={pagination.page <= 1}
          onClick={() => onPage(pagination.page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          disabled={pagination.page >= pagination.totalPages}
          onClick={() => onPage(pagination.page + 1)}
        >
          Next
        </Button>
      </div>
    </nav>
  );
}
