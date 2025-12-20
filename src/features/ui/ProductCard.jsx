import "../styles/productCard.css";

export function ProductCard({
  res,
  prodCat = null,
  billDetailsCard = null,
  onEdit = null,
}) {
  const truncate = (text, max = 20) => {
    if (!text) return "";
    const str = String(text);
    return str.length > max ? `${str.slice(0, max).trimEnd()}...` : str;
  };

  return (
    <div
      className={[
        "cardItem",
        billDetailsCard && "cardItem-in-bill-details",
        prodCat && "cardItem-in-prod-catalog",
      ]
        .filter(Boolean)
        .join(" ")}
      key={res.id || res.name}
    >
      <img
        src={`${res.img_url}`}
        className={`${
          billDetailsCard ? "inside-bill-details-card-img " : "cardImg"
        } `}
      />
      <div className="card-content">
        <h3 className="product-name" title={res.name || ""}>
          {truncate(res.name, 30)}
        </h3>
        <p className="product-brand">by {res.brand}</p>

        <div className="card-details">
          <div className="detail-item">
            {billDetailsCard ? (
              <>
                <label>Rate</label>
                <p className="detail-value price">₹{res.rate}</p>
              </>
            ) : (
              <>
                <label>Price</label>
                <p className="detail-value price">₹{res.mrp}</p>
              </>
            )}
          </div>
          <div className="detail-item">
            <label>Pack Size</label>
            <p className="detail-value">
              {res.unit_qty} <strong>Per</strong> {res.unit_name}
            </p>
          </div>
        </div>

        {!prodCat && (
          <div className="detail-item full-width">
            <label>Quantity in Stock</label>
            <p className="detail-value">{res.item_qty}</p>
          </div>
        )}
        <div className="detail-item full-width">
          <label>HSN Code</label>
          <p className="detail-value">{res.hsn_code}</p>
        </div>
        {prodCat && onEdit && (
          <button className="edit-btn" onClick={() => onEdit(res)}>
            ✎ Edit
          </button>
        )}
      </div>
    </div>
  );
}
