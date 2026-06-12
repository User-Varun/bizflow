const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export function isSupabaseStorageConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export const tenantQrBucket =
  import.meta.env.VITE_SUPABASE_QR_BUCKET || "images";

function encodePathKeepingSlashes(path) {
  return String(path || "")
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

export function buildTenantQrPublicUrl(filePath) {
  if (!supabaseUrl) return "";

  const encodedPath = encodePathKeepingSlashes(filePath);
  return `${supabaseUrl}/storage/v1/object/public/${tenantQrBucket}/${encodedPath}`;
}

export async function uploadTenantQrFile(filePath, file) {
  if (!isSupabaseStorageConfigured()) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }

  if (!filePath || !file) {
    throw new Error("Invalid QR upload payload.");
  }

  const encodedPath = encodePathKeepingSlashes(filePath);
  const endpoint = `${supabaseUrl}/storage/v1/object/${tenantQrBucket}/${encodedPath}?upsert=true`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      "x-upsert": "true",
      "Content-Type": file.type || "image/png",
    },
    body: file,
  });

  if (!response.ok) {
    let msg = "Failed to upload QR image";
    try {
      const payload = await response.json();
      msg = payload?.message || payload?.error || msg;
    } catch (_e) {
      // Keep fallback message when response body is not JSON.
    }
    throw new Error(msg);
  }

  return buildTenantQrPublicUrl(filePath);
}

export function extractTenantQrObjectPath(publicUrl) {
  if (!publicUrl || !supabaseUrl) return "";

  try {
    const base = new URL(supabaseUrl);
    const target = new URL(publicUrl);

    if (base.origin !== target.origin) return "";

    const publicPrefix = `/storage/v1/object/public/${tenantQrBucket}/`;
    if (!target.pathname.startsWith(publicPrefix)) return "";

    const encodedPath = target.pathname.slice(publicPrefix.length);
    return decodeURIComponent(encodedPath);
  } catch (_e) {
    return "";
  }
}

export async function deleteTenantQrFileByPublicUrl(publicUrl) {
  if (!isSupabaseStorageConfigured()) return false;

  const filePath = extractTenantQrObjectPath(publicUrl);
  if (!filePath) return false;

  const encodedPath = encodePathKeepingSlashes(filePath);
  const endpoint = `${supabaseUrl}/storage/v1/object/${tenantQrBucket}/${encodedPath}`;

  const response = await fetch(endpoint, {
    method: "DELETE",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
  });

  return response.ok;
}
