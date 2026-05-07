import { useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import { requestJSON } from "../../styles/utils/requestJSON";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const backend_url = import.meta.env.VITE_API_URL;
  const authBaseUrl = `${backend_url}/auth`;

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const payload = await requestJSON(`${authBaseUrl}/me`, {
          method: "GET",
        });

        if (!cancelled) {
          setSession(payload.data || null);
        }
      } catch (e) {
        console.log(e);
        if (!cancelled) {
          setSession(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSession();

    return () => {
      cancelled = true;
    };
  }, [authBaseUrl]);

  const signIn = async (tenant_slug, email, password) => {
    const payload = await requestJSON(`${authBaseUrl}/login`, {
      method: "POST",
      body: JSON.stringify({ tenant_slug, email, password }),
    });

    setSession(payload.data);
    return payload.data;
  };

  const signUp = async (registrationData) => {
    const payload = await requestJSON(`${authBaseUrl}/register`, {
      method: "POST",
      body: JSON.stringify(registrationData),
    });

    setSession(payload.data);
    return payload.data;
  };

  const signOut = async () => {
    await requestJSON(`${authBaseUrl}/logout`, {
      method: "POST",
    });

    setSession(null);
  };

  const updateTenantPaymentDetails = async (details) => {
    const payload = await requestJSON(`${authBaseUrl}/tenant-payment-details`, {
      method: "PATCH",
      body: JSON.stringify(details),
    });

    setSession(payload.data);
    return payload.data;
  };

  const updateMyProfile = async (details) => {
    const payload = await requestJSON(`${authBaseUrl}/me`, {
      method: "PATCH",
      body: JSON.stringify(details),
    });

    setSession(payload.data);
    return payload.data;
  };

  const updateTenantProfile = async (details) => {
    const payload = await requestJSON(`${authBaseUrl}/tenant-profile`, {
      method: "PATCH",
      body: JSON.stringify(details),
    });

    setSession(payload.data);
    return payload.data;
  };

  const requestPasswordReset = async (tenant_slug, email) => {
    await requestJSON(`${authBaseUrl}/forgot-password`, {
      method: "POST",
      body: JSON.stringify({ tenant_slug, email }),
    });
  };

  const resetPassword = async (token, newPassword) => {
    await requestJSON(`${authBaseUrl}/reset-password`, {
      method: "POST",
      body: JSON.stringify({ token, password: newPassword }),
    });
  };

  const value = {
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updateTenantPaymentDetails,
    updateMyProfile,
    updateTenantProfile,
    requestPasswordReset,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
