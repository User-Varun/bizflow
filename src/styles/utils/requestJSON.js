function normalizeApiErrorMessage(payload, response) {
  const raw =
    payload?.message ||
    payload?.msg ||
    payload?.error?.message ||
    payload?.error ||
    "";

  const message = String(raw || "").trim();

  if (!message) {
    if (response?.status === 401) return "Please sign in again.";
    if (response?.status === 403)
      return "You are not allowed to do this action.";
    if (response?.status === 404) return "Requested record was not found.";
    if (response?.status >= 500) return "Server error. Please try again.";
    return "Request failed. Please try again.";
  }

  if (
    message.includes("invoice_items_product_catalog_id_fkey") ||
    message.includes("violates foreign key constraint")
  ) {
    return "One or more selected products are no longer available. Please reselect items and try again.";
  }

  if (
    message.includes("SequelizeUniqueConstraintError") ||
    message.includes("unique constraint")
  ) {
    return "A duplicate value was detected. Please verify your input and retry.";
  }

  return message;
}

export async function requestJSON(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (e) {
    console.log(e);
    payload = null;
  }

  if (!response.ok) {
    const error = new Error(normalizeApiErrorMessage(payload, response));
    error.statusCode = response.status;
    error.payload = payload;
    throw error;
  }

  return payload ?? {};
}
