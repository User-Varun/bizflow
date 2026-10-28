const Inventory = require("../models/inventoryModel");
const AppError = require("./appError");

// Updates inventory per invoice item inside the same DB transaction.
// Case 1: item exists -> increment/decrement quantity
// Case 2: item missing -> create for stock_in, reject for stock_out
exports.updateInventory = async ({
  tenantId,
  invoiceType,
  invoiceItems,
  transaction,
}) => {
  for (const item of invoiceItems) {
    let inventoryItem = null;
    const totalQuantity =
      Number(item.product_qty || 0) + Number(item.free_quantity || 0);

    if (item.product_catalog_id) {
      inventoryItem = await Inventory.findOne({
        where: {
          tenant_id: tenantId,
          product_catalog_id: item.product_catalog_id,
          mrp: Number(item.mrp),
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
    }

    if (!inventoryItem && !item.product_catalog_id) {
      inventoryItem = await Inventory.findOne({
        where: {
          tenant_id: tenantId,
          name: item.name,
          brand: item.brand,
          hsn_code: item.hsn_code,
          unit_name: item.unit_name,
          unit_qty: item.unit_qty,
          mrp: Number(item.mrp),
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
    }

    if (inventoryItem) {
      if (invoiceType === "stock_in") {
        inventoryItem.product_qty =
          Number(inventoryItem.product_qty || 0) + totalQuantity;

        if (Number.isFinite(Number(item.rate))) {
          inventoryItem.rate = Number(item.rate);
        }
      }

      if (invoiceType === "stock_out") {
        if (inventoryItem.product_qty < totalQuantity) {
          throw new AppError(
            `Insufficient stock for item: ${item.name}. Available: ${inventoryItem.product_qty}, Requested: ${totalQuantity}`,
            400,
          );
        }

        inventoryItem.product_qty =
          Number(inventoryItem.product_qty || 0) - totalQuantity;
      }

      await inventoryItem.save({ transaction });
      continue;
    }

    if (invoiceType === "stock_in") {
      await Inventory.create(
        {
          tenant_id: tenantId,
          product_catalog_id: item.product_catalog_id || null,
          name: item.name,
          brand: item.brand,
          product_qty: totalQuantity,
          hsn_code: item.hsn_code,
          unit_name: item.unit_name,
          unit_qty: item.unit_qty,
          mrp: item.mrp,
          rate: Number.isFinite(Number(item.rate)) ? Number(item.rate) : null,
        },
        { transaction },
      );
      continue;
    }

    throw new AppError(
      `cannot stock_out non-existing inventory item: ${item.name}`,
      400,
    );
  }
};
