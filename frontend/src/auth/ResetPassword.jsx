import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "./contexts/useAuth";
import "../styles/login.css";
import { LoadingSpinner } from "../ui/LoadingSpinner";

function getTokenFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get("token") || "";
}

export function ResetPassword() {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const resetToken = useMemo(() => getTokenFromQuery(), []);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!resetToken) {
      setError("Reset token is missing or expired.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await resetPassword(resetToken, password);
      setSuccess("Password updated. You can now sign in.");
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => {
        navigate("/login", { state: { message: "Password reset successful." } });
      }, 800);
    } catch (err) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <LoadingSpinner fullscreen={true} label="Updating password..." />;
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>BizFlow</h1>
        <p className="login-subtitle">Create a new password</p>

        {!resetToken && (
          <div className="error-message">
            This reset link is invalid or expired. Please request a new one.
          </div>
        )}

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              id="password"
              aria-label="New password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="New password"
              disabled={loading || !resetToken}
            />
          </div>

          <div className="form-group">
            <input
              id="confirmPassword"
              aria-label="Confirm password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Confirm new password"
              disabled={loading || !resetToken}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !resetToken}
            className="login-button"
          >
            {loading ? "Updating..." : "Reset password"}
          </button>
        </form>

        <p className="auth-switch-text">
          Back to <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
