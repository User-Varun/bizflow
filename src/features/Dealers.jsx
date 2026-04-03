import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { requestJSON } from "../styles/utils/requestJSON";
import { PaginationComp } from "../ui/PaginationComp";
import { LoadingSpinner } from "../ui/LoadingSpinner";
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
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formState, setFormState] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState("");

  const normalizedSearch = search.trim();

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

  function handleTypeChange(nextType) {
    setActiveType(nextType);
    setPage(1);
    setSearch("");
    setShowAddForm(false);
    setFormError("");
    setFormState((prev) => ({ ...prev, invoice_type: nextType }));
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
    <section className="below-navbar-content-container dealers-shell">
      <header className="dealers-header">
        <h1>Dealers</h1>
        <button
          type="button"
          className="dealers-primary-btn"
          onClick={() => {
            setShowAddForm((prev) => !prev);
            setFormError("");
          }}
        >
          {showAddForm ? "Close" : "Add Dealer"}
        </button>
      </header>

      <section className="dealers-toolbar">
        <div
          className="dealer-type-tabs"
          role="tablist"
          aria-label="Dealer type"
        >
          {DEALER_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              className={`dealer-type-tab ${activeType === type.value ? "active" : ""}`}
              onClick={() => handleTypeChange(type.value)}
            >
              {type.label}
            </button>
          ))}
        </div>

        <input
          className="dealers-search"
          type="text"
          value={search}
          placeholder="Search by name, phone, GST or address"
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </section>

      {showAddForm ? (
        <form className="dealers-form" onSubmit={handleAddDealerSubmit}>
          <h2>Add Dealer</h2>

          <div className="dealers-form-grid">
            <label>
              Name
              <input
                type="text"
                value={formState.name}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g. Arihant Enterprises"
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
                placeholder="e.g. 9826012345"
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
                placeholder="e.g. 27ABCDE1234F1Z5"
              />
            </label>

            <label className="dealers-form-wide">
              Address
              <input
                type="text"
                value={formState.address}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, address: e.target.value }))
                }
                placeholder="e.g. Near Navlakha Road, Indore"
              />
            </label>
          </div>

          {formError ? <p className="dealers-error">{formError}</p> : null}

          <button
            type="submit"
            className="dealers-primary-btn"
            disabled={saveDealerMutation.isPending}
          >
            {saveDealerMutation.isPending ? "Saving..." : "Save Dealer"}
          </button>
        </form>
      ) : null}

      <section className="dealers-list scroll-hide">
        {dealersQuery.isLoading ? (
          <LoadingSpinner label="Loading dealers..." />
        ) : dealers.length > 0 ? (
          dealers.map((dealer) => (
            <button
              key={dealer.id}
              type="button"
              className="dealer-card"
              onClick={() => openDealerProfile(dealer.id)}
            >
              <div className="dealer-card-top">
                <h3>{dealer.name}</h3>
                <span className="dealer-type-chip">{activeType}</span>
              </div>
              <p>
                <strong>Phone:</strong> {dealer.phone || "-"}
              </p>
              <p>
                <strong>GST:</strong> {dealer.gst || "-"}
              </p>
              <p className="dealer-address">
                <strong>Address:</strong> {dealer.address || "-"}
              </p>
            </button>
          ))
        ) : (
          <div className="dealers-empty-state">
            <h2>No dealers found</h2>
            <p>
              Add your first{" "}
              {activeType === "stock_out" ? "customer" : "supplier"} to start
              billing.
            </p>
            <button
              type="button"
              className="dealers-primary-btn"
              onClick={() => setShowAddForm(true)}
            >
              Add Dealer
            </button>
          </div>
        )}
      </section>

      {total > pageSize ? (
        <PaginationComp
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
