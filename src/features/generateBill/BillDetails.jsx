import supabase from "../../services/supabaseClient";
import "../styles/generateBillStyles/billDetails.css";
import { useBill } from "./hooks/useBill";
import { ProductCard } from "../ui/ProductCard";

export function BillDetails({ setShowInvoice, setBillId }) {
  const { state, dispatch } = useBill();

  async function handleSubmit(e) {
    e.preventDefault();

    if (state.isSubmitting) return console.log("duplicate"); // prevent double submissions

    if (state.billItems.length <= 0) return;

    // gather mamaJi data (This data Will come from user Profile in future, when user auth is implemented )
    const mamaJi = {
      name: "V.S. Enterprises",
      address: "667 lig 2nd scheme no. 71",
      phoneNo: 9229665110,
    };

    // get user-entered party input BEFORE changing billType
    const partyInput = {
      name: state.billType === "Credit" ? state.buyerName : state.sellerName,
      address:
        state.billType === "Credit" ? state.buyerAddress : state.sellerAddress,
      phoneNo:
        state.billType === "Credit" ? state.buyerPhoneNo : state.sellerPhoneNo,
    };

    // build finalObject WITHOUT depending on dispatched state
    const finalBill = {
      billType: state.billType,
      buyerName: state.billType === "Credit" ? partyInput.name : mamaJi.name,
      buyerAddress:
        state.billType === "Credit" ? partyInput.address : mamaJi.address,
      buyerPhoneNo:
        state.billType === "Credit" ? partyInput.phoneNo : mamaJi.phoneNo,

      sellerName: state.billType === "Debit" ? partyInput.name : mamaJi.name,
      sellerAddress:
        state.billType === "Debit" ? partyInput.address : mamaJi.address,
      sellerPhoneNo:
        state.billType === "Debit" ? partyInput.phoneNo : mamaJi.phoneNo,

      cgst: state.cgst,
      sgst: state.sgst,
    };

    // now save with guaranteed correct data
    dispatch({
      type: "SET_FIELDS",
      payload: { isSubmitting: true },
    });
    try {
      await saveBillToDB(finalBill);
    } catch (err) {
      console.error("Error saving bill:", err);
    } finally {
      dispatch({
        type: "SET_FIELDS",
        payload: { isSubmitting: false },
      });
    }
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
        "error occured in BillDetails at handleUpdateInventory"
      );
    }
  }

  function handleBillTypeChange(selectedType) {
    // Auto Filling Mama ji's detail based on bill Type

    dispatch({
      type: "SET_FIELDS",
      payload: { billType: selectedType },
    });

    const mamaJiDetails = {
      name: "V.S. Enterprises",
      address: "667 lig 2nd scheme no. 71",
      phoneNo: 9229665110,
    };

    // Preserve user-entered data
    const userData = {
      name: selectedType === "Credit" ? state.buyerName : state.sellerName,
      address:
        selectedType === "Credit" ? state.buyerAddress : state.sellerAddress,
      phoneNo:
        selectedType === "Credit" ? state.buyerPhoneNo : state.sellerPhoneNo,
    };

    if (selectedType === "Credit") {
      dispatch({
        type: "SET_FIELDS",
        payload: {
          sellerName: mamaJiDetails.name,
          sellerAddress: mamaJiDetails.address,
          sellerPhoneNo: mamaJiDetails.phoneNo,
          buyerName: userData.name,
          buyerAddress: userData.address,
          buyerPhoneNo: userData.phoneNo,
        },
      });
    }

    if (selectedType === "Credit") {
      dispatch({
        type: "SET_FIELDS",
        payload: {
          sellerName: mamaJiDetails.name,
          sellerAddress: mamaJiDetails.address,
          sellerPhoneNo: mamaJiDetails.phoneNo,
          buyerName: userData.name,
          buyerAddress: userData.address,
          buyerPhoneNo: userData.phoneNo,
        },
      });
    }
  }

  async function saveBillToDB(finalBill) {
    try {
      // Save to Bill + Bill_items table in the database (then updates the inventory table using handleUpdateInventory fn)
      const { data: billDataRes, error: billDataError } = await supabase
        .from("bills")
        .insert([
          {
            bill_type: finalBill.billType,
            buyer_name: finalBill.buyerName,
            buyer_address: finalBill.buyerAddress,
            buyer_phone_no: finalBill.buyerPhoneNo,

            seller_name: finalBill.sellerName,
            seller_address: finalBill.sellerAddress,
            seller_phone_no: finalBill.sellerPhoneNo,

            cgst: finalBill.cgst,
            sgst: finalBill.sgst,
          },
        ])
        .select();

      if (billDataError)
        throw "error while saving in Bill Table (at bill details )";

      console.log("SuccessFully Saved Bill", billDataRes);

      const itemsToSave = state.billItems.map((item) => {
        console.log(item);
        return {
          bill_id: billDataRes[0].id,
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
        .from("bill_items")
        .insert(itemsToSave)
        .select();

      if (BillItemsError)
        throw "Error while Saving in  Bill items Table (at bill details ) ";

      console.log("SuccessFully Saved Bill items ", billItemsData);

      // save the id the in bill store so invoice template can access it
      console.log("BILL Details =    ", billDataRes.id, billDataRes[0].id);
      setBillId(billDataRes[0].id);
      setShowInvoice(true);
      // dispatch({ type: "SET_FIELDS", payload: { bill_id: billDataRes[0].id } });
      // dispatch({ type: "SET_FIELDS", payload: { showBill: true } });

      // Updates the inventory if everything goes right.
      await handleUpdateInventory(billItemsData);

      // // create a snapshot of the saved bill for invoice display
      // const snapshot = {
      //   billId: billDataRes[0].id,
      //   billType: finalBill.billType,
      //   buyerName: finalBill.buyerName,
      //   buyerAddress: finalBill.buyerAddress,
      //   buyerPhoneNo: finalBill.buyerPhoneNo,
      //   sellerName: finalBill.sellerName,
      //   sellerAddress: finalBill.sellerAddress,
      //   sellerPhoneNo: finalBill.sellerPhoneNo,
      //   cgst: finalBill.cgst,
      //   sgst: finalBill.sgst,
      //   billItems: billItemsData,
      //   billNo: billDataRes[0].bill_no,
      //   createdAt: billDataRes[0].created_at,
      // };

      // set the snapshot in context, show invoice, and clear the editable form fields
      // dispatch({ type: "SET_SNAPSHOT", payload: snapshot });
      // dispatch({ type: "SET_FIELDS", payload: { showBill: true } });
      // clear form fields so the user gets a fresh form when they come back
      dispatch({
        type: "SET_FIELDS",
        payload: {
          billType: "Credit",
          buyerName: "",
          buyerAddress: "",
          buyerPhoneNo: "",
          sellerName: "",
          sellerAddress: "",
          sellerPhoneNo: "",
          cgst: "",
          sgst: "",
          billItems: [],
        },
      });

      // commented this coz the invoiceFormat needs the current state to in the bill (will see in future if i can get data from db by passing id, it will be costly so will see)
      /*
      setting input fields to their initial values.
      dispatch({
        type: "SET_FIELDS",
        payload: {
          billType: "Credit",
          buyerName: "",
          buyerAddress: "",
          buyerPhoneNo: "",
          sellerName: "",
          sellerAddress: "",
          sellerPhoneNo: "",
          cgst: "",
          sgst: "",
          billItems: [],
      },
      });
      */
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <section id="billDetails">
      <h1>Bill Details</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-sub-container">
          <div className="form-el-container">
            <span>Bill Type</span>
            <select
              className="formEl"
              id="selectEl"
              value={state.billType}
              onChange={(e) => handleBillTypeChange(e.target.value)}
              name="billType"
            >
              <option className="optionEl" value="Credit">
                Credit
              </option>
              <option className="optionEl" value="Debit">
                Debit
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
                state.billType === "Credit" ? state.buyerName : state.sellerName
              }
              onChange={(e) =>
                dispatch({
                  type: "SET_FIELDS",
                  payload:
                    state.billType === "Credit"
                      ? { buyerName: e.target.value }
                      : { sellerName: e.target.value },
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
                state.billType === "Credit"
                  ? state.buyerAddress
                  : state.sellerAddress
              }
              onChange={(e) =>
                dispatch({
                  type: "SET_FIELDS",
                  payload:
                    state.billType === "Credit"
                      ? { buyerAddress: e.target.value }
                      : { sellerAddress: e.target.value },
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
                state.billType === "Credit"
                  ? state.buyerPhoneNo
                  : state.sellerPhoneNo
              }
              onChange={(e) =>
                dispatch({
                  type: "SET_FIELDS",
                  payload:
                    state.billType === "Credit"
                      ? { buyerPhoneNo: e.target.value }
                      : { sellerPhoneNo: e.target.value },
                })
              }
            />
          </div>
        </div>

        <div id="billItemsContainer" className="scroll-hide">
          {state.billItems && state.billItems.length > 0 ? (
            state.billItems.map((item) => {
              console.log(item);

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
          <p>Your Total : 💵</p>
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
