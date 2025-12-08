import { useEffect, useState } from "react";

import "../styles/generateBillStyles/searchItems.css";
import supabase from "../../services/supabaseClient";
import { SearchBar } from "../ui/SearchBar";
import { BillCardItem } from "../ui/BillCardItem";

export function SearchItems() {
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchData() {
      // load all products
      const { data: allProd, error: errAllProd } = await supabase
        .from("product_catalog")
        .select("*")
        .limit(4);

      if (errAllProd) {
        console.error(
          "Error loading all Bills ( search items in generate bill screen.js ) ",
          errAllProd
        );
        setData([]);
      }
      setData(allProd || []);
    }

    fetchData();
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        let query = supabase.from("product_catalog").select("*").limit(4);
        const trimmed = searchQuery.trim();

        if (searchQuery) {
          query = query.ilike("name", `%${trimmed}%`);

          const { data: resData, error } = await query;

          if (error) {
            console.error("Supbase Error", error);
            setData([]);
            return;
          }
          setData(resData || []);
        }
      } catch (err) {
        console.error(err);
        setData([]);
      }
    }

    fetchData();
  }, [searchQuery]);

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
