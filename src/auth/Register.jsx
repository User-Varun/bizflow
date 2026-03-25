import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "./contexts/useAuth";
import "../styles/login.css";
import { LoadingSpinner } from "../ui/LoadingSpinner";

export function Register() {
  const [step, setStep] = useState(1);
  const [cname, setCname] = useState("");
  const [caddress, setCaddress] = useState("");
  const [cphoneNumber, setCphoneNumber] = useState("");
  const [gstin, setGstin] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { signUp } = useAuth();
  const navigate = useNavigate();

  function handleNextStep() {
    setError("");

    if (
      !cname.trim() ||
      !caddress.trim() ||
      !cphoneNumber.trim() ||
      !gstin.trim()
    ) {
      setError("Please fill all owner details before continuing.");
      return;
    }

    setStep(2);
  }

  function handlePrevStep() {
    setError("");
    setStep(1);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signUp({
        cname: cname.trim(),
        caddress: caddress.trim(),
        cphone_number: cphoneNumber.trim(),
        gstin: gstin.trim(),
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
          Step {step} of 2: {step === 1 ? "Owner Details" : "User Details"}
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
