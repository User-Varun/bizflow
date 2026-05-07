import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "./contexts/useAuth";
import "../styles/login.css";
import { LoadingSpinner } from "../ui/LoadingSpinner";

export function Login() {
  const [tenantSlug, setTenantSlug] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location?.state?.message || "";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn(tenantSlug, email, password);
      navigate("/");
    } catch (err) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <LoadingSpinner fullscreen={true} label="Signing in..." />;
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>BizFlow</h1>
        <p className="login-subtitle">Sign in to continue</p>

        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}
        {error && <div className="error-message">{error}</div>}

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

          <div className="form-group">
            <input
              id="password"
              aria-label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              disabled={loading}
            />
            <div className="forgot-password-row">
              <Link to="/forgot-password">Forgot password?</Link>
            </div>
          </div>

          <button type="submit" disabled={loading} className="login-button">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="auth-switch-text">
          New to BizFlow? <Link to="/register">Create account</Link>
        </p>
      </div>
    </div>
  );
}
