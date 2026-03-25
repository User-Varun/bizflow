import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "../styles/invoiceTemplate.css";
import { useQuery } from "@tanstack/react-query";
import { requestJSON } from "../styles/utils/requestJSON";
import { LoadingSpinner } from "./LoadingSpinner";

const baseUrl = import.meta.env.VITE_API_URL;

export function InvoiceTemplate({ id, onBack, backButtonLabel = "Back" }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["invoice", id],
    queryFn: () =>
      requestJSON(`${baseUrl}/viewInvoices/${id}`, {
        method: "GET",
      }),
    select: (payload) => payload?.result || null,
    enabled: Boolean(id),
    staleTime: 30000,
  });

  function clacSubTotal() {
    return Number(data?.sub_total || 0);
  }

  function clacGrandTotal() {
    return Number(data?.grand_total || 0);
  }

  function calcDiscountTotal() {
    const items = data?.invoice_items || [];

    return items.reduce((sum, item) => {
      const baseAmount = Number(item.rate || 0) * Number(item.product_qty || 0);
      const discountPct = Number(item.discount || 0);
      const discountAmount = (baseAmount * discountPct) / 100;

      return sum + discountAmount;
    }, 0);
  }

  function formatAmt(n) {
    return `₹${Number(n || 0).toFixed(2)}`;
  }

  function numberToWords(num) {
    if (num === 0) return "zero";

    const ones = [
      "",
      "one",
      "two",
      "three",
      "four",
      "five",
      "six",
      "seven",
      "eight",
      "nine",
    ];
    const teens = [
      "ten",
      "eleven",
      "twelve",
      "thirteen",
      "fourteen",
      "fifteen",
      "sixteen",
      "seventeen",
      "eighteen",
      "nineteen",
    ];
    const tens = [
      "",
      "",
      "twenty",
      "thirty",
      "forty",
      "fifty",
      "sixty",
      "seventy",
      "eighty",
      "ninety",
    ];

    function convertLessThanThousand(n) {
      if (n === 0) return "";
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100)
        return (
          tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "")
        );
      return (
        ones[Math.floor(n / 100)] +
        " hundred" +
        (n % 100 !== 0 ? " " + convertLessThanThousand(n % 100) : "")
      );
    }

    let integer = Math.floor(num);
    const decimal = Math.round((num - integer) * 100);

    let result = "";

    if (integer >= 10000000) {
      const crores = Math.floor(integer / 10000000);
      result += convertLessThanThousand(crores) + " crore ";
      integer %= 10000000;
    }

    if (integer >= 100000) {
      const lakhs = Math.floor(integer / 100000);
      result += convertLessThanThousand(lakhs) + " lakh ";
      integer %= 100000;
    }

    if (integer >= 1000) {
      const thousands = Math.floor(integer / 1000);
      result += convertLessThanThousand(thousands) + " thousand ";
      integer %= 1000;
    }

    if (integer > 0) {
      result += convertLessThanThousand(integer);
    }

    result = result.trim();

    if (decimal > 0) {
      result += " and " + convertLessThanThousand(decimal) + " paise";
    }

    return result + " only";
  }

  async function handleDownloadPDF() {
    const el = document.getElementById("invoice-root");
    if (!el) return;

    // capture at scale for crispnessa
    const scale = Math.max(1, Math.min(3, window.devicePixelRatio || 2));
    const canvas = await html2canvas(el, {
      scale,
      useCORS: true,
    });
    const imgData = canvas.toDataURL("image/png");

    // canvas.width/height are in device pixels (cssPx * scale)
    const cssWidthPx = canvas.width / scale;
    const cssHeightPx = canvas.height / scale;

    // convert CSS px -> mm (assume 96 DPI baseline)
    const mmPerPx = 25.4 / 96;
    const pdfWidthMm = cssWidthPx * mmPerPx;
    const pdfHeightMm = cssHeightPx * mmPerPx;

    // force landscape if you want always landscape:
    const orientation = pdfWidthMm >= pdfHeightMm ? "landscape" : "portrait";

    // create a PDF with exact dimensions in mm (no fallback to A4)
    let pdf;
    try {
      pdf = new jsPDF({
        unit: "mm",
        format: [pdfWidthMm, pdfHeightMm],
        orientation,
      });
    } catch (err) {
      console.log(err);
      // older API fallback
      pdf = new jsPDF(orientation === "landscape" ? "l" : "p", "mm", [
        pdfWidthMm,
        pdfHeightMm,
      ]);
    }

    // add image at full page size (no extra margins)
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidthMm, pdfHeightMm);
    pdf.save(`invoice-${Date.now()}.pdf`);
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    const formatted = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;

    return formatted;
  }

  if (isLoading) {
    return <LoadingSpinner label="Loading invoice..." minHeight="300px" />;
  }

  if (isError)
    return <span>{error?.message || "Failed to load invoice."}</span>;

  return data ? (
    <div className="invoice-template-container">
      <div id="invoice-root" className="invoice-container">
        <div className="invoice-border">
          <header className="inv-top">
            <div className="inv-left">
              <h2 className="company">{data.invoice_from}</h2>
              <span className="text-s">{data.address_from}</span>
              <span className="text-s">Phone: {data.phone_from}</span>
            </div>

            <div className="inv-right">
              <h2 className="company">{data.invoice_to}</h2>
              <p className="text-s">{data.address_to}</p>
              <p className="text-s">Phone: {data.phone_to}</p>
              {/* <p className="text-s">GST : {data[0].gst}</p> */}
              <p className="text-s">GST : {data.other_party_gst || "-"}</p>
            </div>
          </header>

          <section className="bill-meta">
            <div className="container-pad">
              {/* <span>GSTIN: {data[0].gst_in}</span> */}
              <span>Other Party GSTIN: {data.other_party_gst || "-"}</span>
            </div>
            <div className="inv-center">
              <h1 className="inv-title">GST INVOICE</h1>
            </div>
            <div className="inv-right-inner container-pad-2">
              <span>Invoice No. : {data.invoice_number}</span>
              <span>Date : {formatDate(data.createdAt)}</span>
            </div>
          </section>

          <table className="inv-table">
            <thead>
              <tr>
                <th>Sn.</th>
                <th>QTY</th>
                <th>Product</th>
                <th>HSN</th>
                <th>MRP</th>
                <th>RATE</th>
                <th>Discount</th>
                <th>SGST</th>
                <th>CGST</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.invoice_items && data.invoice_items.length > 0 ? (
                data.invoice_items.map((item, idx) => {
                  const baseAmount =
                    Number(item.rate || 0) * Number(item.product_qty || 0);
                  const discountPct = Number(item.discount || 0);
                  const discountAmount = (baseAmount * discountPct) / 100;
                  const lineAmount = baseAmount - discountAmount;

                  return (
                    <tr key={item.id || idx}>
                      <td>{idx + 1}</td>
                      <td>{item.product_qty}</td>
                      <td className="prod-col prod-name">{item.name}</td>
                      <td>{item.hsn_code || "-"}</td>
                      <td>₹{item.mrp ?? "-"}</td>
                      <td>₹{item.rate ?? "-"}</td>
                      <td className="discount-cell">
                        {Number(item.discount || 0)}%
                      </td>
                      <td>{Number(item.sgst || 0)}%</td>
                      <td>{Number(item.cgst || 0)}%</td>
                      <td>{formatAmt(lineAmount)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center" }}>
                    NO Items available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="subTotalContainer">
            <div className="inner-stc">
              <span>SUB TOTAL</span>
              <span>{formatAmt(clacSubTotal())}</span>
            </div>
          </div>

          <div className="totals-row">
            <div className="left-block">
              <div className="inner-left-block">
                <p className="in-words">
                  Rs. {numberToWords(clacGrandTotal())}
                </p>
                <div className="terms">
                  <a href="#">Terms & Conditions</a>
                </div>
                <div className="terms-more">
                  <p>Goods once sold will not be taken back or exchanged.</p>
                  <span>
                    Bills not paid due date will attract 24% interest.
                  </span>
                </div>
                <div className="bank">
                  <span>
                    <strong>HDFC BANK: </strong> (needs edit)
                  </span>
                  <span>
                    I<strong>FSC CODE: </strong> (needs edit)
                  </span>
                </div>
              </div>
              <div className="inner-right-block">
                <img
                  className="qr"
                  // src={data[0].qr_url || "/qr.png"}
                  src={"/qr.png"}
                  alt="QR code"
                />
                <span>For V.S. Enterprises</span>
              </div>
              <div className="inner-middle-down-block">
                <a href="#" className="auth-sig">
                  Authorised Signatory
                </a>
              </div>
            </div>
            <div className="right-block">
              <div className="tot-line">
                <span>SGST PAYABLE</span>
                <span>{formatAmt(data.sgst_total)}</span>
              </div>
              <div className="tot-line">
                <span>CGST PAYABLE</span>
                <span>{formatAmt(data.cgst_total)}</span>
              </div>
              <div className="tot-line">
                <span>DISCOUNT</span>
                <span>{formatAmt(calcDiscountTotal())}</span>
              </div>

              {/* <div className="tot-line">
                <span>CR/DR NOTE</span>
                <span>0</span>
              </div>  */}
              <div className="tot-line grand">
                <span>GRAND TOTAL</span>
                <span>{formatAmt(clacGrandTotal())}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="invoice-actions-row">
        {onBack ? (
          <button
            type="button"
            className="invoice-action-btn invoice-action-btn-secondary"
            onClick={onBack}
          >
            {backButtonLabel}
          </button>
        ) : null}
        <button
          type="button"
          className="invoice-action-btn invoice-action-btn-primary"
          onClick={handleDownloadPDF}
        >
          Download this in PDF
        </button>
      </div>
    </div>
  ) : (
    <span>Invoice not found.</span>
  );
}
