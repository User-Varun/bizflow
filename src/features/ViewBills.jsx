import { SearchBar } from "../ui/SearchBar";
import { BillViewCard } from "../ui/BillViewCard";
import { PaginationComp } from "../ui/PaginationComp";
import "../styles/viewBills.css";
import { InvoiceTemplate } from "../ui/InvoiceTemplate";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { requestJSON } from "../utils/requestJSON";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import "../index.css";

export function ViewBills() {
  const baseUrl = import.meta.env.VITE_API_URL;
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState("invoice_number");
  const [id, setId] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const normalizedSearch = searchQuery.trim();

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: [
      "viewInvoices",
      { page, pageSize, search: normalizedSearch, searchFilter },
    ],
    queryFn: () =>
      requestJSON(
        `${baseUrl}/viewInvoices?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(normalizedSearch)}&searchFilter=${encodeURIComponent(searchFilter)}`,
        {
          method: "GET",
        },
      ),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
  });

  const bills = data?.result || [];
  const total = data?.total || 0;

  function handleSearchChange(value) {
    setSearchQuery(value);
    setPage(1);
  }

  function handleFilterChange(value) {
    setSearchFilter(value);
    setPage(1);
  }

  if (error) {
    return (
      <section className="below-navbar-content-container">
        <h1>{error?.message || "Failed to load bills"}</h1>
      </section>
    );
  }

  return (
    <section className="below-navbar-content-container">
      <div id="viewBillInnerHeader">
        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={handleSearchChange}
          widthInPercent={85}
        />
        <div className="viewBillFilter">
          <select
            value={searchFilter}
            onChange={(e) => handleFilterChange(e.target.value)}
          >
            <option value="invoice_number">By Invoice No</option>
            <option value="createdAt">By Date</option>
            <option value="invoice_to">By Buyer Name</option>
            <option value="invoice_from">By Seller Name</option>
          </select>
        </div>
      </div>

      {!showInvoice ? (
        <>
          <section className="billContainer scroll-hide">
            {isLoading && bills.length === 0 ? (
              <LoadingSpinner label="Loading bills..." />
            ) : bills.length > 0 ? (
              bills.map((res) => {
                return (
                  <BillViewCard
                    res={res}
                    key={res.id}
                    setShowInvoice={setShowInvoice}
                    setId={setId}
                  />
                );
              })
            ) : (
              <h1>No Bills Found!</h1>
            )}
          </section>
          <PaginationComp
            page={page}
            pageSize={pageSize}
            total={total}
            onChange={setPage}
            onPageSizeChange={setPageSize}
            disabled={isLoading || isFetching}
            showFirstLast={true}
            siblingCount={1}
          />
        </>
      ) : (
        <InvoiceTemplate id={id} />
      )}
    </section>
  );
}
