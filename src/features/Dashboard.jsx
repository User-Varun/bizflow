import { useQuery, useQueryClient } from "@tanstack/react-query";
import { requestJSON } from "../utils/requestJSON";
import "../styles/dashboard.css";
import { LoadingSpinner } from "../ui/LoadingSpinner";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function KpiCard({ title, value, subtitle, tone = "neutral" }) {
  return (
    <article className={`dashboard-card dashboard-card-${tone}`}>
      <p className="dashboard-card-title">{title}</p>
      <h2 className="dashboard-card-value">{value}</h2>
      <p className="dashboard-card-subtitle">{subtitle}</p>
    </article>
  );
}

export function Dashboard() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: () =>
      requestJSON(`${import.meta.env.VITE_API_URL}/dashboard/summary`, {
        method: "GET",
      }),
    staleTime: 30000,
  });

  const summary = data?.result;

  function handleRefresh() {
    queryClient.invalidateQueries({ queryKey: ["dashboard", "summary"] });
  }

  if (isLoading) {
    return (
      <section className="below-navbar-content-container dashboard-shell">
        <LoadingSpinner label="Loading dashboard summary..." />
      </section>
    );
  }

  if (isError) {
    return (
      <section className="below-navbar-content-container dashboard-shell">
        <div className="dashboard-error">
          {error?.message || "Unable to load dashboard summary"}
        </div>
      </section>
    );
  }

  return (
    <section className="below-navbar-content-container dashboard-shell">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-eyebrow">Business Snapshot</p>
          <h1 className="dashboard-heading">This Month at a Glance</h1>
          <p className="dashboard-caption">
            Track invoices, cash flow exposure, and inventory risk in one place.
          </p>
        </div>
        <div className="dashboard-header-actions">
          <button
            className="dashboard-refresh-btn"
            onClick={handleRefresh}
            disabled={isFetching}
            title="Refresh dashboard data"
          >
            {isFetching ? "Refreshing..." : "↻ Refresh"}
          </button>
          <span className="dashboard-status" aria-live="polite">
            {isFetching ? "Refreshing..." : "Up to date"}
          </span>
        </div>
      </header>

      <div className="dashboard-grid">
        <KpiCard
          title="Total Invoices (Current Month)"
          value={summary?.total_invoices_current_month ?? 0}
          subtitle="All stock in and stock out invoices"
          tone="accent"
        />

        <KpiCard
          title="Stock Out Total (Current Month)"
          value={formatCurrency(summary?.stock_out_total_current_month)}
          subtitle="Sales billed in current month"
          tone="positive"
        />

        <KpiCard
          title="Stock In Total (Current Month)"
          value={formatCurrency(summary?.stock_in_total_current_month)}
          subtitle="Purchase billed in current month"
          tone="neutral"
        />

        <KpiCard
          title="Pending Receivable Total"
          value={formatCurrency(summary?.pending_receivable_total)}
          subtitle="Outstanding amount from stock out invoices"
          tone="warning"
        />

        <KpiCard
          title="Pending Payable Total"
          value={formatCurrency(summary?.pending_payable_total)}
          subtitle="Outstanding amount from stock in invoices"
          tone="warning"
        />

        <KpiCard
          title="Low Stock Item Count"
          value={summary?.low_stock_item_count ?? 0}
          subtitle={`Items at or below ${summary?.low_stock_threshold ?? 10} units`}
          tone="danger"
        />
      </div>
    </section>
  );
}
