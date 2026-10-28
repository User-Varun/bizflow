import "../../styles/generateBillStyles/billDetails.css";
import { useBill } from "./hooks/useBill";
import { ProductCard } from "../../ui/ProductCard.jsx";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { requestJSON } from "../../styles/utils/requestJSON.js";
import { PaginationComp } from "../../ui/PaginationComp.jsx";
import {
  formatCurrencyAmount,
  formatSignedCurrencyAmount,
  toFixedTwo,
} from "../../lib/formatters";
import { DealerSelect } from "./DealerSelect.jsx";
const STOCK_IN = import.meta.env.VITE_STOCK_IN;
const STOCK_OUT = import.meta.env.VITE_STOCK_OUT;
const baseUrl = import.meta.env.VITE_API_URL;
const BILL_ITEMS_PAGE_SIZE = 6;

export function BillDetails({ setShowInvoice, setBillId }) {
  const { state, dispatch } = useBill();
  const queryClient = useQueryClient();
  const [depositedAmount, setDepositedAmount] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [manualInvoiceDate, setManualInvoiceDate] = useState("");
  const [errorModalMessage, setErrorModalMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdInvoiceId, setCreatedInvoiceId] = useState(null);
  const [billItemsPage, setBillItemsPage] = useState(1);

  useEffect(() => {
    const totalItems = state.invoice_items?.length || 0;
    const totalPages = Math.max(
      1,
      Math.ceil(totalItems / BILL_ITEMS_PAGE_SIZE),
    );

    if (billItemsPage > totalPages) {
      setBillItemsPage(totalPages);
    }
  }, [state.invoice_items, billItemsPage]);

  const pagedInvoiceItems = useMemo(() => {
    const start = (billItemsPage - 1) * BILL_ITEMS_PAGE_SIZE;
    const end = start + BILL_ITEMS_PAGE_SIZE;
    return (state.invoice_items || []).slice(start, end);
  }, [state.invoice_items, billItemsPage]);

  const estimatedBillAmount = useMemo(() => {
    return state.invoice_items.reduce((acc, item) => {
      const baseAmount = Number(item.rate || 0) * Number(item.item_qty || 0);
      const discountPercent = Math.max(
        0,
        Math.min(100, Number(item.discount || 0)),
      );
      const discountValue = (baseAmount * discountPercent) / 100;
      const taxableAmount = Math.max(0, baseAmount - discountValue);
      const cgstAmount = (taxableAmount * Number(item.cgst || 0)) / 100;
      const sgstAmount = (taxableAmount * Number(item.sgst || 0)) / 100;

      return acc + taxableAmount + cgstAmount + sgstAmount;
    }, 0);
  }, [state.invoice_items]);

  const roundedEstimatedBillAmount = useMemo(
    () => Math.round(Number(estimatedBillAmount || 0)),
    [estimatedBillAmount],
  );

  const roundOffAmount = useMemo(() => {
    const rounded = Number(roundedEstimatedBillAmount || 0);
    const exact = Number(estimatedBillAmount || 0);
    return Number((rounded - exact).toFixed(2));
  }, [roundedEstimatedBillAmount, estimatedBillAmount]);

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
        dealer_id: "",
        invoice_to: "",
        address_to: "",
        phone_to: "",
        other_party_gst: "",
        invoice_from: mamaJiDetails.name,
        address_from: mamaJiDetails.address,
        phone_from: mamaJiDetails.phoneNo,
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
    setBillItemsPage(1);
  }

  function handleCreateAnotherBill() {
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

    setBillId(createdInvoiceId);
    setShowSuccessModal(false);
    setCreatedInvoiceId(null);
    resetBillForm();
    setShowInvoice(true);
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

    if (!state.dealer_id) {
      setErrorModalMessage(
        "Please select a dealer before generating the bill.",
      );
      return;
    }

    if (state.invoice_type === STOCK_IN && !String(state.invoice_no).trim()) {
      setErrorModalMessage(
        "Please enter supplier invoice number for stock_in bill.",
      );
      return;
    }

    if (state.invoice_type === STOCK_IN) {
      const missingCatalogItem = state.invoice_items.find((item) => {
        const catalogId = String(
          item.product_catalog_id || item.id || "",
        ).trim();
        return !catalogId;
      });

      if (missingCatalogItem) {
        setErrorModalMessage(
          `Selected item is missing product mapping: ${missingCatalogItem.name}. Remove and add it again.`,
        );
        return;
      }
    }

    const amount = Number(depositedAmount);

    if (!Number.isFinite(amount) || amount < 0) {
      setErrorModalMessage("Deposited amount cannot be less than zero.");
      return;
    }

    if (amount > roundedEstimatedBillAmount) {
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
            dealer_id: state.dealer_id,
            invoice_to: state.invoice_to,
            address_to: state.address_to,
            phone_to: state.phone_to,
            other_party_gst: state.other_party_gst,
            created_at: createdAtOverride,
          }
        : {
            invoice_type: STOCK_IN,
            dealer_id: state.dealer_id,
            supplier_invoice_number: String(state.invoice_no || "").trim(),
            invoice_from: state.invoice_from,
            address_from: state.address_from,
            phone_from: state.phone_from,
            other_party_gst: state.other_party_gst,
            created_at: createdAtOverride,
          };

    const invoiceItemsDetails = state.invoice_items.map((item) => {
      // For stock_in, item.id is product_catalog.id.
      // For stock_out, item.id is inventory.id, so use product_catalog_id only.
      const mappedProductCatalogId =
        state.invoice_type === STOCK_IN
          ? String(item.product_catalog_id || item.id || "").trim() || null
          : String(item.product_catalog_id || "").trim() || null;

      return {
        name: item.name,
        brand: item.brand,
        hsn_code: item.hsn_code,
        unit_name: item.unit_name,
        unit_qty: Number(item.unit_qty || 0),
        product_qty: Number(item.item_qty || 0),
        free_quantity: Number(item.free_quantity || 0),
        rate: Number(item.rate || 0),
        mrp: Number(item.mrp || 0),
        cgst: Number(item.cgst || 2.5),
        sgst: Number(item.sgst || 2.5),
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
      if (itemToRemove.draft_line_id) {
        return item.draft_line_id !== itemToRemove.draft_line_id;
      }

      if (item.id && itemToRemove.id) {
        return (
          item.id !== itemToRemove.id ||
          Number(item.mrp || 0) !== Number(itemToRemove.mrp || 0)
        );
      }

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
        dealer_id: "",
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

    setBillItemsPage(1);

    // then apply the value based on the invoice_type

    if (selectedType === STOCK_OUT) {
      await dispatch({
        type: "SET_FIELDS",
        payload: {
          dealer_id: "",
          invoice_from: mamaJiDetails.name,
          address_from: mamaJiDetails.address,
          phone_from: mamaJiDetails.phoneNo,
        },
      });
    } else if (selectedType === STOCK_IN) {
      await dispatch({
        type: "SET_FIELDS",
        payload: {
          dealer_id: "",
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
            <span>Select Dealer</span>
            <DealerSelect
              invoiceType={state.invoice_type}
              selectedDealerId={state.dealer_id}
              selectedDealerLabel={
                state.dealer_id
                  ? state.invoice_type === STOCK_OUT
                    ? state.invoice_to
                    : state.invoice_from
                  : ""
              }
              onSelectDealer={(dealer) => {
                const shouldResetStockInItems =
                  state.invoice_type === STOCK_IN &&
                  Boolean(state.dealer_id) &&
                  state.dealer_id !== dealer.id;

                dispatch({
                  type: "SET_FIELDS",
                  payload:
                    state.invoice_type === STOCK_OUT
                      ? {
                          dealer_id: dealer.id,
                          invoice_to: dealer.name || "",
                          address_to: dealer.address || "",
                          phone_to: dealer.phone || "",
                          other_party_gst: dealer.gst || "",
                          ...(shouldResetStockInItems ? { invoice_items: [] } : {}),
                        }
                      : {
                          dealer_id: dealer.id,
                          invoice_from: dealer.name || "",
                          address_from: dealer.address || "",
                          phone_from: dealer.phone || "",
                          other_party_gst: dealer.gst || "",
                          ...(shouldResetStockInItems ? { invoice_items: [] } : {}),
                        },
                });

                if (shouldResetStockInItems) {
                  setBillItemsPage(1);
                }
              }}
              disabled={generateInvoiceMutation.isPending}
            />
          </div>

          {state.invoice_type === STOCK_IN ? (
            <div className="form-el-container">
              <span>Supplier Invoice No</span>
              <input
                className="formEl"
                type="text"
                required
                value={state.invoice_no || ""}
                onChange={(e) =>
                  dispatch({
                    type: "SET_FIELDS",
                    payload: { invoice_no: e.target.value },
                  })
                }
                placeholder="Enter supplier invoice number"
              />
            </div>
          ) : null}
        </div>

        <div
          id="billItemsContainer"
          className={`scroll-hide ${state.invoice_items && state.invoice_items.length > 0 ? "" : "bill-items-empty"}`}
        >
          {state.invoice_items && state.invoice_items.length > 0 ? (
            pagedInvoiceItems.map((item) => {
              return (
                <ProductCard
                  res={item}
                  key={
                    item.draft_line_id ||
                    `${item.id || `${item.name}-${item.brand}`}-${item.mrp}`
                  }
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
        {state.invoice_items &&
        state.invoice_items.length > BILL_ITEMS_PAGE_SIZE ? (
          <PaginationComp
            page={billItemsPage}
            pageSize={BILL_ITEMS_PAGE_SIZE}
            total={state.invoice_items.length}
            onChange={setBillItemsPage}
            disabled={generateInvoiceMutation.isPending}
            showFirstLast={true}
            siblingCount={1}
            ariaLabel="Bill items pagination"
          />
        ) : null}
        <div className="form-sub-container">
          <div className="bill-total-summary">
            <p>
              Your Total : {formatCurrencyAmount(roundedEstimatedBillAmount)}
            </p>
            <p>Round Off : {formatSignedCurrencyAmount(roundOffAmount)}</p>
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
              onBlur={(e) =>
                setDepositedAmount(
                  toFixedTwo(e.target.value, 0, { clampMin: 0 }),
                )
              }
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
