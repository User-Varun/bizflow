import supabase from "../../services/supabaseClient";
import { SearchBar } from "../ui/SearchBar";
import { BillViewCard } from "../ui/BillViewCard";
import { PaginationComp } from "../ui/PaginationComp";
import "../styles/viewBills.css";
import { InvoiceTemplate } from "../ui/InvoiceTemplate";
import { useState, useEffect } from "react";
import "../../index.css";

export function ViewBills() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState("bill_no");
  const [data, setData] = useState([]);
  const [id, setId] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);
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
          .from("bills")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false });

        if (trimmed) {
          if (searchFilter === "bill_no") {
            const queryStr = Number(trimmed);
            if (!isNaN(queryStr)) {
              query = query.eq("bill_no", queryStr);
            } else {
              setData([]);
              setTotal(0);
              setIsLoading(false);
              return;
            }
          } else if (searchFilter === "created_at") {
            const parts = trimmed.split("-");
            if (
              parts.length === 3 &&
              parts.every((part) => part.length > 0) &&
              parts[2].length === 4
            ) {
              const [day, month, year] = parts;
              const startDate = `${year}-${month}-${day}T00:00:00Z`;
              const endDate = `${year}-${month}-${day}T23:59:59Z`;
              query = query
                .gte("created_at", startDate)
                .lte("created_at", endDate);
            } else {
              setData([]);
              setTotal(0);
              setIsLoading(false);
              return;
            }
          } else if (searchFilter === "buyer_name") {
            query = query.ilike("buyer_name", `%${trimmed}%`);
          } else if (searchFilter === "seller_name") {
            query = query.ilike("seller_name", `%${trimmed}%`);
          }
        }

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data: rows, count, error } = await query.range(from, to);

        if (error) throw error;

        setData(rows || []);
        setTotal(count || 0);
      } catch (err) {
        console.error("Error loading bills", err);
        setData([]);
        setTotal(0);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [searchQuery, searchFilter, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, searchFilter]);

  return (
    <section className="below-navbar-content-container">
      <div id="viewBillInnerHeader">
        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          widthInPercent={85}
        />
        <div className="viewBillFilter">
          <select
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
          >
            <option value="bill_no">By Invoice No</option>
            <option value="created_at">By Date</option>
            <option value="buyer_name">By Buyer Name</option>
            <option value="seller_name">By Seller Name</option>
          </select>
        </div>
      </div>

      {!showInvoice ? (
        <>
          <section className="billContainer scroll-hide">
            {data.length > 0 ? (
              data.map((res) => {
                return (
                  <BillViewCard
                    res={res}
                    key={res.id}
                    setShowInvoice={setShowInvoice}
                    setId={setId}
                  />
                );
              })
            ) : (
              <h1>No Bills Found!</h1>
            )}
          </section>
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
        </>
      ) : (
        <InvoiceTemplate data={data} id={id} />
      )}
    </section>
  );
}
