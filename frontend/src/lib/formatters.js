export function toFixedTwo(value, fallback = 0, { clampMin, clampMax } = {}) {
  const parsed = Number(value);
  let safeValue = Number.isFinite(parsed) ? parsed : fallback;

  if (Number.isFinite(clampMin)) safeValue = Math.max(clampMin, safeValue);
  if (Number.isFinite(clampMax)) safeValue = Math.min(clampMax, safeValue);

  return safeValue.toFixed(2);
}

export function toTwoDecimalNumber(value, fallback = 0, options = {}) {
  return Number(toFixedTwo(value, fallback, options));
}

export function formatCurrencyAmount(value, prefix = "₹") {
  return `${prefix}${toFixedTwo(value)}`;
}

export function formatPercent(value) {
  return `${toFixedTwo(value)}%`;
}

export function formatQuantity(value, fallback = 0) {
  const parsed = Number(value);
  const safeValue = Number.isFinite(parsed) ? parsed : fallback;
  return String(safeValue);
}

export function formatSignedCurrencyAmount(value, prefix = "₹") {
  const amount = Number(value || 0);
  const sign = amount > 0 ? "+" : amount < 0 ? "-" : "";
  return `${sign}${prefix}${Math.abs(amount).toFixed(2)}`;
}

export function normalizeTaxPercent(value, fallback = 2.5) {
  return toTwoDecimalNumber(value, fallback, { clampMin: 0, clampMax: 100 });
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function formatDateWithMonthWord(value, fallback = "-") {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = MONTH_NAMES[date.getUTCMonth()] || "";
  const year = date.getUTCFullYear();

  return `${day}-${month}-${year}`;
}

export function formatDateTimeWithMonthWord(value, fallback = "-") {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  const datePart = formatDateWithMonthWord(value, fallback);
  if (datePart === fallback) return fallback;

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${datePart} ${hours}:${minutes}`;
}
