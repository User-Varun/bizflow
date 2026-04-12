import "../styles/productCard.css";
import {
  formatCurrencyAmount,
  formatDateWithMonthWord,
  formatQuantity,
  formatPercent,
} from "../lib/formatters";

export function ProductCard({
  res,
  prodCat = null,
  billDetailsCard = null,
  compact = false,
  inventoryInsights = false,
  onRemove = null,
  onEdit = null,
  onDelete = null,
}) {
  const truncate = (text, max = 20) => {
    if (!text) return "";
    const str = String(text);
    return str.length > max ? `${str.slice(0, max).trimEnd()}...` : str;
  };

  const stockQty = Number(res?.product_qty ?? res?.item_qty ?? 0);
  const unitLabel =
    `${formatQuantity(res?.unit_qty ?? 0)} ${res?.unit_name ?? ""}`.trim();
  const hsnLabel = `HSN: ${res?.hsn_code ?? ""}`;
  const dealerLabel = res?.dealer?.name ? `Dealer: ${res.dealer.name}` : "";
  const showInventoryTopQty = compact && !prodCat && !billDetailsCard;
  const updatedLabel = res?.updatedAt
    ? `Updated: ${formatDateWithMonthWord(res.updatedAt, "")}`
    : "";
  const compactNameMax = prodCat ? 100 : inventoryInsights ? 70 : 34;

  return (
    <div
      className={[
        "cardItem",
        billDetailsCard && "cardItem-in-bill-details",
        prodCat && "cardItem-in-prod-catalog",
        compact && "cardItem-compact",
      ]
        .filter(Boolean)
        .join(" ")}
      key={res.id || res.name}
    >
      {/* <img
        src={`${res.img_url}`}
        className={`${
          billDetailsCard ? "inside-bill-details-card-img " : "cardImg"
        } `}
      /> */}
      {compact || billDetailsCard ? (
        <div className="card-content compact-card-content">
          <div className="product-compact-top-row">
            <div className="product-compact-name-wrap">
              <h3
                className={[
                  "product-compact-name",
                  prodCat && "catalog-compact-name",
                  inventoryInsights && "inventory-compact-name",
                ]
                  .filter(Boolean)
                  .join(" ")}
                title={res.name || ""}
              >
                {truncate(res.name, compactNameMax)}
              </h3>
              <p className="product-compact-brand" title={res.brand || ""}>
                {truncate(res.brand, 26)}
              </p>
            </div>
            <div className="product-compact-price-stack">
              <span className="product-compact-price">
                {formatCurrencyAmount(billDetailsCard ? res.rate : res.mrp)}
              </span>
              {showInventoryTopQty ? (
                <span className="product-compact-chip qty-highlight stock-highlight compact-top-qty">
                  Qty: {formatQuantity(stockQty)}
                </span>
              ) : null}
            </div>
          </div>

          <div className="product-compact-meta">
            <span
              className="product-compact-chip trunc-chip unit-chip"
              title={unitLabel}
            >
              {truncate(unitLabel, 16)}
            </span>
            {billDetailsCard ? (
              <span className="product-compact-chip qty-highlight">
                Qty: {formatQuantity(res?.item_qty || 0)}
              </span>
            ) : (
              !prodCat &&
              !showInventoryTopQty && (
                <span className="product-compact-chip qty-highlight stock-highlight">
                  Qty: {formatQuantity(stockQty)}
                </span>
              )
            )}
            {billDetailsCard ? (
              <span className="product-compact-chip">
                Disc: {formatPercent(res?.discount || 0)}
              </span>
            ) : null}
            {billDetailsCard ? (
              <span className="product-compact-chip">
                CGST: {formatPercent(res?.cgst || 0)}
              </span>
            ) : null}
            {billDetailsCard ? (
              <span className="product-compact-chip">
                SGST: {formatPercent(res?.sgst || 0)}
              </span>
            ) : null}
            {prodCat && dealerLabel ? (
              <span
                className="product-compact-chip trunc-chip dealer-chip"
                title={dealerLabel}
              >
                {truncate(dealerLabel, 22)}
              </span>
            ) : null}
            <span
              className="product-compact-chip trunc-chip hsn-chip"
              title={hsnLabel}
            >
              {truncate(hsnLabel, 16)}
            </span>
            {inventoryInsights && stockQty <= 0 ? (
              <span className="product-compact-chip inventory-out-stock-chip">
                Out of Stock
              </span>
            ) : null}
            {inventoryInsights && updatedLabel ? (
              <span
                className="product-compact-chip inventory-updated-chip"
                title={updatedLabel}
              >
                {updatedLabel}
              </span>
            ) : null}
          </div>

          {billDetailsCard && onRemove && (
            <button
              type="button"
              className="bill-details-remove-btn"
              onClick={() => onRemove(res)}
            >
              Remove
            </button>
          )}

          {prodCat && (onEdit || onDelete) && (
            <div className="compact-card-actions">
              {onEdit && (
                <button className="edit-btn" onClick={() => onEdit(res)}>
                  ✎ Edit
                </button>
              )}
              {onDelete && (
                <button className="delete-btn" onClick={() => onDelete(res)}>
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
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
                  <p className="detail-value price">
                    {formatCurrencyAmount(res.rate)}
                  </p>
                </>
              ) : (
                <>
                  <label>Price</label>
                  <p className="detail-value price">
                    {formatCurrencyAmount(res.mrp)}
                  </p>
                </>
              )}
            </div>
            <div className="detail-item">
              <label>Pack Size</label>
              <p className="detail-value">
                {formatQuantity(res.unit_qty)} {res.unit_name}
              </p>
            </div>
          </div>

          {!prodCat && (
            <div className="detail-item full-width">
              <label>Quantity in Stock</label>
              <p className="detail-value">{formatQuantity(stockQty)}</p>
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
          {prodCat && onDelete && (
            <button className="delete-btn" onClick={() => onDelete(res)}>
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
