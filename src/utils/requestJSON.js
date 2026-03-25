export async function requestJSON(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const payload = await response.json();

  console.log(payload);

  if (!response.ok) throw new Error(payload.msg || "Auth request failed!");

  return payload;
}
