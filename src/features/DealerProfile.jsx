import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { requestJSON } from "../styles/utils/requestJSON";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { PaginationComp } from "../ui/PaginationComp";
import {
  formatCurrencyAmount,
  formatDateTimeWithMonthWord,
  formatDateWithMonthWord,
  toFixedTwo,
} from "../lib/formatters";
import "../styles/dealerProfile.css";

const baseUrl = import.meta.env.VITE_API_URL;

export function DealerProfile() {
  const queryClient = useQueryClient();
  const { invoiceType, dealerId } = useParams();

  const [formState, setFormState] = useState({
    invoice_type: invoiceType || "stock_out",
    name: "",
    phone: "",
    gst: "",
    address: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize] = useState(6);
  const [historyBillState, setHistoryBillState] = useState("all");
  const [historySearch, setHistorySearch] = useState("");
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerPageSize] = useState(8);

  const normalizedHistorySearch = historySearch.trim();

  const dealerQuery = useQuery({
    queryKey: ["dealer", invoiceType, dealerId],
    queryFn: () =>
      requestJSON(
        `${baseUrl}/dealers/${dealerId}?invoice_type=${encodeURIComponent(invoiceType || "")}`,
      ),
    enabled: Boolean(invoiceType && dealerId),
    staleTime: 30000,
  });

  useEffect(() => {
    const dealer = dealerQuery.data?.result;
    if (!dealer) return;

    setFormState({
      invoice_type: dealer.invoice_type,
      name: dealer.name || "",
      phone: dealer.phone || "",
      gst: dealer.gst || "",
      address: dealer.address || "",
    });
  }, [dealerQuery.data]);

  const dealerType =
    dealerQuery.data?.result?.invoice_type || invoiceType || "stock_out";
  const counterpartLabel = dealerType === "stock_in" ? "Supplier" : "Customer";

  const invoiceHistoryQuery = useQuery({
    queryKey: [
      "dealerInvoices",
      dealerId,
      dealerType,
      historyPage,
      historyPageSize,
      historyBillState,
      normalizedHistorySearch,
    ],
    queryFn: () =>
      requestJSON(
        `${baseUrl}/dealers/${dealerId}/invoices?invoice_type=${encodeURIComponent(dealerType)}&page=${historyPage}&pageSize=${historyPageSize}&bill_state=${encodeURIComponent(historyBillState)}&search=${encodeURIComponent(normalizedHistorySearch)}`,
      ),
    enabled: Boolean(dealerId && dealerType),
    staleTime: 30000,
    placeholderData: (prev) => prev,
  });

  const ledgerSummaryQuery = useQuery({
    queryKey: ["dealerLedgerSummary", dealerId, dealerType],
    queryFn: () =>
      requestJSON(
        `${baseUrl}/dealers/${dealerId}/ledger/summary?invoice_type=${encodeURIComponent(dealerType)}`,
      ),
    enabled: Boolean(dealerId && dealerType),
    staleTime: 30000,
  });

  const ledgerStatementQuery = useQuery({
    queryKey: [
      "dealerLedgerStatement",
      dealerId,
      dealerType,
      ledgerPage,
      ledgerPageSize,
    ],
    queryFn: () =>
      requestJSON(
        `${baseUrl}/dealers/${dealerId}/ledger/statement?invoice_type=${encodeURIComponent(dealerType)}&page=${ledgerPage}&pageSize=${ledgerPageSize}`,
      ),
    enabled: Boolean(dealerId && dealerType),
    staleTime: 30000,
    placeholderData: (prev) => prev,
  });

  useEffect(() => {
    setHistoryPage(1);
    setLedgerPage(1);
  }, [dealerType]);

  const updateDealerMutation = useMutation({
    mutationFn: (payload) =>
      requestJSON(`${baseUrl}/dealers/${dealerId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      setErrorMessage("");
      setSuccessMessage("Dealer updated successfully.");
      setShowEditModal(false);
      queryClient.invalidateQueries({
        queryKey: ["dealer", invoiceType, dealerId],
      });
      queryClient.invalidateQueries({ queryKey: ["dealers"] });
    },
    onError: (err) => {
      setSuccessMessage("");
      setErrorMessage(err?.message || "Failed to update dealer.");
    },
  });

  function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const payload = {
      invoice_type: String(formState.invoice_type || "")
        .trim()
        .toLowerCase(),
      name: String(formState.name || "").trim(),
      phone: String(formState.phone || "")
        .replace(/\s+/g, "")
        .trim(),
      gst: String(formState.gst || "")
        .trim()
        .toUpperCase(),
      address: String(formState.address || "").trim(),
    };

    if (!payload.name || !payload.phone) {
      setErrorMessage("Name and phone are required.");
      return;
    }

    updateDealerMutation.mutate(payload);
  }

  if (dealerQuery.isLoading) {
    return (
      <section className="below-navbar-content-container">
        <LoadingSpinner label="Loading dealer profile..." />
      </section>
    );
  }

  if (dealerQuery.error) {
    return (
      <section className="below-navbar-content-container dealer-profile-shell">
        <h1>
          {dealerQuery.error?.message || "Failed to load dealer profile."}
        </h1>
        <Link to="/dealers" className="dealer-profile-back-link">
          Back to Dealers
        </Link>
      </section>
    );
  }

  const invoices = Array.isArray(invoiceHistoryQuery.data?.result)
    ? invoiceHistoryQuery.data.result
    : [];
  const historyTotal = Number(invoiceHistoryQuery.data?.meta?.total || 0);
  const ledgerSummary = ledgerSummaryQuery.data?.result || null;
  const ledgerRows = Array.isArray(ledgerStatementQuery.data?.result)
    ? ledgerStatementQuery.data.result
    : [];
  const ledgerTotal = Number(ledgerStatementQuery.data?.meta?.total || 0);

  return (
    <section className="below-navbar-content-container dealer-profile-shell">
      {showEditModal ? (
        <div
          className="dealer-profile-modal-overlay"
          onClick={() => {
            if (updateDealerMutation.isPending) return;
            setShowEditModal(false);
          }}
        >
          <div
            className="dealer-profile-modal-content"
            role="dialog"
            aria-modal="true"
            aria-label="Edit dealer"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Edit Dealer</h2>
            <form className="dealer-profile-form" onSubmit={handleSubmit}>
              <div className="dealer-profile-grid">
                <label>
                  Name
                  <input
                    type="text"
                    value={formState.name}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    required
                  />
                </label>

                <label>
                  Phone
                  <input
                    type="text"
                    value={formState.phone}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    required
                  />
                </label>

                <label>
                  GST
                  <input
                    type="text"
                    value={formState.gst}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, gst: e.target.value }))
                    }
                  />
                </label>

                <label>
                  Invoice Type
                  <select
                    value={formState.invoice_type}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        invoice_type: e.target.value,
                      }))
                    }
                  >
                    <option value="stock_out">stock_out</option>
                    <option value="stock_in">stock_in</option>
                  </select>
                </label>

                <label className="dealer-profile-wide">
                  Address
                  <input
                    type="text"
                    value={formState.address}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              {errorMessage ? (
                <p className="dealer-profile-error">{errorMessage}</p>
              ) : null}
              {successMessage ? (
                <p className="dealer-profile-success">{successMessage}</p>
              ) : null}

              <div className="dealer-profile-modal-actions">
                <button
                  type="button"
                  className="dealer-profile-modal-cancel"
                  onClick={() => setShowEditModal(false)}
                  disabled={updateDealerMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="dealer-profile-save-btn"
                  disabled={updateDealerMutation.isPending}
                >
                  {updateDealerMutation.isPending
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <div className="dealer-profile-header">
        <div>
          <h1>Dealer Profile</h1>
          <p>
            Type: <strong>{formState.invoice_type || invoiceType}</strong>
          </p>
        </div>
        <div className="dealer-profile-header-actions">
          <button
            type="button"
            className="dealer-profile-edit-btn"
            onClick={() => {
              setErrorMessage("");
              setSuccessMessage("");
              setShowEditModal(true);
            }}
          >
            Edit Dealer
          </button>
          <Link to="/dealers" className="dealer-profile-back-link">
            Back to Dealers
          </Link>
        </div>
      </div>

      <section className="dealer-profile-overview">
        <h2>Dealer Details</h2>
        <div className="dealer-profile-overview-grid">
          <article>
            <span>Name</span>
            <strong>{formState.name || "-"}</strong>
          </article>
          <article>
            <span>Phone</span>
            <strong>{formState.phone || "-"}</strong>
          </article>
          <article>
            <span>GST</span>
            <strong>{formState.gst || "-"}</strong>
          </article>
          <article>
            <span>Type</span>
            <strong>{formState.invoice_type || "-"}</strong>
          </article>
          <article className="dealer-profile-overview-wide">
            <span>Address</span>
            <strong>{formState.address || "-"}</strong>
          </article>
        </div>
        {successMessage ? (
          <p className="dealer-profile-success">{successMessage}</p>
        ) : null}
      </section>

      <section className="dealer-history-section">
        <div className="dealer-history-header">
          <h2>Invoice History</h2>
          <span className="dealer-history-chip">{dealerType}</span>
        </div>

        <div className="dealer-history-controls">
          <input
            type="text"
            value={historySearch}
            placeholder="Search by invoice number"
            onChange={(e) => {
              setHistorySearch(e.target.value);
              setHistoryPage(1);
            }}
          />

          <select
            value={historyBillState}
            onChange={(e) => {
              setHistoryBillState(e.target.value);
              setHistoryPage(1);
            }}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
          </select>
        </div>

        {invoiceHistoryQuery.isLoading ? (
          <LoadingSpinner label="Loading dealer invoices..." />
        ) : invoices.length > 0 ? (
          <>
            <div className="dealer-history-list-container scroll-hide">
              <div className="dealer-history-list">
                {invoices.map((invoice) => (
                  <article key={invoice.id} className="dealer-history-card">
                    <div className="dealer-history-row">
                      <h3>
                        {dealerType === "stock_in" &&
                        String(invoice.supplier_invoice_number || "").trim()
                          ? invoice.supplier_invoice_number
                          : invoice.invoice_number}
                      </h3>
                      <span
                        className={`dealer-bill-state ${invoice.bill_state}`}
                      >
                        {invoice.bill_state}
                      </span>
                    </div>
                    <p>
                      <strong>Date:</strong>{" "}
                      {formatDateWithMonthWord(invoice.createdAt, "-")}
                    </p>
                    <p>
                      <strong>{counterpartLabel}:</strong>{" "}
                      {dealerType === "stock_in"
                        ? invoice.invoice_to || "-"
                        : invoice.invoice_from || "-"}
                    </p>
                    <p>
                      <strong>Total:</strong> Rs.{" "}
                      {toFixedTwo(invoice.grand_total || 0)}
                    </p>
                    <p>
                      <strong>Pending:</strong> Rs.{" "}
                      {toFixedTwo(invoice.pending_amount || 0)}
                    </p>
                  </article>
                ))}
              </div>
            </div>

            {historyTotal > historyPageSize ? (
              <PaginationComp
                page={historyPage}
                pageSize={historyPageSize}
                total={historyTotal}
                onChange={setHistoryPage}
                disabled={invoiceHistoryQuery.isFetching}
                showFirstLast={true}
                siblingCount={1}
                ariaLabel="Dealer invoice history pagination"
              />
            ) : null}
          </>
        ) : (
          <div className="dealer-history-empty">
            <p>No invoices found for this dealer.</p>
          </div>
        )}
      </section>

      <section className="dealer-history-section">
        <div className="dealer-history-header">
          <h2>Ledger</h2>
          <span className="dealer-history-chip">
            {ledgerSummary?.ledger_kind ||
              (dealerType === "stock_out" ? "receivable" : "payable")}
          </span>
        </div>

        {ledgerSummaryQuery.isLoading ? (
          <LoadingSpinner label="Loading ledger summary..." />
        ) : ledgerSummary ? (
          <div className="ledger-summary-grid">
            <article className="ledger-summary-card">
              <span>Total Invoiced</span>
              <strong>
                {formatCurrencyAmount(ledgerSummary.total_invoiced || 0)}
              </strong>
            </article>
            <article className="ledger-summary-card">
              <span>Total Paid</span>
              <strong>
                {formatCurrencyAmount(ledgerSummary.total_paid || 0)}
              </strong>
            </article>
            <article className="ledger-summary-card">
              <span>Total Pending</span>
              <strong>
                {formatCurrencyAmount(ledgerSummary.total_pending || 0)}
              </strong>
            </article>
            <article className="ledger-summary-card">
              <span>Invoices</span>
              <strong>{toFixedTwo(ledgerSummary.invoice_count || 0)}</strong>
            </article>
          </div>
        ) : (
          <div className="dealer-history-empty">
            <p>Ledger summary is not available.</p>
          </div>
        )}

        {ledgerStatementQuery.isLoading ? (
          <LoadingSpinner label="Loading ledger statement..." />
        ) : ledgerRows.length > 0 ? (
          <>
            <div className="ledger-statement-list-container scroll-hide">
              <div className="ledger-statement-list">
                {ledgerRows.map((row) => (
                  <article key={row.row_id} className="ledger-statement-card">
                    <div className="dealer-history-row">
                      <h3>{row.invoice_number || "Invoice"}</h3>
                      <span
                        className={`dealer-bill-state ${row.row_type === "payment" ? "paid" : "partial"}`}
                      >
                        {row.row_type}
                      </span>
                    </div>
                    <p>
                      <strong>Amount:</strong> Rs. {toFixedTwo(row.amount || 0)}
                    </p>
                    <p>
                      <strong>Running Balance:</strong> Rs.{" "}
                      {toFixedTwo(row.running_balance || 0)}
                    </p>
                    <p>
                      <strong>Date:</strong>{" "}
                      {formatDateTimeWithMonthWord(row.event_at, "-")}
                    </p>
                    <p>
                      <strong>{counterpartLabel}:</strong>{" "}
                      {row.other_party_name || "-"}
                    </p>
                    {row.payment_method ? (
                      <p>
                        <strong>Method:</strong> {row.payment_method}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            </div>

            {ledgerTotal > ledgerPageSize ? (
              <PaginationComp
                page={ledgerPage}
                pageSize={ledgerPageSize}
                total={ledgerTotal}
                onChange={setLedgerPage}
                disabled={ledgerStatementQuery.isFetching}
                showFirstLast={true}
                siblingCount={1}
                ariaLabel="Dealer ledger statement pagination"
              />
            ) : null}
          </>
        ) : (
          <div className="dealer-history-empty">
            <p>No ledger transactions found for this dealer.</p>
          </div>
        )}
      </section>
    </section>
  );
}
