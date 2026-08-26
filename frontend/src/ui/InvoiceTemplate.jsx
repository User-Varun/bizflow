import "../styles/invoiceTemplate.css";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { requestJSON } from "../styles/utils/requestJSON";
import { LoadingSpinner } from "./LoadingSpinner";
import {
  formatCurrencyAmount,
  formatDateWithMonthWord,
  formatPercent,
  formatSignedCurrencyAmount,
  formatQuantity,
} from "../lib/formatters";

const baseUrl = import.meta.env.VITE_API_URL;
const ITEMS_PER_PAGE = 6;

export function InvoiceTemplate({
  id,
  onBack,
  backButtonLabel = "Back",
  autoPrint = false,
}) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfLoading, _setPdfLoading] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const hasAutoPrintedRef = useRef(false);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["invoice", id],
    queryFn: () =>
      requestJSON(`${baseUrl}/viewInvoices/${id}`, {
        method: "GET",
      }),
    select: (payload) => payload?.result || null,
    enabled: Boolean(id),
    staleTime: 0,
    refetchOnMount: "always",
  });

  function handlePrintInvoice() {
    window.print();
  }

  function buildQrSrc(qrUrl, versionSeed) {
    const url = String(qrUrl || "").trim();
    if (!url) return "/qr.png";
    if (url.startsWith("data:")) return url;

    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}v=${encodeURIComponent(String(versionSeed || "0"))}`;
  }

  function clacSubTotal() {
    return Number(data?.sub_total || 0);
  }

  function clacGrandTotal() {
    return Math.round(Number(data?.grand_total || 0));
  }

  function calcRawGrandTotal() {
    const items = data?.invoice_items || [];

    return items.reduce((sum, item) => {
      const baseAmount = Number(item.rate || 0) * Number(item.product_qty || 0);
      const discountAmount = (baseAmount * Number(item.discount || 0)) / 100;
      const taxableAmount = Math.max(0, baseAmount - discountAmount);
      const cgstAmount = (taxableAmount * Number(item.cgst || 0)) / 100;
      const sgstAmount = (taxableAmount * Number(item.sgst || 0)) / 100;

      return sum + taxableAmount + cgstAmount + sgstAmount;
    }, 0);
  }

  function calcRoundOffAmount() {
    const roundOffFromApi = Number(data?.round_off);
    if (Number.isFinite(roundOffFromApi)) {
      return roundOffFromApi;
    }

    // Legacy invoices may not have round_off persisted. In that case,
    // infer it from the stored grand total's nearest-integer rounding.
    const grandTotalFromApi = Number(data?.grand_total);
    if (Number.isFinite(grandTotalFromApi)) {
      const inferredLegacyRoundOff =
        Math.round(grandTotalFromApi) - grandTotalFromApi;
      if (Math.abs(inferredLegacyRoundOff) >= 0.005) {
        return Number(inferredLegacyRoundOff.toFixed(2));
      }
    }

    const roundedTotal = clacGrandTotal();
    const rawTotal = calcRawGrandTotal();

    return Number((roundedTotal - rawTotal).toFixed(2));
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
    return formatCurrencyAmount(n);
  }

  function formatDecimalAmt(n) {
    return formatSignedCurrencyAmount(n);
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

  function closePdfModal() {
    setShowPdfModal(false);
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  }

  function formatDate(dateStr) {
    return formatDateWithMonthWord(dateStr, "-");
  }

  const invoiceType = String(data?.invoice_type || "").toLowerCase();
  const isStockIn = invoiceType === "stock_in";
  const displayInvoiceNumber =
    isStockIn && String(data?.supplier_invoice_number || "").trim()
      ? data.supplier_invoice_number
      : data?.invoice_number;
  const companyGstin = String(data?.company_gstin || "").trim();
  const partyGstin = String(data?.other_party_gst || "").trim();

  const gstinValue = invoiceType === "stock_out" ? companyGstin : partyGstin;
  const gstValue = invoiceType === "stock_out" ? partyGstin : companyGstin;
  const qrSrc = buildQrSrc(data?.qr_url, data?.tenant_payment_updated_at);
  const invoiceItems = Array.isArray(data?.invoice_items)
    ? data.invoice_items
    : [];

  const itemPages =
    invoiceItems.length > 0
      ? Array.from(
          { length: Math.ceil(invoiceItems.length / ITEMS_PER_PAGE) },
          (_, pageIndex) =>
            invoiceItems.slice(
              pageIndex * ITEMS_PER_PAGE,
              (pageIndex + 1) * ITEMS_PER_PAGE,
            ),
        )
      : [[]];

  const totalPages = itemPages.length;
  const pagesPerSheet = 1;
  const sheetPages = Array.from(
    { length: Math.ceil(totalPages / pagesPerSheet) },
    (_, sheetIndex) =>
      itemPages.slice(
        sheetIndex * pagesPerSheet,
        sheetIndex * pagesPerSheet + pagesPerSheet,
      ),
  );

  useEffect(() => {
    if (!data || !autoPrint || hasAutoPrintedRef.current) return;

    hasAutoPrintedRef.current = true;
    const timerId = window.setTimeout(() => {
      window.print();
    }, 250);

    return () => window.clearTimeout(timerId);
  }, [autoPrint, data]);

  if (isLoading) {
    return <LoadingSpinner label="Loading invoice..." minHeight="300px" />;
  }

  if (isError)
    return <span>{error?.message || "Failed to load invoice."}</span>;

  return data ? (
    <div className="invoice-template-container">
      <div id="invoice-root" className="invoice-pages-stack">
        {sheetPages.map((sheet, sheetIndex) => (
          <div className="invoice-print-sheet" key={`sheet-${sheetIndex + 1}`}>
            {sheet.map((pageItems, innerIndex) => {
              const pageIndex = sheetIndex * pagesPerSheet + innerIndex;

              const empty_rows = ITEMS_PER_PAGE - pageItems.length;

              return (
                <div
                  className="invoice-print-page"
                  key={`page-${pageIndex + 1}`}
                >
                  <div className="invoice-container">
                    <div className="invoice-border invoice-margin">
                      <div className="invoice-page-tag">
                        Page {pageIndex + 1}/{totalPages}
                      </div>
                      <header className="inv-top">
                        <div className="inv-left">
                          <h2 className="company-seller">
                            {data.invoice_from}
                          </h2>
                          <p className="text-s">{data.address_from}</p>
                          <p className="text-s">Phone: {data.phone_from}</p>
                        </div>

                        <div className="inv-right">
                          <h2 className="company">{data.invoice_to}</h2>
                          <p className="text-s">{data.address_to}</p>
                          <p className="text-s">Phone: {data.phone_to}</p>
                          <p className="text-s">GST : {gstValue || "-"}</p>
                        </div>
                      </header>

                      <section className="bill-meta">
                        <div className="container-pad">
                          <span>GSTIN: {gstinValue || "-"}</span>
                        </div>
                        <div className="inv-center">
                          <h1 className="inv-title">GST INVOICE</h1>
                        </div>
                        <div className="inv-right-inner container-pad-2">
                          <span>Invoice No. : {displayInvoiceNumber}</span>
                          <span>Date : {formatDate(data.createdAt)}</span>
                        </div>
                      </section>

                      <table className="inv-table">
                        <colgroup>
                          <col className="inv-col-sn" />
                          <col className="inv-col-qty" />
                          <col className="inv-col-product" />
                          <col className="inv-col-hsn" />
                          <col className="inv-col-mrp" />
                          <col className="inv-col-rate" />
                          <col className="inv-col-discount" />
                          <col className="inv-col-sgst" />
                          <col className="inv-col-cgst" />
                          <col className="inv-col-amount" />
                        </colgroup>
                        <thead>
                          <tr>
                            <th>Sn.</th>
                            <th>QTY</th>
                            <th>Product</th>
                            <th>HSN</th>
                            <th>MRP</th>
                            <th>RATE</th>
                            <th>DIS</th>
                            <th>SGST</th>
                            <th>CGST</th>
                            <th>Amount</th>
                          </tr>
                        </thead>
                        <tbody className="table-body-border-bottom">
                          {pageItems.length > 0 ? (
                            pageItems.map((item, idx) => {
                              const baseAmount =
                                Number(item.rate || 0) *
                                Number(item.product_qty || 0);
                              const discountPct = Number(item.discount || 0);
                              const discountAmount =
                                (baseAmount * discountPct) / 100;
                              const taxableAmount = Math.max(
                                0,
                                baseAmount - discountAmount,
                              );
                              const cgstAmount =
                                (taxableAmount * Number(item.cgst || 0)) / 100;
                              const sgstAmount =
                                (taxableAmount * Number(item.sgst || 0)) / 100;
                              const lineAmount =
                                taxableAmount + cgstAmount + sgstAmount;

                              return (
                                <tr key={item.id || `${pageIndex}-${idx}`}>
                                  <td>
                                    {pageIndex * ITEMS_PER_PAGE + idx + 1}
                                  </td>
                                  <td>{formatQuantity(item.product_qty)}</td>
                                  <td className="prod-col prod-name">
                                    {item.name}
                                  </td>
                                  <td>{item.hsn_code || "-"}</td>
                                  <td>{formatAmt(item.mrp ?? 0)}</td>
                                  <td>{formatAmt(item.rate ?? 0)}</td>
                                  <td>{formatPercent(item.discount || 0)}</td>
                                  <td>{formatPercent(item.sgst || 0)}</td>
                                  <td>{formatPercent(item.cgst || 0)}</td>
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

                          {Array.from({ length: empty_rows }).map(
                            (_, index) => {
                              return (
                                <tr
                                  className="empty-row"
                                  key={`empty-${index}`}
                                >
                                  <td>&nbsp;</td>
                                  <td></td>
                                  <td></td>
                                  <td></td>
                                  <td></td>
                                  <td></td>
                                  <td></td>
                                  <td></td>
                                  <td></td>
                                  <td></td>
                                </tr>
                              );
                            },
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
                            {!isStockIn ? (
                              <>
                                <div className="terms">
                                  <a href="#">Terms & Conditions</a>
                                </div>
                                <div className="terms-more">
                                  <p>
                                    Goods once sold will not be taken back or
                                    exchanged.
                                  </p>
                                  <span>
                                    Bills not paid due date will attract 24%
                                    interest.
                                  </span>
                                </div>
                                <div className="bank">
                                  <span>
                                    <strong>A/C NO: </strong>{" "}
                                    {data.account_number || "-"}
                                  </span>
                                  <span>
                                    <strong>IFSC CODE: </strong>{" "}
                                    {data.ifsc_code || "-"}
                                  </span>
                                </div>
                              </>
                            ) : null}
                          </div>
                          <div className="inner-right-block">
                            {!isStockIn ? (
                              <img className="qr" src={qrSrc} alt="QR code" />
                            ) : (
                              <span>Seller: {data.invoice_from || "-"}</span>
                            )}
                          </div>
                          <div className="inner-middle-down-block">
                            <span className="company-name">
                              For {data.invoice_from || "Business"}
                            </span>
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
                            <span>IGST PAYABLE</span>
                            <span>
                              {formatAmt(data.cgst_total + data.sgst_total)}
                            </span>
                          </div>
                          <div className="tot-line">
                            <span>DISCOUNT</span>
                            <span>{formatAmt(calcDiscountTotal())}</span>
                          </div>
                          <div className="tot-line">
                            <span>ROUND OFF</span>
                            <span>
                              {formatDecimalAmt(calcRoundOffAmount())}
                            </span>
                          </div>
                          <div className="tot-line grand">
                            <span>GRAND TOTAL</span>
                            <span>{formatAmt(clacGrandTotal())}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
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
        {/* <div className="invoice-print-options">
          <span className="invoice-print-label">Paper size</span>
          <button
            type="button"
            className={`invoice-print-option ${
              printPaper === "A5" ? "is-active" : ""
            }`}
            onClick={() => setPrintPaper("A5")}
          >
            A5 Landscape
          </button>
          <button
            type="button"
            className={`invoice-print-option ${
              printPaper === "A4" ? "is-active" : ""
            }`}
            onClick={() => setPrintPaper("A4")}
          >
            A4 Landscape
          </button>
        </div> */}
        {/* <button
          type="button"
          className="invoice-action-btn invoice-action-btn-primary"
          onClick={handleOpenPdfPreview}
          disabled={pdfLoading}
        >
          {pdfLoading ? "Loading PDF..." : "Download or Print Invoice"}
        </button> */}

        <button
          type="button"
          className="invoice-action-btn invoice-action-btn-primary"
          onClick={handlePrintInvoice}
          disabled={pdfLoading}
        >
          {pdfLoading ? "Loading PDF..." : "Print Invoice"}{" "}
        </button>
      </div>
      {showPdfModal && (
        <div className="invoice-pdf-modal-overlay" onClick={closePdfModal}>
          <div
            className="invoice-pdf-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="invoice-pdf-modal-actions">
              <button
                type="button"
                onClick={() => {
                  const iframe = document.getElementById("invoice-pdf-iframe");
                  if (iframe && iframe.contentWindow)
                    iframe.contentWindow.print();
                }}
              >
                Print
              </button>
              <a
                href={pdfUrl}
                download={`invoice-${displayInvoiceNumber || id}.pdf`}
              >
                <button type="button">Download</button>
              </a>
              <button type="button" onClick={closePdfModal}>
                Close
              </button>
            </div>
            <iframe
              id="invoice-pdf-iframe"
              title="Invoice PDF"
              src={pdfUrl}
              style={{ width: "100%", height: "80vh", border: "none" }}
            />
          </div>
        </div>
      )}
    </div>
  ) : (
    <span>Invoice not found.</span>
  );
}
