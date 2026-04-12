import { useState } from "react";

import { useQuery } from "@tanstack/react-query";

import "../../styles/generateBillStyles/searchItems.css";
import { SearchBar } from "../../ui/SearchBar";
import { BillCardItem } from "../../ui/BillCardItem";
import { LoadingSpinner } from "../../ui/LoadingSpinner";
import { requestJSON } from "../../styles/utils/requestJSON";
import { useBill } from "./hooks/useBill";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";

const baseUrl = import.meta.env.VITE_API_URL;

export function SearchItems() {
  const { state } = useBill();

  // Load defaults on mount/invoice_type change
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 350);
  const normalizedSearch = debouncedSearch.trim();
  const isStockIn = state.invoice_type === "stock_in";
  const sourcePath = isStockIn ? "productCatalog" : "inventory";
  const selectedDealerId = String(state.dealer_id || "").trim();

  const {
    data: products = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [
      "generateInvoiceSearchItems",
      {
        invoiceType: state.invoice_type,
        search: normalizedSearch,
        dealerId: selectedDealerId,
      },
    ],
    queryFn: () =>
      requestJSON(
        `${baseUrl}/${sourcePath}?page=1&pageSize=200&search=${encodeURIComponent(normalizedSearch)}${isStockIn ? `&dealer_id=${encodeURIComponent(selectedDealerId)}` : ""}`,
        {
          method: "GET",
        },
      ),
    enabled: !isStockIn || Boolean(selectedDealerId),
    select: (payload) => {
      const items = payload?.result ?? [];

      // For stock_out, show only inventory rows that still have quantity.
      if (!isStockIn) {
        return items.filter((item) => Number(item?.product_qty || 0) > 0);
      }

      return items;
    },
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
  });

  if (isLoading) {
    return (
      <LoadingSpinner
        label={isStockIn ? "Loading products..." : "Loading inventory..."}
      />
    );
  }

  if (isError) {
    return <h1>{error?.message || "Failed to load search items"}</h1>;
  }

  return (
    <section id="searchFeatureContainer">
      <SearchBar searchQuery={searchInput} setSearchQuery={setSearchInput} />
      <div id="searchItemsContainer" className="scroll-hide">
        {isStockIn && !selectedDealerId ? (
          <h1>Select a supplier dealer to load products.</h1>
        ) : null}

        {products.length > 0 ? (
          products.map((res) => {
            return <BillCardItem res={res} key={res.id || res.name} />;
          })
        ) : !isStockIn || selectedDealerId ? (
          <h1>
            {isStockIn ? "No products found!" : "No inventory items found!"}
          </h1>
        ) : null}
      </div>
    </section>
  );
}
