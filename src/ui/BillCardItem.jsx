import { useRef } from "react";
import { useBill } from "../features/generateBill/hooks/useBill";
import { useSearchItems } from "../features/generateBill/hooks/useSearchItems";
import "../styles/productCard.css";

export function BillCardItem({ res }) {
  const rateElRef = useRef(null);
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
    const id = e.target.dataset.id; // get will get data attribute named "data-id"
    const qty = searchItemsState.quantities?.[id] || 0;
    const inputRate = Number(searchItemsState.rate?.[id]);
    const safeRate = Number.isFinite(inputRate) ? inputRate : safeBaseRate;
    const discountInput = Number(searchItemsState.discount?.[id] ?? 0);
    const safeDiscount = Number.isFinite(discountInput)
      ? Math.max(0, Math.min(100, discountInput))
      : 0;

    if (qty <= 0) return; // nothing to add

    const exits = billState.invoice_items.find((item) => item.id == id);

    if (exits) {
      // update existing item's property

      billToUpdate = billState.invoice_items.map((item) => {
        return item.id === id
          ? {
              ...item,
              item_qty: (item.item_qty || 0) + qty,
              rate: safeRate,
              discount: safeDiscount,
            }
          : item;
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
          item_qty: qty,
          rate: safeRate,
          discount: safeDiscount,
        },
      ];

      billDispatch({
        type: "ADD_BILL_ITEM",
        payload: { billToUpdate },
      });
    }

    // reset the selected qty for this product only
    searchItemsDispatch({ type: "RESET_QTY", payload: { id: res.id } });
    searchItemsDispatch({ type: "RESET_RATE", payload: { id: res.id } });
    searchItemsDispatch({
      type: "RESET_PURCHASE_RATE_PERCENT",
      payload: { id: res.id },
    });
    searchItemsDispatch({ type: "RESET_DISCOUNT", payload: { id: res.id } });
  }

  const manualRate = searchItemsState.rate?.[res.id];
  const displayRateValue =
    manualRate === "" || manualRate == null ? safeBaseRate : manualRate;
  const purchasePercentValue = searchItemsState.purchaseRatePercent?.[res.id];
  const discountValue = searchItemsState.discount?.[res.id];

  return (
    <div className="cardItem bill-item-card" key={res.id || res.name}>
      <div className="bill-item-top-row">
        <div className="bill-item-name-wrap">
          <span className="bill-item-name">{res.name}</span>
        </div>
        <div className="bill-item-price-stack">
          <span className="bill-item-price">MRP: ₹{safeMrp}</span>
          <span className="bill-item-rate-secondary">
            Rate: ₹{safeBaseRate}
          </span>
        </div>
      </div>

      <div className="bill-item-meta-row">
        <span className="bill-item-brand">{res.brand}</span>
        <span className="bill-item-unit-pill">
          {res.unit_qty} {res.unit_name}
        </span>
      </div>

      {showInventoryQty && (
        <div className="bill-item-inventory-row">
          <span className="bill-item-inventory-pill">
            In stock: {inventoryQty}
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
            step="1"
            placeholder="0"
            value={searchItemsState.quantities?.[res.id] ?? ""}
            onFocus={(e) => e.target.select()}
            onChange={(e) =>
              searchItemsDispatch({
                type: "SET_QTY",
                payload: { id: res.id, qty: e.target.value },
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
          {!isStockIn ? (
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Purchase %"
              value={
                purchasePercentValue === undefined ? 0 : purchasePercentValue
              }
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                const rawPercent = e.target.value;

                searchItemsDispatch({
                  type: "SET_PURCHASE_RATE_PERCENT",
                  payload: { id: res.id, inputFieldValue: rawPercent },
                });

                if (rawPercent === "") {
                  searchItemsDispatch({
                    type: "SET_RATE",
                    payload: {
                      id: res.id,
                      inputFieldValue: safeBaseRate,
                    },
                  });
                  return;
                }

                const percent = Number(rawPercent);
                if (!Number.isFinite(percent) || percent < 0) return;

                const computedRate = safeBaseRate * (1 + percent / 100);
                searchItemsDispatch({
                  type: "SET_RATE",
                  payload: {
                    id: res.id,
                    inputFieldValue: Number(computedRate.toFixed(2)),
                  },
                });
              }}
              className="rate-input purchase-rate-input"
            />
          ) : null}

          <input
            ref={rateElRef}
            type="number"
            placeholder="Rate"
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

          <input
            ref={discountElRef}
            type="number"
            min="0"
            max="100"
            step="0.01"
            placeholder="Disc %"
            value={discountValue === undefined ? 0 : discountValue}
            onFocus={(e) => e.target.select()}
            onChange={(e) =>
              searchItemsDispatch({
                type: "SET_DISCOUNT",
                payload: { id: res.id, inputFieldValue: e.target.value },
              })
            }
            onMouseLeave={() => {
              if (discountElRef.current) discountElRef.current.blur();
            }}
            className="rate-input discount-input"
          />
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
