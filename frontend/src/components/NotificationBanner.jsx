import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { X } from "lucide-react";

/* ─── Context ─── */
const NotifContext = createContext(null);

/* Auto-dismiss duration: 3.5 seconds for a clean, non-intrusive display */
const DURATION = 3500;

/* ─── Provider ─── */
export const NotificationProvider = ({ children }) => {
  const [notif, setNotif] = useState(null);   // { type, message, id }
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  const dismiss = useCallback(() => {
    setVisible(false);
    setTimeout(() => setNotif(null), 250);
  }, []);

  const notify = useCallback((type, message) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    setNotif({ type, message, id: Date.now() });
    setVisible(true);

    timerRef.current = setTimeout(dismiss, DURATION);
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

/* ─── Banner UI (Fully black background & border, white text, X icon, top-to-bottom slide) ─── */
const Banner = ({ notif, visible, onDismiss }) => {
  if (!notif) return null;

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
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            background: "#000000",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "12px 48px 12px 20px",
            minHeight: "46px",
            fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
            fontSize: "14.5px",
            fontWeight: 600,
            letterSpacing: "-0.01em",
            textAlign: "center",
            boxShadow: "none",
            borderRadius: 0,
            borderTop: "none",
            borderLeft: "none",
            borderRight: "none",
            borderBottom: "1px solid #000000",
            boxSizing: "border-box",
          }}
        >
          <span style={{ color: "#ffffff", lineHeight: "1.3", wordBreak: "break-word" }}>
            {notif.message}
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            aria-label="Close notification"
            style={{
              position: "absolute",
              right: "14px",
              background: "transparent",
              border: "none",
              color: "#ffffff",
              opacity: 0.85,
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "4px",
              transition: "opacity 0.15s, background 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.18)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "0.85";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </>
  );
};


