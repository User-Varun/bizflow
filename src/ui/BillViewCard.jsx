import "../styles/billViewCard.css";
import { useEffect, useState } from "react";

export function BillViewCard({
  res,
  setShowInvoice,
  setId,
  onPay,
  onUpdateDate,
  onEditInvoice,
  isPaying,
  isUpdatingDate,
  isEditingInvoice,
}) {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [localCreatedAt, setLocalCreatedAt] = useState(res?.createdAt || null);
  const [editDate, setEditDate] = useState(() => {
    if (!res?.createdAt) return "";
    const d = new Date(res.createdAt);
    if (Number.isNaN(d.getTime())) return "";
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setLocalCreatedAt(res?.createdAt || null);
  }, [res?.createdAt]);

  useEffect(() => {
    if (!success) return;
    const timerId = setTimeout(() => setSuccess(""), 2500);
    return () => clearTimeout(timerId);
  }, [success]);

  const truncate = (text, max = 20) => {
    if (!text) return "";
    const str = String(text);
    return str.length > max ? `${str.slice(0, max).trimEnd()}...` : str;
  };

  // Format createdAt as DD-MM-YYYY using UTC to avoid timezone shifts
  const formattedDate = (() => {
    if (!localCreatedAt) return "";
    const d = new Date(localCreatedAt);
    if (Number.isNaN(d.getTime())) return "";
    const day = String(d.getUTCDate()).padStart(2, "0");
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = monthNames[d.getUTCMonth()] || "";
    const year = d.getUTCFullYear();
    return `${day}-${month}-${year}`;
  })();

  const pendingAmount = Number(res?.pending_amount || 0);
  const roundedPendingAmount = Math.round(pendingAmount);
  const isPaid = String(res?.bill_state || "") === "paid" || pendingAmount <= 0;

  async function handlePay() {
    setError("");

    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Enter a payment amount greater than 0.");
      return;
    }

    if (parsedAmount > pendingAmount) {
      setError("Payment amount cannot be greater than pending bill amount.");
      return;
    }

    try {
      await onPay({ amount: parsedAmount, payment_method: paymentMethod });
      setAmount("");
    } catch (err) {
      setError(err?.message || "Failed to add payment.");
    }
  }

  async function handleUpdateDate() {
    if (!onUpdateDate) return;

    setError("");
    setSuccess("");
    if (!editDate) {
      setError("Please select a valid date.");
      return;
    }

    try {
      const created_at = new Date(`${editDate}T12:00:00`).toISOString();
      const response = await onUpdateDate({ created_at });
      const persistedCreatedAt = response?.result?.createdAt || created_at;

      setLocalCreatedAt(persistedCreatedAt);
      setSuccess("Date updated successfully.");
    } catch (err) {
      setError(err?.message || "Failed to update invoice date.");
    }
  }

  return (
    <div className="billCard">
      <div className="billCardList">
        <div className="billCardField">
          <p className="billCardLabel">Invoice No</p>
          <p className="billCardValue">{res.invoice_number || "-"}</p>
        </div>

        <div className="billCardField">
          <p className="billCardLabel">Bill Type</p>
          <p className="billCardValue">{res.invoice_type}</p>
        </div>

        <div className="billCardField">
          <p className="billCardLabel">Buyer</p>
          <p className="billCardValue">{truncate(res.invoice_to)}</p>
        </div>

        <div className="billCardField">
          <p className="billCardLabel">Seller</p>
          <p className="billCardValue">{truncate(res.invoice_from)}</p>
        </div>

        <div className="billCardField">
          <p className="billCardLabel">Created At</p>
          <p className="billCardValue">{formattedDate}</p>
        </div>

        <div className="billCardField">
          <p className="billCardLabel">Status</p>
          <p className="billCardValue">
            <strong className={`bill-state-chip bill-state-${res.bill_state}`}>
              {res.bill_state}
            </strong>
          </p>
        </div>

        <div className="billCardField billCardFieldPending">
          <p className="billCardLabel">Pending</p>
          <p className="billCardValue billPendingValue">
            ₹{roundedPendingAmount}
          </p>
        </div>
      </div>

      <div className="bill-card-actions-col">
        <div className="bill-payment-box">
          <input
            type="number"
            min="0"
            step="0.01"
            className="bill-pay-input"
            placeholder="Pay amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isPaid || isPaying}
          />
          <select
            className="bill-pay-select"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            disabled={isPaid || isPaying}
          >
            <option value="cash">cash</option>
            <option value="online">online</option>
            <option value="check">check</option>
          </select>
          <button
            type="button"
            className="bill-card-btn bill-pay-btn"
            onClick={handlePay}
            disabled={isPaid || isPaying}
          >
            {isPaid ? "Paid" : isPaying ? "Paying..." : "Add Payment"}
          </button>
        </div>

        <div className="bill-date-box">
          <input
            type="date"
            className="bill-pay-input bill-date-input"
            value={editDate}
            onChange={(e) => setEditDate(e.target.value)}
            disabled={isUpdatingDate}
          />
          <button
            type="button"
            className="bill-card-btn bill-date-btn"
            onClick={handleUpdateDate}
            disabled={isUpdatingDate}
          >
            {isUpdatingDate ? "Updating..." : "Update Date"}
          </button>
        </div>

        {error ? <p className="bill-pay-error">{error}</p> : null}
        {success ? <p className="bill-date-success">{success}</p> : null}

        <button
          className="bill-card-btn"
          onClick={() => {
            setId(res.id);
            setShowInvoice(true);
          }}
        >
          Open Invoice
        </button>

        <button
          type="button"
          className="bill-card-btn"
          onClick={onEditInvoice}
          disabled={isEditingInvoice}
        >
          {isEditingInvoice ? "Saving..." : "Edit Invoice"}
        </button>
      </div>
    </div>
  );
}
