import "../styles/paginationComp.css";
import { getPaginationRange, DOTS } from "../styles/utils/pagination";

export function PaginationComp({
  page = 1,
  pageSize = 8,
  total = 0,
  onChange,
  siblingCount = 1,
  showFirstLast = true,
  disabled = false,
  className = "",
  ariaLabel = "Pagination Navigation",
}) {
  const totalPages = Math.max(
    1,
    Math.ceil((total || 0) / Math.max(1, pageSize)),
  );
  const range = getPaginationRange({ total, pageSize, page, siblingCount });

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
        {showFirstLast && (
          <button
            type="button"
            className="page-button"
            aria-label="First page"
            disabled={disabled || !canGoPrev}
            onClick={() => goTo(1)}
          >
            «
          </button>
        )}

        <button
          type="button"
          className="page-button"
          aria-label="Previous page"
          disabled={disabled || !canGoPrev}
          onClick={() => goTo(page - 1)}
        >
          ‹
        </button>

        <ul className="page-list" role="list">
          {range.map((item, idx) => {
            if (item === DOTS) {
              return (
                <li
                  key={`dots-${idx}`}
                  className="page-item ellipsis"
                  aria-hidden
                >
                  …
                </li>
              );
            }
            const isActive = item === page;
            return (
              <li
                key={`page-${item}`}
                className={`page-item ${isActive ? "active" : ""}`}
              >
                <button
                  type="button"
                  className="page-button"
                  aria-current={isActive ? "page" : undefined}
                  disabled={disabled}
                  onClick={() => goTo(item)}
                >
                  {item}
                </button>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          className="page-button"
          aria-label="Next page"
          disabled={disabled || !canGoNext}
          onClick={() => goTo(page + 1)}
        >
          ›
        </button>

        {showFirstLast && (
          <button
            type="button"
            className="page-button"
            aria-label="Last page"
            disabled={disabled || !canGoNext}
            onClick={() => goTo(totalPages)}
          >
            »
          </button>
        )}

        {/* {onPageSizeChange && (
          <label className="page-size">
            <span>Per page</span>
            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              disabled={disabled}
              aria-label="Items per page"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
        )} */}
      </div>
      <div className="pagination-meta" aria-live="polite">
        Page {page} of {totalPages}
      </div>
    </nav>
  );
}
