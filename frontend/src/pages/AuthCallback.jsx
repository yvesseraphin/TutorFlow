import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useNotification } from "../components/NotificationBanner";

const AuthCallback = () => {
  const navigate = useNavigate();
  const notif = useNotification();
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const saveUserAndRedirect = (session) => {
      if (!session || !session.access_token) return false;
      const user = session.user;
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
      if (isMounted) {
        notif.success("Signed in successfully!");
        navigate("/dashboard", { replace: true });
      }
      return true;
    };

    const handleAuth = async () => {
      try {
        // 1. Check if session was already created by Supabase's automatic listener
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        if (existingSession && saveUserAndRedirect(existingSession)) {
          return;
        }

        // 2. If URL contains a PKCE ?code= parameter, exchange it manually
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");

        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            // Check if the code exchange succeeded in background despite error
            const { data: { session: retrySession } } = await supabase.auth.getSession();
            if (retrySession && saveUserAndRedirect(retrySession)) {
              return;
            }
            throw exchangeError;
          }
          if (data?.session && saveUserAndRedirect(data.session)) {
            return;
          }
        }

        // 3. Subscribe to auth state changes to catch async OAuth sign-in completion
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (session && saveUserAndRedirect(session)) {
            subscription.unsubscribe();
          }
        });

      } catch (err) {
        console.error("OAuth callback error:", err);
        // Check session one last time before displaying error
        const { data: { session: fallbackSession } } = await supabase.auth.getSession();
        if (fallbackSession && saveUserAndRedirect(fallbackSession)) {
          return;
        }
        if (isMounted) {
          const msg = err.message || "Sign-in failed. Please try again.";
          setError(msg);
          notif.error(msg);
        }
      }
    };

    handleAuth();

    return () => {
      isMounted = false;
    };
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

