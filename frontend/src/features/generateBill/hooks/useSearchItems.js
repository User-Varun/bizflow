import { useContext } from "react";
import { SearchItemsContext } from "../stores/searchItemsContextStore";

export function useSearchItems() {
  const ctx = useContext(SearchItemsContext);

  if (!ctx)
    throw Error("useSearchItems must be used inside SearchItemsProvider");
  return ctx;
}
