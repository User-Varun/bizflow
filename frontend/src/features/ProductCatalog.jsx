import "../index.css";
import "../styles/productCatalog.css";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { SearchBar } from "../ui/SearchBar";
import { ProductCard } from "../ui/ProductCard";
import { PaginationComp } from "../ui/PaginationComp";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { requestJSON } from "../styles/utils/requestJSON";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const DEFAULT_UNIT_OPTIONS = ["pcs", "box", "jar"];
const CUSTOM_UNIT_OPTION = "__custom_unit__";
const baseUrl = import.meta.env.VITE_API_URL;
const SUPPLIER_TYPE = "stock_in";

function normalizeCustomUnitName(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1).toLowerCase()}`;
}

export function ProductCatalog() {
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [activeDealerId, setActiveDealerId] = useState("");
  const [formDealerId, setFormDealerId] = useState("");

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [mrp, setMrp] = useState("");
  const [rate, setRate] = useState("");
  const [hsnCode, setHsnCode] = useState("");
  const [unitName, setUnitName] = useState("pcs");
  const [customUnitName, setCustomUnitName] = useState("");
  const [unitQty, setUnitQty] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 8;

  const debouncedSearch = useDebouncedValue(searchInput, 350);
  const normalizedSearch = debouncedSearch.trim();
  const isCustomUnitSelected = unitName === CUSTOM_UNIT_OPTION;

  const unitOptions =
    unitName &&
    unitName !== CUSTOM_UNIT_OPTION &&
    !DEFAULT_UNIT_OPTIONS.includes(unitName)
      ? [...DEFAULT_UNIT_OPTIONS, unitName]
      : DEFAULT_UNIT_OPTIONS;

  const suppliersQuery = useQuery({
    queryKey: ["productCatalogSuppliers"],
    queryFn: () =>
      requestJSON(
        `${baseUrl}/dealers?invoice_type=${SUPPLIER_TYPE}&page=1&pageSize=200`,
      ),
    staleTime: 60000,
  });

  const suppliers = useMemo(() => {
    return Array.isArray(suppliersQuery.data?.result)
      ? suppliersQuery.data.result
      : [];
  }, [suppliersQuery.data]);

  useEffect(() => {
    if (suppliers.length === 0) {
      setActiveDealerId("");
      setFormDealerId("");
      return;
    }

    const hasCurrentDealer = suppliers.some(
      (dealer) => dealer.id === activeDealerId,
    );

    if (!hasCurrentDealer) {
      const defaultDealerId = suppliers[0].id;
      setActiveDealerId(defaultDealerId);
      setFormDealerId(defaultDealerId);
    }
  }, [suppliers, activeDealerId]);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: [
      "productCatalog",
      {
        page,
        pageSize,
        search: normalizedSearch,
        dealerId: activeDealerId,
      },
    ],
    queryFn: () =>
      requestJSON(
        `${baseUrl}/productCatalog?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(normalizedSearch)}&dealer_id=${encodeURIComponent(activeDealerId)}`,
        {
          method: "GET",
        },
      ),
    enabled: Boolean(activeDealerId),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
  });

  const addOrUpdateMutation = useMutation({
    mutationFn: async (payload) => {
      if (isEditMode && editingProductId) {
        return requestJSON(`${baseUrl}/productCatalog/${editingProductId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      }

      return requestJSON(`${baseUrl}/productCatalog`, {
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
      requestJSON(`${baseUrl}/productCatalog/${productId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productCatalog"] });
    },
    onError: (err) => {
      setErrMsg(err?.message || "Failed to delete product");
    },
  });

  const products = activeDealerId ? data?.result || [] : [];
  const total = activeDealerId ? Number(data?.total || 0) : 0;

  function resetForm() {
    setFormDealerId(activeDealerId || "");
    setName("");
    setBrand("");
    setMrp("");
    setRate("");
    setHsnCode("");
    setUnitName("pcs");
    setCustomUnitName("");
    setUnitQty("");
    setIsEditMode(false);
    setEditingProductId(null);
  }

  function closeForm() {
    if (addOrUpdateMutation.isPending) return;
    resetForm();
    setErrMsg("");
    setIsOpen(false);
  }

  function openAddForm() {
    if (!activeDealerId) return;
    resetForm();
    setFormDealerId(activeDealerId);
    setErrMsg("");
    setIsOpen(true);
  }

  function handleEdit(product) {
    setErrMsg("");
    setIsEditMode(true);
    setEditingProductId(product.id);
    setFormDealerId(product.dealer_id || product?.dealer?.id || activeDealerId);
    setName(product.name);
    setBrand(product.brand);
    setMrp(product.mrp ?? "");
    setRate(product.rate ?? "");
    setHsnCode(product.hsn_code);
    if (DEFAULT_UNIT_OPTIONS.includes(product.unit_name)) {
      setUnitName(product.unit_name);
      setCustomUnitName("");
    } else {
      setUnitName(CUSTOM_UNIT_OPTION);
      setCustomUnitName(normalizeCustomUnitName(product.unit_name || ""));
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
    setSearchInput(value);
    setPage(1);
  }

  function handleDealerFilterChange(nextDealerId) {
    setActiveDealerId(nextDealerId);
    setPage(1);
    if (!isEditMode) {
      setFormDealerId(nextDealerId);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    setErrMsg("");

    const resolvedUnitName = isCustomUnitSelected
      ? normalizeCustomUnitName(customUnitName)
      : String(unitName || "")
          .trim()
          .toLowerCase();

    if (isCustomUnitSelected) {
      setCustomUnitName(resolvedUnitName);
    }

    if (
      !formDealerId ||
      !name ||
      !brand ||
      rate === "" ||
      mrp === "" ||
      !hsnCode ||
      !resolvedUnitName ||
      !unitQty
    ) {
      setErrMsg("Please fill all fields before submitting.");
      return;
    }

    const parsedMrp = Number(mrp);
    if (!Number.isFinite(parsedMrp) || parsedMrp < 0) {
      setErrMsg("MRP must be a valid non-negative number.");
      return;
    }

    const parsedRate = Number(rate);
    if (!Number.isFinite(parsedRate) || parsedRate < 0) {
      setErrMsg("Rate must be a valid non-negative number.");
      return;
    }

    if (resolvedUnitName.length > 50) {
      setErrMsg("Unit name must be 50 characters or less.");
      return;
    }

    const payload = {
      dealer_id: formDealerId,
      name: name.trim(),
      brand: brand.trim(),
      mrp: parsedMrp,
      rate: parsedRate,
      hsn_code: String(hsnCode).trim(),
      unit_name: resolvedUnitName,
      unit_qty: Number(unitQty),
    };

    addOrUpdateMutation.mutate(payload);
  }

  if (suppliersQuery.isLoading) {
    return <LoadingSpinner label="Loading suppliers..." />;
  }

  if (suppliersQuery.isError) {
    return <p>{suppliersQuery.error?.message || "Failed to load suppliers"}</p>;
  }

  if (suppliers.length > 0 && !activeDealerId) {
    return <LoadingSpinner label="Loading products..." />;
  }

  if (isLoading) return <LoadingSpinner label="Loading products..." />;
  if (isError) return <p>{error?.message || "Failed to load products"}</p>;

  return (
    <section
      className={`below-navbar-content-container productCatalogShell ${isOpen || productToDelete ? "blurred" : ""}`}
    >
      {isOpen && (
        <div className="modal-overlay" onClick={closeForm}>
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
              <label className="add-product-form-field">
                <span className="add-product-form-label">Supplier Dealer</span>
                <select
                  value={formDealerId}
                  onChange={(e) => setFormDealerId(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Select supplier dealer
                  </option>
                  {suppliers.map((dealer) => (
                    <option value={dealer.id} key={dealer.id}>
                      {dealer.name} ({dealer.phone})
                    </option>
                  ))}
                </select>
              </label>

              <label className="add-product-form-field">
                <span className="add-product-form-label">Product Name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter product name"
                  required
                />
              </label>
              <label className="add-product-form-field">
                <span className="add-product-form-label">Brand</span>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Enter product brand"
                  required
                />
              </label>
              <label className="add-product-form-field">
                <span className="add-product-form-label">MRP</span>
                <input
                  type="number"
                  value={mrp}
                  min="0"
                  onChange={(e) => {
                    setMrp(e.target.value);
                  }}
                  placeholder="Enter MRP"
                  required
                />
              </label>
              <label className="add-product-form-field">
                <span className="add-product-form-label">Base Rate</span>
                <input
                  type="number"
                  value={rate}
                  min="0"
                  step="any"
                  onChange={(e) => {
                    setRate(e.target.value);
                  }}
                  placeholder="Enter base rate"
                  required
                />
              </label>
              <label className="add-product-form-field">
                <span className="add-product-form-label">HSN Code</span>
                <input
                  type="number"
                  value={hsnCode}
                  min="0"
                  onChange={(e) => {
                    setHsnCode(e.target.value);
                  }}
                  placeholder="Enter HSN code"
                  required
                />
              </label>
              <label className="add-product-form-field">
                <span className="add-product-form-label">Unit</span>
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
              </label>
              {isCustomUnitSelected ? (
                <label className="add-product-form-field">
                  <span className="add-product-form-label">Custom Unit</span>
                  <input
                    type="text"
                    value={customUnitName}
                    onChange={(e) => setCustomUnitName(e.target.value)}
                    onBlur={(e) =>
                      setCustomUnitName(normalizeCustomUnitName(e.target.value))
                    }
                    placeholder="Enter custom unit name (e.g. strip, packet)"
                    maxLength={50}
                    required
                  />
                </label>
              ) : null}
              <label className="add-product-form-field">
                <span className="add-product-form-label">Unit Quantity</span>
                <input
                  type="number"
                  value={unitQty}
                  min="0"
                  onChange={(e) => {
                    setUnitQty(e.target.value);
                  }}
                  placeholder="Enter unit quantity"
                  required
                />
              </label>

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
              onClick={closeForm}
              aria-label="Close"
              disabled={addOrUpdateMutation.isPending}
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
          searchQuery={searchInput}
          setSearchQuery={handleSearchChange}
        />

        <select
          className="productCatalogDealerFilter"
          value={activeDealerId}
          onChange={(e) => handleDealerFilterChange(e.target.value)}
          aria-label="Filter products by supplier"
        >
          {suppliers.map((dealer) => (
            <option value={dealer.id} key={dealer.id}>
              {dealer.name}
            </option>
          ))}
        </select>

        <button
          className="prodCBtn"
          onClick={openAddForm}
          disabled={!activeDealerId}
        >
          + Add Product
        </button>
      </div>

      {suppliers.length === 0 ? (
        <div className="product-catalog-empty">
          <svg viewBox="0 0 64 64" aria-hidden="true">
            <path d="M8 18a2 2 0 0 1 2-2h44a2 2 0 0 1 1.73 1l6 10.4a2 2 0 0 1 .27 1v18.6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V28.4a2 2 0 0 1 .27-1L8 17.98V18Zm1.85 2-4.7 8.13H58.9L54.2 20H9.85ZM4 30v16h56V30H4Zm16 4h4v8h-4v-8Zm8 0h4v8h-4v-8Zm8 0h4v8h-4v-8Z" />
          </svg>
          <h1>No suppliers yet</h1>
          <p>
            Create a supplier dealer first, then add products to that supplier.
          </p>
          <Link to="/dealers" className="prodCBtn productCatalogCtaLink">
            Go to Dealers
          </Link>
        </div>
      ) : products.length > 0 ? (
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
              : "Add a product for this supplier to see it appear here."}
          </p>
        </div>
      )}
    </section>
  );
}
