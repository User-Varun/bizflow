import "../../styles/generateBillStyles/billDetails.css";
import { useBill } from "./hooks/useBill";
import { ProductCard } from "../../ui/ProductCard.jsx";
import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { requestJSON } from "../../utils/requestJSON";
const STOCK_IN = import.meta.env.VITE_STOCK_IN;
const STOCK_OUT = import.meta.env.VITE_STOCK_OUT;
const baseUrl = import.meta.env.VITE_API_URL;

export function BillDetails({ setShowInvoice, setBillId }) {
  const { state, dispatch } = useBill();
  const queryClient = useQueryClient();

  const totalAmount = useMemo(() => {
    return state.invoice_items.reduce(
      (acc, item) => acc + Number(item.rate || 0) * Number(item.item_qty || 0),
      0,
    );
  }, [state.invoice_items]);

  // mamaJi data (This data Will come from user Profile in future, when user auth is implemented )
  const mamaJiDetails = {
    name: "V.S. Enterprises",
    address: "667 lig 2nd scheme no. 71",
    phoneNo: 9229665110,
  };

  const generateInvoiceMutation = useMutation({
    mutationFn: (payload) =>
      requestJSON(`${baseUrl}/generateInvoice`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (response) => {
      const generatedInvoiceId = response?.result?.invoiceRes?.id;
      if (!generatedInvoiceId)
        throw new Error("Invoice created but id missing");

      setBillId(generatedInvoiceId);
      setShowInvoice(true);

      dispatch({
        type: "SET_FIELDS",
        payload: {
          invoice_type: STOCK_OUT,
          invoice_to: "",
          address_to: "",
          phone_to: "",
          invoice_from: mamaJiDetails.name,
          address_from: mamaJiDetails.address,
          phone_from: mamaJiDetails.phoneNo,
          cgst: "2.5",
          sgst: "2.5",
          invoice_items: [],
          invoice_no: "",
          total_amt: 0,
          pending_amt: 0,
          pending_invoice: true,
        },
      });

      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["viewInvoices"] });
    },
    onError: (err) => {
      console.error("Error saving bill:", err);
    },
  });

  function handleSubmit(e) {
    e.preventDefault();

    if (generateInvoiceMutation.isPending) return;

    if (state.invoice_items.length <= 0) return;

    const invoiceDetails =
      state.invoice_type === STOCK_OUT
        ? {
            invoice_type: STOCK_OUT,
            invoice_to: state.invoice_to,
            address_to: state.address_to,
            phone_to: state.phone_to,
          }
        : {
            invoice_type: STOCK_IN,
            invoice_from: state.invoice_from,
            address_from: state.address_from,
            phone_from: state.phone_from,
          };

    const invoiceItemsDetails = state.invoice_items.map((item) => ({
      name: item.name,
      brand: item.brand,
      hsn_code: item.hsn_code,
      unit_name: item.unit_name,
      unit_qty: Number(item.unit_qty || 0),
      product_qty: Number(item.item_qty || 0),
      rate: Number(item.rate || 0),
      mrp: Number(item.mrp || 0),
      cgst: Number(state.cgst || 0),
      sgst: Number(state.sgst || 0),
      discount: Number(item.discount || 0),
      product_catalog_id: item.product_catalog_id || item.id || null,
    }));

    const payload = {
      invoiceDetails,
      invoiceItemsDetails,
      paymentDetails: {
        amount: 0,
        payment_method: "cash",
      },
    };

    generateInvoiceMutation.mutate(payload);
  }

  function handleRemoveBillItem(itemToRemove) {
    const updatedItems = state.invoice_items.filter((item) => {
      if (item.id && itemToRemove.id) return item.id !== itemToRemove.id;

      return !(
        item.name === itemToRemove.name &&
        item.brand === itemToRemove.brand &&
        Number(item.unit_qty || 0) === Number(itemToRemove.unit_qty || 0) &&
        item.unit_name === itemToRemove.unit_name
      );
    });

    dispatch({
      type: "SET_FIELDS",
      payload: {
        invoice_items: updatedItems,
      },
    });
  }

  async function handleBillTypeChange(selectedType) {
    // Job :- Auto Filling Mama ji's detail based on invoice_Type

    await dispatch({
      type: "SET_FIELDS",
      payload: { invoice_type: selectedType },
    });

    // Clear all feilds when user change invoice_type
    await dispatch({
      type: "SET_FIELDS",
      payload: {
        invoice_from: "",
        address_from: "",
        phone_from: "",

        invoice_to: "",
        address_to: "",
        phone_to: "",

        invoice_items: [],
        invoice_no: "",
        total_amt: 0,
        pending_amt: 0,
        pending_invoice: true,
      },
    });

    // then apply the value based on the invoice_type

    if (selectedType === STOCK_OUT) {
      await dispatch({
        type: "SET_FIELDS",
        payload: {
          invoice_from: mamaJiDetails.name,
          address_from: mamaJiDetails.address,
          phone_from: mamaJiDetails.phoneNo,
        },
      });
    } else if (selectedType === STOCK_IN) {
      await dispatch({
        type: "SET_FIELDS",
        payload: {
          invoice_to: mamaJiDetails.name,
          address_to: mamaJiDetails.address,
          phone_to: mamaJiDetails.phoneNo,
        },
      });
    }
  }

  return (
    <section id="billDetails">
      <form onSubmit={handleSubmit}>
        <div className="form-sub-container">
          <div className="form-el-container">
            <span>Bill Type</span>
            <select
              className="formEl"
              id="selectEl"
              value={state.invoice_type}
              onChange={(e) => handleBillTypeChange(e.target.value)}
              name="invoice_type"
            >
              <option className="optionEl" value={STOCK_OUT}>
                stock_out
              </option>
              <option className="optionEl" value={STOCK_IN}>
                stock_in
              </option>
            </select>
          </div>

          <div className="form-el-container">
            <span>Party Name</span>
            <input
              className="formEl"
              required
              type="text"
              placeholder="e.g. arihant enterprises"
              value={
                state.invoice_type === STOCK_OUT
                  ? state.invoice_to
                  : state.invoice_from
              }
              onChange={(e) =>
                dispatch({
                  type: "SET_FIELDS",
                  payload:
                    state.invoice_type === STOCK_OUT
                      ? { invoice_to: e.target.value }
                      : { invoice_from: e.target.value },
                })
              }
            />
          </div>
        </div>

        <div className="form-sub-container">
          <div className="form-el-container">
            <span>Party Address</span>
            <input
              className="formEl"
              required
              type="text"
              placeholder="e.g near navlakha road, indore"
              value={
                state.invoice_type === STOCK_OUT
                  ? state.address_to
                  : state.address_from
              }
              onChange={(e) =>
                dispatch({
                  type: "SET_FIELDS",
                  payload:
                    state.invoice_type === STOCK_OUT
                      ? { address_to: e.target.value }
                      : { address_from: e.target.value },
                })
              }
            />
          </div>

          <div className="form-el-container">
            <span>Party Phone No.</span>
            <input
              className="formEl"
              required
              type="number"
              placeholder="e.g. XXXXX98260"
              maxLength={10}
              value={
                state.invoice_type === STOCK_OUT
                  ? state.phone_to
                  : state.phone_from
              }
              onChange={(e) =>
                dispatch({
                  type: "SET_FIELDS",
                  payload:
                    state.invoice_type === STOCK_OUT
                      ? { phone_to: e.target.value }
                      : { phone_from: e.target.value },
                })
              }
            />
          </div>
        </div>

        <div id="billItemsContainer" className="scroll-hide">
          {state.invoice_items && state.invoice_items.length > 0 ? (
            state.invoice_items.map((item) => {
              return (
                <ProductCard
                  res={item}
                  key={item.id || `${item.name}-${item.brand}`}
                  billDetailsCard={true}
                  onRemove={handleRemoveBillItem}
                />
              );
            })
          ) : (
            <span className="emptyContainerMsg">
              No Items! <br></br>Add some and watch them appear here 🙃
            </span>
          )}
        </div>
        <div className="form-sub-container">
          <p>Your Total : ₹{totalAmount}</p>
          <div className="form-sub-container2">
            <div>
              <em>CGST </em>{" "}
              <input
                className="formEl2"
                required
                type="text"
                placeholder="2.5"
                value={state.cgst}
                onChange={(e) =>
                  dispatch({
                    type: "SET_FIELDS",
                    payload: { cgst: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <em>SGST </em>{" "}
              <input
                className="formEl2"
                required
                type="text"
                placeholder="2.5"
                value={state.sgst}
                onChange={(e) =>
                  dispatch({
                    type: "SET_FIELDS",
                    payload: { sgst: e.target.value },
                  })
                }
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className={`submitBtn ${generateInvoiceMutation.isPending ? "btn-disabled" : ""}`}
          disabled={generateInvoiceMutation.isPending}
        >
          {generateInvoiceMutation.isPending
            ? "Generating..."
            : "Generate Bill"}
        </button>
      </form>
    </section>
  );
}
