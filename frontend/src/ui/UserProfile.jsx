import { useEffect, useRef, useState } from "react";
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
  const { session, signOut, updateMyProfile, updateTenantProfile } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const [profileEmail, setProfileEmail] = useState("");
  const [profileName, setProfileName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [userFormError, setUserFormError] = useState("");
  const [userFeedback, setUserFeedback] = useState("");
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyGstin, setCompanyGstin] = useState("");
  const [companyAccount, setCompanyAccount] = useState("");
  const [companyIfsc, setCompanyIfsc] = useState("");
  const [companyQrUrl, setCompanyQrUrl] = useState("");
  const [companyQrFile, setCompanyQrFile] = useState(null);
  const [tenantFormError, setTenantFormError] = useState("");
  const [tenantFeedback, setTenantFeedback] = useState("");
  const [isSavingTenant, setIsSavingTenant] = useState(false);
  const [isEditingTenant, setIsEditingTenant] = useState(false);

  const email = session?.user?.email || "";
  const role = session?.user?.role || "";
  const isOwner = role === "owner";
  const tenantName = session?.tenant?.cname || "";
  const tenantSlug = session?.tenant?.tenant_slug || "";
  const tenantQr = session?.tenant?.qr_url || "";
  const firstLetter = (email.charAt(0) || "U").toUpperCase();
  const displayName =
    String(session?.user?.name || "").trim() ||
    (email ? email.split("@")[0] : "User");
  const roleLabel = role
    ? `${role.charAt(0).toUpperCase()}${role.slice(1)}`
    : "N/A";

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }

    if (!showDropdown) return undefined;

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  useEffect(() => {
    if (!showProfileModal || !session) return;

    setProfileEmail(String(session.user?.email || ""));
    setProfileName(String(session.user?.name || ""));
    setCurrentPassword("");
    setNewPassword("");
    setUserFormError("");
    setIsEditingUser(false);

    setCompanyName(String(session.tenant?.cname || ""));
    setCompanyAddress(String(session.tenant?.caddress || ""));
    setCompanyPhone(String(session.tenant?.cphone_number || ""));
    setCompanyGstin(String(session.tenant?.gstin || ""));
    setCompanyAccount(String(session.tenant?.account_number || ""));
    setCompanyIfsc(String(session.tenant?.ifsc_code || ""));
    setCompanyQrUrl(String(session.tenant?.qr_url || ""));
    setCompanyQrFile(null);
    setTenantFormError("");
    setIsEditingTenant(false);
  }, [showProfileModal, session]);

  useEffect(() => {
    if (!userFeedback && !tenantFeedback) return undefined;

    const timerId = setTimeout(() => {
      setUserFeedback("");
      setTenantFeedback("");
    }, 3500);

    return () => clearTimeout(timerId);
  }, [userFeedback, tenantFeedback]);

  if (!session?.user) return null;

  async function handleSignOut() {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }

  function openProfileModal() {
    setShowDropdown(false);
    setShowProfileModal(true);
  }

  function closeProfileModal() {
    if (isSavingUser || isSavingTenant) return;
    setShowProfileModal(false);
    setUserFormError("");
    setTenantFormError("");
    setIsEditingUser(false);
    setIsEditingTenant(false);
  }

  async function handleSaveUserDetails(e) {
    e.preventDefault();
    setUserFormError("");
    setUserFeedback("");

    const cleanedEmail = String(profileEmail || "")
      .trim()
      .toLowerCase();
    const cleanedName = String(profileName || "").trim();
    const payload = {};

    if (
      isOwner &&
      cleanedName &&
      cleanedName !== String(session?.user?.name || "").trim()
    ) {
      payload.name = cleanedName;
    }

    if (cleanedEmail && cleanedEmail !== String(email).trim().toLowerCase()) {
      payload.email = cleanedEmail;
    }

    const cleanedCurrentPassword = String(currentPassword || "");
    const cleanedNewPassword = String(newPassword || "");

    if (cleanedNewPassword) {
      if (!cleanedCurrentPassword) {
        setUserFormError("Current password is required to set a new password.");
        return;
      }

      payload.current_password = cleanedCurrentPassword;
      payload.new_password = cleanedNewPassword;
    }

    if (Object.keys(payload).length === 0) {
      setUserFormError("No user profile changes to save.");
      return;
    }

    setIsSavingUser(true);

    try {
      await updateMyProfile(payload);
      setCurrentPassword("");
      setNewPassword("");
      setUserFeedback("User profile updated successfully.");
      setIsEditingUser(false);
    } catch (err) {
      setUserFormError(err.message || "Failed to update your profile");
    } finally {
      setIsSavingUser(false);
    }
  }

  async function handleSaveTenantDetails(e) {
    e.preventDefault();

    if (!isOwner) {
      setTenantFormError("Only owner can edit company profile.");
      return;
    }

    setTenantFormError("");
    setTenantFeedback("");

    const cleanedPayload = {
      cname: String(companyName || "").trim(),
      caddress: String(companyAddress || "").trim(),
      cphone_number: String(companyPhone || "")
        .replace(/\s+/g, "")
        .trim(),
      gstin: String(companyGstin || "")
        .replace(/\s+/g, "")
        .toUpperCase(),
      account_number: String(companyAccount || "")
        .replace(/\s+/g, "")
        .trim(),
      ifsc_code: String(companyIfsc || "")
        .replace(/\s+/g, "")
        .toUpperCase(),
      qr_url: String(companyQrUrl || "").trim(),
    };

    if (
      !cleanedPayload.cname ||
      !cleanedPayload.caddress ||
      !cleanedPayload.cphone_number ||
      !cleanedPayload.gstin
    ) {
      setTenantFormError(
        "Company name, address, phone and GSTIN are mandatory.",
      );
      return;
    }

    const hasAnyPaymentField =
      Boolean(cleanedPayload.account_number) ||
      Boolean(cleanedPayload.ifsc_code) ||
      Boolean(cleanedPayload.qr_url) ||
      Boolean(companyQrFile);

    if (
      hasAnyPaymentField &&
      (!cleanedPayload.account_number ||
        !cleanedPayload.ifsc_code ||
        (!cleanedPayload.qr_url && !companyQrFile))
    ) {
      setTenantFormError(
        "Account number, IFSC and QR are required together when payment details are provided.",
      );
      return;
    }

    setIsSavingTenant(true);

    try {
      let qrUrl = cleanedPayload.qr_url;
      const previousQrUrl = tenantQr;

      if (companyQrFile) {
        if (!isSupabaseStorageConfigured()) {
          throw new Error(
            "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
          );
        }

        qrUrl = await uploadTenantQrToSupabase({
          file: companyQrFile,
          tenantSlug,
          tenantName,
        });
      }

      await updateTenantProfile({
        ...cleanedPayload,
        qr_url: qrUrl,
      });

      if (companyQrFile && previousQrUrl && previousQrUrl !== qrUrl) {
        try {
          await deleteTenantQrFileByPublicUrl(previousQrUrl);
        } catch (deleteErr) {
          console.warn("Failed to delete previous QR file", deleteErr);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["invoice"] });
      queryClient.invalidateQueries({ queryKey: ["viewInvoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });

      setCompanyQrFile(null);
      setTenantFeedback("Company profile updated successfully.");
      setIsEditingTenant(false);
    } catch (err) {
      setTenantFormError(err.message || "Failed to update company profile");
    } finally {
      setIsSavingTenant(false);
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

      {showDropdown ? (
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
              <span className="user-meta-label">Role</span>
              <span className="user-meta-value">{roleLabel}</span>
            </div>

            <div className="user-meta-chips">
              <span className="user-chip role-chip">{roleLabel}</span>
              <span className="user-chip tenant-chip">
                {tenantSlug || "N/A"}
              </span>
            </div>

            <button
              type="button"
              className="tenant-payment-btn"
              onClick={openProfileModal}
            >
              Open Full Profile
            </button>
          </div>

          <button onClick={handleSignOut} className="logout-btn">
            Sign Out
          </button>
        </div>
      ) : null}

      {showProfileModal ? (
        <div className="profile-modal-overlay" onClick={closeProfileModal}>
          <div
            className="profile-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="profile-modal-header">
              <h3>Profile</h3>
              <button
                type="button"
                className="profile-modal-close"
                onClick={closeProfileModal}
                disabled={isSavingUser || isSavingTenant}
              >
                x
              </button>
            </div>

            <div className="profile-sections-grid">
              <section className="profile-card">
                <div className="profile-card-head">
                  <h4>Current User</h4>
                  {isEditingUser ? (
                    <button
                      type="button"
                      className="profile-edit-toggle-btn profile-edit-toggle-btn-cancel"
                      onClick={() => {
                        setIsEditingUser(false);
                        setUserFormError("");
                        setProfileName(String(session.user?.name || ""));
                        setProfileEmail(String(session.user?.email || ""));
                        setCurrentPassword("");
                        setNewPassword("");
                      }}
                      disabled={isSavingUser}
                    >
                      Cancel
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="profile-edit-toggle-btn"
                      onClick={() => {
                        setIsEditingUser(true);
                        setUserFormError("");
                      }}
                    >
                      Edit
                    </button>
                  )}
                </div>

                <div className="profile-read-grid">
                  <div className="profile-read-item">
                    <span>Name</span>
                    <p>{displayName || "-"}</p>
                  </div>
                  <div className="profile-read-item">
                    <span>Email</span>
                    <p>{email || "-"}</p>
                  </div>
                  <div className="profile-read-item">
                    <span>Role</span>
                    <p>{roleLabel}</p>
                  </div>
                  <div className="profile-read-item profile-read-item-full">
                    <span>Tenant</span>
                    <p>{tenantName || "-"}</p>
                  </div>
                </div>

                {isEditingUser ? (
                  <form
                    className="profile-edit-form"
                    onSubmit={handleSaveUserDetails}
                  >
                    {isOwner ? (
                      <label>
                        Name
                        <input
                          type="text"
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          disabled={isSavingUser}
                        />
                      </label>
                    ) : null}

                    <label>
                      Email
                      <input
                        type="email"
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                        disabled={isSavingUser}
                      />
                    </label>

                    <label>
                      Current Password (only if changing password)
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        disabled={isSavingUser}
                      />
                    </label>

                    <label>
                      New Password
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={isSavingUser}
                      />
                    </label>

                    {userFormError ? (
                      <p className="payment-form-error">{userFormError}</p>
                    ) : null}
                    {userFeedback ? (
                      <p className="payment-feedback-msg">{userFeedback}</p>
                    ) : null}

                    <button
                      type="submit"
                      className="profile-save-btn"
                      disabled={isSavingUser}
                    >
                      {isSavingUser ? "Saving..." : "Save My Details"}
                    </button>
                  </form>
                ) : null}
              </section>

              <section className="profile-card">
                <div className="profile-card-head">
                  <h4>Company / Tenant</h4>
                  {isOwner ? (
                    isEditingTenant ? (
                      <button
                        type="button"
                        className="profile-edit-toggle-btn profile-edit-toggle-btn-cancel"
                        onClick={() => {
                          setIsEditingTenant(false);
                          setTenantFormError("");
                          setCompanyName(String(session.tenant?.cname || ""));
                          setCompanyAddress(
                            String(session.tenant?.caddress || ""),
                          );
                          setCompanyPhone(
                            String(session.tenant?.cphone_number || ""),
                          );
                          setCompanyGstin(String(session.tenant?.gstin || ""));
                          setCompanyAccount(
                            String(session.tenant?.account_number || ""),
                          );
                          setCompanyIfsc(
                            String(session.tenant?.ifsc_code || ""),
                          );
                          setCompanyQrUrl(String(session.tenant?.qr_url || ""));
                          setCompanyQrFile(null);
                        }}
                        disabled={isSavingTenant}
                      >
                        Cancel
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="profile-edit-toggle-btn"
                        onClick={() => {
                          setIsEditingTenant(true);
                          setTenantFormError("");
                        }}
                      >
                        Edit
                      </button>
                    )
                  ) : null}
                </div>

                <div className="profile-read-grid">
                  <div className="profile-read-item">
                    <span>Company Name</span>
                    <p>{session.tenant?.cname || "-"}</p>
                  </div>
                  <div className="profile-read-item">
                    <span>Company Phone</span>
                    <p>{session.tenant?.cphone_number || "-"}</p>
                  </div>
                  <div className="profile-read-item profile-read-item-full">
                    <span>Company Address</span>
                    <p>{session.tenant?.caddress || "-"}</p>
                  </div>
                </div>

                {!isOwner ? (
                  <p className="profile-permission-note">
                    Only owner can edit company details. You can still edit your
                    own user details.
                  </p>
                ) : null}

                {isEditingTenant ? (
                  <form
                    className="profile-edit-form"
                    onSubmit={handleSaveTenantDetails}
                  >
                    <label>
                      Company Name
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        disabled={!isOwner || isSavingTenant}
                      />
                    </label>

                    <label>
                      Company Address
                      <input
                        type="text"
                        value={companyAddress}
                        onChange={(e) => setCompanyAddress(e.target.value)}
                        disabled={!isOwner || isSavingTenant}
                      />
                    </label>

                    <label>
                      Company Phone
                      <input
                        type="text"
                        value={companyPhone}
                        onChange={(e) => setCompanyPhone(e.target.value)}
                        disabled={!isOwner || isSavingTenant}
                      />
                    </label>

                    <label>
                      GSTIN
                      <input
                        type="text"
                        value={companyGstin}
                        onChange={(e) => setCompanyGstin(e.target.value)}
                        disabled={!isOwner || isSavingTenant}
                      />
                    </label>

                    <label>
                      Account Number
                      <input
                        type="text"
                        value={companyAccount}
                        onChange={(e) => setCompanyAccount(e.target.value)}
                        disabled={!isOwner || isSavingTenant}
                      />
                    </label>

                    <label>
                      IFSC Code
                      <input
                        type="text"
                        value={companyIfsc}
                        onChange={(e) => setCompanyIfsc(e.target.value)}
                        disabled={!isOwner || isSavingTenant}
                      />
                    </label>

                    <label>
                      QR URL
                      <input
                        type="url"
                        value={companyQrUrl}
                        onChange={(e) => setCompanyQrUrl(e.target.value)}
                        disabled={!isOwner || isSavingTenant}
                      />
                    </label>

                    <label>
                      Upload New QR (optional)
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(e) =>
                          setCompanyQrFile(e.target.files?.[0] || null)
                        }
                        disabled={!isOwner || isSavingTenant}
                      />
                    </label>

                    {tenantFormError ? (
                      <p className="payment-form-error">{tenantFormError}</p>
                    ) : null}
                    {tenantFeedback ? (
                      <p className="payment-feedback-msg">{tenantFeedback}</p>
                    ) : null}

                    <button
                      type="submit"
                      className="profile-save-btn"
                      disabled={!isOwner || isSavingTenant}
                    >
                      {isSavingTenant ? "Saving..." : "Save Company Details"}
                    </button>
                  </form>
                ) : null}
              </section>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
