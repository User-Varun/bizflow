import { createContext } from "react";

export const SearchItemsContext = createContext();

export const initalValue = {
  rate: {},
  discount: {},
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
          [action.payload.id]: (state.quantities[action.payload.id] || 0) + 1,
        },
      };
    case "DEC_QTY":
      return {
        ...state,
        quantities: {
          ...state.quantities,
          [action.payload.id]: Math.max(
            0,
            (state.quantities[action.payload.id] || 0) - 1,
          ),
        },
      };

    case "SET_RATE":
      return {
        ...state,
        rate: {
          ...state.rate,
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
          [action.payload.id]: 0,
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
    case "RESET_DISCOUNT":
      return {
        ...state,
        discount: {
          ...state.discount,
          [action.payload.id]: "",
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
