import { ProductCard } from "../ui/ProductCard";
import { SearchBar } from "../ui/SearchBar";
import { PaginationComp } from "../ui/PaginationComp";
import "../styles/inventory.css";
import "../index.css";
import { requestJSON } from "../styles/utils/requestJSON";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useSearchParams } from "react-router";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

const baseUrl = import.meta.env.VITE_API_URL;
const SUPPLIER_TYPE = "stock_in";

export function Inventory() {
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);
  const [searchInput, setSearchInput] = useState("");
  const [activeDealerId, setActiveDealerId] = useState("all");
  const [stockStatus, setStockStatus] = useState("all");
  const debouncedSearch = useDebouncedValue(searchInput, 350);

  const normalizedSearch = debouncedSearch.trim();

  const suppliersQuery = useQuery({
    queryKey: ["inventorySuppliers"],
    queryFn: () =>
      requestJSON(
        `${baseUrl}/dealers?invoice_type=${SUPPLIER_TYPE}&page=1&pageSize=200`,
      ),
    staleTime: 60000,
  });

  const suppliers = useMemo(() => {
    return Array.isArray(suppliersQuery.data?.result)
      ? suppliersQuery.data.result
      : [];
  }, [suppliersQuery.data]);

  useEffect(() => {
    const stockStatusParam = String(searchParams.get("stockStatus") || "all")
      .trim()
      .toLowerCase();

    setStockStatus(
      ["all", "out_of_stock", "low_stock"].includes(stockStatusParam)
        ? stockStatusParam
        : "all",
    );
    setPage(1);
  }, [searchParams]);

  useEffect(() => {
    if (suppliers.length === 0) {
      setActiveDealerId("all");
      return;
    }

    if (activeDealerId === "all") return;

    const hasSelectedDealer = suppliers.some(
      (dealer) => dealer.id === activeDealerId,
    );

    if (!hasSelectedDealer) {
      setActiveDealerId("all");
      setPage(1);
    }
  }, [suppliers, activeDealerId]);

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: [
      "inventory",
      {
        page,
        pageSize,
        search: normalizedSearch,
        dealerId: activeDealerId,
        stockStatus,
      },
    ],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        search: normalizedSearch,
        stockStatus,
      });

      if (activeDealerId && activeDealerId !== "all") {
        params.set("dealer_id", activeDealerId);
      }

      return requestJSON(`${baseUrl}/inventory?${params.toString()}`, {
        method: "GET",
      });
    },
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
  });

  const inventory = data?.result || [];
  const total = data?.total || 0;

  function handleSearchChange(value) {
    setSearchInput(value);
    setPage(1);
  }

  function handleDealerFilterChange(e) {
    setActiveDealerId(e.target.value);
    setPage(1);
  }

  function handleStockStatusChange(e) {
    setStockStatus(e.target.value);
    setPage(1);
  }

  if (suppliersQuery.isLoading || isLoading) {
    return <LoadingSpinner label="Loading inventory..." />;
  }

  if (suppliersQuery.error) return <p>{suppliersQuery.error.message}</p>;
  if (error) return <p>{error.message}</p>;

  return (
    <section className="below-navbar-content-container inventoryShell">
      <div id="innerHeader">
        <SearchBar
          searchQuery={searchInput}
          setSearchQuery={handleSearchChange}
        />
        <select
          className="inventoryDealerFilter"
          value={activeDealerId}
          onChange={handleDealerFilterChange}
          aria-label="Filter inventory by supplier"
        >
          <option value="all">All Suppliers</option>
          {suppliers.map((dealer) => (
            <option key={dealer.id} value={dealer.id}>
              {dealer.name}
            </option>
          ))}
        </select>
        <select
          className="inventoryStockFilter"
          value={stockStatus}
          onChange={handleStockStatusChange}
          aria-label="Filter inventory by stock status"
        >
          <option value="all">All Stock</option>
          <option value="out_of_stock">Out of Stock</option>
          <option value="low_stock">Low Stock</option>
        </select>
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
              : activeDealerId && activeDealerId !== "all"
                ? "No items found for this supplier yet."
                : "Add items or create bills to see them show up here."}
          </p>
        </div>
      ) : (
        <>
          <div id="inventoryContainer" className="scroll-hide">
            {inventory.map((res) => (
              <ProductCard
                res={res}
                compact={true}
                inventoryInsights={true}
                key={res.id || res.name}
              />
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
