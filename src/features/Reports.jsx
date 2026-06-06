import { useState } from "react";
import "../styles/viewBills.css";

export function Reports() {
  const baseUrl = import.meta.env.VITE_API_URL;

  const [range, setRange] = useState("last_month");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDownload = async () => {
    try {
      setLoading(true);
      setError("");

      const payload =
        range === "custom"
          ? { dateFrom, dateTo }
          : { range };

      const res = await fetch(
        `${baseUrl}/reports/download`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to generate report");
      }

      const blob = await res.blob();

      const disposition =
        res.headers.get("content-disposition");

      let filename = "report.pdf";

      if (disposition) {
        const match =
          disposition.match(/filename="?([^"]+)"?/);

        if (match) {
          filename = match[1];
        }
      }

      const url =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;
      link.download = filename;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="view-bills-root">
      <h2>Reports</h2>

      <div style={{ marginBottom: 12 }}>
        <label>
          <input
            type="radio"
            checked={range === "last_month"}
            onChange={() =>
              setRange("last_month")
            }
          />
          Last Month
        </label>

        <label style={{ marginLeft: 12 }}>
          <input
            type="radio"
            checked={range === "this_month"}
            onChange={() =>
              setRange("this_month")
            }
          />
          This Month
        </label>

        <label style={{ marginLeft: 12 }}>
          <input
            type="radio"
            checked={range === "custom"}
            onChange={() =>
              setRange("custom")
            }
          />
          Custom Range
        </label>
      </div>

      {range === "custom" && (
        <div style={{ marginBottom: 12 }}>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) =>
              setDateFrom(e.target.value)
            }
          />

          <input
            type="date"
            value={dateTo}
            onChange={(e) =>
              setDateTo(e.target.value)
            }
            style={{ marginLeft: 8 }}
          />
        </div>
      )}

      <button
        onClick={handleDownload}
        disabled={loading}
      >
        {loading
          ? "Generating..."
          : "Download PDF Report"}
      </button>

      {error && (
        <div
          style={{
            color: "red",
            marginTop: 10,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}