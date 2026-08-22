import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff, BookOpen, ChevronDown } from "lucide-react";
import { signInWithGoogle } from "../lib/supabase";
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
  brandLogo: { height: "38px", objectFit: "contain" },

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
    color: "#64748B",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
    fontFamily: "'Outfit', sans-serif",
    fontWeight: "400",
    lineHeight: "24px",
    gap: "14px",
    alignItems: "center",
  },
  selectInput: {
    width: "100%",
    height: "56px",
    padding: "0 50px",
    border: "1px solid #E2E8F0",
    borderRadius: "14px",
    fontSize: "16px",
    background: "#ffffff",
    color: "#64748B",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
    fontFamily: "'Outfit', sans-serif",
    fontWeight: "400",
    lineHeight: "24px",
    gap: "14px",
    alignItems: "center",
    cursor: "pointer",
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
    background: "#2563EB",
    color: "#ffffff",
    border: "none",
    borderRadius: "14px",
    height: "56px",
    fontSize: "17px",
    fontWeight: "500",
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

const SignUp = () => {
  const navigate = useNavigate();
  const gradeOptions = [
    { value: "8th Grade", label: "8th Grade" },
    { value: "9th Grade", label: "9th Grade" },
    { value: "10th Grade", label: "10th Grade" },
    { value: "11th Grade", label: "11th Grade" },
    { value: "College", label: "College" },
  ];
  const notif = useNotification();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [grade, setGrade] = useState("9th Grade");
  const [isGradeOpen, setIsGradeOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const selectedGrade = gradeOptions.find((option) => option.value === grade) || gradeOptions[1];

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      notif.error("Please fill in all required fields.");
      return;
    }
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1"}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          school: "TutorFlow Academy",
          grade: grade,
          learning_goals: ["Build strong fundamentals"],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.requires_email_confirmation || !data.access_token) {
          setLoading(false);
          notif.info("Account created! Please check your email to confirm your account, then log in.");
          navigate("/login", {
            state: { notice: "Account created! Please check your email to confirm your account, then log in." },
          });
          return;
        }
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("user", JSON.stringify(data.user));
        notif.success("Account created successfully!");
        navigate("/dashboard");
      } else {
        const errData = await response.json().catch(() => ({}));
        const msg = errData.detail || "Sign up failed. Please check your information.";
        notif.error(msg);
      }
    } catch (err) {
      notif.error(err.message || "Unable to create your account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
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
          border: 2px solid #7ca1f1 !important;
        }
        
        .google-btn:hover {
          background-color: #f8fafc !important;
          border-color: #cbd5e1 !important;
        }

        .grade-trigger {
          width: 100%;
          height: 56px;
          padding: 0 46px 0 50px;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          background: #ffffff;
          color: #64748B;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-sizing: border-box;
          font-family: 'Outfit', sans-serif;
          font-size: 16px;
          font-weight: 400;
          line-height: 24px;
          cursor: pointer;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .grade-trigger.open,
        .grade-trigger:focus {
          border: 2px solid #7ca1f1;
          outline: none;
        }

        .grade-value {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .grade-chevron {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
          pointer-events: none;
          transition: transform 0.2s;
        }

        .grade-chevron.open {
          transform: translateY(-50%) rotate(180deg);
        }

        .grade-menu {
          position: absolute;
          left: 0;
          right: 0;
          top: calc(100% + 8px);
          z-index: 20;
          padding: 8px;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          background: #ffffff;
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
        }

        .grade-option {
          width: 100%;
          min-height: 52px;
          padding: 8px 12px;
          border: 0;
          border-radius: 12px;
          background: transparent;
          color: #334155;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          cursor: pointer;
          font-family: 'Outfit', sans-serif;
          text-align: left;
          transition: background 0.15s, color 0.15s;
        }

        .grade-option:hover,
        .grade-option.active {
          background: #eef4ff;
          color: #2563EB;
        }

        .grade-option-main {
          display: block;
          font-size: 15px;
          font-weight: 600;
          line-height: 20px;
        }

        .grade-option-sub {
          display: none;
        }

        .grade-option.active .grade-option-sub,
        .grade-option:hover .grade-option-sub {
          color: #1d4ed8;
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

          <h1 style={S.h1}>Create Account</h1>
          <p style={S.subtitle}>Start your personalized AI learning journey.</p>



          <form onSubmit={handleSignUp} style={S.form}>
            {/* Full Name */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={S.label}>Full Name</label>
              <div style={S.inputWrap}>
                <span style={S.inputIcon}>
                  <User size={20} color="#64748B" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={S.input}
                  className="custom-input"
                  onFocus={(e) => (e.target.style.borderColor = "#1a56db")}
                  onBlur={(e) => (e.target.style.borderColor = "#cbd5e1")}
                />
              </div>
            </div>

            {/* Email */}
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

            {/* Password */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={S.label}>Password</label>
              <div style={S.inputWrap}>
                <span style={S.inputIcon}>
                  <Lock size={20} color="#64748B" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Create secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={S.input}
                  className="custom-input"
                  onFocus={(e) => (e.target.style.borderColor = "#1a56db")}
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

            {/* Grade Level */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={S.label}>Grade / Level</label>
              <div style={S.inputWrap}>
                <span style={S.inputIcon}>
                  <BookOpen size={20} color="#64748B" />
                </span>
                <button
                  type="button"
                  className={`grade-trigger${isGradeOpen ? " open" : ""}`}
                  aria-haspopup="listbox"
                  aria-expanded={isGradeOpen}
                  onClick={() => setIsGradeOpen((open) => !open)}
                  onBlur={() => window.setTimeout(() => setIsGradeOpen(false), 120)}
                >
                  <span className="grade-value">
                    {selectedGrade.label}
                  </span>
                </button>
                <ChevronDown
                  size={18}
                  className={`grade-chevron${isGradeOpen ? " open" : ""}`}
                  aria-hidden="true"
                />
                {isGradeOpen && (
                  <div className="grade-menu" role="listbox" aria-label="Grade / Level">
                    {gradeOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        role="option"
                        aria-selected={grade === option.value}
                        className={`grade-option${grade === option.value ? " active" : ""}`}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setGrade(option.value);
                          setIsGradeOpen(false);
                        }}
                      >
                        <span>
                          <span className="grade-option-main">{option.label}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={S.submitBtn}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#1e40af")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#1a56db")
              }
            >
              {loading ? "Creating Account…" : "Create Account"}
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
            onClick={handleGoogleSignUp}
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
            Sign up with Google
          </button>
        </div>

        {/* Footer */}
        <p style={S.footer}>
          Already have an account?{" "}
          <Link to="/login" style={S.footerLink}>
            Log in
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

export default SignUp;
