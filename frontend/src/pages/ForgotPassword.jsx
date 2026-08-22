import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, Send, CheckCircle } from "lucide-react";
import { api } from "../lib/api";
import { useNotification } from "../components/NotificationBanner";

/* ─── Inline styles object (matching Login.jsx light design) ─── */

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

  formArea: { width: "100%", maxWidth: "380px" },
  h1: {
    fontSize: "42px",
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: "6px",
    letterSpacing: "-1px",
    fontFamily: "'Outfit', sans-serif",
    lineHeight: "46px",
    textAlign: "center",
  },
  subtitle: {
    color: "#64748b",
    fontSize: "17px",
    fontWeight: "400",
    marginBottom: "28px",
    fontFamily: "'Outfit', sans-serif",
    lineHeight: "24px",
    textAlign: "center",
  },
  successBox: {
    background: "#f0fdf4",
    border: "1px solid #86efac",
    color: "#15803d",
    padding: "16px",
    borderRadius: "14px",
    fontSize: "15px",
    lineHeight: "22px",
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    fontFamily: "'Outfit', sans-serif",
    marginBottom: "20px",
  },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  label: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#334155",
    lineHeight: "20px",
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
    padding: "0 20px 0 50px",
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
  },
  submitBtn: {
    background: "#2563EB",
    color: "#ffffff",
    border: "none",
    borderRadius: "14px",
    height: "56px",
    fontSize: "17px",
    fontWeight: "500",
    cursor: "pointer",
    marginTop: "8px",
    transition: "background 0.2s",
    letterSpacing: "-0.01em",
    fontFamily: "'Outfit', sans-serif",
    lineHeight: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
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
  footerLink: { color: "#2563eb", fontWeight: "600", textDecoration: "none" },

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

const ForgotPassword = () => {
  const notif = useNotification();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      notif.error("Please enter your email address.");
      return;
    }
    setLoading(true);
    try {
      await api("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSent(true);
      notif.success(`Password reset link sent to ${email}`);
    } catch (err) {
      notif.error(err.message || "Unable to send reset link. Please try again.");
    } finally {
      setLoading(false);
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
          opacity: "0.93";
        }
        
        .custom-input:focus {
          border: 2px solid #7ca1f1 !important;
        }
      `,
        }}
      />

      {/* ══════════════════════ LEFT PANEL ══════════════════════ */}
      <div style={S.left} className="left-panel-wrapper">
        <div style={S.formArea} className="form-area-wrapper">
          <div style={S.brand}>
            <img
              src="/Logo_cropped.png"
              alt="TutorFlow"
              style={{ height: "40px", objectFit: "contain" }}
            />
          </div>

          <h1 style={S.h1}>Reset password</h1>
          <p style={S.subtitle}>
            Enter your email to receive a password reset link.
          </p>

          {sent ? (
            <div style={S.successBox}>
              <CheckCircle size={20} style={{ flexShrink: 0, marginTop: 2, color: "#16a34a" }} />
              <span>
                If an account exists for <strong>{email}</strong>, a reset link has been sent. Check your inbox!
              </span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={S.form}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
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
                    onFocus={(e) => (e.target.style.borderColor = "#1a56db")}
                    onBlur={(e) => (e.target.style.borderColor = "#cbd5e1")}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={S.submitBtn}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#1e40af")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#1a56db")}
              >
                <Send size={18} />
                {loading ? "Sending link…" : "Send Reset Link"}
              </button>
            </form>
          )}

          <p style={S.footer}>
            Remember your password?{" "}
            <Link to="/login" style={S.footerLink}>
              Log in
            </Link>
          </p>
        </div>
      </div>

      {/* ══════════════════════ RIGHT PANEL ══════════════════════ */}
      <RightPanel />
    </div>
  );
};

const RightPanel = () => {
  return (
    <div style={S.right} className="right-panel-wrapper">
      <div style={S.tagline}>
        <h2 style={S.taglineH2}>
          <span style={{ color: "#1a56db" }}>Your AI Tutor.</span>
          <br />
          <span style={{ color: "#1a56db" }}>Your Learning Flow.</span>
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

export default ForgotPassword;
