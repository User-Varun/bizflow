import "../styles/billViewCard.css";

export function BillViewCard({ res, setShowInvoice, setId }) {
  const truncate = (text, max = 20) => {
    if (!text) return "";
    const str = String(text);
    return str.length > max ? `${str.slice(0, max).trimEnd()}...` : str;
  };

  // Format created_at as DD-MM-YYYY using UTC to avoid timezone shifts
  const formattedDate = (() => {
    if (!res?.created_at) return "";
    const d = new Date(res.created_at);
    if (Number.isNaN(d.getTime())) return "";
    const day = String(d.getUTCDate()).padStart(2, "0");
    const month = String(d.getMonth()).padStart(2, "0");
    const year = d.getUTCFullYear();
    return `${day}-${month}-${year}`;
  })();

  return (
    <div className="billCard">
      <div className="billCardList">
        <span>Bill Type: {res.bill_type}</span>
        <span>Buyer: {truncate(res.buyer_name)}</span>
        <span>Seller: {truncate(res.seller_name)}</span>
        <span>Created At: {formattedDate}</span>
      </div>
      <button
        className="bill-card-btn"
        onClick={() => {
          setId(res.id);
          setShowInvoice(true);
        }}
      >
        Open Invoice
      </button>
    </div>
  );
}
