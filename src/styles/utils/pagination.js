export const DOTS = "DOTS";

export function getPaginationRange({
  total,
  pageSize,
  page,
  siblingCount = 1,
}) {
  const totalPages = Math.max(
    1,
    Math.ceil((total || 0) / Math.max(1, pageSize))
  );

  // Pages: 1 ... leftSibling ... page ... rightSibling ... totalPages
  const totalNumbers = siblingCount * 2 + 5; // first, last, current, 2 siblings, 2 dots
  const totalBlocks = totalNumbers;

  if (totalPages <= totalBlocks) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSiblingIndex = Math.max(page - siblingCount, 1);
  const rightSiblingIndex = Math.min(page + siblingCount, totalPages);

  const showLeftDots = leftSiblingIndex > 2;
  const showRightDots = rightSiblingIndex < totalPages - 1;

  const firstPageIndex = 1;
  const lastPageIndex = totalPages;

  if (!showLeftDots && showRightDots) {
    const leftItemCount = 3 + 2 * siblingCount; // 1, 2.., siblings around
    const range = Array.from({ length: leftItemCount }, (_, i) => i + 1);
    return [...range, DOTS, totalPages];
  }

  if (showLeftDots && !showRightDots) {
    const rightItemCount = 3 + 2 * siblingCount;
    const range = Array.from(
      { length: rightItemCount },
      (_, i) => totalPages - rightItemCount + 1 + i
    );
    return [firstPageIndex, DOTS, ...range];
  }

  if (showLeftDots && showRightDots) {
    const middleRange = Array.from(
      { length: rightSiblingIndex - leftSiblingIndex + 1 },
      (_, i) => leftSiblingIndex + i
    );
    return [firstPageIndex, DOTS, ...middleRange, DOTS, lastPageIndex];
  }

  // Fallback
  return Array.from({ length: totalPages }, (_, i) => i + 1);
}
