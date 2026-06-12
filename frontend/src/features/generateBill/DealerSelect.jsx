import { useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { requestJSON } from "../../styles/utils/requestJSON.js";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { LoadingSpinner } from "../../ui/LoadingSpinner.jsx";
import "../../styles/generateBillStyles/dealerSelect.css";

const baseUrl = import.meta.env.VITE_API_URL;
const PAGE_SIZE = 25;

export function DealerSelect({
  invoiceType,
  selectedDealerId,
  selectedDealerLabel,
  onSelectDealer,
  disabled = false,
}) {
  const wrapperRef = useRef(null);
  const panelRef = useRef(null);
  const searchInputRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const normalizedSearch = debouncedSearch.trim();

  const dealersQuery = useInfiniteQuery({
    queryKey: ["bill-dealers", invoiceType, normalizedSearch],
    queryFn: ({ pageParam = 1 }) =>
      requestJSON(
        `${baseUrl}/dealers?invoice_type=${encodeURIComponent(invoiceType)}&page=${pageParam}&pageSize=${PAGE_SIZE}&search=${encodeURIComponent(normalizedSearch)}`,
      ),
    initialPageParam: 1,
    enabled: isOpen && Boolean(invoiceType),
    staleTime: 60_000,
    getNextPageParam: (lastPage, allPages) => {
      const page = Number(lastPage?.meta?.page || allPages.length || 1);
      const pageSize = Number(lastPage?.meta?.pageSize || PAGE_SIZE);
      const total = Number(lastPage?.meta?.total || 0);
      const loadedCount = page * pageSize;

      return loadedCount < total ? page + 1 : undefined;
    },
  });

  const dealers = useMemo(() => {
    return (dealersQuery.data?.pages || []).flatMap((page) =>
      Array.isArray(page?.result) ? page.result : [],
    );
  }, [dealersQuery.data]);

  const buttonLabel =
    String(selectedDealerLabel || "").trim() || "Select dealer";

  useEffect(() => {
    if (!isOpen) return undefined;

    const onPointerDown = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    searchInputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    panelRef.current?.scrollTo({ top: 0 });
  }, [normalizedSearch, isOpen]);

  useEffect(() => {
    if (isOpen) return;

    setSearchInput("");
  }, [isOpen]);

  function handleScroll(event) {
    if (!dealersQuery.hasNextPage || dealersQuery.isFetchingNextPage) return;

    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    const distanceToBottom = scrollHeight - (scrollTop + clientHeight);

    if (distanceToBottom < 64) {
      dealersQuery.fetchNextPage();
    }
  }

  function handleSelectDealer(dealer) {
    onSelectDealer(dealer);
    setIsOpen(false);
    setSearchInput("");
  }

  return (
    <div className="dealer-select-shell" ref={wrapperRef}>
      <button
        type="button"
        className="dealer-select-trigger formEl"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="dealer-select-trigger-label">{buttonLabel}</span>
        <span className="dealer-select-trigger-caret" aria-hidden="true">
          {isOpen ? "▲" : "▼"}
        </span>
      </button>

      {isOpen ? (
        <div className="dealer-select-panel" role="dialog" aria-label="Dealer search and selection">
          <div className="dealer-select-search-row">
            <input
              ref={searchInputRef}
              type="search"
              className="dealer-select-search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search dealers"
              aria-label="Search dealers"
            />
          </div>

          <div
            className="dealer-select-list scroll-hide"
            ref={panelRef}
            onScroll={handleScroll}
            role="listbox"
            aria-label="Dealers"
          >
            {dealersQuery.isLoading ? (
              <LoadingSpinner label="Loading dealers..." />
            ) : dealers.length > 0 ? (
              dealers.map((dealer) => {
                const isSelected = dealer.id === selectedDealerId;

                return (
                  <button
                    key={dealer.id}
                    type="button"
                    className={`dealer-select-option ${isSelected ? "active" : ""}`}
                    onClick={() => handleSelectDealer(dealer)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <span className="dealer-select-option-main">
                      <strong>{dealer.name}</strong>
                      <span>{dealer.phone || "-"}</span>
                    </span>
                    <span className="dealer-select-option-meta">
                      {dealer.gst || "GST not set"}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="dealer-select-empty">
                <p>No dealers found.</p>
                <p>Try a different search or add a dealer first.</p>
              </div>
            )}

            {dealersQuery.isFetchingNextPage ? (
              <div className="dealer-select-loading-more">
                Loading more dealers...
              </div>
            ) : null}

            {!dealersQuery.hasNextPage && dealers.length > 0 ? (
              <div className="dealer-select-end-note">
                All dealers loaded.
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
