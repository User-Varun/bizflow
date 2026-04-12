import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useMemo, useState } from "react";
import { requestJSON } from "../styles/utils/requestJSON";
import "../styles/dashboard.css";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { formatCurrencyAmount, formatQuantity } from "../lib/formatters";

function formatCurrency(value) {
  return formatCurrencyAmount(value);
}

function KpiCard({ title, value, subtitle, tone = "neutral", onClick }) {
  const cardClass = [
    "dashboard-card",
    `dashboard-card-${tone}`,
    onClick ? "dashboard-card-clickable" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      className={cardClass}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (!onClick) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <p className="dashboard-card-title">{title}</p>
      <h2 className="dashboard-card-value">{value}</h2>
      <p className="dashboard-card-subtitle">{subtitle}</p>
      {onClick ? (
        <p className="dashboard-card-hint" aria-hidden="true">
          Click to view details <span>→</span>
        </p>
      ) : null}
    </article>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [rangeType, setRangeType] = useState("month");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const currentMonthBounds = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return {
      from: `${year}-${month}-01`,
      to: `${year}-${month}-${day}`,
    };
  }, []);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["dashboard", "summary", { rangeType, dateFrom, dateTo }],
    queryFn: () => {
      const params = new URLSearchParams({ rangeType });
      if (rangeType === "custom") {
        params.set("dateFrom", dateFrom);
        params.set("dateTo", dateTo);
      }

      return requestJSON(
        `${import.meta.env.VITE_API_URL}/dashboard/summary?${params.toString()}`,
        {
          method: "GET",
        },
      );
    },
    enabled: rangeType !== "custom" || (Boolean(dateFrom) && Boolean(dateTo)),
    staleTime: 30000,
  });

  const summary = data?.result;
  const periodLabel = summary?.period_label || "This Month";

  function handleRangeTypeChange(nextRangeType) {
    setRangeType(nextRangeType);
    if (nextRangeType === "custom") {
      setDateFrom((prev) => prev || currentMonthBounds.from);
      setDateTo((prev) => prev || currentMonthBounds.to);
    }
  }

  function handleRefresh() {
    queryClient.invalidateQueries({ queryKey: ["dashboard", "summary"] });
  }

  if (isLoading) {
    return (
      <section className="below-navbar-content-container dashboardShell">
        <div className="dashboard-shell">
          <LoadingSpinner label="Loading dashboard summary..." />
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="below-navbar-content-container dashboardShell">
        <div className="dashboard-shell">
          <div className="dashboard-error">
            {error?.message || "Unable to load dashboard summary"}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="below-navbar-content-container dashboardShell">
      <div className="dashboard-shell">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-eyebrow">Business Snapshot</p>
            <h1 className="dashboard-heading">Your Business at a Glance</h1>
            <p className="dashboard-caption">
              Track invoices, cash flow exposure, and inventory risk here in one
              place.
            </p>
          </div>
          <div className="dashboard-header-actions">
            <div
              className="dashboard-filters"
              role="group"
              aria-label="Dashboard date filters"
            >
              <select
                value={rangeType}
                onChange={(e) => handleRangeTypeChange(e.target.value)}
                className="dashboard-filter-select"
                aria-label="Choose dashboard insight range"
              >
                <option value="today">Today</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
                <option value="custom">Custom Range</option>
              </select>

              {rangeType === "custom" ? (
                <>
                  <input
                    type="date"
                    className="dashboard-filter-date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    aria-label="From date"
                  />
                  <input
                    type="date"
                    className="dashboard-filter-date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    aria-label="To date"
                  />
                </>
              ) : null}
            </div>
            <button
              className="dashboard-refresh-btn"
              onClick={handleRefresh}
              disabled={isFetching}
              title="Refresh dashboard data"
            >
              {isFetching ? "Refreshing..." : "↻ Refresh"}
            </button>
            <span className="dashboard-status" aria-live="polite">
              {isFetching ? "Refreshing..." : periodLabel}
            </span>
          </div>
        </header>

        <div className="dashboard-grid">
          <KpiCard
            title="Total Invoices"
            value={formatQuantity(summary?.total_invoices_current_month ?? 0)}
            subtitle={`All stock in and stock out invoices for ${periodLabel}`}
            tone="accent"
            onClick={() => navigate("/viewBills?billType=all")}
          />

          <KpiCard
            title="Stock Out Total"
            value={formatCurrency(summary?.stock_out_total_current_month)}
            subtitle={`Sales billed for ${periodLabel}`}
            tone="positive"
            onClick={() => navigate("/viewBills?billType=stock_out")}
          />

          <KpiCard
            title="Stock In Total"
            value={formatCurrency(summary?.stock_in_total_current_month)}
            subtitle={`Purchase billed for ${periodLabel}`}
            tone="neutral"
            onClick={() => navigate("/viewBills?billType=stock_in")}
          />

          <KpiCard
            title="Pending Receivable Total"
            value={formatCurrency(summary?.pending_receivable_total)}
            subtitle="Outstanding amount from stock out invoices"
            tone="warning"
            onClick={() =>
              navigate("/viewBills?billType=stock_out&billState=open")
            }
          />

          <KpiCard
            title="Pending Payable Total"
            value={formatCurrency(summary?.pending_payable_total)}
            subtitle="Outstanding amount from stock in invoices"
            tone="warning"
            onClick={() =>
              navigate("/viewBills?billType=stock_in&billState=open")
            }
          />

          <KpiCard
            title="Out Of Stock Item Count"
            value={formatQuantity(summary?.out_of_stock_item_count ?? 0)}
            subtitle="Items currently at zero stock"
            tone="danger"
            onClick={() => navigate("/inventory?stockStatus=out_of_stock")}
          />
        </div>
      </div>
    </section>
  );
}
