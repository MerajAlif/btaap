import { createContext, useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "@/lib/api";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Fetch current user on mount
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            fetchMe();
        } else {
            setLoading(false);
        }
    }, []);

    const fetchMe = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                setLoading(false);
                return;
            }

            const res = await fetch(`${BASE_URL}/api/auth/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
            } else {
                // Token invalid or expired
                localStorage.removeItem("token");
                setUser(null);
            }
        } catch (error) {
            console.error("Failed to fetch user:", error);
            localStorage.removeItem("token");
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const refreshMe = async () => {
        await fetchMe();
    };

    const refreshUser = async () => {
        await fetchMe();
    };

    const login = async (email, password) => {
        const res = await fetch(`${BASE_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "Login failed");
        }

        localStorage.setItem("token", data.token);
        setUser(data.user);
        return data;
    };

    const register = async (userData) => {
        const res = await fetch(`${BASE_URL}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "Registration failed");
        }

        localStorage.setItem("token", data.token);
        setUser(data.user);
        return data;
    };

    const updateProfile = async (payload) => {
        const res = await fetch(`${BASE_URL}/api/auth/updateprofile`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "Update failed");
        }

        // Refresh user data
        await refreshMe();
        return data;
    };

    const updatePassword = async (currentPassword, newPassword) => {
        const res = await fetch(`${BASE_URL}/api/auth/updatepassword`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({ currentPassword, newPassword }),
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "Password update failed");
        }

        return data;
    };

    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);
        navigate("/");
    };

    const value = useMemo(
        () => ({
            user,
            loading,
            login,
            register,
            logout,
            refreshMe,
            refreshUser,
            updateProfile,
            updatePassword,
            // Helper properties
            isMentor: user?.role === "mentor",
            isAdmin: user?.role === "admin",
            isApprovedMentor: user?.role === "mentor" && user?.approvalStatus === "approved",
            isPendingMentor: user?.role === "mentor" && user?.approvalStatus === "pending",
        }),
        [user, loading]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
