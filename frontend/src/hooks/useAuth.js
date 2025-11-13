import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, setToken, getToken } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { id, name, email, role, approvalStatus, credits, creditExpiry, profile }
  const [loading, setLoading] = useState(true);

  // helper to save user locally
  const saveUser = (u) => {
    setUser(u);
    localStorage.setItem("user", JSON.stringify(u));
  };

  // initial load (try /me if token exists)
  useEffect(() => {
    const init = async () => {
      const token = getToken();
      if (!token) return setLoading(false);

      try {
        const res = await api("/api/auth/me");
        const u = res.user || res?.data?.user;
        if (u) saveUser(u);
      } catch (err) {
        console.warn("Auth init failed:", err.message);
        localStorage.removeItem("user");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // login
  const login = async (email, password) => {
    const data = await api("/api/auth/login", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ email, password }),
    });

    setToken(data.token);

    // fetch full user info to include credits + expiry
    try {
      const me = await api("/api/auth/me");
      const fullUser = me.user || me?.data?.user || data.user;
      saveUser(fullUser);
      return fullUser;
    } catch (err) {
      console.warn("Failed to refresh full user info:", err.message);
      saveUser(data.user);
      return data.user;
    }
  };

  // register
  const register = async (payload) => {
    const data = await api("/api/auth/register", {
      method: "POST",
      auth: false,
      body: JSON.stringify(payload),
    });

    if (data.token && data.user) {
      setToken(data.token);
      saveUser(data.user);
    }
    return data;
  };

  // refresh /me
  const refreshMe = async () => {
    try {
      const res = await api("/api/auth/me");
      const u = res.user || res?.data?.user || null;
      if (u) saveUser(u);
      return u;
    } catch (err) {
      console.error("refreshMe failed:", err.message);
      return null;
    }
  };

  // alias for components that call refreshUser()
  const refreshUser = () => refreshMe();

  // update profile (auto-refresh and return freshest user)
  const updateProfile = async (payload) => {
    const res = await api("/api/auth/updateprofile", {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    let u = res.user || res?.data?.user || null;
    if (u) {
      saveUser(u);
      return u;
    }
    // fallback: fetch from /me to ensure we have the latest
    u = await refreshMe();
    return u;
  };

  // update password
  const updatePassword = async (currentPassword, newPassword) => {
    return api("/api/auth/updatepassword", {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  };

  // logout
  const logout = () => {
    setToken(null);
    localStorage.removeItem("user");
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      isMentor: user?.role === "mentor",
      isAdmin: user?.role === "admin",
      isApprovedMentor:
        user?.role === "mentor" && user?.approvalStatus === "approved",
      isPendingMentor:
        user?.role === "mentor" && user?.approvalStatus === "pending",
      login,
      register,
      logout,
      refreshMe,
      refreshUser,      // <-- exposed for Profile.jsx
      updateProfile,    // <-- use this from components if you prefer
      updatePassword,
      loading,
    }),
    [user, loading]
  );

  // keep .js file (no JSX)
  return React.createElement(AuthContext.Provider, { value }, children);
}

export default function useAuth() {
  return useContext(AuthContext);
}
