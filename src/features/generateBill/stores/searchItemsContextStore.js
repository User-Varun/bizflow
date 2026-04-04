import { createContext } from "react";

export const SearchItemsContext = createContext();

export const initalValue = {
  rate: {},
  purchaseRatePercent: {},
  discount: {},
  cgst: {},
  sgst: {},
  quantities: {},
  data: [],
  searchQuery: "",
};

export function reducerFn(state, action) {
  switch (action.type) {
    case "INC_QTY":
      return {
        ...state,
        quantities: {
          ...state.quantities,
          [action.payload.id]: (
            Number(state.quantities[action.payload.id] || 0) + 1
          ).toFixed(2),
        },
      };
    case "DEC_QTY":
      return {
        ...state,
        quantities: {
          ...state.quantities,
          [action.payload.id]: Math.max(
            0,
            Number(state.quantities[action.payload.id] || 0) - 1,
          ).toFixed(2),
        },
      };

    case "SET_QTY": {
      const rawQty = action.payload.qty;
      if (rawQty === "") {
        return {
          ...state,
          quantities: {
            ...state.quantities,
            [action.payload.id]: "",
          },
        };
      }

      const parsedQty = Number(rawQty);
      const normalizedQty = Number.isFinite(parsedQty)
        ? Math.max(0, parsedQty).toFixed(2)
        : 0;

      return {
        ...state,
        quantities: {
          ...state.quantities,
          [action.payload.id]: normalizedQty,
        },
      };
    }

    case "SET_RATE":
      return {
        ...state,
        rate: {
          ...state.rate,
          [action.payload.id]: action.payload.inputFieldValue,
        },
      };

    case "SET_PURCHASE_RATE_PERCENT":
      return {
        ...state,
        purchaseRatePercent: {
          ...state.purchaseRatePercent,
          [action.payload.id]: action.payload.inputFieldValue,
        },
      };

    case "SET_DISCOUNT":
      return {
        ...state,
        discount: {
          ...state.discount,
          [action.payload.id]: action.payload.inputFieldValue,
        },
      };

    case "SET_CGST":
      return {
        ...state,
        cgst: {
          ...state.cgst,
          [action.payload.id]: action.payload.inputFieldValue,
        },
      };

    case "SET_SGST":
      return {
        ...state,
        sgst: {
          ...state.sgst,
          [action.payload.id]: action.payload.inputFieldValue,
        },
      };

    case "SET_SEARCH_QUERY":
      return {
        ...state,
        searchQuery: action.payload.curVal,
      };

    case "RESET_QTY":
      return {
        ...state,
        quantities: {
          ...state.quantities,
          [action.payload.id]: "0.00",
        },
      };
    case "RESET_RATE":
      return {
        ...state,
        rate: {
          ...state.rate,
          [action.payload.id]: "",
        },
      };
    case "RESET_PURCHASE_RATE_PERCENT":
      return {
        ...state,
        purchaseRatePercent: {
          ...state.purchaseRatePercent,
          [action.payload.id]: 0,
        },
      };
    case "RESET_DISCOUNT":
      return {
        ...state,
        discount: {
          ...state.discount,
          [action.payload.id]: 0,
        },
      };
    case "RESET_CGST":
      return {
        ...state,
        cgst: {
          ...state.cgst,
          [action.payload.id]: 2.5,
        },
      };
    case "RESET_SGST":
      return {
        ...state,
        sgst: {
          ...state.sgst,
          [action.payload.id]: 2.5,
        },
      };
    case "RESET_SEARCH_QUERY":
      return {
        ...state,
        searchQuery: "",
      };
    default:
      return state;
  }
}
