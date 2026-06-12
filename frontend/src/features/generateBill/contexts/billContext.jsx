import { useReducer } from "react";
import {
  BillContext,
  initialState,
  reducerFn,
} from "../stores/billContextStore";

export function BillProvider({ children }) {
  const [state, dispatch] = useReducer(reducerFn, initialState);

  return (
    <BillContext.Provider value={{ state, dispatch }}>
      {children}
    </BillContext.Provider>
  );
}
