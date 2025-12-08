import { useEffect, useState } from "react";
import supabase from "../../services/supabaseClient";
import { ProductCard } from "../ui/ProductCard";
import { SearchBar } from "../ui/SearchBar";
import "../styles/inventory.css";

export function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchData() {
      // load all products
      const { data: allProd, error: errAllProd } = await supabase
        .from("inventory")
        .select("*")
        .limit(8);

      if (errAllProd) {
        console.error("Error loading all Bills ( inventory.js ) ", errAllProd);
        setInventory([]);
      }
      setInventory(allProd || []);
    }

    fetchData();
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        let query = supabase.from("inventory").select("*").limit(4);
        const trimmed = searchQuery.trim();

        if (searchQuery) {
          query = query.ilike("name", `%${trimmed}%`);

          const { data: resData, error } = await query;

          if (error) {
            console.error("Supbase Error", error);
            setInventory([]);
            return;
          }
          setInventory(resData || []);
        }
      } catch (err) {
        console.error(err);
        setInventory([]);
      }
    }

    fetchData();
  }, [searchQuery]);

  return (
    <section className="inventory">
      <div id="innerHeader">
        <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      </div>
      <div id="inventoryContainer" className="scroll-hide">
        {inventory.length === 0 ? (
          <h1 className="container-empty-msg">
            INVENTORY EMPTY!
            <em>create bills and watch them gets updated here :)</em>
          </h1>
        ) : (
          inventory.map((res) => (
            <ProductCard res={res} key={res.id || res.name} />
          ))
        )}
      </div>
    </section>
  );
}
