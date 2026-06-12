import { useReducer } from "react";
import {
  SearchItemsContext,
  initalValue,
  reducerFn,
} from "../stores/searchItemsContextStore";

export function SearchItemsProvider({ children }) {
  const [state, dispatch] = useReducer(reducerFn, initalValue);

  return (
    <SearchItemsContext.Provider value={{ state, dispatch }}>
      {children}
    </SearchItemsContext.Provider>
  );
}
