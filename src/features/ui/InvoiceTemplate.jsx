import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "../styles/invoiceTemplate.css";
import { useState, useEffect } from "react";
import supabase from "../../services/supabaseClient";

export function InvoiceTemplate({ id }) {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    [0];
    async function fetchData() {
      try {
        // fetching data
        const { data: billData, error: billErr } = await supabase
          .from("bills")
          .select(`*, bill_items(*)`)
          .eq("id", id);

        if (billErr)
          throw `error in invoiceTemplate.js  inside useEffect hook ${billErr}`;

        setData(billData || []);

        // finish loading
        setIsLoading(false);
      } catch (err) {
        console.error(err, "err in invoice template.js");
        setData([]);
      }
    }

    fetchData();
  }, [id]);

  function clacSubTotal() {
    return data[0].bill_items.reduce(
      (acc, item) => acc + Number(item.rate || 0) * Number(item.item_qty || 0),
      0
    );
  }

  function clacGrandTotal() {
    const subtotal = clacSubTotal();

    const cgstAmt = (subtotal * data[0].cgst) / 100;
    const sgstAmt = (subtotal * data[0].sgst) / 100;

    const grandTotal = subtotal + cgstAmt + sgstAmt;
    return grandTotal;
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
    const formatted = `${date.getDay()}-${date.getMonth()}-${date.getFullYear()}`;

    return formatted;
  }

  return !isLoading ? (
    <div className="invoice-template-container">
      <div id="invoice-root" className="invoice-container">
        <div className="invoice-border">
          <header className="inv-top">
            <div className="inv-left">
              <h2 className="company">{data[0].seller_name}</h2>
              <span className="text-s">{data[0].seller_address}</span>
              <span className="text-s">Phone: {data[0].seller_phone_no}</span>
            </div>

            <div className="inv-right">
              <h2 className="company">{data[0].buyer_name}</h2>
              <p className="text-s">{data[0].buyer_address}</p>
              <p className="text-s">Phone: {data[0].buyer_phone_no}</p>
              <p className="text-s">GST : {data[0].gst}</p>
            </div>
          </header>

          <section className="bill-meta">
            <div className="container-pad">
              <span>GSTIN: {data[0].gst_in}</span>
            </div>
            <div className="inv-center">
              <h1 className="inv-title">GST INVOICE</h1>
            </div>
            <div className="inv-right-inner container-pad-2">
              <span>Invoice No. : {data[0].bill_no}</span>
              <span>Date : {formatDate(data[0].created_at)}</span>
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
                {/* <th>Dis1</th>
                <th>Dis2</th> */}
                <th>SGST</th>
                <th>CGST</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {data[0].bill_items && data[0].bill_items.length > 0 ? (
                data[0].bill_items.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td>{idx + 1}</td>
                    <td>{item.item_qty}</td>
                    <td className="prod-col prod-name">{item.name}</td>
                    <td>{item.hsn_code || "-"}</td>
                    <td>{item.mrp ?? "-"}</td>
                    <td>{item.rate ?? "-"}</td>
                    {/* <td>0.00</td>
                    <td>0.00</td> */}
                    <td>{Number(data[0].sgst)}%</td>
                    <td>{Number(data[0].cgst)}%</td>
                    <td>
                      {formatAmt(
                        Number(item.rate || 0) * Number(item.item_qty || 0)
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} style={{ textAlign: "center" }}>
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
                  src={data[0].qr_url || "/qr.png"}
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
                <span>{formatAmt((clacSubTotal() * data[0].sgst) / 100)}</span>
              </div>
              <div className="tot-line">
                <span>CGST PAYABLE</span>
                <span>{formatAmt((clacSubTotal() * data[0].cgst) / 100)}</span>
              </div>
              {/* <div className="tot-line">
                <span>DIS1</span>
                <span>0</span>
              </div>
              <div className="tot-line">
                <span>DIS2</span>
                <span>0</span>
              </div>
              <div className="tot-line">
                <span>TOTAL DIS</span>
                <span>0</span>
              </div>
              <div className="tot-line">
                <span>CR/DR NOTE</span>
                <span>0</span>
              </div> */}
              <div className="tot-line grand">
                <span>GRAND TOTAL</span>
                <span>{formatAmt(clacGrandTotal())}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="download-pdf-btn">
        <button onClick={handleDownloadPDF}>Download this in PDF</button>
      </div>
    </div>
  ) : (
    <span>Loading Invoice... Please Wait.</span>
  );
}
