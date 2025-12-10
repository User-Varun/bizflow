import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import "../styles/userProfile.css";
import { useAuth } from "../auth/contexts/useAuth";

export function UserProfile() {
  const { session, signOut } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const email = session.user.email || "";
  const firstLetter = email.charAt(0).toUpperCase();

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
      >
        {firstLetter}
      </button>

      {showDropdown && (
        <div className="user-dropdown">
          <div className="user-info">
            <p className="user-email">{email}</p>
          </div>
          <button onClick={handleSignOut} className="logout-btn">
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
