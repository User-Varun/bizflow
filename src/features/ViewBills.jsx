import { SearchBar } from "../ui/SearchBar";
import { BillViewCard } from "../ui/BillViewCard";
import { PaginationComp } from "../ui/PaginationComp";
import "../styles/viewBills.css";
import { InvoiceTemplate } from "../ui/InvoiceTemplate";
import { EditInvoiceModal } from "../ui/EditInvoiceModal";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { requestJSON } from "../styles/utils/requestJSON";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import "../index.css";

export function ViewBills() {
  const baseUrl = import.meta.env.VITE_API_URL;
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState("invoice_number");
  const [billTypeFilter, setBillTypeFilter] = useState("all");
  const [id, setId] = useState(null);
  const [editingInvoiceId, setEditingInvoiceId] = useState(null);
  const [editInvoiceError, setEditInvoiceError] = useState("");
  const [showInvoice, setShowInvoice] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const normalizedSearch = searchQuery.trim();

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: [
      "viewInvoices",
      {
        page,
        pageSize,
        search: normalizedSearch,
        searchFilter,
        billTypeFilter,
      },
    ],
    queryFn: () =>
      requestJSON(
        `${baseUrl}/viewInvoices?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(normalizedSearch)}&searchFilter=${encodeURIComponent(searchFilter)}&billType=${encodeURIComponent(billTypeFilter)}`,
        {
          method: "GET",
        },
      ),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
  });

  const bills = data?.result || [];
  const total = data?.total || 0;

  const payInvoiceMutation = useMutation({
    mutationFn: ({ id, amount, payment_method }) =>
      requestJSON(`${baseUrl}/viewInvoices/${id}/pay`, {
        method: "PATCH",
        body: JSON.stringify({ amount, payment_method }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["viewInvoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const updateInvoiceDateMutation = useMutation({
    mutationFn: ({ id, created_at }) =>
      requestJSON(`${baseUrl}/viewInvoices/${id}/date`, {
        method: "PATCH",
        body: JSON.stringify({ created_at }),
      }),
    onSuccess: (response) => {
      const updatedId = response?.result?.id;
      const updatedCreatedAt = response?.result?.createdAt;

      if (updatedId && updatedCreatedAt) {
        queryClient.setQueriesData({ queryKey: ["viewInvoices"] }, (old) => {
          if (!old?.result || !Array.isArray(old.result)) return old;

          return {
            ...old,
            result: old.result.map((bill) =>
              bill.id === updatedId
                ? { ...bill, createdAt: updatedCreatedAt }
                : bill,
            ),
          };
        });
      }

      queryClient.invalidateQueries({ queryKey: ["viewInvoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const invoiceToEditQuery = useQuery({
    queryKey: ["invoiceToEdit", editingInvoiceId],
    queryFn: () =>
      requestJSON(`${baseUrl}/viewInvoices/${editingInvoiceId}`, {
        method: "GET",
      }),
    enabled: Boolean(editingInvoiceId),
    staleTime: 0,
  });

  const editSourceQuery = useQuery({
    queryKey: [
      "editInvoiceSourceItems",
      editingInvoiceId,
      invoiceToEditQuery.data?.result?.invoice_type,
    ],
    queryFn: async () => {
      const invoiceType = invoiceToEditQuery.data?.result?.invoice_type;
      const sourcePath =
        invoiceType === "stock_in" ? "productCatalog" : "inventory";

      const response = await requestJSON(
        `${baseUrl}/${sourcePath}?page=1&pageSize=200&search=`,
        {
          method: "GET",
        },
      );

      const rows = response?.result || [];
      if (invoiceType !== "stock_in") {
        return rows.filter((item) => Number(item?.product_qty || 0) > 0);
      }

      return rows;
    },
    enabled:
      Boolean(editingInvoiceId) &&
      Boolean(invoiceToEditQuery.data?.result?.invoice_type),
    staleTime: 30000,
  });

  const editInvoiceMutation = useMutation({
    mutationFn: ({ id, payload }) =>
      requestJSON(`${baseUrl}/viewInvoices/${id}/edit`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["viewInvoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setEditInvoiceError("");
      setEditingInvoiceId(null);
    },
    onError: (err) => {
      setEditInvoiceError(err?.message || "Failed to update invoice.");
    },
  });

  function handleSearchChange(value) {
    setSearchQuery(value);
    setPage(1);
  }

  function handleFilterChange(value) {
    setSearchFilter(value);
    setPage(1);
  }

  function handleBillTypeFilterChange(value) {
    setBillTypeFilter(value);
    setPage(1);
  }

  function openEditInvoiceModal(invoiceId) {
    setEditInvoiceError("");
    setEditingInvoiceId(invoiceId);
  }

  function closeEditInvoiceModal() {
    if (editInvoiceMutation.isPending) return;
    setEditInvoiceError("");
    setEditingInvoiceId(null);
  }

  if (error) {
    return (
      <section className="below-navbar-content-container">
        <h1>{error?.message || "Failed to load bills"}</h1>
      </section>
    );
  }

  return (
    <section
      className={`below-navbar-content-container ${!showInvoice ? "viewBillsShell" : ""}`}
    >
      {!showInvoice && (
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
          <div className="viewBillFilter">
            <select
              value={billTypeFilter}
              onChange={(e) => handleBillTypeFilterChange(e.target.value)}
            >
              <option value="all">All Bills</option>
              <option value="stock_in">Stock In</option>
              <option value="stock_out">Stock Out</option>
            </select>
          </div>
        </div>
      )}

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
                    onPay={({ amount, payment_method }) =>
                      payInvoiceMutation.mutateAsync({
                        id: res.id,
                        amount,
                        payment_method,
                      })
                    }
                    onUpdateDate={({ created_at }) =>
                      updateInvoiceDateMutation.mutateAsync({
                        id: res.id,
                        created_at,
                      })
                    }
                    isPaying={
                      payInvoiceMutation.isPending &&
                      payInvoiceMutation.variables?.id === res.id
                    }
                    isUpdatingDate={
                      updateInvoiceDateMutation.isPending &&
                      updateInvoiceDateMutation.variables?.id === res.id
                    }
                    onEditInvoice={() => openEditInvoiceModal(res.id)}
                    isEditingInvoice={
                      editInvoiceMutation.isPending &&
                      editInvoiceMutation.variables?.id === res.id
                    }
                  />
                );
              })
            ) : (
              <div className="product-catalog-empty">
                <svg viewBox="0 0 64 64" aria-hidden="true">
                  <path d="M8 18a2 2 0 0 1 2-2h44a2 2 0 0 1 1.73 1l6 10.4a2 2 0 0 1 .27 1v18.6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V28.4a2 2 0 0 1 .27-1L8 17.98V18Zm1.85 2-4.7 8.13H58.9L54.2 20H9.85ZM4 30v16h56V30H4Zm16 4h4v8h-4v-8Zm8 0h4v8h-4v-8Zm8 0h4v8h-4v-8Z" />
                </svg>
                <h1>No Bills yet</h1>
                <p>
                  {normalizedSearch
                    ? "No bill matched your search."
                    : "generate bill to see it appear here."}
                </p>
              </div>
            )}
          </section>
          {bills.length > 0 ? (
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
          ) : null}
        </>
      ) : (
        <InvoiceTemplate
          id={id}
          onBack={() => {
            setShowInvoice(false);
            setId(null);
          }}
          backButtonLabel="Back to All Bills"
        />
      )}

      <EditInvoiceModal
        isOpen={Boolean(editingInvoiceId)}
        onClose={closeEditInvoiceModal}
        invoiceData={invoiceToEditQuery.data?.result || null}
        sourceItems={editSourceQuery.data || []}
        sourceLoading={
          editSourceQuery.isLoading || invoiceToEditQuery.isLoading
        }
        isSaving={editInvoiceMutation.isPending}
        errorMessage={editInvoiceError}
        onSave={async (payload) => {
          setEditInvoiceError("");
          await editInvoiceMutation.mutateAsync({
            id: editingInvoiceId,
            payload,
          });
        }}
      />
    </section>
  );
}
