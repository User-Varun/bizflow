import { createContext } from "react";

export const BillContext = createContext(null);

export const initialState = {
  billType: "Credit",
  sellerName: "",
  sellerAddress: "",
  sellerPhoneNo: "",
  buyerName: "",
  buyerAddress: "",
  buyerPhoneNo: "",
  cgst: "2.5",
  sgst: "2.5",
  billItems: [],
  // showBill: false,
  isSubmitting: false,
  // invoiceSnapshot: null,
  // bill_id: null,
};

export function reducerFn(state, action) {
  switch (action.type) {
    case "SET_FIELDS":
      return { ...state, ...action.payload };
    case "SET_SNAPSHOT":
      return { ...state, invoiceSnapshot: action.payload };
    case "UPDATE_BILL_ITEM": {
      return { ...state, billItems: action.payload.billToUpdate };
    }
    case "ADD_BILL_ITEM": {
      return { ...state, billItems: action.payload.billToUpdate };
    }
    default:
      return state;
  }
}
