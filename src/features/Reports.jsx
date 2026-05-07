import { useState } from "react";
import { requestJSON } from "../styles/utils/requestJSON";
import "../styles/viewBills.css";

export function Reports() {
  const baseUrl = import.meta.env.VITE_API_URL;
  const [range, setRange] = useState("last_month");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDownload = async () => {
    setError("");
    setLoading(true);
    try {
      const payload =
        range === "custom" ? { dateFrom, dateTo } : { range };

      const res = await fetch(`${baseUrl}/reports/download-bills`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "download failed");
      }

      const blob = await res.blob();
      const disposition = res.headers.get("content-disposition") || "";
      let filename = "bills.zip";
      const match = /filename="?([^";]+)"?/.exec(disposition);
      if (match) filename = match[1];

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setError(String(e.message || e));
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
            name="range"
            value="last_month"
            checked={range === "last_month"}
            onChange={() => setRange("last_month")}
          />
          Last month
        </label>
        <label style={{ marginLeft: 12 }}>
          <input
            type="radio"
            name="range"
            value="this_month"
            checked={range === "this_month"}
            onChange={() => setRange("this_month")}
          />
          This month
        </label>
        <label style={{ marginLeft: 12 }}>
          <input
            type="radio"
            name="range"
            value="custom"
            checked={range === "custom"}
            onChange={() => setRange("custom")}
          />
          Custom
        </label>
      </div>

      {range === "custom" && (
        <div style={{ marginBottom: 12 }}>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <input style={{ marginLeft: 8 }} type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      )}

      <div>
        <button onClick={handleDownload} disabled={loading}>
          {loading ? "Preparing..." : "Download ZIP"}
        </button>
      </div>

      {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
    </div>
  );
}
