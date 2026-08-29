import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  ClipboardList,
  Sparkles,
  Activity,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  BellOff
} from "lucide-react";
import { api } from "../lib/api";

const styles = `
  .notif-dropdown-wrapper {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .notif-trigger-badge {
    position: absolute;
    top: 2px;
    right: 2px;
    min-width: 19px;
    height: 19px;
    padding: 0 4px;
    border-radius: 999px;
    background: #111111;
    color: #ffffff;
    font-size: 11px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    border: 2px solid #ffffff;
    box-sizing: border-box;
    line-height: 1;
    z-index: 2;
  }

  .notif-menu-card {
    position: absolute;
    top: calc(100% + 14px);
    right: -175px;
    width: 410px;
    max-width: calc(100vw - 32px);
    background: #ffffff;
    border: 1px solid #e8e8e8;
    border-radius: 16px;
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.04);
    z-index: 1000;
    padding: 22px 24px;
    font-family: "Outfit", sans-serif;
    animation: notifFadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .notif-menu-card::before {
    content: "";
    position: absolute;
    top: -7px;
    right: 189px;
    width: 14px;
    height: 14px;
    background: #ffffff;
    border-left: 1px solid #e8e8e8;
    border-top: 1px solid #e8e8e8;
    transform: rotate(45deg);
  }

  @keyframes notifFadeIn {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .notif-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 16px;
    border-bottom: 1px solid #f0f0f0;
  }

  .notif-header h3 {
    margin: 0;
    font-size: 19px;
    font-weight: 700;
    color: #111111;
    letter-spacing: -0.01em;
  }

  .notif-mark-all-btn {
    border: 0;
    background: transparent;
    font-family: "Outfit", sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: #444444;
    cursor: pointer;
    padding: 0;
    transition: color 0.15s ease;
  }

  .notif-mark-all-btn:hover {
    color: #111111;
    text-decoration: underline;
  }

  .notif-list {
    display: flex;
    flex-direction: column;
    padding-top: 4px;
    max-height: 380px;
    overflow-y: auto;
  }

  .notif-item {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 14px 8px;
    border-bottom: 1px solid #f5f5f5;
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .notif-item:last-child {
    border-bottom: 0;
  }

  .notif-item:hover {
    background: #fafafa;
  }

  .notif-icon-box {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: #f8f8f8;
    border: 1px solid #ededed;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #111111;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .notif-content {
    flex: 1;
    min-width: 0;
  }

  .notif-title {
    font-size: 15px;
    font-weight: 700;
    color: #111111;
    margin: 0 0 4px;
    line-height: 1.3;
  }

  .notif-desc {
    font-size: 13.5px;
    color: #555555;
    margin: 0 0 4px;
    line-height: 20px;
    word-break: break-word;
  }

  .notif-time {
    font-size: 12px;
    color: #888888;
    margin: 0;
  }

  .notif-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #111111;
    flex-shrink: 0;
    margin-top: 8px;
    margin-left: 6px;
    align-self: center;
  }

  .notif-empty {
    padding: 32px 16px;
    text-align: center;
    color: #888888;
  }
`;

function formatRelativeTime(dateString) {
  if (!dateString) return "Just now";
  try {
    const d = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now - d) / 1000);
    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    return `${diffDays}d ago`;
  } catch {
    return "Recently";
  }
}

function getIconForType(type) {
  switch (type) {
    case "flashcard":
      return RotateCcw;
    case "retention":
      return AlertTriangle;
    case "memory":
      return Sparkles;
    case "session":
      return CheckCircle2;
    case "diagnostic":
      return Activity;
    case "welcome":
    default:
      return BookOpen;
  }
}

export const NotificationDropdown = ({ children }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(() => {
    try {
      const cached = localStorage.getItem("tutorflow_cached_notifications");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [readIds, setReadIds] = useState(() => {
    try {
      const stored = localStorage.getItem("tutorflow_read_notifications");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const containerRef = useRef(null);

  // Fetch real dynamic notifications
  useEffect(() => {
    async function loadNotifications() {
      try {
        const res = await api("/analytics/notifications");
        if (res?.notifications) {
          setNotifications(res.notifications);
          localStorage.setItem("tutorflow_cached_notifications", JSON.stringify(res.notifications));
        }
      } catch (err) {
        console.error("Failed to load notifications:", err);
      }
    }

    loadNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAllRead = () => {
    const allIds = notifications.map((n) => n.id);
    const updated = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(updated);
    try {
      localStorage.setItem("tutorflow_read_notifications", JSON.stringify(updated));
    } catch { /* ignore */ }
  };

  const handleItemClick = (item) => {
    if (!readIds.includes(item.id)) {
      const updated = [...readIds, item.id];
      setReadIds(updated);
      try {
        localStorage.setItem("tutorflow_read_notifications", JSON.stringify(updated));
      } catch { /* ignore */ }
    }
    if (item.action_url) {
      setIsOpen(false);
      navigate(item.action_url);
    }
  };

  return (
    <div className="notif-dropdown-wrapper" ref={containerRef}>
      <style>{styles}</style>
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        style={{ position: "relative", display: "inline-flex", cursor: "pointer" }}
      >
        {children}
        {unreadCount > 0 && (
          <span className="notif-trigger-badge">{unreadCount}</span>
        )}
      </div>

      {isOpen && (
        <div className="notif-menu-card">
          <div className="notif-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                className="notif-mark-all-btn"
                onClick={handleMarkAllRead}
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">
                <BellOff size={32} strokeWidth={1.5} style={{ marginBottom: "8px", opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: "14px", fontWeight: "600" }}>No notifications yet</p>
                <p style={{ margin: "4px 0 0", fontSize: "12.5px" }}>
                  Your AI teacher will notify you here about reviews & milestones.
                </p>
              </div>
            ) : (
              notifications.map((item) => {
                const Icon = getIconForType(item.type);
                const isUnread = !readIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className="notif-item"
                    onClick={() => handleItemClick(item)}
                  >
                    <div className="notif-icon-box">
                      <Icon size={20} strokeWidth={2} />
                    </div>
                    <div className="notif-content">
                      <h4 className="notif-title">{item.title}</h4>
                      <p className="notif-desc">{item.desc}</p>
                      <span className="notif-time">{formatRelativeTime(item.created_at)}</span>
                    </div>
                    {isUnread && <div className="notif-dot" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
