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

export function formatSignedCurrencyAmount(value, prefix = "₹") {
  const amount = Number(value || 0);
  const sign = amount > 0 ? "+" : amount < 0 ? "-" : "";
  return `${sign}${prefix}${Math.abs(amount).toFixed(2)}`;
}

export function normalizeTaxPercent(value, fallback = 2.5) {
  return toTwoDecimalNumber(value, fallback, { clampMin: 0, clampMax: 100 });
}
