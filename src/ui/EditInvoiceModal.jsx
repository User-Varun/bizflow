import { useEffect, useMemo, useState } from "react";
import "../styles/editInvoiceModal.css";

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function EditInvoiceModal({
  isOpen,
  onClose,
  invoiceData,
  sourceItems,
  sourceLoading,
  onSave,
  isSaving,
  errorMessage,
}) {
  const [partyName, setPartyName] = useState("");
  const [partyAddress, setPartyAddress] = useState("");
  const [partyPhone, setPartyPhone] = useState("");
  const [partyGst, setPartyGst] = useState("");
  const [editableItems, setEditableItems] = useState([]);
  const [selectedAddId, setSelectedAddId] = useState("");
  const [localError, setLocalError] = useState("");

  const isStockOut = invoiceData?.invoice_type === "stock_out";

  useEffect(() => {
    if (!invoiceData) return;

    if (invoiceData.invoice_type === "stock_out") {
      setPartyName(String(invoiceData.invoice_to || ""));
      setPartyAddress(String(invoiceData.address_to || ""));
      setPartyPhone(String(invoiceData.phone_to || ""));
    } else {
      setPartyName(String(invoiceData.invoice_from || ""));
      setPartyAddress(String(invoiceData.address_from || ""));
      setPartyPhone(String(invoiceData.phone_from || ""));
    }

    setPartyGst(String(invoiceData.other_party_gst || ""));

    const mappedItems = Array.isArray(invoiceData.invoice_items)
      ? invoiceData.invoice_items.map((item, index) => ({
          rowId: `${item.id || index}-${Date.now()}-${Math.random()}`,
          product_catalog_id: item.product_catalog_id || null,
          name: String(item.name || ""),
          brand: String(item.brand || ""),
          hsn_code: String(item.hsn_code || ""),
          unit_name: String(item.unit_name || ""),
          unit_qty: toNumber(item.unit_qty, 0),
          product_qty: toNumber(item.product_qty, 0),
          rate: toNumber(item.rate, 0),
          mrp: toNumber(item.mrp, 0),
          discount: toNumber(item.discount, 0),
          cgst: toNumber(item.cgst, 0),
          sgst: toNumber(item.sgst, 0),
        }))
      : [];

    setEditableItems(mappedItems);
    setSelectedAddId("");
    setLocalError("");
  }, [invoiceData]);

  const sourceOptions = useMemo(() => {
    if (!Array.isArray(sourceItems)) return [];
    return sourceItems;
  }, [sourceItems]);

  if (!isOpen) return null;

  function updateItem(rowId, key, value) {
    setEditableItems((prev) =>
      prev.map((item) =>
        item.rowId === rowId ? { ...item, [key]: value } : item,
      ),
    );
  }

  function removeItem(rowId) {
    setEditableItems((prev) => prev.filter((item) => item.rowId !== rowId));
  }

  function addSelectedItem() {
    setLocalError("");
    if (!selectedAddId) return;

    const selected = sourceOptions.find(
      (item) => String(item.id) === selectedAddId,
    );
    if (!selected) return;

    setEditableItems((prev) => [
      ...prev,
      {
        rowId: `${selected.id}-${Date.now()}-${Math.random()}`,
        product_catalog_id: selected.product_catalog_id || selected.id || null,
        name: String(selected.name || ""),
        brand: String(selected.brand || ""),
        hsn_code: String(selected.hsn_code || ""),
        unit_name: String(selected.unit_name || ""),
        unit_qty: toNumber(selected.unit_qty, 0),
        product_qty: 1,
        rate: toNumber(selected.rate ?? selected.mrp, 0),
        mrp: toNumber(selected.mrp, 0),
        discount: 0,
        cgst: editableItems?.[0]?.cgst ?? 0,
        sgst: editableItems?.[0]?.sgst ?? 0,
      },
    ]);

    setSelectedAddId("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLocalError("");

    if (
      !partyName.trim() ||
      !partyAddress.trim() ||
      !partyPhone.trim() ||
      !partyGst.trim()
    ) {
      setLocalError("Party details are required.");
      return;
    }

    if (!editableItems.length) {
      setLocalError("At least one item is required.");
      return;
    }

    const normalizedItems = editableItems.map((item) => ({
      product_catalog_id: item.product_catalog_id || null,
      name: String(item.name || "").trim(),
      brand: String(item.brand || "").trim(),
      hsn_code: String(item.hsn_code || "").trim(),
      unit_name: String(item.unit_name || "").trim(),
      unit_qty: toNumber(item.unit_qty, 0),
      product_qty: toNumber(item.product_qty, 0),
      rate: toNumber(item.rate, 0),
      mrp: toNumber(item.mrp, 0),
      discount: toNumber(item.discount, 0),
      cgst: toNumber(item.cgst, 0),
      sgst: toNumber(item.sgst, 0),
    }));

    const payload = {
      invoiceDetails: isStockOut
        ? {
            invoice_to: partyName,
            address_to: partyAddress,
            phone_to: partyPhone,
            other_party_gst: partyGst,
          }
        : {
            invoice_from: partyName,
            address_from: partyAddress,
            phone_from: partyPhone,
            other_party_gst: partyGst,
          },
      invoiceItemsDetails: normalizedItems,
    };

    await onSave(payload);
  }

  return (
    <div className="edit-invoice-modal-overlay" onClick={onClose}>
      <div
        className="edit-invoice-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Edit invoice"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="edit-invoice-header">
          <h2>Edit Invoice</h2>
          <button
            type="button"
            className="edit-invoice-close"
            onClick={onClose}
          >
            x
          </button>
        </div>

        <div className="edit-invoice-lock-info">
          <span>
            Locked: Invoice No, Bill Type, Created Date, Payment History
          </span>
          <p>
            #{invoiceData?.invoice_number || "-"} |{" "}
            {invoiceData?.invoice_type || "-"}
          </p>
        </div>

        <form className="edit-invoice-form" onSubmit={handleSubmit}>
          <div className="edit-invoice-party-grid">
            <label>
              Party Name
              <input
                type="text"
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                required
              />
            </label>
            <label>
              Party Address
              <input
                type="text"
                value={partyAddress}
                onChange={(e) => setPartyAddress(e.target.value)}
                required
              />
            </label>
            <label>
              Party Phone
              <input
                type="text"
                value={partyPhone}
                onChange={(e) => setPartyPhone(e.target.value)}
                required
              />
            </label>
            <label>
              Party GST
              <input
                type="text"
                value={partyGst}
                onChange={(e) => setPartyGst(e.target.value.toUpperCase())}
                required
              />
            </label>
          </div>

          <div className="edit-invoice-add-row">
            <select
              value={selectedAddId}
              onChange={(e) => setSelectedAddId(e.target.value)}
              disabled={sourceLoading}
            >
              <option value="">Select item to add</option>
              {sourceOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.brand})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={addSelectedItem}
              disabled={!selectedAddId}
            >
              Add Item
            </button>
          </div>

          <div className="edit-invoice-items-wrap scroll-hide">
            <table className="edit-invoice-items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Disc %</th>
                  <th>Remove</th>
                </tr>
              </thead>
              <tbody>
                {editableItems.map((item) => (
                  <tr key={item.rowId}>
                    <td>
                      <div className="edit-item-name">{item.name}</div>
                      <div className="edit-item-meta">
                        {item.brand} | {item.unit_qty} {item.unit_name}
                      </div>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={item.product_qty}
                        onChange={(e) =>
                          updateItem(item.rowId, "product_qty", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.rate}
                        onChange={(e) =>
                          updateItem(item.rowId, "rate", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={item.discount}
                        onChange={(e) =>
                          updateItem(item.rowId, "discount", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => removeItem(item.rowId)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {localError ? (
            <p className="edit-invoice-error">{localError}</p>
          ) : null}
          {errorMessage ? (
            <p className="edit-invoice-error">{errorMessage}</p>
          ) : null}

          <div className="edit-invoice-actions">
            <button type="button" onClick={onClose} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
