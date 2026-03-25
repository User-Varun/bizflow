import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import "../styles/userProfile.css";
import { useAuth } from "../auth/contexts/useAuth";

export function UserProfile() {
  const { session, signOut } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const email = session?.user?.email || "";
  const role = session?.user?.role || "";
  const tenantName = session?.tenant?.cname || "";
  const tenantSlug = session?.tenant?.tenant_slug || "";
  const firstLetter = email.charAt(0).toUpperCase();
  const displayName = email ? email.split("@")[0] : "User";
  const roleLabel = role
    ? `${role.charAt(0).toUpperCase()}${role.slice(1)}`
    : "N/A";

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

  if (!session?.user) return null;

  async function handleSignOut() {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
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

            <div className="user-meta-chips">
              <span className="user-chip role-chip">{roleLabel}</span>
              <span className="user-chip tenant-chip">
                {tenantSlug || "N/A"}
              </span>
            </div>
          </div>

          <button onClick={handleSignOut} className="logout-btn">
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
