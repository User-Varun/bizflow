const Invoice = require("../models/invoiceModel");
const { Op, literal } = require("sequelize");

const INVOICE_PREFIX_BY_TYPE = {
  stock_in: "PURCHASE",
  stock_out: "INV",
};

exports.generateInvoiceNumber = async ({ tenantId, invoiceType, transaction }) => {
  const year = new Date().getFullYear();
  const prefixLabel = INVOICE_PREFIX_BY_TYPE[invoiceType];

  if (!prefixLabel) {
    throw new Error(
      `invalid invoice type for invoice number generation: ${invoiceType}`,
    );
  }

  // sale invoices will use underscore format: INV_YEAR_SEQ (e.g. INV_2026_001)
  const isSale = String(invoiceType) === "stock_out";
  const delimiter = isSale ? "_" : "-";
  const prefix = isSale ? `${prefixLabel}_${year}_` : `${prefixLabel}-${year}-`;

  try {
    const lastInvoice = await Invoice.findOne({
      where: {
        tenant_id: tenantId,
        invoice_type: invoiceType,
        invoice_number: { [Op.like]: `${prefix}%` },
      },
      attributes: ["invoice_number"],
      order: [[literal(`CAST(split_part("invoice_number", '${delimiter}', 3) AS INTEGER)`), "DESC"]],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    const rawSeq = lastInvoice?.invoice_number?.split(delimiter)[2];
    const lastSeq = Number.isFinite(Number(rawSeq)) ? Number(rawSeq) : 0;
    const nextSeq = lastSeq + 1;

    return `${prefix}${String(nextSeq).padStart(3, "0")}`;
  } catch (err) {
    throw err;
  }
};
