import { createContext } from "react";

export const BillContext = createContext(null);

export const initialState = {
  invoice_type: "stock_out", // credit
  dealer_id: "",

  invoice_from: "",
  address_from: "",
  phone_from: "",

  invoice_to: "",
  address_to: "",
  phone_to: "",
  other_party_gst: "",

  cgst: "2.5",
  sgst: "2.5",

  invoice_no: "",
  total_amt: 0,
  pending_amt: 0,
  pending_invoice: true,

  invoice_items: [],

  isSubmitting: false,
};

export function reducerFn(state, action) {
  switch (action.type) {
    case "SET_FIELDS":
      return { ...state, ...action.payload };
    case "UPDATE_BILL_ITEM": {
      return { ...state, invoice_items: action.payload.billToUpdate };
    }
    case "ADD_BILL_ITEM": {
      return { ...state, invoice_items: action.payload.billToUpdate };
    }
    default:
      return state;
  }
}
