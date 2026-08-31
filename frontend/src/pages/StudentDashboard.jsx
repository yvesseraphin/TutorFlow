import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  Calendar,
  Flame,
  Play,
  Target,
  TrendingUp,
  Brain,
  Sparkles,
  AlertTriangle,
  Activity,
} from "lucide-react";
import { api } from "../lib/api";
import NotificationDropdown from "../components/NotificationDropdown";
import DiagnosticModal from "../components/DiagnosticModal";

const styles = `
  .tf-dashboard-wrapper {
    min-height: 100vh;
    background: #ffffff;
    padding: 32px 40px 48px;
    font-family: "Outfit", sans-serif;
    color: #111111;
  }

  .tf-dashboard-container {
    max-width: 1260px;
    margin: 0 auto;
  }

  /* ── Header ── */
  .tf-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 32px;
  }

  .tf-welcome-title {
    margin: 0;
    font-size: 34px;
    font-weight: 700;
    line-height: 1.2;
    color: #111111;
    letter-spacing: -0.02em;
  }

  .tf-welcome-subtitle {
    margin: 6px 0 0;
    font-size: 18px;
    font-weight: 400;
    color: #666666;
    line-height: 26px;
  }

  .tf-header-actions {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .tf-bell-btn {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: none;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #111111;
    transition: background 0.2s ease;
  }

  .tf-bell-btn:hover {
    background: #f5f5f5;
  }

  .tf-user-avatar {
    width: 46px;
    height: 46px;
    border-radius: 50%;
    background: #111111;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 600;
    cursor: pointer;
    user-select: none;
  }

  /* ── AI Teacher Hero Card ── */
  .tf-hero-card {
    background: #ffffff;
    border: 1px solid #f0f0f0;
    border-radius: 20px;
    padding: 36px 48px;
    box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 36px;
    margin-bottom: 28px;
    overflow: hidden;
  }

  .tf-hero-copy {
    flex: 1;
    max-width: 540px;
  }

  .tf-hero-kicker {
    font-size: 16px;
    font-weight: 600;
    color: #666666;
    margin: 0 0 8px;
    letter-spacing: 0.02em;
  }

  .tf-hero-heading {
    font-size: 34px;
    font-weight: 700;
    color: #111111;
    line-height: 1.25;
    letter-spacing: -0.02em;
    margin: 0 0 10px;
  }

  .tf-hero-desc {
    font-size: 18px;
    font-weight: 400;
    color: #666666;
    margin: 0 0 24px;
    line-height: 1.5;
  }

  .tf-primary-btn {
    height: 52px;
    padding: 0 28px;
    border-radius: 12px;
    background: #0a0a0a;
    color: #ffffff;
    font-family: "Outfit", sans-serif;
    font-size: 17px;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 12px;
    border: none;
    cursor: pointer;
    transition: background 0.2s ease, transform 0.2s ease;
  }

  .tf-primary-btn:hover {
    background: #222222;
    transform: translateY(-1px);
  }

  .tf-play-pill-icon {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #ffffff;
    color: #0a0a0a;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  /* ── Whiteboard Illustration ── */
  .tf-whiteboard-card {
    width: 440px;
    height: 260px;
    max-width: 48%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .tf-whiteboard-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    transform: scale(1.15);
    filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.09));
  }

  /* ── Statistics Grid (5 Columns) ── */
  .tf-stats-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  }

  .tf-stat-card {
    background: #ffffff;
    border: 1px solid #f0f0f0;
    border-radius: 16px;
    padding: 24px 22px;
    min-height: 230px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02);
    transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
    cursor: pointer;
    box-sizing: border-box;
  }

  .tf-stat-card:hover {
    border-color: #e5e5e5;
    transform: translateY(-2px);
    box-shadow: 0 8px 24px -2px rgba(0, 0, 0, 0.06);
  }

  .tf-stat-icon-wrap {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #111111;
  }

  .tf-stat-value {
    font-size: 34px;
    font-weight: 700;
    color: #111111;
    margin: 20px 0 0;
    line-height: 1;
    letter-spacing: -0.02em;
  }

  .tf-stat-title {
    font-size: 18px;
    font-weight: 600;
    color: #222222;
    margin: 6px 0 0;
    line-height: 24px;
  }

  .tf-stat-desc {
    font-size: 15px;
    font-weight: 400;
    color: #777777;
    margin: 4px 0 0;
    line-height: 20px;
  }

  .tf-stat-arrow {
    display: inline-flex;
    align-items: center;
    color: #111111;
    margin-top: 18px;
  }

  /* ── Recent Sessions Section ── */
  .tf-recent-section {
    background: #ffffff;
    border: 1px solid #f0f0f0;
    border-radius: 18px;
    padding: 28px 32px;
    min-height: 320px;
    box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02);
  }

  .tf-recent-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
  }

  .tf-recent-title {
    margin: 0;
    font-size: 24px;
    font-weight: 700;
    color: #111111;
    letter-spacing: -0.02em;
  }

  .tf-view-all-btn {
    font-family: "Outfit", sans-serif;
    font-size: 16px;
    font-weight: 600;
    color: #222222;
    background: transparent;
    border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: opacity 0.18s ease;
  }

  .tf-view-all-btn:hover {
    opacity: 0.75;
    text-decoration: underline;
  }

  /* ── Empty State ── */
  .tf-empty-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 36px 0 20px;
    text-align: center;
  }

  .tf-empty-icon-circle {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: #f7f7f8;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    overflow: hidden;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
  }

  .tf-empty-title {
    font-size: 22px;
    font-weight: 700;
    color: #222222;
    margin: 0 0 6px;
  }

  .tf-empty-desc {
    font-size: 17px;
    font-weight: 400;
    color: #777777;
    margin: 0 0 20px;
  }

  .tf-empty-btn {
    height: 50px;
    padding: 0 26px;
    border-radius: 10px;
    background: #0a0a0a;
    color: #ffffff;
    font-family: "Outfit", sans-serif;
    font-size: 17px;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .tf-empty-btn:hover {
    background: #222222;
  }

  /* ── Session Cards (When populated) ── */
  .tf-sessions-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 16px;
  }

  .tf-session-card {
    background: #ffffff;
    border: 1px solid #e8e8e8;
    border-radius: 14px;
    padding: 18px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: border-color 0.2s ease;
  }

  .tf-session-card:hover {
    border-color: #dadada;
  }

  .tf-session-name {
    font-size: 18px;
    font-weight: 600;
    color: #111111;
    margin: 0 0 4px;
  }

  .tf-session-date {
    font-size: 15px;
    color: #777777;
    margin: 0;
  }

  /* ── Responsive ── */
  @media (max-width: 1200px) {
    .tf-stats-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  @media (max-width: 900px) {
    .tf-dashboard-wrapper {
      padding: 24px 20px;
    }
    .tf-hero-card {
      flex-direction: column;
      align-items: flex-start;
      padding: 24px;
    }
    .tf-whiteboard-card {
      width: 100%;
    }
    .tf-stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 600px) {
    .tf-stats-grid {
      grid-template-columns: 1fr;
    }
  }
`;

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [analytics, setAnalytics] = useState(() => {
    try {
      const cached = localStorage.getItem("tutorflow_cached_analytics");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(() => {
    return !localStorage.getItem("tutorflow_cached_analytics");
  });
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);

  useEffect(() => {
    Promise.all([
      api("/analytics/dashboard"),
      api("/auth/me"),
    ])
      .then(([analyticsData, meData]) => {
        if (analyticsData) {
          setAnalytics(analyticsData);
          localStorage.setItem("tutorflow_cached_analytics", JSON.stringify(analyticsData));
        }
        if (meData) {
          setUser(meData);
          localStorage.setItem("user", JSON.stringify(meData));
        }
      })
      .catch(() => { /* non-fatal */ })
      .finally(() => setLoading(false));
  }, []);

  const fullName = user?.full_name || user?.profile?.full_name || user?.email?.split("@")[0] || "";
  const firstName = fullName ? fullName.split(" ")[0] : "";
  const userInitial = firstName ? firstName[0].toUpperCase() : (user?.email ? user.email[0].toUpperCase() : "S");

  const overallMastery = analytics ? Math.round((analytics.overall_mastery || 0) * 100) : 0;
  const accuracy = analytics ? Math.round((analytics.accuracy || 0) * 100) : 0;
  const streak = analytics?.streak_days ?? analytics?.current_streak ?? 0;
  const sessionsCompleted = analytics?.completed_sessions ?? analytics?.sessions_completed ?? 0;
  const nextLessonTitle = analytics?.next_recommended_lesson || "Linear Equations (One-Step)";
  const teacherGreeting = analytics?.ai_teacher_greeting || "I'm your AI Teacher, ready to guide you step-by-step through your mathematics journey.";
  const retentionRisks = analytics?.retention_risk_topics || [];

  const quickCards = [
    {
      icon: Target,
      value: `${analytics?.mastered_count || 0}/${analytics?.total_topics || 10}`,
      title: "Topics Mastered",
      desc: "Knowledge graph status",
    },
    {
      icon: TrendingUp,
      value: `${overallMastery}%`,
      title: "Overall Mastery",
      desc: "Across all skills",
    },
    {
      icon: CheckCircle2,
      value: `${accuracy}%`,
      title: "Accuracy",
      desc: "Problem solving accuracy",
    },
    {
      icon: Flame,
      value: `${streak}`,
      title: "Daily Streak",
      desc: "Consecutive days active",
    },
    {
      icon: Calendar,
      value: `${sessionsCompleted}`,
      title: "Sessions Done",
      desc: "Lessons completed",
    },
  ];

  const recentSessions = analytics?.recent_sessions || [];

  return (
    <main className="tf-dashboard-wrapper">
      <style>{styles}</style>

      <div className="tf-dashboard-container">
        {/* ── Top Header ── */}
        <header className="tf-header">
          <div>
            <h1 className="tf-welcome-title">Hello{firstName ? `, ${firstName}` : ""}!</h1>
            <p className="tf-welcome-subtitle">Your AI Personal Teacher is active and tracking your progress.</p>
          </div>

          <div className="tf-header-actions">
            {!loading && analytics && !analytics.has_completed_diagnostic && (
              <button
                type="button"
                onClick={() => setShowDiagnosticModal(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 18px",
                  borderRadius: "12px",
                  background: "#111111",
                  border: "1px solid #111111",
                  color: "#ffffff",
                  fontWeight: "600",
                  fontSize: "14px",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#222222")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#111111")}
              >
                <Activity size={18} />
                AI Diagnostic
              </button>
            )}

            <NotificationDropdown>
              <button type="button" className="tf-bell-btn" aria-label="Notifications">
                <Bell size={22} strokeWidth={2} />
              </button>
            </NotificationDropdown>
            <div
              className="tf-user-avatar"
              onClick={() => navigate("/profile")}
              title="View Profile"
            >
              {userInitial}
            </div>
          </div>
        </header>

        {/* ── Spaced Repetition Retention Black Bar ── */}
        {retentionRisks.length > 0 && (
          <div
            style={{
              background: "#000000",
              color: "#ffffff",
              borderRadius: "14px",
              padding: "14px 22px",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
              fontFamily: "'Outfit', sans-serif",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <AlertTriangle size={18} color="#ffffff" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff" }}>
                Spaced Repetition Review Due:
              </span>
              <span style={{ fontSize: "14px", color: "#e5e5e5", fontWeight: 400 }}>
                {retentionRisks.map((r, idx) => (
                  <span key={r.topic}>
                    {idx > 0 && ", "}
                    <span
                      onClick={() => navigate(`/classroom?topic=${encodeURIComponent(r.topic)}`)}
                      style={{
                        textDecoration: "underline",
                        textUnderlineOffset: "3px",
                        cursor: "pointer",
                        color: "#ffffff",
                        fontWeight: 500,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.75")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                      title={`Review ${r.topic}`}
                    >
                      {r.topic}
                    </span>
                  </span>
                ))}
              </span>
            </div>
            <span
              onClick={() => navigate(`/classroom?topic=${encodeURIComponent(retentionRisks[0].topic)}`)}
              style={{
                color: "#ffffff",
                fontSize: "13.5px",
                fontWeight: 700,
                textDecoration: "underline",
                textUnderlineOffset: "3px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                transition: "opacity 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.75")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Quick 2-Min Review &rarr;
            </span>
          </div>
        )}

        {/* ── Tutor AI Hero Card ── */}
        <section className="tf-hero-card" aria-label="Tutor AI">
          <div className="tf-hero-copy">
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
              <Sparkles size={16} color="#111111" />
              <p className="tf-hero-kicker" style={{ margin: 0 }}>AI Teacher Insights</p>
            </div>
            <h2 className="tf-hero-heading">{nextLessonTitle}</h2>
            <p className="tf-hero-desc">{teacherGreeting}</p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <button
                className="tf-primary-btn"
                type="button"
                onClick={() => navigate(`/classroom?topic=${encodeURIComponent(nextLessonTitle)}`)}
              >
                <span className="tf-play-pill-icon">
                  <Play size={10} fill="currentColor" strokeWidth={0} />
                </span>
                Start Lesson with AI Teacher
              </button>
            </div>
          </div>

          <div className="tf-whiteboard-card" aria-hidden="true">
            <img src="/whiteboard.webp" alt="Whiteboard preview" className="tf-whiteboard-img" />
          </div>
        </section>

        {/* ── Statistics Cards (5 Columns) ── */}
        <section className="tf-stats-grid" aria-label="Learning Statistics">
          {quickCards.map((card) => {
            const Icon = card.icon;
            return (
              <article
                className="tf-stat-card"
                key={card.title}
                onClick={() => navigate("/classroom")}
              >
                <div>
                  <div className="tf-stat-icon-wrap">
                    <Icon size={22} strokeWidth={2} />
                  </div>
                  <div className="tf-stat-value">{card.value}</div>
                  <h3 className="tf-stat-title">{card.title}</h3>
                  <p className="tf-stat-desc">{card.desc}</p>
                </div>
                <div className="tf-stat-arrow">
                  <ArrowRight size={18} strokeWidth={2} />
                </div>
              </article>
            );
          })}
        </section>

        {/* ── Recent Sessions Section ── */}
        <section className="tf-recent-section" aria-label="Recent Sessions">
          <div className="tf-recent-header">
            <h2 className="tf-recent-title">Recent Sessions</h2>
            <button
              type="button"
              className="tf-view-all-btn"
              onClick={() => navigate("/classroom")}
            >
              View all lessons <ArrowRight size={16} strokeWidth={2} />
            </button>
          </div>

          {recentSessions.length === 0 ? (
            <div className="tf-empty-wrap">
              <div className="tf-empty-icon-circle">
                <img
                  src="/book.webp"
                  alt="Book illustration"
                  style={{ width: "96px", height: "96px", objectFit: "contain", transform: "scale(1.1)" }}
                />
              </div>
              <h3 className="tf-empty-title">No sessions yet</h3>
              <p className="tf-empty-desc">Start your first lesson to see it here!</p>
              <button
                type="button"
                className="tf-empty-btn"
                onClick={() => navigate("/classroom")}
              >
                Start Learning
              </button>
            </div>
          ) : (
            <div className="tf-sessions-list">
              {recentSessions.map((session) => (
                <div
                  className="tf-session-card"
                  key={session.id}
                  onClick={() => navigate("/classroom")}
                  style={{ cursor: "pointer" }}
                >
                  <div>
                    <h3 className="tf-session-name">{session.topic}</h3>
                    <p className="tf-session-date">
                      {new Date(session.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <ArrowRight size={18} color="#111111" />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <DiagnosticModal
        isOpen={showDiagnosticModal}
        onClose={() => setShowDiagnosticModal(false)}
        onComplete={() => {
          setAnalytics(prev => ({ ...prev, has_completed_diagnostic: true }));
          api("/analytics/dashboard").then(data => setAnalytics(data)).catch(() => {});
        }}
      />
    </main>
  );
};

export default StudentDashboard;
