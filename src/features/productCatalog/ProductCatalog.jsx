import "../../index.css";
import "../styles/productCatalog.css";
import { useEffect, useState } from "react";
import supabase from "../../services/supabaseClient";
import { SearchBar } from "../ui/SearchBar";
import { ProductCard } from "../ui/ProductCard";
import { PaginationComp } from "../ui/PaginationComp";

export function ProductCatalog() {
  const [data, setData] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);

  // Form Data
  const [imageData, setImageData] = useState(null);
  const [imgURL, setImgURL] = useState("");
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [mrp, setMrp] = useState(0);
  const [hsnCode, setHsnCode] = useState("");
  const [unitName, setUnitName] = useState("");
  const [unitQty, setUnitQty] = useState(0);

  // Error message cleanup effect
  useEffect(() => {
    if (errMsg) {
      const timer = setTimeout(() => {
        setErrMsg("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [errMsg]);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const trimmed = searchQuery.trim();

        let query = supabase
          .from("product_catalog")
          .select("*", { count: "exact" })
          .order("id", { ascending: false });

        if (trimmed) {
          query = query.or(`name.ilike.%${trimmed}%,brand.ilike.%${trimmed}%`);
        }

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data: rows, count, error } = await query.range(from, to);

        if (error) throw error;

        setData(rows || []);
        setTotal(count || 0);
      } catch (err) {
        console.error("Error loading product catalog", err);
        setData([]);
        setTotal(0);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [searchQuery, page, pageSize]);

  // Reset to first page when search changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  function toggleForm() {
    setIsOpen(!isOpen);
    if (isOpen) {
      resetForm();
    }
  }

  function resetForm() {
    setImageData(null);
    setImgURL("");
    setName("");
    setBrand("");
    setMrp(0);
    setHsnCode("");
    setUnitName("");
    setUnitQty(0);
    setIsEditMode(false);
    setEditingProductId(null);
  }

  function handleEdit(product) {
    setIsEditMode(true);
    setEditingProductId(product.id);
    setName(product.name);
    setBrand(product.brand);
    setMrp(product.mrp);
    setHsnCode(product.hsn_code);
    setUnitName(product.unit_name);
    setUnitQty(product.unit_qty);
    setImgURL(product.img_url);
    setImageData(null);
    setIsOpen(true);
  }

  function handleImageChange(e) {
    setImageData(e.target.files[0]);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!name || !brand || !mrp || !hsnCode || !unitName || !unitQty)
      return setErrMsg("Please Fill The data before submitting!");

    try {
      setIsSubmitting(true);

      let publicUrl = imgURL; // default to existing URL

      // Upload new image only if changed
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
      }

      if (isEditMode && editingProductId) {
        // Update existing product
        const { error: updateError } = await supabase
          .from("product_catalog")
          .update({
            name,
            brand,
            img_url: publicUrl,
            mrp,
            hsn_code: hsnCode,
            unit_name: unitName,
            unit_qty: unitQty,
          })
          .eq("id", editingProductId);

        if (updateError) throw updateError;

        console.log("product updated successfully");
      } else {
        // Insert new product
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
          insertedRows,
        );
      }

      // Reset and close modal
      resetForm();
      setIsOpen(false);
      // Refresh data
      setPage(1);
      setSearchQuery("");
    } catch (error) {
      console.error(error);
      setErrMsg("Error saving product. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    // add className for CSS fallback blur when modal is open
    <section className="below-navbar-content-container">
      {isOpen && (
        <div className="modal-overlay" onClick={toggleForm}>
          <div
            className="modal-content"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h1 className="modal-heading">
              {isEditMode ? "Edit Product" : "Add Product"}
            </h1>
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
              {isSubmitting
                ? "Submitting..."
                : isEditMode
                  ? "Update Product"
                  : "Submit"}
            </button>
            {errMsg ? <span className="errMsg">{errMsg}</span> : null}

            <button
              className="modal-close "
              onClick={() => {
                resetForm();
                setIsOpen(false);
              }}
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
        <>
          <section id="productCatalogContainer" className="scroll-hide">
            {data.map((res) => (
              <ProductCard
                res={res}
                key={res.id || res.name}
                prodCat={true}
                onEdit={handleEdit}
              />
            ))}
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
