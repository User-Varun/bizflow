import "../../styles/generateBillStyles/billDetails.css";
import { useBill } from "./hooks/useBill";
import { ProductCard } from "../../ui/ProductCard.jsx";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { requestJSON } from "../../styles/utils/requestJSON.js";
const STOCK_IN = import.meta.env.VITE_STOCK_IN;
const STOCK_OUT = import.meta.env.VITE_STOCK_OUT;
const baseUrl = import.meta.env.VITE_API_URL;
const DEALER_CACHE_KEY = "bizflow.dealerCache.v1";
const DEALER_CACHE_LIMIT = 20;

function safeReadDealerCache() {
  try {
    const raw = localStorage.getItem(DEALER_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistDealerCache(cache) {
  try {
    localStorage.setItem(DEALER_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage failures.
  }
}

export function BillDetails({ setShowInvoice, setBillId }) {
  const { state, dispatch } = useBill();
  const queryClient = useQueryClient();
  const [depositedAmount, setDepositedAmount] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [manualInvoiceDate, setManualInvoiceDate] = useState("");
  const [errorModalMessage, setErrorModalMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdInvoiceId, setCreatedInvoiceId] = useState(null);
  const [cachedDealers, setCachedDealers] = useState(() =>
    safeReadDealerCache(),
  );

  const totalAmount = useMemo(() => {
    return state.invoice_items.reduce(
      (acc, item) => acc + Number(item.rate || 0) * Number(item.item_qty || 0),
      0,
    );
  }, [state.invoice_items]);

  const discountAmount = useMemo(() => {
    return state.invoice_items.reduce((acc, item) => {
      const baseAmount = Number(item.rate || 0) * Number(item.item_qty || 0);
      const discountPercent = Number(item.discount || 0);

      return acc + (baseAmount * discountPercent) / 100;
    }, 0);
  }, [state.invoice_items]);

  const estimatedBillAmount = useMemo(() => {
    const cgst = Number(state.cgst || 0);
    const sgst = Number(state.sgst || 0);
    const taxPercent = cgst + sgst;
    const taxAmount = (totalAmount * taxPercent) / 100;

    return Number((totalAmount + taxAmount - discountAmount).toFixed(2));
  }, [totalAmount, discountAmount, state.cgst, state.sgst]);

  // mamaJi data (This data Will come from user Profile in future, when user auth is implemented )
  const mamaJiDetails = {
    name: "V.S. Enterprises",
    address: "667 lig 2nd scheme no. 71",
    phoneNo: 9229665110,
  };

  function resetBillForm() {
    dispatch({
      type: "SET_FIELDS",
      payload: {
        invoice_type: STOCK_OUT,
        invoice_to: "",
        address_to: "",
        phone_to: "",
        other_party_gst: "",
        invoice_from: mamaJiDetails.name,
        address_from: mamaJiDetails.address,
        phone_from: mamaJiDetails.phoneNo,
        cgst: "2.5",
        sgst: "2.5",
        invoice_items: [],
        invoice_no: "",
        total_amt: 0,
        pending_amt: 0,
        pending_invoice: true,
      },
    });

    setDepositedAmount("0");
    setPaymentMethod("cash");
    setManualInvoiceDate("");
  }

  function handleCreateAnotherBill() {
    saveCurrentDealerToCache();
    resetBillForm();
    setCreatedInvoiceId(null);
    setShowSuccessModal(false);
  }

  function handleShowInvoice() {
    if (!createdInvoiceId) {
      setShowSuccessModal(false);
      setErrorModalMessage("Invoice was created but could not be opened.");
      return;
    }

    saveCurrentDealerToCache();
    setBillId(createdInvoiceId);
    setShowSuccessModal(false);
    setCreatedInvoiceId(null);
    resetBillForm();
    setShowInvoice(true);
  }

  function getCurrentPartyFields() {
    return state.invoice_type === STOCK_OUT
      ? {
          name: String(state.invoice_to || "").trim(),
          address: String(state.address_to || "").trim(),
          phone: String(state.phone_to || "").trim(),
          gst: String(state.other_party_gst || "")
            .trim()
            .toUpperCase(),
        }
      : {
          name: String(state.invoice_from || "").trim(),
          address: String(state.address_from || "").trim(),
          phone: String(state.phone_from || "").trim(),
          gst: String(state.other_party_gst || "")
            .trim()
            .toUpperCase(),
        };
  }

  function saveCurrentDealerToCache() {
    const party = getCurrentPartyFields();
    if (!party.name || !party.phone) return;

    const cacheId = `${party.name.toLowerCase()}::${party.phone.replace(/\s+/g, "")}`;

    const next = [
      {
        id: cacheId,
        ...party,
        updatedAt: Date.now(),
      },
      ...cachedDealers.filter((dealer) => dealer.id !== cacheId),
    ].slice(0, DEALER_CACHE_LIMIT);

    setCachedDealers(next);
    persistDealerCache(next);
  }

  function handleSelectCachedDealer(selectedId) {
    if (!selectedId) return;
    const selected = cachedDealers.find((dealer) => dealer.id === selectedId);
    if (!selected) return;

    dispatch({
      type: "SET_FIELDS",
      payload:
        state.invoice_type === STOCK_OUT
          ? {
              invoice_to: selected.name || "",
              address_to: selected.address || "",
              phone_to: selected.phone || "",
              other_party_gst: selected.gst || "",
            }
          : {
              invoice_from: selected.name || "",
              address_from: selected.address || "",
              phone_from: selected.phone || "",
              other_party_gst: selected.gst || "",
            },
    });
  }

  const generateInvoiceMutation = useMutation({
    mutationFn: (payload) =>
      requestJSON(`${baseUrl}/generateInvoice`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (response) => {
      const generatedInvoiceId = response?.result?.invoiceRes?.id;
      if (!generatedInvoiceId)
        throw new Error("Invoice created but id missing");

      setCreatedInvoiceId(generatedInvoiceId);
      setShowSuccessModal(true);

      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["viewInvoices"] });
    },
    onError: (err) => {
      setErrorModalMessage(err?.message || "Failed to generate bill.");
    },
  });

  function handleSubmit(e) {
    e.preventDefault();
    setErrorModalMessage("");

    if (generateInvoiceMutation.isPending) return;

    if (state.invoice_items.length <= 0) {
      setErrorModalMessage("Please add at least one item before generating.");
      return;
    }

    const amount = Number(depositedAmount);

    if (!Number.isFinite(amount) || amount < 0) {
      setErrorModalMessage("Deposited amount cannot be less than zero.");
      return;
    }

    if (amount > estimatedBillAmount) {
      setErrorModalMessage(
        "Deposited amount cannot be greater than bill amount.",
      );
      return;
    }

    let createdAtOverride = null;
    if (manualInvoiceDate) {
      const parsed = new Date(`${manualInvoiceDate}T12:00:00`);
      if (Number.isNaN(parsed.getTime())) {
        setErrorModalMessage("Invalid invoice date selected.");
        return;
      }
      createdAtOverride = parsed.toISOString();
    }

    const invoiceDetails =
      state.invoice_type === STOCK_OUT
        ? {
            invoice_type: STOCK_OUT,
            invoice_to: state.invoice_to,
            address_to: state.address_to,
            phone_to: state.phone_to,
            other_party_gst: state.other_party_gst,
            created_at: createdAtOverride,
          }
        : {
            invoice_type: STOCK_IN,
            invoice_from: state.invoice_from,
            address_from: state.address_from,
            phone_from: state.phone_from,
            other_party_gst: state.other_party_gst,
            created_at: createdAtOverride,
          };

    const invoiceItemsDetails = state.invoice_items.map((item) => {
      // For stock_in, item.id is product_catalog.id.
      // For stock_out, item.id is inventory.id, so use product_catalog_id only.
      const mappedProductCatalogId = item.product_catalog_id || null;

      return {
        name: item.name,
        brand: item.brand,
        hsn_code: item.hsn_code,
        unit_name: item.unit_name,
        unit_qty: Number(item.unit_qty || 0),
        product_qty: Number(item.item_qty || 0),
        rate: Number(item.rate || 0),
        mrp: Number(item.mrp || 0),
        cgst: Number(state.cgst || 0),
        sgst: Number(state.sgst || 0),
        discount: Number(item.discount || 0),
        product_catalog_id: mappedProductCatalogId,
      };
    });

    const payload = {
      invoiceDetails,
      invoiceItemsDetails,
      paymentDetails: {
        amount,
        payment_method: paymentMethod,
      },
    };

    generateInvoiceMutation.mutate(payload);
  }

  function handleRemoveBillItem(itemToRemove) {
    const updatedItems = state.invoice_items.filter((item) => {
      if (item.id && itemToRemove.id) return item.id !== itemToRemove.id;

      return !(
        item.name === itemToRemove.name &&
        item.brand === itemToRemove.brand &&
        Number(item.unit_qty || 0) === Number(itemToRemove.unit_qty || 0) &&
        item.unit_name === itemToRemove.unit_name
      );
    });

    dispatch({
      type: "SET_FIELDS",
      payload: {
        invoice_items: updatedItems,
      },
    });
  }

  async function handleBillTypeChange(selectedType) {
    // Job :- Auto Filling Mama ji's detail based on invoice_Type

    await dispatch({
      type: "SET_FIELDS",
      payload: { invoice_type: selectedType },
    });

    // Clear all feilds when user change invoice_type
    await dispatch({
      type: "SET_FIELDS",
      payload: {
        invoice_from: "",
        address_from: "",
        phone_from: "",

        invoice_to: "",
        address_to: "",
        phone_to: "",
        other_party_gst: "",

        invoice_items: [],
        invoice_no: "",
        total_amt: 0,
        pending_amt: 0,
        pending_invoice: true,
      },
    });

    // then apply the value based on the invoice_type

    if (selectedType === STOCK_OUT) {
      await dispatch({
        type: "SET_FIELDS",
        payload: {
          invoice_from: mamaJiDetails.name,
          address_from: mamaJiDetails.address,
          phone_from: mamaJiDetails.phoneNo,
        },
      });
    } else if (selectedType === STOCK_IN) {
      await dispatch({
        type: "SET_FIELDS",
        payload: {
          invoice_to: mamaJiDetails.name,
          address_to: mamaJiDetails.address,
          phone_to: mamaJiDetails.phoneNo,
        },
      });
    }
  }

  return (
    <section id="billDetails">
      {errorModalMessage ? (
        <div
          className="bill-error-modal-overlay"
          onClick={() => setErrorModalMessage("")}
        >
          <div
            className="bill-error-modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bill-error-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="bill-error-title">Unable to Generate Bill</h2>
            <p>{errorModalMessage}</p>
            <button
              type="button"
              className="bill-error-ok-btn"
              onClick={() => setErrorModalMessage("")}
            >
              Okay
            </button>
          </div>
        </div>
      ) : null}

      {showSuccessModal ? (
        <div className="bill-success-modal-overlay">
          <div
            className="bill-success-modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bill-success-title"
          >
            <h2 id="bill-success-title">Bill Created Successfully</h2>
            <p>What would you like to do next?</p>
            <div className="bill-success-actions">
              <button
                type="button"
                className="bill-success-secondary-btn"
                onClick={handleCreateAnotherBill}
              >
                Create Another Bill
              </button>
              <button
                type="button"
                className="bill-success-primary-btn"
                onClick={handleShowInvoice}
              >
                Show Invoice
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <form onSubmit={handleSubmit}>
        <div className="form-sub-container">
          <div className="form-el-container">
            <span>Bill Type</span>
            <select
              className="formEl"
              id="selectEl"
              value={state.invoice_type}
              onChange={(e) => handleBillTypeChange(e.target.value)}
              name="invoice_type"
            >
              <option className="optionEl" value={STOCK_OUT}>
                stock_out
              </option>
              <option className="optionEl" value={STOCK_IN}>
                stock_in
              </option>
            </select>
          </div>

          <div className="form-el-container">
            <span>Party Name</span>
            <input
              className="formEl"
              required
              type="text"
              placeholder="e.g. arihant enterprises"
              value={
                state.invoice_type === STOCK_OUT
                  ? state.invoice_to
                  : state.invoice_from
              }
              onChange={(e) =>
                dispatch({
                  type: "SET_FIELDS",
                  payload:
                    state.invoice_type === STOCK_OUT
                      ? { invoice_to: e.target.value }
                      : { invoice_from: e.target.value },
                })
              }
            />
          </div>
        </div>

        <div className="form-sub-container">
          <div className="form-el-container">
            <span>Party Address</span>
            <input
              className="formEl"
              required
              type="text"
              placeholder="e.g near navlakha road, indore"
              value={
                state.invoice_type === STOCK_OUT
                  ? state.address_to
                  : state.address_from
              }
              onChange={(e) =>
                dispatch({
                  type: "SET_FIELDS",
                  payload:
                    state.invoice_type === STOCK_OUT
                      ? { address_to: e.target.value }
                      : { address_from: e.target.value },
                })
              }
            />
          </div>

          <div className="form-el-container">
            <span>Party Phone No.</span>
            <input
              className="formEl"
              required
              type="number"
              placeholder="e.g. XXXXX98260"
              maxLength={10}
              value={
                state.invoice_type === STOCK_OUT
                  ? state.phone_to
                  : state.phone_from
              }
              onChange={(e) =>
                dispatch({
                  type: "SET_FIELDS",
                  payload:
                    state.invoice_type === STOCK_OUT
                      ? { phone_to: e.target.value }
                      : { phone_from: e.target.value },
                })
              }
            />
          </div>
        </div>

        <div className="form-sub-container party-gst-row">
          <div className="form-el-container">
            <span>Party GST No.</span>
            <input
              className="formEl"
              required
              type="text"
              placeholder="e.g. 27ABCDE1234F1Z5"
              value={state.other_party_gst || ""}
              onChange={(e) =>
                dispatch({
                  type: "SET_FIELDS",
                  payload: { other_party_gst: e.target.value.toUpperCase() },
                })
              }
            />
          </div>

          <div className="form-el-container">
            <span>Cached Dealers</span>
            <div className="cache-dealer-controls">
              <select
                className="formEl"
                defaultValue=""
                onChange={(e) => handleSelectCachedDealer(e.target.value)}
              >
                <option value="">Select dealer</option>
                {cachedDealers.map((dealer) => (
                  <option key={dealer.id} value={dealer.id}>
                    {dealer.name} ({dealer.phone})
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="cache-dealer-btn"
                onClick={saveCurrentDealerToCache}
              >
                Save Dealer
              </button>
            </div>
          </div>
        </div>

        <div id="billItemsContainer" className="scroll-hide">
          {state.invoice_items && state.invoice_items.length > 0 ? (
            state.invoice_items.map((item) => {
              return (
                <ProductCard
                  res={item}
                  key={item.id || `${item.name}-${item.brand}`}
                  billDetailsCard={true}
                  onRemove={handleRemoveBillItem}
                />
              );
            })
          ) : (
            <span className="emptyContainerMsg">
              No Items! <br></br>Add some and watch them appear here 🙃
            </span>
          )}
        </div>
        <div className="form-sub-container">
          <p>Your Total : ₹{estimatedBillAmount}</p>
          <div className="form-sub-container2">
            <div>
              <em>CGST </em>{" "}
              <input
                className="formEl2"
                required
                type="text"
                placeholder="2.5"
                value={state.cgst}
                onChange={(e) =>
                  dispatch({
                    type: "SET_FIELDS",
                    payload: { cgst: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <em>SGST </em>{" "}
              <input
                className="formEl2"
                required
                type="text"
                placeholder="2.5"
                value={state.sgst}
                onChange={(e) =>
                  dispatch({
                    type: "SET_FIELDS",
                    payload: { sgst: e.target.value },
                  })
                }
              />
            </div>
          </div>
        </div>

        <div className="form-sub-container payment-row">
          <div className="form-el-container">
            <span>Invoice Date (optional)</span>
            <input
              className="formEl"
              type="date"
              value={manualInvoiceDate}
              onChange={(e) => setManualInvoiceDate(e.target.value)}
            />
          </div>

          <div className="form-el-container">
            <span>Deposited Amount</span>
            <input
              className="formEl"
              type="number"
              min="0"
              step="0.01"
              value={depositedAmount}
              onChange={(e) => setDepositedAmount(e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="form-el-container">
            <span>Payment Method</span>
            <select
              className="formEl"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="cash">cash</option>
              <option value="online">online</option>
              <option value="check">check</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          className={`submitBtn ${generateInvoiceMutation.isPending ? "btn-disabled" : ""}`}
          disabled={generateInvoiceMutation.isPending}
        >
          {generateInvoiceMutation.isPending
            ? "Generating..."
            : "Generate Bill"}
        </button>
      </form>
    </section>
  );
}
