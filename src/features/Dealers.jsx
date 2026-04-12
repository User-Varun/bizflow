import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { requestJSON } from "../styles/utils/requestJSON";
import { PaginationComp } from "../ui/PaginationComp";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { SearchBar } from "../ui/SearchBar";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import "../styles/dealers.css";

const baseUrl = import.meta.env.VITE_API_URL;

const DEALER_TYPES = [
  { value: "stock_out", label: "Customers" },
  { value: "stock_in", label: "Suppliers" },
];

const INITIAL_FORM = {
  invoice_type: "stock_out",
  name: "",
  address: "",
  phone: "",
  gst: "",
};

export function Dealers() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeType, setActiveType] = useState("stock_out");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formState, setFormState] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState("");

  const debouncedSearch = useDebouncedValue(searchInput, 350);
  const normalizedSearch = debouncedSearch.trim();

  const dealersQuery = useQuery({
    queryKey: ["dealers", activeType, page, pageSize, normalizedSearch],
    queryFn: () =>
      requestJSON(
        `${baseUrl}/dealers?invoice_type=${encodeURIComponent(activeType)}&page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(normalizedSearch)}`,
      ),
    staleTime: 30000,
    placeholderData: (prev) => prev,
  });

  const saveDealerMutation = useMutation({
    mutationFn: (payload) =>
      requestJSON(`${baseUrl}/dealers`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dealers"] });
      setShowAddForm(false);
      setFormState({ ...INITIAL_FORM, invoice_type: activeType });
      setFormError("");
    },
    onError: (err) => {
      setFormError(err?.message || "Failed to save dealer.");
    },
  });

  const dealers = useMemo(() => {
    return Array.isArray(dealersQuery.data?.result)
      ? dealersQuery.data.result
      : [];
  }, [dealersQuery.data]);

  const total = Number(dealersQuery.data?.meta?.total || 0);

  function handleTypeChange(nextType, options = {}) {
    const { closeForm = true } = options;
    setActiveType(nextType);
    setPage(1);
    setSearchInput("");
    if (closeForm) {
      setShowAddForm(false);
    }
    setFormError("");
    setFormState((prev) => ({ ...prev, invoice_type: nextType }));
  }

  function closeDealerForm() {
    if (saveDealerMutation.isPending) return;
    setShowAddForm(false);
    setFormError("");
    setFormState({ ...INITIAL_FORM, invoice_type: activeType });
  }

  function handleAddDealerSubmit(e) {
    e.preventDefault();
    setFormError("");

    const payload = {
      invoice_type: activeType,
      name: String(formState.name || "").trim(),
      address: String(formState.address || "").trim(),
      phone: String(formState.phone || "")
        .replace(/\s+/g, "")
        .trim(),
      gst: String(formState.gst || "")
        .trim()
        .toUpperCase(),
    };

    if (!payload.name || !payload.phone) {
      setFormError("Dealer name and phone are required.");
      return;
    }

    saveDealerMutation.mutate(payload);
  }

  function openDealerProfile(dealerId) {
    navigate(`/dealers/${activeType}/${dealerId}`);
  }

  return (
    <section
      className={`below-navbar-content-container dealersCatalogShell ${showAddForm ? "blurred" : ""}`}
    >
      {showAddForm ? (
        <div className="dealers-modal-overlay" onClick={closeDealerForm}>
          <div
            className="dealers-modal-content"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h1 className="dealers-modal-heading">Add Dealer</h1>

            <form className="dealersFormGrid" onSubmit={handleAddDealerSubmit}>
              <label>
                Dealer Type
                <select
                  value={activeType}
                  onChange={(e) =>
                    handleTypeChange(e.target.value, { closeForm: false })
                  }
                >
                  <option value="stock_out">stock_out (customer)</option>
                  <option value="stock_in">stock_in (supplier)</option>
                </select>
              </label>

              <label>
                Name
                <input
                  type="text"
                  value={formState.name}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Dealer name"
                  required
                />
              </label>

              <label>
                Phone
                <input
                  type="text"
                  value={formState.phone}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="Phone number"
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
                  placeholder="GST number"
                />
              </label>

              <label className="dealersFormWide">
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
                  placeholder="Address"
                />
              </label>

              <button
                type="submit"
                className={`dealersSubmitBtn ${saveDealerMutation.isPending ? "dealersSubmitBtnDisabled" : ""}`}
                disabled={saveDealerMutation.isPending}
              >
                {saveDealerMutation.isPending ? "Saving..." : "Save Dealer"}
              </button>
            </form>

            {formError ? <p className="dealersFormError">{formError}</p> : null}

            <button
              className="dealers-modal-close"
              onClick={closeDealerForm}
              aria-label="Close"
              disabled={saveDealerMutation.isPending}
            >
              ×
            </button>
          </div>
        </div>
      ) : null}

      <div id="dealersInnerHeader">
        <SearchBar
          widthInPercent={70}
          searchQuery={searchInput}
          setSearchQuery={(value) => {
            setSearchInput(value);
            setPage(1);
          }}
          placeholder="Search Dealers"
        />

        <div className="dealersHeaderControls">
          <section
            className="dealersTypeTabs"
            role="tablist"
            aria-label="Dealer type"
          >
            {DEALER_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                className={`dealerTypeTab ${activeType === type.value ? "active" : ""}`}
                onClick={() => handleTypeChange(type.value)}
              >
                {type.label}
              </button>
            ))}
          </section>

          <button
            type="button"
            className="dealersAddBtn"
            onClick={() => {
              setShowAddForm(true);
              setFormError("");
            }}
          >
            + Add Dealer
          </button>
        </div>
      </div>

      <section
        className={`dealersCatalogContainer scroll-hide ${!dealersQuery.isLoading && dealers.length === 0 ? "dealersCatalogContainerEmpty" : ""}`}
      >
        {dealersQuery.isLoading ? (
          <LoadingSpinner label="Loading dealers..." />
        ) : dealers.length > 0 ? (
          dealers.map((dealer) => (
            <button
              key={dealer.id}
              type="button"
              className="dealerCard"
              onClick={() => openDealerProfile(dealer.id)}
            >
              <div className="dealerCardTop">
                <h3 title={dealer.name}>{dealer.name}</h3>
              </div>

              <div className="dealerCardDetails">
                <div className="dealerDetailItem">
                  <label>Phone</label>
                  <p>{dealer.phone || "-"}</p>
                </div>
                <div className="dealerDetailItem">
                  <label>GST</label>
                  <p>{dealer.gst || "-"}</p>
                </div>
                <div className="dealerDetailItem dealerDetailItemFull">
                  <label>Address</label>
                  <p title={dealer.address || ""}>{dealer.address || "-"}</p>
                </div>
              </div>

              <div className="dealerCardHint">Open details -></div>
            </button>
          ))
        ) : (
          <div className="dealersEmptyState">
            <svg viewBox="0 0 64 64" aria-hidden="true">
              <path d="M8 18a2 2 0 0 1 2-2h44a2 2 0 0 1 1.73 1l6 10.4a2 2 0 0 1 .27 1v18.6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V28.4a2 2 0 0 1 .27-1L8 17.98V18Zm1.85 2-4.7 8.13H58.9L54.2 20H9.85ZM4 30v16h56V30H4Zm16 4h4v8h-4v-8Zm8 0h4v8h-4v-8Zm8 0h4v8h-4v-8Z" />
            </svg>
            <h2>No dealers found</h2>
            <p>
              Add your first{" "}
              {activeType === "stock_out" ? "customer" : "supplier"} to start
              billing.
            </p>
            <button
              type="button"
              className="dealersAddBtn"
              onClick={() => setShowAddForm(true)}
            >
              Add Dealer
            </button>
          </div>
        )}
      </section>

      {dealers.length > 0 && total > pageSize ? (
        <PaginationComp
          className="dealersHeaderPagination"
          page={page}
          pageSize={pageSize}
          total={total}
          onChange={setPage}
          disabled={dealersQuery.isFetching}
          showFirstLast={true}
          siblingCount={1}
          ariaLabel="Dealers pagination"
        />
      ) : null}
    </section>
  );
}
