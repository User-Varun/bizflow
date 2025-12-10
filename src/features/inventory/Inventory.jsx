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
      {inventory.length === 0 ? (
        <div className="inventory-empty">
          <svg viewBox="0 0 64 64" aria-hidden="true">
            <path d="M8 18a2 2 0 0 1 2-2h44a2 2 0 0 1 1.73 1l6 10.4a2 2 0 0 1 .27 1v18.6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V28.4a2 2 0 0 1 .27-1L8 17.98V18Zm1.85 2-4.7 8.13H58.9L54.2 20H9.85ZM4 30v16h56V30H4Zm16 4h4v8h-4v-8Zm8 0h4v8h-4v-8Zm8 0h4v8h-4v-8Z" />
          </svg>
          <h1>No inventory yet</h1>
          <p>Add items or create bills to see them show up here.</p>
        </div>
      ) : (
        <div id="inventoryContainer" className="scroll-hide">
          {inventory.map((res) => (
            <ProductCard res={res} key={res.id || res.name} />
          ))}
        </div>
      )}
    </section>
  );
}
