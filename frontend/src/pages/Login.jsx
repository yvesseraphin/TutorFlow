import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ChevronRight, Book } from "lucide-react";
import { signInWithGoogle } from "../lib/supabase";
import { useNotification } from "../components/NotificationBanner";
import { prefetchUserData } from "../lib/prefetch";

/* ─── Inline styles object (light / white theme matching design) ─── */

const S = {
  page: {
    display: "flex",
    minHeight: "100vh",
    width: "100vw",
    background: "#ffffff",
    fontFamily: "'Plus Jakarta Sans', 'Outfit', sans-serif",
    color: "#0f172a",
    overflowX: "hidden",
  },

  /* ── LEFT PANEL ── */
  left: {
    width: "50%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "56px 40px",
    background: "#ffffff",
    boxSizing: "border-box",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginBottom: "20px",
  },
  brandLogo: { height: "38px", objectFit: "contain" },
  brandName: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: "24px",
    fontWeight: "700",
    color: "#111111",
    letterSpacing: "-0.3px",
  },

  formArea: { width: "100%", maxWidth: "380px" },
  h1: {
    fontSize: "46px",
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: "6px",
    letterSpacing: "-1px",
    fontFamily: "'Outfit', sans-serif",
    lineHeight: "48px",
    textAlign: "center",
  },
  subtitle: {
    color: "#64748b",
    fontSize: "18px",
    fontWeight: "400",
    marginBottom: "28px",
    fontFamily: "'Outfit', sans-serif",
    lineHeight: "24px",
    textAlign: "center",
  },

  errorBox: {
    background: "#fef2f2",
    border: "1px solid #fca5a5",
    color: "#ef4444",
    padding: "10px 14px",
    borderRadius: "8px",
    fontSize: "13px",
    marginBottom: "16px",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  label: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#334155",
    lineHeight: "20px",
    fontFamily: "'Outfit', sans-serif",
  },
  labelRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  forgotLink: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#111111",
    textDecoration: "none",
    fontFamily: "'Outfit', sans-serif",
  },
  inputWrap: { position: "relative" },
  inputIcon: {
    position: "absolute",
    left: "18px",
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none",
  },
  input: {
    width: "100%",
    height: "56px",
    padding: "0 50px",
    border: "1px solid #E2E8F0",
    borderRadius: "14px",
    fontSize: "16px",
    background: "#ffffff",
    color: "#0f172a",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
    fontFamily: "'Outfit', sans-serif",
    fontWeight: "400",
    lineHeight: "24px",
    gap: "14px",
    alignItems: "center",
  },
  eyeBtn: {
    position: "absolute",
    right: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
  },
  submitBtn: {
    background: "#0a0a0a",
    color: "#ffffff",
    border: "none",
    borderRadius: "14px",
    height: "56px",
    fontSize: "17px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "4px",
    transition: "background 0.2s",
    letterSpacing: "-0.01em",
    fontFamily: "'Outfit', sans-serif",
    lineHeight: "24px",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    margin: "18px 0",
    color: "#94a3b8",
    fontSize: "15px",
    fontWeight: "500",
    fontFamily: "'Outfit', sans-serif",
  },
  dividerLine: { flex: 1, height: "1px", background: "#e2e8f0" },
  googleBtn: {
    width: "100%",
    height: "56px",
    border: "1px solid #E2E8F0",
    borderRadius: "14px",
    background: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    cursor: "pointer",
    color: "#0f172a",
    fontWeight: "500",
    fontSize: "17px",
    transition: "border-color 0.2s",
    fontFamily: "'Outfit', sans-serif",
    boxShadow: "0 1px 2px rgba(15,23,42,.03)",
    letterSpacing: "-0.01em",
  },
  continueCard: {
    background: "#ffffff",
    border: "1px solid #EDF2F7",
    borderRadius: "18px",
    padding: "14px 18px",
    marginTop: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: "pointer",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
    transition: "all 0.2s ease-in-out",
    fontFamily: "'Outfit', sans-serif",
    height: "96px",
  },
  continueCardLeft: { display: "flex", alignItems: "center", gap: "14px" },
  continueIcon: {
    width: "56px",
    height: "56px",
    borderRadius: "16px",
    background: "#f5f5f5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  continueTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1e293b",
    fontFamily: "'Outfit' , sans-serif",
    lineHeight: "30px",
    letterSpacing: "-0.02em",
  },
  continueSub: {
    fontSize: "15px",
    fontWeight: "400",
    lineHeight: "26px",
    letterSpacing: "0",
    color: "#64748b",
    marginTop: "2px",
    fontFamily: "'Outfit', sans-serif",
  },

  footer: {
    fontSize: "15px",
    color: "#64748b",
    fontWeight: "400",
    textAlign: "center",
    width: "100%",
    maxWidth: "380px",
    marginTop: "40px",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  footerLink: { color: "#111111", fontWeight: "600", textDecoration: "none" },

  /* ── RIGHT PANEL ── */
  right: {
    width: "50%",
    background: "#ffffff url(/background.png) no-repeat center center / cover",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "16px 56px 96px 56px",
    gap: "16px",
    position: "relative",
    overflow: "hidden",
    boxSizing: "border-box",
  },

  tagline: {
    position: "relative",
    zIndex: 2,
    width: "100%",
    maxWidth: "640px",
    alignSelf: "center",
  },
  taglineH2: {
    fontSize: "48px",
    fontWeight: "700",
    lineHeight: 1.15,
    letterSpacing: "-0.03em",
    marginBottom: "8px",
    fontFamily: "'Outfit', sans-serif",
  },
  taglineSub: {
    color: "#64748b",
    fontSize: "18px",
    fontWeight: "400",
    fontFamily: "'Outfit', sans-serif",
  },

  dashboardWrapper: {
    width: "100%",
    maxWidth: "640px",
    alignSelf: "center",
    perspective: "1200px",
    perspectiveOrigin: "50% 50%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  dashboardImg: {
    width: "100%",
    height: "auto",
    borderRadius: "16px",
    boxShadow:
      "0 25px 50px -12px rgba(15, 23, 42, 0.14), 0 12px 24px -8px rgba(37, 99, 235, 0.10)",
    transform: "rotateX(14deg) rotateY(-18deg) rotateZ(4deg)",
    transformStyle: "preserve-3d",
    transition: "transform 0.4s ease, box-shadow 0.4s ease",
  },
};

/* ─────────────────────────────────────────────────────────────────── */

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const notice = location.state?.notice || "";
  const notif = useNotification();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (notice) {
      notif.info(notice);
    }
  }, [notice, notif]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      notif.error("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1"}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("user", JSON.stringify(data.user));
        // Prefetch dashboard, profile, curriculum & notifications so the dashboard and all pages are primed instantly
        prefetchUserData();
        notif.success("Login successful! Welcome back.");
        navigate("/dashboard");
      } else {
        const errData = await response.json().catch(() => ({}));
        const message = errData.detail || "Invalid email or password. Please try again.";
        notif.error(message);
      }
    } catch (err) {
      notif.error(err.message || "Unable to sign in. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle(); // redirects away — no further code runs
    } catch (err) {
      notif.error(err.message || "Google sign-in failed. Please try again.");
    }
  };

  return (
    <div style={S.page}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media (max-width: 1024px) {
          .right-panel-wrapper { display: none !important; }
          .left-panel-wrapper { width: 100% !important; max-width: 100% !important; min-width: 100% !important; padding: 40px 24px !important; }
          .form-area-wrapper { max-width: 380px !important; margin: 0 auto !important; }
        }
        
        .custom-input::placeholder {
          opacity: "0.93",
        }
        
        .custom-input:focus {
          border: 2px solid #111111 !important;
        }
        
        .google-btn:hover {
          background-color: #f8fafc !important;
          border-color: #cbd5e1 !important;
        }
      `,
        }}
      />

      {/* ══════════════════════ LEFT PANEL ══════════════════════ */}
      <div style={S.left} className="left-panel-wrapper">
        {/* Form block */}
        <div style={S.formArea} className="form-area-wrapper">
          <div style={S.brand}>
            <img
              src="/Logo_cropped.png"
              alt="TutorFlow"
              style={{ height: "40px", objectFit: "contain" }}
            />
          </div>

          <h1 style={S.h1}>Welcome back!</h1>
          <p style={S.subtitle}>Log in to continue your learning journey.</p>



          <form onSubmit={handleLogin} style={S.form}>
            {/* Email */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "6px" }}
            >
              <label style={S.label}>Email</label>
              <div style={S.inputWrap}>
                <span style={S.inputIcon}>
                  <Mail size={20} color="#64748B" />
                </span>
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={S.input}
                  className="custom-input"
                  onFocus={(e) => (e.target.style.borderColor = "#111111")}
                  onBlur={(e) => (e.target.style.borderColor = "#cbd5e1")}
                />
              </div>
            </div>

            {/* Password */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "6px" }}
            >
              <div style={S.labelRow}>
                <label style={S.label}>Password</label>
                <Link to="/forgot-password" style={S.forgotLink}>
                  Forgot password?
                </Link>
              </div>
              <div style={S.inputWrap}>
                <span style={S.inputIcon}>
                  <Lock size={20} color="#64748B" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={S.input}
                  className="custom-input"
                  onFocus={(e) => (e.target.style.borderColor = "#111111")}
                  onBlur={(e) => (e.target.style.borderColor = "#cbd5e1")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={S.eyeBtn}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={S.submitBtn}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#222222")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#0a0a0a")
              }
            >
              {loading ? "Logging in…" : "Log in"}
            </button>
          </form>

          {/* Divider */}
          <div style={S.divider}>
            <div style={S.dividerLine} />
            <span style={{ padding: "0 12px" }}>or</span>
            <div style={S.dividerLine} />
          </div>

          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            style={S.googleBtn}
            className="google-btn"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          {/* Continue Learning card */}
          <div
            style={S.continueCard}
            onClick={handleGoogleLogin}
            className="continue-card"
          >
            <div style={S.continueCardLeft}>
              <div style={S.continueIcon}>
                <Book size={24} color="#111111" />
              </div>
              <div>
                <div style={S.continueTitle}>Continue learning</div>
                <div style={S.continueSub}>Pick up where you left off</div>
              </div>
            </div>
            <ChevronRight size={24} color="#111111" />
          </div>
        </div>

        {/* Footer */}
        <p style={S.footer}>
          Don't have an account?{" "}
          <Link to="/signup" style={S.footerLink}>
            Sign up
          </Link>
        </p>
      </div>

      <RightPanel />
    </div>
  );
};

const RightPanel = () => {
  return (
    <div style={S.right} className="right-panel-wrapper">
      <div style={S.tagline}>
        <h2 style={S.taglineH2}>
          <span style={{ color: "#111111" }}>Your AI Tutor.</span>
          <br />
          <span style={{ color: "#111111" }}>Your Learning Flow.</span>
        </h2>
        <p style={S.taglineSub}>Teach. Understand. Improve.</p>
      </div>

      <div style={S.dashboardWrapper}>
        <img
          src="/Dashboard.png"
          alt="Dashboard Mockup"
          style={S.dashboardImg}
          className="dashboard-mockup-img"
        />
      </div>
    </div>
  );
};

export default Login;
