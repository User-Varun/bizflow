import "../styles/productCard.css";

export function ProductCard({ res, prodCat = null, billDetailsCard = null }) {
  return (
    <div className="cardItem" key={res.id || res.name}>
      <img
        src={`${res.img_url}`}
        className={`cardImg ${
          billDetailsCard ? "inside-bill-details-card-img " : null
        } `}
      />
      <span id="nameAndBrand">
        {res.name} by {res.brand}
      </span>

      <span>
        {res.unit_qty} {res.unit_name} at ₹{res.mrp}
      </span>
      {prodCat ? null : <span>Quantity: {res.item_qty}</span>}
      <span>HSN code: {res.hsn_code}</span>
    </div>
  );
}
