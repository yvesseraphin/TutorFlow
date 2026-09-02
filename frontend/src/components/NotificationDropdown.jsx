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
    width: 390px;
    max-width: calc(100vw - 32px);
    background: #ffffff;
    border: 1px solid #e8e8e8;
    border-radius: 12px;
    box-shadow: none;
    z-index: 1000;
    padding: 18px 20px;
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
    gap: 12px;
    padding: 12px 10px;
    border-bottom: 1px solid #f4f4f4;
    border-radius: 8px;
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
    width: 38px;
    height: 38px;
    border-radius: 10px;
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

  .notif-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 3px;
  }

  .notif-title {
    font-size: 14px;
    font-weight: 600;
    color: #111111;
    margin: 0;
    line-height: 1.35;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .notif-time {
    font-size: 11.5px;
    font-weight: 500;
    color: #888888;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .notif-subtitle {
    font-size: 12.5px;
    color: #555555;
    margin: 0;
    line-height: 18px;
    word-break: break-word;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .notif-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #111111;
    flex-shrink: 0;
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
    if (isNaN(d.getTime())) return "Recently";
    const now = new Date();
    const diffSec = Math.floor((now - d) / 1000);
    if (diffSec < 45) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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
  const normalizeNotification = (n) => {
    const title = n.title || "Study Milestone Update";
    const subtitle = n.subtitle || n.desc || n.message || n.summary || "Review your personalized learning insights and progress.";
    return {
      ...n,
      title,
      subtitle,
      desc: subtitle,
    };
  };

  const [notifications, setNotifications] = useState(() => {
    try {
      const cached = localStorage.getItem("tutorflow_cached_notifications");
      if (!cached) return [];
      const parsed = JSON.parse(cached);
      return Array.isArray(parsed) ? parsed.map(normalizeNotification) : [];
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
        let notifs = res?.notifications || [];

        // Also check cached dashboard analytics for any immediate retention risks
        try {
          const cachedAnalytics = localStorage.getItem("tutorflow_cached_analytics");
          if (cachedAnalytics) {
            const parsed = JSON.parse(cachedAnalytics);
            if (parsed?.retention_risk_topics?.length > 0) {
              const existingIds = new Set(notifs.map((n) => n.id));
              parsed.retention_risk_topics.forEach((r) => {
                const id = `retention-${r.topic}`;
                if (!existingIds.has(id)) {
                  const msg = `Quick 2-min review scheduled to retain your ${Math.round((r.mastery || 0.8) * 100)}% mastery.`;
                  notifs.unshift({
                    id,
                    type: "retention",
                    title: `Spaced Repetition Due: ${r.topic}`,
                    subtitle: msg,
                    desc: msg,
                    created_at: new Date().toISOString(),
                    topic: r.topic,
                    action_url: `/classroom?topic=${encodeURIComponent(r.topic)}`,
                  });
                  existingIds.add(id);
                }
              });
            }
          }
        } catch { /* ignore */ }

        if (notifs.length > 0) {
          const normalized = notifs.map(normalizeNotification);
          setNotifications(normalized);
          localStorage.setItem("tutorflow_cached_notifications", JSON.stringify(normalized));
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
                const title = item.title || "Study Update";
                const subtitle = item.subtitle || item.desc || item.message || item.summary || "Review your personalized learning milestones.";
                const timeline = formatRelativeTime(item.created_at || item.time || item.timestamp);

                return (
                  <div
                    key={item.id}
                    className="notif-item"
                    onClick={() => handleItemClick(item)}
                  >
                    <div className="notif-icon-box">
                      <Icon size={18} strokeWidth={2} />
                    </div>
                    <div className="notif-content">
                      <div className="notif-header-row">
                        <h4 className="notif-title">{title}</h4>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                          <span className="notif-time">{timeline}</span>
                          {isUnread && <div className="notif-dot" />}
                        </div>
                      </div>
                      <p className="notif-subtitle">{subtitle}</p>
                    </div>
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
