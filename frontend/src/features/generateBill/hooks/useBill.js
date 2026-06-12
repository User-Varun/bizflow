import { useContext } from "react";
import { BillContext } from "../stores/billContextStore";

export function useBill() {
  const ctx = useContext(BillContext);
  if (!ctx) throw new Error("useBill must be used inside BillProvider");
  return ctx;
}
