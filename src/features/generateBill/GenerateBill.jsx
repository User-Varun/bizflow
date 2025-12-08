import "../styles/generateBillStyles/generateBill.css";

// import { InvoiceFormat } from "./InvoiceFormat";
import { BillDetails } from "./BillDetails";
import { SearchItems } from "./SearchItems";
// import { useBill } from "./hooks/useBill";
import { InvoiceTemplate } from "../ui/InvoiceTemplate";
import { useState } from "react";

export function GenerateBill() {
  const [showInvoice, setShowInvoice] = useState(false);
  const [billId, setBillId] = useState(null);

  return (
    <section id="generateBillContainer">
      {showInvoice ? (
        <InvoiceTemplate id={billId} />
      ) : (
        <>
          <BillDetails setShowInvoice={setShowInvoice} setBillId={setBillId} />
          <SearchItems />
        </>
      )}
    </section>
  );
}
