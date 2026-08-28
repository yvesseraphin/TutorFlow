import React, { useState, useEffect, useRef } from "react";
import { BookOpen, ClipboardList, MessageSquare } from "lucide-react";

const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    icon: BookOpen,
    title: "New lesson available",
    desc: "Math: Quadratic Equations is now available.",
    time: "2m ago",
    unread: true,
  },
  {
    id: 2,
    icon: ClipboardList,
    title: "Assignment due tomorrow",
    desc: '"Algebra Practice Set 3" is due tomorrow at 11:59 PM.',
    time: "1h ago",
    unread: true,
  },
  {
    id: 3,
    icon: MessageSquare,
    title: "New message",
    desc: "Your teacher replied to your question.",
    time: "3h ago",
    unread: true,
  },
];

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

  /* Triangle Pointer directly pointing to the bell button center */
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
    font-size: 14.5px;
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
  }

  .notif-item {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 16px 6px;
    border-bottom: 1px solid #f5f5f5;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .notif-item:last-child {
    border-bottom: 0;
    padding-bottom: 4px;
  }

  .notif-item:hover {
    background: #fafafa;
  }

  .notif-icon-box {
    width: 50px;
    height: 50px;
    border-radius: 14px;
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
    font-size: 16px;
    font-weight: 700;
    color: #111111;
    margin: 0 0 5px;
    line-height: 1.3;
  }

  .notif-desc {
    font-size: 14.5px;
    color: #555555;
    margin: 0 0 6px;
    line-height: 22px;
    word-break: break-word;
  }

  .notif-time {
    font-size: 13.5px;
    color: #888888;
    margin: 0;
  }

  .notif-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #111111;
    flex-shrink: 0;
    margin-top: 8px;
    margin-left: 8px;
    align-self: center;
  }
`;

export const NotificationDropdown = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const containerRef = useRef(null);

  const unreadCount = notifications.filter((n) => n.unread).length;

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
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const handleItemClick = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
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
            {notifications.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="notif-item"
                  onClick={() => handleItemClick(item.id)}
                >
                  <div className="notif-icon-box">
                    <Icon size={22} strokeWidth={2} />
                  </div>
                  <div className="notif-content">
                    <h4 className="notif-title">{item.title}</h4>
                    <p className="notif-desc">{item.desc}</p>
                    <span className="notif-time">{item.time}</span>
                  </div>
                  {item.unread && <div className="notif-dot" />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
