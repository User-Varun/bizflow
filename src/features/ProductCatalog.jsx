import "../index.css";
import "../styles/productCatalog.css";
import { useState } from "react";
import { SearchBar } from "../ui/SearchBar";
import { ProductCard } from "../ui/ProductCard";
import { PaginationComp } from "../ui/PaginationComp";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { requestJSON } from "../styles/utils/requestJSON";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const DEFAULT_UNIT_OPTIONS = ["pcs", "box", "jar"];
const CUSTOM_UNIT_OPTION = "__custom_unit__";

export function ProductCatalog() {
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [mrp, setMrp] = useState("");
  const [hsnCode, setHsnCode] = useState("");
  const [unitName, setUnitName] = useState("pcs");
  const [customUnitName, setCustomUnitName] = useState("");
  const [unitQty, setUnitQty] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const normalizedSearch = searchQuery.trim();
  const isCustomUnitSelected = unitName === CUSTOM_UNIT_OPTION;

  const unitOptions =
    unitName &&
    unitName !== CUSTOM_UNIT_OPTION &&
    !DEFAULT_UNIT_OPTIONS.includes(unitName)
      ? [...DEFAULT_UNIT_OPTIONS, unitName]
      : DEFAULT_UNIT_OPTIONS;

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["productCatalog", { page, pageSize, search: normalizedSearch }],
    queryFn: () =>
      requestJSON(
        `${import.meta.env.VITE_API_URL}/productCatalog?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(normalizedSearch)}`,
        {
          method: "GET",
        },
      ),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
  });

  const addOrUpdateMutation = useMutation({
    mutationFn: async (payload) => {
      if (isEditMode && editingProductId) {
        return requestJSON(
          `${import.meta.env.VITE_API_URL}/productCatalog/${editingProductId}`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          },
        );
      }

      return requestJSON(`${import.meta.env.VITE_API_URL}/productCatalog`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productCatalog"] });
      resetForm();
      setIsOpen(false);
      setErrMsg("");
    },
    onError: (err) => {
      setErrMsg(err?.message || "Failed to save product");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (productId) =>
      requestJSON(
        `${import.meta.env.VITE_API_URL}/productCatalog/${productId}`,
        {
          method: "DELETE",
        },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productCatalog"] });
    },
    onError: (err) => {
      setErrMsg(err?.message || "Failed to delete product");
    },
  });

  const products = data?.result || [];
  const total = data?.total || 0;

  function toggleForm() {
    setIsOpen(!isOpen);
    if (isOpen) {
      resetForm();
    }
  }

  function resetForm() {
    setName("");
    setBrand("");
    setMrp(0);
    setHsnCode("");
    setUnitName("pcs");
    setCustomUnitName("");
    setUnitQty("");
    setIsEditMode(false);
    setEditingProductId(null);
  }

  function handleEdit(product) {
    setErrMsg("");
    setIsEditMode(true);
    setEditingProductId(product.id);
    setName(product.name);
    setBrand(product.brand);
    setMrp(product.mrp);
    setHsnCode(product.hsn_code);
    if (DEFAULT_UNIT_OPTIONS.includes(product.unit_name)) {
      setUnitName(product.unit_name);
      setCustomUnitName("");
    } else {
      setUnitName(CUSTOM_UNIT_OPTION);
      setCustomUnitName(product.unit_name || "");
    }
    setUnitQty(product.unit_qty);
    setIsOpen(true);
  }

  function handleDelete(product) {
    setErrMsg("");
    setProductToDelete(product);
  }

  function closeDeleteModal() {
    if (deleteMutation.isPending) return;
    setProductToDelete(null);
  }

  function handleConfirmDelete() {
    if (!productToDelete?.id) return;

    deleteMutation.mutate(productToDelete.id, {
      onSuccess: () => {
        setProductToDelete(null);
      },
    });
  }

  function handleSearchChange(value) {
    setSearchQuery(value);
    setPage(1);
  }

  function handleSubmit(e) {
    e.preventDefault();
    setErrMsg("");

    const resolvedUnitName = String(
      isCustomUnitSelected ? customUnitName : unitName,
    )
      .trim()
      .toLowerCase();

    if (!name || !brand || !mrp || !hsnCode || !resolvedUnitName || !unitQty) {
      setErrMsg("Please fill all fields before submitting.");
      return;
    }

    if (resolvedUnitName.length > 50) {
      setErrMsg("Unit name must be 50 characters or less.");
      return;
    }

    const payload = {
      name: name.trim(),
      brand: brand.trim(),
      mrp: Number(mrp),
      hsn_code: String(hsnCode).trim(),
      unit_name: resolvedUnitName,
      unit_qty: Number(unitQty),
    };

    addOrUpdateMutation.mutate(payload);
  }

  if (isLoading) return <LoadingSpinner label="Loading products..." />;
  if (isError) return <p>{error?.message || "Failed to load products"}</p>;

  return (
    <section
      className={`below-navbar-content-container productCatalogShell ${isOpen || productToDelete ? "blurred" : ""}`}
    >
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
            <form className="container-addProd" onSubmit={handleSubmit}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="product name"
                required
              />
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="product brand"
                required
              />
              <input
                type="number"
                value={mrp}
                min="0"
                onChange={(e) => {
                  setMrp(e.target.value);
                }}
                placeholder="product MRP"
                required
              />
              <input
                type="number"
                value={hsnCode}
                min="0"
                onChange={(e) => {
                  setHsnCode(e.target.value);
                }}
                placeholder="HSN Code"
                required
              />
              <select
                value={unitName}
                onChange={(e) => {
                  const selected = e.target.value;
                  setUnitName(selected);
                  if (selected !== CUSTOM_UNIT_OPTION) {
                    setCustomUnitName("");
                  }
                }}
                required
              >
                {unitOptions.map((option) => (
                  <option value={option} key={option}>
                    {option}
                  </option>
                ))}
                <option value={CUSTOM_UNIT_OPTION}>+ Add custom unit</option>
              </select>
              {isCustomUnitSelected ? (
                <input
                  type="text"
                  value={customUnitName}
                  onChange={(e) => setCustomUnitName(e.target.value)}
                  placeholder="Enter custom unit name (e.g. strip, packet)"
                  maxLength={50}
                  required
                />
              ) : null}
              <input
                type="number"
                value={unitQty}
                min="0"
                onChange={(e) => {
                  setUnitQty(e.target.value);
                }}
                placeholder="Unit Quantity (say 5 )"
                required
              />

              <button
                type="submit"
                className={
                  addOrUpdateMutation.isPending
                    ? "add-prod-submitting"
                    : "add-prod-btn"
                }
                disabled={addOrUpdateMutation.isPending}
              >
                {addOrUpdateMutation.isPending
                  ? "Submitting..."
                  : isEditMode
                    ? "Update Product"
                    : "Submit"}
              </button>
            </form>
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

      {productToDelete && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div
            className="modal-content delete-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-product-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="delete-product-title"
              className="modal-heading delete-heading"
            >
              Delete Product?
            </h2>
            <p className="delete-warning-text">
              This action is permanent. Are you sure you want to delete
              <strong> {productToDelete.name}</strong>?
            </p>

            <div className="delete-confirm-actions">
              <button
                type="button"
                className="delete-cancel-btn"
                onClick={closeDeleteModal}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="delete-confirm-btn"
                onClick={handleConfirmDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>

            <button
              className="modal-close"
              onClick={closeDeleteModal}
              aria-label="Close"
              disabled={deleteMutation.isPending}
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
          setSearchQuery={handleSearchChange}
        />
        <button className="prodCBtn" onClick={toggleForm}>
          + Add Product
        </button>
      </div>

      {products.length > 0 ? (
        <>
          <section id="productCatalogContainer" className="scroll-hide">
            {products.map((res) => (
              <ProductCard
                res={res}
                key={res.id || res.name}
                prodCat={true}
                compact={true}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </section>
          <PaginationComp
            page={page}
            pageSize={pageSize}
            total={total}
            onChange={setPage}
            disabled={isLoading || isFetching}
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
          <p>
            {normalizedSearch
              ? "No products match your search."
              : "Add a product to see it appear here."}
          </p>
        </div>
      )}
    </section>
  );
}
