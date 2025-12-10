import { useRef } from "react";
import { useBill } from "../generateBill/hooks/useBill";
import { useSearchItems } from "../generateBill/hooks/useSearchItems";
import "../styles/productCard.css";

export function BillCardItem({ res }) {
  const rateElRef = useRef(null);

  const { state: searchItemsState, dispatch: searchItemsDispatch } =
    useSearchItems();
  const { state: billState, dispatch: billDispatch } = useBill();

  function handleAddItem(e) {
    e.preventDefault();

    let billToUpdate;
    const id = e.target.dataset.id; // get will get data attribute named "data-id"
    const qty = searchItemsState.quantities?.[id] || 0;

    if (qty <= 0) return; // nothing to add

    const exits = billState.billItems.find((item) => item.id == id);

    if (exits) {
      // update existing item's property

      billToUpdate = billState.billItems.map((item) => {
        return item.id === id
          ? {
              ...item,
              item_qty: (item.item_qty || 0) + qty,
              rate: Number(searchItemsState.rate[id]),
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
        ...billState.billItems,
        {
          ...res,
          item_qty: qty,
          rate: Number(searchItemsState.rate[id]),
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
  }

  return (
    <div className="cardItem height-adjustment" key={res.id || res.name}>
      <img src={`${res.img_url}`} className="cardImg" />
      <span id="nameAndBrand">
        {res.name} by {res.brand}
      </span>

      <span>
        {res.unit_qty} {res.unit_name} at ₹{res.mrp}
      </span>

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
          <span className="itemContainerField">
            {searchItemsState.quantities[res.id] || 0}
          </span>
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

        <div>
          <span>Rate </span>
          <input
            ref={rateElRef}
            type="number"
            placeholder="0"
            value={searchItemsState.rate?.[res.id] ?? ""}
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
        </div>
      </div>
      <button
        data-id={res.id}
        style={{
          backgroundColor: "blue",
          padding: "0.25rem",
          cursor: "pointer",
        }}
        onClick={(e) => handleAddItem(e)}
      >
        ADD
      </button>
    </div>
  );
}
