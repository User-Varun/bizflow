import { useRef } from "react";
import { useBill } from "../features/generateBill/hooks/useBill";
import { useSearchItems } from "../features/generateBill/hooks/useSearchItems";
import {
  formatCurrencyAmount,
  formatQuantity,
  toFixedTwo,
  normalizeTaxPercent,
} from "../lib/formatters";
import "../styles/productCard.css";

export function BillCardItem({ res }) {
  const rateElRef = useRef(null);
  const mrpElRef = useRef(null);
  const discountElRef = useRef(null);

  const mrp = Number(res?.mrp ?? 0);
  const safeMrp = Number.isFinite(mrp) ? mrp : 0;
  const baseRate = Number(res?.rate ?? res?.mrp ?? 0);
  const safeBaseRate = Number.isFinite(baseRate) ? baseRate : 0;

  const { state: searchItemsState, dispatch: searchItemsDispatch } =
    useSearchItems();
  const { state: billState, dispatch: billDispatch } = useBill();
  const isStockIn = billState.invoice_type === "stock_in";
  const isStockOut = billState.invoice_type === "stock_out";
  const inventoryQty = Number(res?.product_qty || 0);
  const showInventoryQty =
    (isStockIn || isStockOut) && Number.isFinite(inventoryQty);

  function handleAddItem(e) {
    e.preventDefault();

    let billToUpdate;
    const id = String(e.currentTarget.dataset.id || res?.id || "").trim();
    if (!id) return;

    const resolvedProductCatalogId = isStockIn
      ? String(res?.product_catalog_id || res?.id || "").trim() || null
      : String(res?.product_catalog_id || "").trim() || null;
    const qty = Number(searchItemsState.quantities?.[id] || 0);
    const rawRate = searchItemsState.rate?.[id];
    const hasExplicitRate =
      rawRate !== undefined &&
      rawRate !== null &&
      String(rawRate).trim() !== "";
    const parsedExplicitRate = Number(rawRate);
    const safeRate =
      hasExplicitRate && Number.isFinite(parsedExplicitRate)
        ? Math.max(0, parsedExplicitRate)
        : safeBaseRate;
    const rawMrp = searchItemsState.mrp?.[id];
    const parsedMrp = Number(rawMrp);
    const selectedMrp =
      isStockIn &&
      rawMrp != null &&
      String(rawMrp).trim() !== "" &&
      Number.isFinite(parsedMrp)
        ? Math.max(0, parsedMrp)
        : safeMrp;
    const discountInput = Number(searchItemsState.discount?.[id] ?? 0);
    const safeDiscount = Number.isFinite(discountInput)
      ? Math.max(0, Math.min(100, discountInput))
      : 0;
    const safeCgst = normalizeTaxPercent(searchItemsState.cgst?.[id], 2.5);
    const safeSgst = normalizeTaxPercent(searchItemsState.sgst?.[id], 2.5);

    if (qty <= 0) return; // nothing to add

    const exits = billState.invoice_items.find(
      (item) =>
        String(item.id || "").trim() === id &&
        Number(item.mrp ?? 0) === selectedMrp,
    );

    if (exits) {
      // update existing item's property

      billToUpdate = billState.invoice_items.map((item) => {
        if (
          String(item.id || "").trim() !== id ||
          Number(item.mrp ?? 0) !== selectedMrp
        ) {
          return item;
        }

        if (safeRate === 0) {
          return {
            ...item,
            product_catalog_id:
              item.product_catalog_id || resolvedProductCatalogId,
            mrp: selectedMrp,
            free_quantity: Number(item.free_quantity || 0) + qty,
          };
        }

        return {
          ...item,
          product_catalog_id:
            item.product_catalog_id || resolvedProductCatalogId,
          mrp: selectedMrp,
          item_qty: Number(item.item_qty || 0) + qty,
          rate: safeRate,
          discount: safeDiscount,
          cgst: safeCgst,
          sgst: safeSgst,
        };
      });

      billDispatch({
        type: "UPDATE_BILL_ITEM",
        payload: { billToUpdate },
      });
    } else {
      // Add new item with selected quantity

      billToUpdate = [
        ...billState.invoice_items,
        {
          ...res,
          draft_line_id: `${id}-${selectedMrp}-${Date.now()}-${Math.random()}`,
          product_catalog_id: resolvedProductCatalogId,
          mrp: selectedMrp,
          item_qty: safeRate === 0 ? 0 : qty,
          free_quantity: safeRate === 0 ? qty : 0,
          rate: safeRate === 0 ? safeBaseRate : safeRate,
          discount: safeDiscount,
          cgst: safeCgst,
          sgst: safeSgst,
        },
      ];

      billDispatch({
        type: "ADD_BILL_ITEM",
        payload: { billToUpdate },
      });
    }

    // reset the selected qty for this product only
    searchItemsDispatch({ type: "RESET_QTY", payload: { id } });
    searchItemsDispatch({ type: "RESET_RATE", payload: { id } });
    searchItemsDispatch({ type: "RESET_MRP", payload: { id } });
    searchItemsDispatch({ type: "RESET_DISCOUNT", payload: { id } });
    searchItemsDispatch({ type: "RESET_CGST", payload: { id } });
    searchItemsDispatch({ type: "RESET_SGST", payload: { id } });
  }

  const manualRate = searchItemsState.rate?.[res.id];
  const displayRateValue = manualRate == null ? safeBaseRate : manualRate;
  const discountValue = searchItemsState.discount?.[res.id];
  const cgstValue = searchItemsState.cgst?.[res.id];
  const sgstValue = searchItemsState.sgst?.[res.id];

  return (
    <div className="cardItem bill-item-card" key={res.id || res.name}>
      <div className="bill-item-top-row">
        <div className="bill-item-name-wrap">
          <span className="bill-item-name">{res.name}</span>
        </div>
        <div className="bill-item-price-stack">
          <span className="bill-item-price">
            MRP: {formatCurrencyAmount(safeMrp)}
          </span>
          <span className="bill-item-rate-secondary">
            Rate: {formatCurrencyAmount(safeBaseRate)}
          </span>
        </div>
      </div>

      <div className="bill-item-meta-row">
        <span className="bill-item-brand">{res.brand}</span>
        <span className="bill-item-unit-pill">
          {formatQuantity(res.unit_qty)} {res.unit_name}
        </span>
      </div>

      {showInventoryQty && (
        <div className="bill-item-inventory-row">
          <span className="bill-item-inventory-pill">
            In stock: {formatQuantity(inventoryQty)}
          </span>
        </div>
      )}

      <div className="cardSubContainer">
        <div className="itemCounterContainer">
          <button
            className="itemContainerBtn"
            onClick={() =>
              searchItemsDispatch({
                type: "DEC_QTY",
                payload: { id: res.id },
              })
            }
          >
            -
          </button>
          <input
            className="itemContainerField itemContainerInput"
            type="number"
            min="0"
            step="any"
            placeholder="0"
            value={searchItemsState.quantities?.[res.id] ?? ""}
            onFocus={(e) => e.target.select()}
            onChange={(e) =>
              searchItemsDispatch({
                type: "SET_QTY",
                payload: { id: res.id, qty: e.target.value },
              })
            }
            onBlur={(e) =>
              searchItemsDispatch({
                type: "SET_QTY",
                payload: {
                  id: res.id,
                  qty:
                    e.target.value === ""
                      ? ""
                      : String(Math.max(0, Number(e.target.value) || 0)),
                },
              })
            }
          />
          <button
            className="itemContainerBtn"
            onClick={() =>
              searchItemsDispatch({
                type: "INC_QTY",
                payload: { id: res.id },
              })
            }
          >
            +
          </button>
        </div>

        <div
          className={`bill-price-controls ${isStockIn ? "bill-price-controls-stock-in" : ""}`}
        >
          {isStockIn ? (
            <label className="bill-field-row">
              <span className="bill-field-label">MRP</span>
              <input
                ref={mrpElRef}
                type="number"
                min="0"
                step="0.01"
                placeholder={String(safeMrp)}
                value={
                  searchItemsState.mrp?.[res.id] === undefined ||
                  searchItemsState.mrp?.[res.id] === ""
                    ? safeMrp
                    : searchItemsState.mrp[res.id]
                }
                onChange={(e) =>
                  searchItemsDispatch({
                    type: "SET_MRP",
                    payload: {
                      id: res.id,
                      inputFieldValue: e.target.value,
                    },
                  })
                }
                onMouseLeave={() => {
                  if (mrpElRef.current) mrpElRef.current.blur();
                }}
                className="rate-input"
              />
            </label>
          ) : null}
          <label className="bill-field-row">
            <span className="bill-field-label">Rate</span>
            <input
              ref={rateElRef}
              type="number"
              min="0"
              step="any"
              placeholder={String(safeBaseRate)}
              value={displayRateValue}
              onChange={(e) =>
                searchItemsDispatch({
                  type: "SET_RATE",
                  payload: { id: res.id, inputFieldValue: e.target.value },
                })
              }
              onMouseLeave={() => {
                if (rateElRef.current) rateElRef.current.blur(); // Remove focus from the input
              }}
              className="rate-input"
            />
          </label>

          <label className="bill-field-row">
            <span className="bill-field-label">Discount %</span>
            <input
              ref={discountElRef}
              type="number"
              min="0"
              max="100"
              step="0.01"
              placeholder="0"
              value={discountValue === undefined ? 0 : discountValue}
              onFocus={(e) => e.target.select()}
              onChange={(e) =>
                searchItemsDispatch({
                  type: "SET_DISCOUNT",
                  payload: { id: res.id, inputFieldValue: e.target.value },
                })
              }
              onBlur={(e) => {
                searchItemsDispatch({
                  type: "SET_DISCOUNT",
                  payload: {
                    id: res.id,
                    inputFieldValue: toFixedTwo(e.target.value, 0, {
                      clampMin: 0,
                      clampMax: 100,
                    }),
                  },
                });
              }}
              onMouseLeave={() => {
                if (discountElRef.current) discountElRef.current.blur();
              }}
              className="rate-input discount-input"
            />
          </label>

          <label className="bill-field-row">
            <span className="bill-field-label">CGST %</span>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              placeholder="2.5"
              value={cgstValue === undefined ? 2.5 : cgstValue}
              onFocus={(e) => e.target.select()}
              onChange={(e) =>
                searchItemsDispatch({
                  type: "SET_CGST",
                  payload: { id: res.id, inputFieldValue: e.target.value },
                })
              }
              onBlur={(e) =>
                searchItemsDispatch({
                  type: "SET_CGST",
                  payload: {
                    id: res.id,
                    inputFieldValue: toFixedTwo(e.target.value, 2.5, {
                      clampMin: 0,
                      clampMax: 100,
                    }),
                  },
                })
              }
              className="rate-input tax-input"
            />
          </label>

          <label className="bill-field-row">
            <span className="bill-field-label">SGST %</span>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              placeholder="2.5"
              value={sgstValue === undefined ? 2.5 : sgstValue}
              onFocus={(e) => e.target.select()}
              onChange={(e) =>
                searchItemsDispatch({
                  type: "SET_SGST",
                  payload: { id: res.id, inputFieldValue: e.target.value },
                })
              }
              onBlur={(e) =>
                searchItemsDispatch({
                  type: "SET_SGST",
                  payload: {
                    id: res.id,
                    inputFieldValue: toFixedTwo(e.target.value, 2.5, {
                      clampMin: 0,
                      clampMax: 100,
                    }),
                  },
                })
              }
              className="rate-input tax-input"
            />
          </label>
        </div>
      </div>
      <button
        data-id={res.id}
        className="bill-item-add-btn"
        onClick={(e) => handleAddItem(e)}
      >
        ADD
      </button>
    </div>
  );
}
