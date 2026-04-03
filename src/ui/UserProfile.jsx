import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import "../styles/userProfile.css";
import { useAuth } from "../auth/contexts/useAuth";
import {
  deleteTenantQrFileByPublicUrl,
  isSupabaseStorageConfigured,
  uploadTenantQrFile,
} from "../lib/supabaseClient";

function sanitizePathPart(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

async function uploadTenantQrToSupabase({ file, tenantSlug, tenantName }) {
  const safePart = sanitizePathPart(tenantSlug || tenantName) || "tenant";
  const ext =
    String(file?.name || "qr.png")
      .split(".")
      .pop() || "png";
  const filePath = `tenants/${safePart}-${Date.now()}.${ext}`;

  return uploadTenantQrFile(filePath, file);
}

export function UserProfile() {
  const { session, signOut, updateTenantPaymentDetails } = useAuth();
  const queryClient = useQueryClient();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [qrFile, setQrFile] = useState(null);
  const [qrUrlInput, setQrUrlInput] = useState("");
  const [formError, setFormError] = useState("");
  const [paymentFeedback, setPaymentFeedback] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const email = session?.user?.email || "";
  const role = session?.user?.role || "";
  const tenantName = session?.tenant?.cname || "";
  const tenantSlug = session?.tenant?.tenant_slug || "";
  const tenantAccount = session?.tenant?.account_number || "";
  const tenantIfsc = session?.tenant?.ifsc_code || "";
  const tenantQr = session?.tenant?.qr_url || "";
  const firstLetter = email.charAt(0).toUpperCase();
  const displayName = email ? email.split("@")[0] : "User";
  const roleLabel = role
    ? `${role.charAt(0).toUpperCase()}${role.slice(1)}`
    : "N/A";
  const hasPaymentDetails = Boolean(tenantAccount && tenantIfsc && tenantQr);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDropdown]);

  useEffect(() => {
    if (!paymentFeedback) return;

    const timerId = setTimeout(() => {
      setPaymentFeedback("");
    }, 3500);

    return () => clearTimeout(timerId);
  }, [paymentFeedback]);

  if (!session?.user) return null;

  async function handleSignOut() {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }

  function openPaymentModal() {
    setAccountNumber(tenantAccount);
    setIfscCode(tenantIfsc);
    setQrFile(null);
    setQrUrlInput("");
    setFormError("");
    setShowPaymentModal(true);
  }

  function closePaymentModal() {
    if (isSaving) return;
    setShowPaymentModal(false);
    setFormError("");
  }

  async function handleSubmitPaymentDetails(e) {
    e.preventDefault();
    setFormError("");

    const cleanedAccount = String(accountNumber || "")
      .replace(/\s+/g, "")
      .trim();
    const cleanedIfsc = String(ifscCode || "")
      .replace(/\s+/g, "")
      .toUpperCase();

    if (!cleanedAccount || !cleanedIfsc) {
      setFormError("Account number and IFSC code are required.");
      return;
    }

    const cleanedQrUrl = String(qrUrlInput || "").trim();
    const canUploadQrToSupabase = isSupabaseStorageConfigured();

    if (!cleanedQrUrl && !tenantQr && !qrFile) {
      setFormError("Please upload a QR image or paste QR URL.");
      return;
    }

    setIsSaving(true);

    try {
      const isAddingForFirstTime = !hasPaymentDetails;
      let qrUrl = cleanedQrUrl || tenantQr;
      if (qrFile) {
        if (!canUploadQrToSupabase) {
          throw new Error(
            "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
          );
        }

        qrUrl = await uploadTenantQrToSupabase({
          file: qrFile,
          tenantSlug,
          tenantName,
        });
      }

      await updateTenantPaymentDetails({
        account_number: cleanedAccount,
        ifsc_code: cleanedIfsc,
        qr_url: qrUrl,
      });

      if (qrFile && tenantQr && tenantQr !== qrUrl) {
        try {
          await deleteTenantQrFileByPublicUrl(tenantQr);
        } catch (deleteErr) {
          console.warn("Failed to delete previous QR file", deleteErr);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["invoice"] });
      queryClient.invalidateQueries({ queryKey: ["viewInvoices"] });

      setPaymentFeedback(
        isAddingForFirstTime
          ? "Payment details added successfully."
          : "Payment details updated successfully.",
      );

      setShowPaymentModal(false);
    } catch (err) {
      setFormError(err.message || "Failed to save payment details");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="user-profile-container" ref={dropdownRef}>
      <button
        className="user-avatar"
        onClick={() => setShowDropdown(!showDropdown)}
        title={email}
        aria-haspopup="menu"
        aria-expanded={showDropdown}
      >
        {firstLetter}
      </button>

      {showDropdown && (
        <div className="user-dropdown">
          <div className="user-dropdown-header">
            <div className="user-avatar-preview">{firstLetter}</div>
            <div className="user-heading-group">
              <p className="user-display-name">{displayName}</p>
              <p className="user-email">{email}</p>
            </div>
          </div>

          <div className="user-info">
            <div className="user-meta-row">
              <span className="user-meta-label">Tenant</span>
              <span className="user-meta-value">{tenantName || "N/A"}</span>
            </div>

            <div className="user-meta-row">
              <span className="user-meta-label">Bank Setup</span>
              <span className="user-meta-value">
                {hasPaymentDetails ? "Completed" : "Missing"}
              </span>
            </div>

            {paymentFeedback ? (
              <p className="payment-feedback-msg">{paymentFeedback}</p>
            ) : null}

            <div className="user-meta-chips">
              <span className="user-chip role-chip">{roleLabel}</span>
              <span className="user-chip tenant-chip">
                {tenantSlug || "N/A"}
              </span>
            </div>

            <button
              type="button"
              className="tenant-payment-btn"
              onClick={openPaymentModal}
            >
              {hasPaymentDetails ? "Update Bank and QR" : "Add Bank and QR"}
            </button>
          </div>

          <button onClick={handleSignOut} className="logout-btn">
            Sign Out
          </button>
        </div>
      )}

      {showPaymentModal && (
        <div
          className="tenant-payment-modal-overlay"
          onClick={closePaymentModal}
        >
          <div
            className="tenant-payment-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h3>Tenant Payment Details</h3>
            <form onSubmit={handleSubmitPaymentDetails}>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Account Number"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  disabled={isSaving}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="IFSC Code"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  disabled={isSaving}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="url"
                  placeholder="QR URL (optional if uploading file)"
                  value={qrUrlInput}
                  onChange={(e) => setQrUrlInput(e.target.value)}
                  disabled={isSaving}
                />
              </div>
              <div className="form-group">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => setQrFile(e.target.files?.[0] || null)}
                  disabled={isSaving}
                />
                <small className="field-hint">
                  Upload file to Supabase bucket, or paste public QR URL above.
                </small>
              </div>

              {formError ? (
                <p className="payment-form-error">{formError}</p>
              ) : null}

              <div className="tenant-payment-actions">
                <button
                  type="button"
                  onClick={closePaymentModal}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
