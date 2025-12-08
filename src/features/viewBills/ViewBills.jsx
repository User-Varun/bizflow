import supabase from "../../services/supabaseClient";
import { SearchBar } from "../ui/SearchBar";
import { BillViewCard } from "../ui/BillViewCard";
import "../styles/viewBills.css";
import { InvoiceTemplate } from "../ui/InvoiceTemplate";
import { useState, useEffect } from "react";

export function ViewBills() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState("bill_no");
  const [data, setData] = useState([]);
  const [id, setId] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);

  useEffect(() => {
    async function fetchData() {
      // load all bills
      const { data: allBills, error: errAllBills } = await supabase
        .from("bills")
        .select("*")
        .limit(8);

      if (errAllBills) {
        console.error(
          "Error loading all Bills ( View Bills.js ) ",
          errAllBills
        );
        setData([]);
      }
      setData(allBills || []);
    }

    fetchData();
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        let query = supabase.from("bills").select("*").limit(4);
        let trimmed = searchQuery.trim();

        if (searchQuery) {
          // query = query.ilike(searchFilter, `%${trimmed}%`);
          // const { data: resData, error } = await query;

          if (searchFilter === "bill_no") {
            const queryStr = Number(trimmed);

            if (isNaN(queryStr)) return;

            query = query.eq("bill_no", queryStr);
          }

          if (searchFilter == "created_at") {
            const parts = trimmed.split("-");

            if (
              parts.length === 3 &&
              parts.every((part) => part.length > 0) &&
              parts[2].length == 4
            ) {
              const [day, month, year] = parts;

              const startDate = `${year}-${month}-${day}T00:00:00Z`;
              const endDate = `${year}-${month}-${day}T23:59:59Z`;

              query = query
                .gte("created_at", startDate)
                .lte("created_at", endDate);
            } else {
              return; // not executing the query
            }
          }
          if (searchFilter == "buyer_name") {
            query = query.ilike("buyer_name", `%${trimmed}`);
          }
          if (searchFilter == "seller_name") {
            query = query.ilike("buyer_name", `%${trimmed}`);
          }

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
  }, [searchQuery, searchFilter]);

  return (
    <section id="viewBillContainer">
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
      ) : (
        <InvoiceTemplate data={data} id={id} />
      )}
    </section>
  );
}
