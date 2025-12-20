import "../styles/productCatalog.css";
import { useEffect, useState } from "react";
import supabase from "../../services/supabaseClient";
import { SearchBar } from "../ui/SearchBar";
import { ProductCard } from "../ui/ProductCard";

export function ProductCatalog() {
  const [data, setData] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Data
  const [imageData, setImageData] = useState(null);
  const [imgURL, setImgURL] = useState("");
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [mrp, setMrp] = useState(0);
  const [hsnCode, setHsnCode] = useState("");
  const [unitName, setUnitName] = useState("");
  const [unitQty, setUnitQty] = useState(0);

  useEffect(() => {
    async function fetchData() {
      // load all products
      const { data: allProd, error: errAllProd } = await supabase
        .from("product_catalog")
        .select("*")
        .limit(8);

      if (errAllProd) {
        console.error(
          "Error loading all Bills ( product catalog.js ) ",
          errAllProd
        );
        setData([]);
      }
      setData(allProd || []);
    }

    // erase error message after 3 sec
    if (errMsg) {
      setTimeout(function () {
        setErrMsg("");
      }, 3000);
    }

    fetchData();
  }, [errMsg]);

  useEffect(() => {
    async function fetchData() {
      try {
        let query = supabase.from("product_catalog").select("*").limit(4);
        const trimmed = searchQuery.trim();

        if (searchQuery) {
          query = query.ilike("name", `%${trimmed}%`);

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
  }, [searchQuery]);

  function toggleForm() {
    setIsOpen(!isOpen);
  }

  function handleImageChange(e) {
    setImageData(e.target.files[0]);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    let publicUrl = null;

    if (!name || !brand || !mrp || !hsnCode || !unitName || !unitQty)
      return setErrMsg("Please Fill The data before submitting!");

    try {
      console.log("uploading started..");
      setIsSubmitting(true);

      if (imageData) {
        const fileName = `${Date.now()}-${imageData.name}`;

        const { data: uploadImgData, error: imgUploadError } =
          await supabase.storage.from("images").upload(fileName, imageData);

        if (imgUploadError) throw imgUploadError;

        // getPublicUrl returns different shapes depending on SDK version; handle both
        const publicUrlRes = supabase.storage
          .from("images")
          .getPublicUrl(uploadImgData.path);

        publicUrl =
          publicUrlRes?.data?.publicUrl ||
          publicUrlRes?.publicUrl ||
          publicUrlRes?.publicURL;

        setImgURL(publicUrl);

        console.log("img, Done sucessfully!", imgURL);
      }

      const { data: insertedRows, error: insertError } = await supabase
        .from("product_catalog")
        .insert([
          {
            name,
            brand,
            img_url: publicUrl,
            mrp,
            hsn_code: hsnCode,
            unit_name: unitName,
            unit_qty: unitQty,
          },
        ])
        .select();

      if (insertError) throw insertError;

      console.log(
        "data uploaded in product catalog successfully",
        insertedRows
      );

      // set the input fields/state data to their initial value and close the modal

      setImageData(null);
      setImgURL("");
      setName("");
      setBrand("");
      setMrp("");
      setHsnCode("");
      setUnitName("");
      setUnitQty("");
      setIsOpen(!isOpen);
      setIsSubmitting(false);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    // add className for CSS fallback blur when modal is open
    <section id="prodCatalogContainer">
      {isOpen && (
        <div className="modal-overlay" onClick={toggleForm}>
          <div
            className="modal-content"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h1 className="modal-heading">Add Product</h1>
            <div className="container-addProd ">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                placeholder="Pick Your Image"
                className="add-prod-img"
                required
              />
              <input
                type="text"
                onChange={(e) => setName(e.target.value)}
                placeholder="product name"
                required
              />
              <input
                type="text"
                onChange={(e) => setBrand(e.target.value)}
                placeholder="product brand"
                required
              />
              <input
                type="number"
                onChange={(e) => {
                  setMrp(e.target.value);
                }}
                placeholder="product MRP"
                required
              />
              <input
                type="number"
                onChange={(e) => {
                  setHsnCode(e.target.value);
                }}
                placeholder="HSN Code"
                required
              />
              <input
                type="text"
                onChange={(e) => {
                  setUnitName(e.target.value);
                }}
                placeholder="Unit Name (box/pcs/pkt/jar)"
                required
              />
              <input
                type="number"
                onChange={(e) => {
                  setUnitQty(e.target.value);
                }}
                placeholder="Unit Quantity (say 5 )"
                required
              />
            </div>

            {/* Add your form fields here */}
            <button
              className={isSubmitting ? "add-prod-submitting" : "add-prod-btn"}
              onClick={handleSubmit}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
            {errMsg ? <span className="errMsg">{errMsg}</span> : null}

            <button
              className="modal-close "
              onClick={toggleForm}
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div id="innerHeader">
        <SearchBar
          widthInPercent={70}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        <button className="prodCBtn" onClick={toggleForm}>
          + Add Product
        </button>
      </div>

      {data.length > 0 ? (
        <section id="productCatalogContainer" className="scroll-hide">
          {data.map((res) => (
            <ProductCard res={res} key={res.id || res.name} prodCat={true} />
          ))}
        </section>
      ) : (
        <div className="product-catalog-empty">
          <svg viewBox="0 0 64 64" aria-hidden="true">
            <path d="M8 18a2 2 0 0 1 2-2h44a2 2 0 0 1 1.73 1l6 10.4a2 2 0 0 1 .27 1v18.6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V28.4a2 2 0 0 1 .27-1L8 17.98V18Zm1.85 2-4.7 8.13H58.9L54.2 20H9.85ZM4 30v16h56V30H4Zm16 4h4v8h-4v-8Zm8 0h4v8h-4v-8Zm8 0h4v8h-4v-8Z" />
          </svg>
          <h1>No products yet</h1>
          <p>Add a product to see it appear here.</p>
        </div>
      )}
    </section>
  );
}
