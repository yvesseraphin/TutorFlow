/**
 * AuthCallback.jsx
 *
 * Supabase redirects here after a successful Google OAuth sign-in.
 * The URL will contain either:
 *   - A fragment (#access_token=...&refresh_token=...) for implicit flow, OR
 *   - A ?code= query param for PKCE flow (default in supabase-js v2).
 *
 * supabase.auth.exchangeCodeForSession() handles both cases automatically.
 */
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useNotification } from "../components/NotificationBanner";

const AuthCallback = () => {
  const navigate = useNavigate();
  const notif = useNotification();
  const [error, setError] = useState("");

  useEffect(() => {
    const handle = async () => {
      try {
        // Exchange the one-time code in the URL for a real session
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(
          window.location.href
        );

        if (exchangeError) throw exchangeError;

        const session = data?.session;
        const user = data?.user;

        if (!session?.access_token) throw new Error("No session returned.");

        // Store token the same way email/password login does
        localStorage.setItem("token", session.access_token);
        localStorage.setItem(
          "user",
          JSON.stringify({
            id: user.id,
            email: user.email,
            full_name:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email?.split("@")[0] ||
              "",
          })
        );

        notif.success("Signed in successfully!");
        navigate("/dashboard", { replace: true });
      } catch (err) {
        console.error("OAuth callback error:", err);
        const msg = err.message || "Sign-in failed. Please try again.";
        notif.error(msg);
        setError(msg);
      }
    };

    handle();
  }, [navigate, notif]);

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "#ffffff",
          fontFamily: "'Outfit', sans-serif",
          gap: 16,
          padding: 24,
        }}
      >
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fca5a5",
            color: "#dc2626",
            padding: "14px 20px",
            borderRadius: 12,
            fontSize: 15,
            maxWidth: 420,
            textAlign: "center",
          }}
        >
          {error}
        </div>
        <a
          href="/login"
          style={{ color: "#2563eb", fontSize: 15, fontWeight: 600, textDecoration: "none" }}
        >
          ← Back to login
        </a>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#ffffff",
        fontFamily: "'Outfit', sans-serif",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Simple spinner */}
      <div
        style={{
          width: 40,
          height: 40,
          border: "3px solid #e2e8f0",
          borderTopColor: "#2563eb",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: "#64748b", fontSize: 15, margin: 0 }}>Signing you in…</p>
    </div>
  );
};

export default AuthCallback;
