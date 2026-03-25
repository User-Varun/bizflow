import { useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import { requestJSON } from "../../utils/requestJSON";

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

  const signOut = async () => {
    await requestJSON(`${authBaseUrl}/logout`, {
      method: "POST",
    });

    setSession(null);
  };

  const value = {
    session,
    loading,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
