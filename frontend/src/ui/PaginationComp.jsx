import "../styles/paginationComp.css";

export function PaginationComp({
  page = 1,
  pageSize = 8,
  total = 0,
  onChange,
  disabled = false,
  className = "",
  ariaLabel = "Pagination Navigation",
}) {
  const totalPages = Math.max(
    1,
    Math.ceil((total || 0) / Math.max(1, pageSize)),
  );
  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  function goTo(p) {
    if (!onChange) return;
    const clamped = Math.min(Math.max(1, p), totalPages);
    onChange(clamped);
  }

  //   function handlePageSizeChange(e) {
  //     const next = Number(e.target.value);
  //     if (onPageSizeChange) onPageSizeChange(next);
  //   }

  return (
    <nav className={`paginationContainer ${className}`} aria-label={ariaLabel}>
      <div className="pagination">
        <button
          type="button"
          className="page-button"
          aria-label="Previous page"
          disabled={disabled || !canGoPrev}
          onClick={() => goTo(page - 1)}
        >
          ‹
        </button>

        <span className="page-current" aria-live="polite" aria-atomic="true">
          {page} / {totalPages}
        </span>

        <button
          type="button"
          className="page-button"
          aria-label="Next page"
          disabled={disabled || !canGoNext}
          onClick={() => goTo(page + 1)}
        >
          ›
        </button>
      </div>
    </nav>
  );
}
