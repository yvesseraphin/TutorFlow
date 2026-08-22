import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";

/* ─── Context ─── */
const NotifContext = createContext(null);

/* Auto-dismiss durations (ms). 0 = sticky until closed. */
const DURATION = {
  error:   7000,
  success: 4500,
  warning: 5500,
  info:    5500,
};

/* ─── Provider ─── */
export const NotificationProvider = ({ children }) => {
  const [notif, setNotif] = useState(null);   // { type, message, id }
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  const dismiss = useCallback(() => {
    setVisible(false);
    setTimeout(() => setNotif(null), 260);
  }, []);

  const notify = useCallback((type, message) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    setNotif({ type, message, id: Date.now() });
    setVisible(true);

    const duration = DURATION[type] ?? 5500;
    if (duration > 0) {
      timerRef.current = setTimeout(dismiss, duration);
    }
  }, [dismiss]);

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

/* ─── Banner UI (Compact, iconless, centered, attached border, top-to-bottom slide) ─── */
const Banner = ({ notif, visible, onDismiss }) => {
  if (!notif) return null;

  const bgColors = {
    error:   "#0f172a",
    success: "#0f172a",
    warning: "#0f172a",
    info:    "#0f172a",
  };

  const borders = {
    error:   "1px solid #ef4444",
    success: "1px solid #22c55e",
    warning: "1px solid #f59e0b",
    info:    "1px solid #3b82f6",
  };

  const textColors = {
    error:   "#fca5a5",
    success: "#86efac",
    warning: "#fde047",
    info:    "#93c5fd",
  };

  return (
    <>
      <style>{`
        @keyframes tf-banner-slide-in  { from { transform: translateY(-100%); } to { transform: translateY(0); } }
        @keyframes tf-banner-slide-out { from { transform: translateY(0); } to { transform: translateY(-100%); } }
        .tf-banner-wrap {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          width: 100%;
          z-index: 999999;
          animation: tf-banner-slide-in 0.25s ease-out forwards;
        }
        .tf-banner-wrap.leaving {
          animation: tf-banner-slide-out 0.22s ease-in forwards;
        }
      `}</style>

      <div
        className={`tf-banner-wrap${visible ? "" : " leaving"}`}
        role="alert"
        aria-live="assertive"
        onClick={onDismiss}
        title="Click to dismiss"
        style={{ cursor: "pointer" }}
      >
        <div
          style={{
            width: "100%",
            background: bgColors[notif.type] || "#0f172a",
            color: textColors[notif.type] || "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "8px 16px",
            minHeight: "36px",
            fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
            fontSize: "13.5px",
            fontWeight: 600,
            letterSpacing: "-0.01em",
            textAlign: "center",
            boxShadow: "none",
            borderRadius: 0,
            borderTop: "none",
            borderLeft: "none",
            borderRight: "none",
            borderBottom: borders[notif.type] || "1px solid rgba(255, 255, 255, 0.15)",
            boxSizing: "border-box",
          }}
        >
          <span style={{ lineHeight: "1.3", wordBreak: "break-word" }}>
            {notif.message}
          </span>
        </div>
      </div>
    </>
  );
};

