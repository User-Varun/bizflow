const PDFDocument = require("pdfkit-table");

async function generateReportPdf({
  tenant,
  invoices,
  summary,
  reportTitle,
}) {
  const doc = new PDFDocument({
    margin: 30,
    size: "A4",
  });

  const buffers = [];

  doc.on("data", buffers.push.bind(buffers));

  const pdfPromise = new Promise((resolve) => {
    doc.on("end", () => {
      resolve(Buffer.concat(buffers));
    });
  });

  // HEADER

  doc.fontSize(20).text("Sales Report", {
    align: "center",
  });

  doc.moveDown();

  doc.fontSize(12);

  doc.text(`Business: ${tenant.business_name || ""}`);
  doc.text(`GSTIN: ${tenant.gstin || ""}`);
  doc.text(`Report Type: ${reportTitle}`);
  doc.text(`Generated At: ${new Date().toLocaleString()}`);

  doc.moveDown();

  // SUMMARY

  doc.fontSize(16).text("Summary");

  doc.moveDown(0.5);

  doc.fontSize(12);

  doc.text(`Total Bills: ${summary.totalBills}`);
  doc.text(`Total Revenue: ₹${summary.totalRevenue.toFixed(2)}`);
  doc.text(`Total GST: ₹${summary.totalGST.toFixed(2)}`);
  doc.text(`Average Bill Value: ₹${summary.averageBillValue.toFixed(2)}`);

  doc.moveDown(1);

  // TABLE

  const table = {
    title: "Invoices",
    headers: [
      "Invoice No",
      "Date",
      "Buyer",
      "GSTIN",
      "Amount",
      "GST",
      "Total",
    ],

    rows: invoices.map((invoice) => [
      invoice.invoice_number,
      new Date(invoice.createdAt).toLocaleDateString("en-IN"),
      invoice.invoice_to,
      invoice.other_party_gst || "-",
      invoice.sub_total.toFixed(2),
      (invoice.cgst_total + invoice.sgst_total).toFixed(2),
      invoice.grand_total.toFixed(2),
    ]),
  };

  await doc.table(table, {
    width: 540,
  });

  doc.end();

  return pdfPromise;
}

module.exports = generateReportPdf;