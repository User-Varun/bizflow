import { useState } from "react";
import { Link } from "react-router";
import { useAuth } from "./contexts/useAuth";
import "../styles/login.css";
import { LoadingSpinner } from "../ui/LoadingSpinner";

export function ForgotPassword() {
  const { requestPasswordReset } = useAuth();
  const [tenantSlug, setTenantSlug] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await requestPasswordReset(tenantSlug, email);
      setSuccess(
        "If an account exists for that email, a reset link has been sent.",
      );
    } catch (err) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <LoadingSpinner fullscreen={true} label="Sending reset link..." />;
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>BizFlow</h1>
        <p className="login-subtitle">Reset your password</p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              id="tenantSlug"
              aria-label="Tenant code"
              type="text"
              value={tenantSlug}
              onChange={(e) => setTenantSlug(e.target.value)}
              required
              placeholder="Enter your tenant code"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <input
              id="email"
              aria-label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
              disabled={loading}
            />
          </div>

          <button type="submit" disabled={loading} className="login-button">
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <p className="auth-switch-text">
          Back to <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
