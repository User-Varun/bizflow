import supabase from "../../services/supabaseClient";
import "../styles/generateBillStyles/billDetails.css";
import { useBill } from "./hooks/useBill";
import { ProductCard } from "../ui/ProductCard";

import { STOCK_IN, STOCK_OUT } from "../../appConfig.js";
import { useEffect, useCallback } from "react";

export function BillDetails({ setShowInvoice, setBillId }) {
  const { state, dispatch } = useBill();

  const calcTotalAmt = useCallback(() => {
    return state.invoice_items.reduce(
      (acc, item) => acc + Number(item.rate || 0) * Number(item.item_qty || 0),
      0,
    );
  }, [state.invoice_items]);

  // every time user updates the local invoice_items state, update total_amt,pending_amt
  useEffect(() => {
    function f() {
      const invoice_total = calcTotalAmt();

      dispatch({
        type: "SET_FIELDS",
        payload: {
          total_amt: invoice_total,
          pending_amt: invoice_total,
        },
      });
    }

    f();
  }, [dispatch, calcTotalAmt, state.invoice_details]);

  // mamaJi data (This data Will come from user Profile in future, when user auth is implemented )
  const mamaJiDetails = {
    name: "V.S. Enterprises",
    address: "667 lig 2nd scheme no. 71",
    phoneNo: 9229665110,
  };

  async function handleSubmit(e) {
    e.preventDefault();

    if (state.isSubmitting) return console.log("duplicate"); // prevent double submissions

    if (state.invoice_items.length <= 0) return;

    // fill mama ji's detail based on invoice_type (if user don't change the invoice_type field we have to update the mama ji's details here manually)
    // the option stock_out will be selecteed in starting, so have to manually update the seller detail to mamaji in case it is empty
    const finalBill = {
      invoice_type: state.invoice_type,

      invoice_to: state.invoice_to,
      address_to: state.invoice_to,
      phone_to: state.invoice_to,

      invoice_from: state.invoice_from || mamaJiDetails.name,
      address_from: state.invoice_from || mamaJiDetails.address,
      phone_from: state.phone_from || mamaJiDetails.phoneNo,

      cgst: state.cgst,
      sgst: state.sgst,

      invoice_no: state.invoice_no,
      total_amt: state.total_amt,
      pending_amt: state.pending_amt,
      pending_invoice: state.pending_invoice,
    };

    dispatch({
      type: "SET_FIELDS",
      payload: { isSubmitting: true },
    });

    console.log(finalBill);

    //   try {
    //     await saveBillToDB(finalBill);
    //   } catch (err) {
    //     console.error("Error saving bill:", err);
    //   } finally {
    //     dispatch({
    //       type: "SET_FIELDS",
    //       payload: { isSubmitting: false },
    //     });
    //   }
  }

  async function handleUpdateInventory(data) {
    try {
      const hsnCodes = data.map((item) => item.hsn_code);

      const itemsToUpdate = [];
      const itemsToInsert = [];

      // 1. Fetch existing inventory entries
      const { data: existingItems, error: fetchError } = await supabase
        .from("inventory")
        .select("id , hsn_code , item_qty")
        .in("hsn_code", hsnCodes);

      if (fetchError) throw fetchError;

      // 2. Catergories data
      data.forEach((item) => {
        const match = existingItems.find((i) => i.hsn_code === item.hsn_code);

        if (match) {
          // the item already exists in the inventory , just update it's quantity
          itemsToUpdate.push({
            id: match.id,
            item_qty: match.item_qty + item.item_qty,
          });
        } else {
          // otherwise create a record in inventory table
          itemsToInsert.push({
            name: item.name,
            brand: item.brand,
            mrp: item.mrp,
            item_qty: item.item_qty,
            hsn_code: item.hsn_code,
            img_url: item.img_url,
            unit_name: item.unit_name,
            unit_qty: item.unit_qty,
          });
        }
      });

      // 3. insert the new inventory records
      if (itemsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from("inventory")
          .insert(itemsToInsert);

        if (insertError) throw insertError;
      }

      // 4. update the existing records
      for (const item of itemsToUpdate) {
        const { error: updateError } = await supabase
          .from("inventory")
          .update({ item_qty: item.item_qty })
          .eq("id", item.id);

        if (updateError) throw updateError;
      }

      console.log("Inventory updated successfully");
    } catch (err) {
      console.error(
        err,
        "error occured in BillDetails at handleUpdateInventory",
      );
    }
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

  async function saveBillToDB(finalBill) {
    try {
      // Save to Bill + Bill_items table in the database (then updates the inventory table using handleUpdateInventory fn)
      const { data: billDataRes, error: billDataError } = await supabase
        .from("invoices")
        .insert([
          {
            invoice_type: finalBill.invoice_type,
            invoice_to: finalBill.invoice_to,
            address_to: finalBill.address_to,
            phone_to: finalBill.phone_to,

            invoice_from: finalBill.invoice_from,
            address_from: finalBill.address_from,
            phone_from: finalBill.phone_from,

            cgst: finalBill.cgst,
            sgst: finalBill.sgst,

            invoice_no: "0001",
            total_amt: 100,
            pending_amt: 100,
            pending_invoice: true,
          },
        ])
        .select();

      console.log(billDataRes);

      if (billDataError) {
        console.log(billDataError);
        throw "error while saving in invoices Table (at invoice_items )";
      }

      console.log("SuccessFully Saved invoice", billDataRes);

      const itemsToSave = state.invoice_items.map((item) => {
        console.log(item);
        return {
          invoice_id: billDataRes[0].id,
          name: item.name,
          brand: item.brand,
          hsn_code: item.hsn_code,
          unit_name: item.unit_name,
          unit_qty: item.unit_qty,
          item_qty: item.item_qty,
          rate: item.rate,
          mrp: item.mrp,
          taxable_amount: item.rate * item.item_qty,
          img_url: item.img_url,
        };
      });

      const { data: billItemsData, error: BillItemsError } = await supabase
        .from("invoice_items")
        .insert(itemsToSave)
        .select();

      if (BillItemsError)
        throw "Error while Saving in  invoice_items Table (at Bill details ) ";

      console.log("SuccessFully Saved Bill items ", billItemsData);

      // save the id the in bill store so invoice template can access it
      console.log("BILL Details =    ", billDataRes.id, billDataRes[0].id);
      setBillId(billDataRes[0].id);
      setShowInvoice(true);
      // dispatch({ type: "SET_FIELDS", payload: { bill_id: billDataRes[0].id } });
      // dispatch({ type: "SET_FIELDS", payload: { showBill: true } });

      // Updates the inventory if everything goes right.
      await handleUpdateInventory(billItemsData);

      // clear form fields so the user gets a fresh form when they come back
      dispatch({
        type: "SET_FIELDS",
        payload: {
          invoice_type: STOCK_OUT,
          invoice_to: "",
          address_to: "",
          phone_to: "",
          invoice_from: "",
          address_from: "",
          phone_from: "",
          cgst: "2.5",
          sgst: "2.5",
          invoice_items: [],
          invoice_no: "",
          total_amt: 0,
          pending_amt: 0,
          pending_invoice: true,
          isSubmitting: false,
        },
      });
    } catch (err) {
      console.error(err);
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
                <ProductCard res={item} key={item.id} billDetailsCard={true} />
              );
            })
          ) : (
            <span className="emptyContainerMsg">
              No Items! <br></br>Add some and watch them appear here 🙃
            </span>
          )}
        </div>
        <div className="form-sub-container">
          <p>Your Total : ₹{state.total_amt}</p>
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
          className={`submitBtn ${state.isSubmitting ? "btn-disabled" : ""}`}
          disabled={state.isSubmitting}
        >
          {state.isSubmitting ? "Generating..." : "Generate Bill"}
        </button>
      </form>
    </section>
  );
}
