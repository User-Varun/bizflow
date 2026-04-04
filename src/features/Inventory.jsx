import { ProductCard } from "../ui/ProductCard";
import { SearchBar } from "../ui/SearchBar";
import { PaginationComp } from "../ui/PaginationComp";
import "../styles/inventory.css";
import "../index.css";
import { requestJSON } from "../styles/utils/requestJSON";
import { LoadingSpinner } from "../ui/LoadingSpinner";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export function Inventory() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  const normalizedSearch = searchQuery.trim();

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["inventory", { page, pageSize, search: normalizedSearch }],
    queryFn: () =>
      requestJSON(
        `${import.meta.env.VITE_API_URL}/inventory?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(normalizedSearch)}`,
        {
          method: "GET",
        },
      ),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
  });

  const inventory = data?.result || [];
  const total = data?.total || 0;

  function handleSearchChange(value) {
    setSearchQuery(value);
    setPage(1);
  }

  if (isLoading) return <LoadingSpinner label="Loading inventory..." />;
  if (error) return <p>{error.message}</p>;

  return (
    <section className="below-navbar-content-container inventoryShell">
      <div id="innerHeader">
        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={handleSearchChange}
        />
      </div>
      {inventory.length === 0 ? (
        <div className="inventory-empty">
          <svg viewBox="0 0 64 64" aria-hidden="true">
            <path d="M8 18a2 2 0 0 1 2-2h44a2 2 0 0 1 1.73 1l6 10.4a2 2 0 0 1 .27 1v18.6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V28.4a2 2 0 0 1 .27-1L8 17.98V18Zm1.85 2-4.7 8.13H58.9L54.2 20H9.85ZM4 30v16h56V30H4Zm16 4h4v8h-4v-8Zm8 0h4v8h-4v-8Zm8 0h4v8h-4v-8Z" />
          </svg>
          <h1>No inventory yet</h1>
          <p>
            {normalizedSearch
              ? "No items match your search."
              : "Add items or create bills to see them show up here."}
          </p>
        </div>
      ) : (
        <>
          <div id="inventoryContainer" className="scroll-hide">
            {inventory.map((res) => (
              <ProductCard res={res} compact={true} key={res.id || res.name} />
            ))}
          </div>
          <PaginationComp
            page={page}
            pageSize={pageSize}
            total={total}
            onChange={setPage}
            disabled={isLoading || isFetching}
            showFirstLast={true}
            siblingCount={1}
          />
        </>
      )}
    </section>
  );
}
