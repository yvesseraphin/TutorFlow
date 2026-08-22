import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { X, AlertCircle, CheckCircle, AlertTriangle, Info } from "lucide-react";

/* ─── Context ─── */
const NotifContext = createContext(null);

const ICONS = {
  error:   AlertCircle,
  success: CheckCircle,
  warning: AlertTriangle,
  info:    Info,
};

/* Auto-dismiss durations (ms). 0 = sticky until closed. */
const DURATION = {
  error:   8000,    // error messages stay 8s or until dismissed
  success: 5000,
  warning: 6000,
  info:    6000,
};

/* ─── Provider ─── */
export const NotificationProvider = ({ children }) => {
  const [notif, setNotif] = useState(null);   // { type, message, id }
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  const dismiss = useCallback(() => {
    setVisible(false);
    // Remove from DOM after slide-out animation (~280ms)
    setTimeout(() => setNotif(null), 300);
  }, []);

  const notify = useCallback((type, message) => {
    // Clear any running auto-dismiss timer
    if (timerRef.current) clearTimeout(timerRef.current);

    setNotif({ type, message, id: Date.now() });
    setVisible(true);

    const duration = DURATION[type] ?? 6000;
    if (duration > 0) {
      timerRef.current = setTimeout(dismiss, duration);
    }
  }, [dismiss]);

  // Convenience shortcuts
  const error   = useCallback((msg) => notify("error",   msg), [notify]);
  const success = useCallback((msg) => notify("success", msg), [notify]);
  const warning = useCallback((msg) => notify("warning", msg), [notify]);
  const info    = useCallback((msg) => notify("info",    msg), [notify]);

  useEffect(() => () => timerRef.current && clearTimeout(timerRef.current), []);

  return (
    <NotifContext.Provider value={{ notify, error, success, warning, info, dismiss }}>
      {children}
      <Banner notif={notif} visible={visible} onDismiss={dismiss} />
    </NotifContext.Provider>
  );
};

/* ─── Hook ─── */
export const useNotification = () => {
  const ctx = useContext(NotifContext);
  if (!ctx) throw new Error("useNotification must be used inside <NotificationProvider>");
  return ctx;
};

/* ─── Banner UI (Top full-width banner with black background and white text) ─── */
const Banner = ({ notif, visible, onDismiss }) => {
  if (!notif) return null;

  const Icon = ICONS[notif.type] || Info;

  const accent = {
    error:   "#f87171",   // subtle red accent for error icon
    success: "#4ade80",   // subtle green accent for success icon
    warning: "#fbbf24",   // subtle amber accent for warning icon
    info:    "#60a5fa",   // subtle blue accent for info icon
  }[notif.type] || "#ffffff";

  return (
    <>
      <style>{`
        @keyframes tf-banner-in  { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes tf-banner-out { from { transform: translateY(0);    opacity: 1; } to { transform: translateY(-100%); opacity: 0; } }
        .tf-banner-wrap {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          width: 100vw;
          z-index: 999999;
          animation: tf-banner-in 0.28s cubic-bezier(0.4,0,0.2,1) forwards;
        }
        .tf-banner-wrap.leaving {
          animation: tf-banner-out 0.28s cubic-bezier(0.4,0,0.2,1) forwards;
        }
      `}</style>

      <div className={`tf-banner-wrap${visible ? "" : " leaving"}`} role="alert" aria-live="assertive">
        <div
          style={{
            width: "100%",
            background: "#000000",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 28px",
            minHeight: "54px",
            fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
            fontSize: "15px",
            fontWeight: 500,
            letterSpacing: "-0.01em",
            boxShadow: "0 6px 28px rgba(0, 0, 0, 0.45)",
            boxSizing: "border-box",
          }}
        >
          {/* Left: icon + message */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1, minWidth: 0 }}>
            <Icon size={20} color={accent} style={{ flexShrink: 0 }} />
            <span style={{ color: "#ffffff", lineHeight: "22px", fontWeight: 500, wordBreak: "break-word" }}>
              {notif.message}
            </span>
          </div>

          {/* Right: dismiss button */}
          <button
            onClick={onDismiss}
            aria-label="Dismiss notification"
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              padding: "6px",
              display: "flex",
              alignItems: "center",
              marginLeft: "16px",
              flexShrink: 0,
              borderRadius: "6px",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#ffffff";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#94a3b8";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </>
  );
};
