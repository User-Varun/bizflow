import { useEffect, useMemo, useState } from "react";

import "../styles/generateBillStyles/searchItems.css";
import supabase from "../../services/supabaseClient";
import { SearchBar } from "../ui/SearchBar";
import { BillCardItem } from "../ui/BillCardItem";
import { useBill } from "./hooks/useBill";
import { STOCK_OUT } from "../../appConfig";

export function SearchItems() {
  const { state, _dispatch_ } = useBill();
  const [data, setData] = useState([]);
  const [defaultItems, setDefaultItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const base = useMemo(
    () =>
      state.invoice_type === STOCK_OUT
        ? supabase.from("inventory")
        : supabase.from("product_catalog"),
    [state.invoice_type],
  );

  // Load defaults on mount/invoice_type change
  useEffect(() => {
    let isActive = true;

    async function loadDefaults() {
      try {
        const { data: defaultData, error: defaultErr } = await base
          .select("*")
          .limit(4);

        if (!isActive) return;
        if (defaultErr) {
          console.error("Supbase Error", defaultErr);
          setDefaultItems([]);
          setData([]);
          return;
        }
        setDefaultItems(defaultData || []);
        setData(defaultData || []);
      } catch (err) {
        if (!isActive) return;
        console.error(err);
        setDefaultItems([]);
        setData([]);
      }
    }

    loadDefaults();

    return () => {
      isActive = false;
    };
  }, [base]);

  useEffect(() => {
    let isActive = true;
    const trimmed = searchQuery.trim();

    const timer = setTimeout(async () => {
      try {
        // For empty or very short queries, load cached defaults
        if (trimmed.length < 2) {
          if (!isActive) return;
          setData(defaultItems);
          return;
        }

        const { data: resData, error } = await base
          .select("*")
          .ilike("name", `%${trimmed}%`)
          .limit(4);

        if (!isActive) return;

        if (error) {
          console.error("Supbase Error", error);
          setData([]);
          return;
        }
        setData(resData || []);
      } catch (err) {
        if (!isActive) return;
        console.error(err);
        setData([]);
      }
    }, 250); // throttle/debounce search

    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [searchQuery, base, defaultItems]);

  return (
    <section id="searchFeatureContainer">
      <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <div id="searchItemsContainer" className="scroll-hide">
        {data.length > 0 ? (
          data.map((res) => {
            return <BillCardItem res={res} key={res.id || res.name} />;
          })
        ) : (
          <h1>No products!</h1>
        )}
      </div>
    </section>
  );
}
