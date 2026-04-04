import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "./contexts/useAuth";
import "../styles/login.css";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import {
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

async function uploadTenantQrToSupabase({ file, cname }) {
  const safeCompany = sanitizePathPart(cname) || "tenant";
  const ext =
    String(file?.name || "qr.png")
      .split(".")
      .pop() || "png";
  const filePath = `tenants/${safeCompany}-${Date.now()}.${ext}`;

  return uploadTenantQrFile(filePath, file);
}

export function Register() {
  const [step, setStep] = useState(1);
  const [cname, setCname] = useState("");
  const [caddress, setCaddress] = useState("");
  const [cphoneNumber, setCphoneNumber] = useState("");
  const [gstin, setGstin] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [qrFile, setQrFile] = useState(null);
  const [qrUrlInput, setQrUrlInput] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { signUp } = useAuth();
  const navigate = useNavigate();

  function handleNextStep() {
    setError("");

    if (step === 1) {
      if (
        !cname.trim() ||
        !caddress.trim() ||
        !cphoneNumber.trim() ||
        !gstin.trim()
      ) {
        setError("Please fill all company details before continuing.");
        return;
      }

      setStep(2);
      return;
    }

    if (step === 2) {
      if (!accountNumber.trim() || !ifscCode.trim()) {
        setError("Please fill bank details before continuing.");
        return;
      }

      if (!qrFile && !qrUrlInput.trim()) {
        setError("Please provide QR (upload file or paste URL).");
        return;
      }

      setStep(3);
    }
  }

  function handlePrevStep() {
    setError("");
    setStep((current) => Math.max(1, current - 1));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const canUploadQrToSupabase = isSupabaseStorageConfigured();
      let qrUrl = String(qrUrlInput || "").trim();

      if (qrFile) {
        if (!canUploadQrToSupabase) {
          throw new Error(
            "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
          );
        }

        qrUrl = await uploadTenantQrToSupabase({
          file: qrFile,
          cname,
        });
      }

      if (!qrUrl) {
        throw new Error(
          "QR URL is required. Upload QR (with Supabase configured) or paste QR URL.",
        );
      }

      await signUp({
        cname: cname.trim(),
        caddress: caddress.trim(),
        cphone_number: cphoneNumber.trim(),
        gstin: gstin.trim(),
        account_number: accountNumber.trim(),
        ifsc_code: ifscCode.trim().toUpperCase(),
        qr_url: qrUrl,
        email: email.trim(),
        password,
      });
      navigate("/");
    } catch (err) {
      setError(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <LoadingSpinner fullscreen={true} label="Creating account..." />;
  }

  return (
    <div className="login-container register-container">
      <div className="login-card register-card register-card-compact">
        <h1>BizFlow</h1>
        <p className="login-subtitle">Create tenant and owner account</p>
        <p className="auth-step-indicator">
          Step {step} of 3:{" "}
          {step === 1 ? "Company" : step === 2 ? "Payment" : "User Details"}
        </p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          {step === 1 ? (
            <>
              <div className="form-group">
                <input
                  id="cname"
                  aria-label="Company name"
                  type="text"
                  value={cname}
                  onChange={(e) => setCname(e.target.value)}
                  required
                  placeholder="Enter company name"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <input
                  id="caddress"
                  aria-label="Company address"
                  type="text"
                  value={caddress}
                  onChange={(e) => setCaddress(e.target.value)}
                  required
                  placeholder="Enter company address"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <input
                  id="cphoneNumber"
                  aria-label="Company phone"
                  type="text"
                  value={cphoneNumber}
                  onChange={(e) => setCphoneNumber(e.target.value)}
                  required
                  placeholder="Enter phone number"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <input
                  id="gstin"
                  aria-label="GSTIN"
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  required
                  placeholder="Enter GSTIN"
                  disabled={loading}
                />
              </div>

              <button
                type="button"
                className="login-button"
                onClick={handleNextStep}
              >
                Next
              </button>
            </>
          ) : step === 2 ? (
            <>
              <div className="form-group">
                <input
                  id="accountNumber"
                  aria-label="Bank account number"
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  required
                  placeholder="Enter bank account number"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <input
                  id="ifscCode"
                  aria-label="IFSC code"
                  type="text"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  required
                  placeholder="Enter IFSC code"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <input
                  id="qrUrl"
                  aria-label="QR URL"
                  type="url"
                  value={qrUrlInput}
                  onChange={(e) => setQrUrlInput(e.target.value)}
                  placeholder="Paste public QR URL (optional if uploading file)"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <input
                  id="qrCode"
                  aria-label="QR code"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  disabled={loading}
                  onChange={(e) => setQrFile(e.target.files?.[0] || null)}
                />
                <small className="field-hint">
                  Upload QR file (Supabase) or paste QR URL above.
                </small>
              </div>

              <div className="auth-actions-row">
                <button
                  type="button"
                  className="auth-secondary-btn"
                  onClick={handlePrevStep}
                  disabled={loading}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="login-button"
                  onClick={handleNextStep}
                  disabled={loading}
                >
                  Next
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <input
                  id="email"
                  aria-label="Owner email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter owner email"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <input
                  id="password"
                  aria-label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Create password"
                  disabled={loading}
                />
              </div>

              <div className="auth-actions-row">
                <button
                  type="button"
                  className="auth-secondary-btn"
                  onClick={handlePrevStep}
                  disabled={loading}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="login-button"
                >
                  {loading ? "Creating..." : "Create Account"}
                </button>
              </div>
            </>
          )}
        </form>

        <p className="auth-switch-text">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
