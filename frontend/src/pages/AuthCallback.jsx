import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useNotification } from "../components/NotificationBanner";
import { prefetchUserData } from "../lib/prefetch";

const AuthCallback = () => {
  const navigate = useNavigate();
  const notif = useNotification();
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const saveUserAndRedirect = async (session) => {
      if (!session || !session.access_token) return false;
      const user = session.user;
      const meta = user.user_metadata || {};
      const avatar = meta.avatar_url || meta.picture || meta.avatar || "";

      localStorage.setItem("token", session.access_token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: user.id,
          email: user.email,
          full_name:
            meta.full_name ||
            meta.name ||
            user.email?.split("@")[0] ||
            "",
          avatar_url: avatar,
        })
      );
      await prefetchUserData();
      if (isMounted) {
        notif.success("Verification successful! Welcome to TutorFlow.");
        navigate("/dashboard", { replace: true });
      }
      return true;
    };

    const handleAuth = async () => {
      try {
        // 1. Check for errors in query or hash fragment
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));

        const errorDesc =
          urlParams.get("error_description") ||
          hashParams.get("error_description") ||
          urlParams.get("error") ||
          hashParams.get("error");

        if (errorDesc) {
          throw new Error(decodeURIComponent(errorDesc.replace(/\+/g, " ")));
        }

        // 2. Check for token_hash and type (Email Verification Link / OTP flow)
        const tokenHash = urlParams.get("token_hash") || hashParams.get("token_hash");
        const otpType = urlParams.get("type") || hashParams.get("type") || "signup";

        if (tokenHash) {
          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: otpType,
          });
          if (verifyError) throw verifyError;
          if (data?.session && (await saveUserAndRedirect(data.session))) {
            return;
          }
        }

        // 3. If URL contains a PKCE ?code= parameter, exchange it manually
        const code = urlParams.get("code");
        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            const { data: { session: retrySession } } = await supabase.auth.getSession();
            if (retrySession && (await saveUserAndRedirect(retrySession))) {
              return;
            }
            throw exchangeError;
          }
          if (data?.session && (await saveUserAndRedirect(data.session))) {
            return;
          }
        }

        // 4. Check for implicit hash session or existing session
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        if (existingSession && (await saveUserAndRedirect(existingSession))) {
          return;
        }

        // 5. Subscribe to auth state changes to catch async sign-in completion
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (session && (await saveUserAndRedirect(session))) {
            subscription.unsubscribe();
          }
        });

      } catch (err) {
        console.error("Auth callback error:", err);
        const { data: { session: fallbackSession } } = await supabase.auth.getSession();
        if (fallbackSession && (await saveUserAndRedirect(fallbackSession))) {
          return;
        }
        if (isMounted) {
          const msg = err.message || "Verification or sign-in failed. Please try again.";
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
          gap: 18,
          padding: 24,
        }}
      >
        <div
          style={{
            background: "#f5f5f5",
            border: "1px solid #e5e5e5",
            color: "#111111",
            padding: "16px 24px",
            borderRadius: 14,
            fontSize: 15,
            fontWeight: 500,
            maxWidth: 440,
            textAlign: "center",
            lineHeight: "22px",
          }}
        >
          {error}
        </div>
        <button
          type="button"
          onClick={() => navigate("/login")}
          style={{
            height: "48px",
            padding: "0 24px",
            background: "#111111",
            color: "#ffffff",
            border: "none",
            borderRadius: "12px",
            fontSize: "15px",
            fontWeight: "600",
            cursor: "pointer",
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          Return to Login
        </button>
      </div>
    );
  }

  return null;
};

export default AuthCallback;

