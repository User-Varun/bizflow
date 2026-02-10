import { useEffect, useState } from "react";
import supabase from "../../services/supabaseClient";
import { ProductCard } from "../ui/ProductCard";
import { SearchBar } from "../ui/SearchBar";
import { PaginationComp } from "../ui/PaginationComp";
import "../styles/inventory.css";
import "../../index.css";

export function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const trimmed = searchQuery.trim();

        let query = supabase
          .from("inventory")
          .select("*", { count: "exact" })
          .order("id", { ascending: false });

        if (trimmed) {
          query = query.ilike("name", `%${trimmed}%`);
        }

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data: rows, count, error } = await query.range(from, to);

        if (error) throw error;

        setInventory(rows || []);
        setTotal(count || 0);
      } catch (err) {
        console.error("Error loading inventory", err);
        setInventory([]);
        setTotal(0);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [searchQuery, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  return (
    <section className="below-navbar-content-container">
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
      <PaginationComp
        page={page}
        pageSize={pageSize}
        total={total}
        onChange={setPage}
        onPageSizeChange={setPageSize}
        disabled={isLoading}
        showFirstLast={true}
        siblingCount={1}
      />
    </section>
  );
}
