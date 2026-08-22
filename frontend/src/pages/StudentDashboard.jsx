import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Clock3,
  Play,
  RotateCcw,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { api } from "../lib/api";

const styles = `
  .tf-dashboard {
    min-height: 100vh;
    padding: 30px 38px 36px;
    background: #ffffff;
    color: #0f172a;
    font-family: "Outfit", sans-serif;
    max-width: 1400px;
    margin: 0 auto;
  }

  .tf-dashboard-top {
    height: 138px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 18px 0 18px 26px;
  }

  .tf-welcome-small {
    margin: 0 0 5px;
    color: #0f172a;
    font-size: 24px;
    font-weight: 500;
    line-height: 30px;
    letter-spacing: 0;
  }

  .tf-welcome-name {
    margin: 0;
    color: #020b3d;
    font-size: 29px;
    font-weight: 700;
    line-height: 34px;
    letter-spacing: -0.02em;
  }

  .tf-welcome-subtitle {
    margin: 12px 0 0;
    color: #475b8f;
    font-size: 17px;
    font-weight: 400;
    line-height: 24px;
  }

  .tf-hero {
    position: relative;
    min-height: 226px;
    border: 1px solid #cfe0ff;
    border-radius: 17px;
    overflow: hidden;
    background: url("/background_hero.png") center 38% / cover no-repeat;
    box-shadow: 0 20px 50px rgba(37, 99, 235, 0.08);
    display: grid;
    grid-template-columns: 240px 1fr 320px;
    align-items: center;
    padding: 22px 44px 22px 30px;
  }

  .tf-hero-spacer { min-height: 170px; }

  .tf-hero-copy {
    padding-left: 24px;
    transform: translateY(-3px);
  }

  .tf-hero-label {
    margin: 0 0 13px;
    color: #0054ff;
    font-size: 16px;
    font-weight: 700;
  }

  .tf-hero-heading {
    margin: 0 0 22px;
    color: #020b3d;
    font-size: 29px;
    font-weight: 700;
    line-height: 38px;
    letter-spacing: -0.03em;
  }

  .tf-focus-label {
    margin: 0 0 3px;
    color: #4d6091;
    font-size: 17px;
    font-weight: 400;
  }

  .tf-focus-title {
    margin: 0 0 18px;
    color: #0054ff;
    font-size: 31px;
    font-weight: 700;
    line-height: 38px;
    letter-spacing: -0.03em;
  }

  .tf-primary-btn {
    height: 52px;
    display: inline-flex;
    align-items: center;
    gap: 14px;
    padding: 0 25px;
    border: 0;
    border-radius: 10px;
    background: #0054ff;
    color: #ffffff;
    font-family: "Outfit", sans-serif;
    font-size: 18px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 10px 24px rgba(0, 84, 255, 0.22);
    transition: background 0.18s ease, transform 0.18s ease;
  }

  .tf-primary-btn:hover {
    background: #1d4ed8;
    transform: translateY(-1px);
  }

  .tf-play-icon {
    width: 25px;
    height: 25px;
    border-radius: 50%;
    background: #ffffff;
    color: #2563eb;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .tf-board-math {
    position: absolute;
    right: 116px;
    top: 57px;
    z-index: 1;
    width: 236px;
    height: 124px;
    color: #0054ff;
    font-family: "Comic Sans MS", "Bradley Hand ITC", cursive;
    font-weight: 500;
    pointer-events: none;
  }

  .tf-board-line {
    position: absolute;
    font-size: 20px;
    line-height: 1;
    letter-spacing: 0.08em;
  }

  .tf-board-line.first { left: 20px; top: 0; transform: rotate(-1deg); }
  .tf-board-line.second { left: 70px; top: 42px; transform: rotate(1deg); }

  .tf-board-box {
    position: absolute;
    left: 76px;
    top: 73px;
    width: 84px;
    height: 40px;
    border: 2px solid #0054ff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 19px;
    letter-spacing: 0.08em;
    transform: rotate(-1.5deg);
  }

  .tf-quick-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 18px;
    margin-top: 26px;
  }

  .tf-quick-card {
    background: #ffffff;
    border: 1px solid #e3eaf8;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
    min-height: 158px;
    border-radius: 13px;
    padding: 20px 22px;
  }

  .tf-icon-box {
    width: 56px;
    height: 56px;
    border-radius: 9px;
    margin-bottom: 18px;
    background: #eef4ff;
    color: #0054ff;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .tf-card-title {
    margin: 0 0 7px;
    color: #020b3d;
    font-size: 18px;
    font-weight: 700;
    line-height: 24px;
  }

  .tf-card-subtitle {
    margin: 0 0 13px;
    color: #4d6091;
    font-size: 16px;
    font-weight: 400;
    line-height: 20px;
  }

  .tf-card-status {
    color: #0054ff;
    font-size: 16px;
    font-weight: 500;
  }

  .tf-goal-track {
    width: 100%;
    height: 8px;
    overflow: hidden;
    border-radius: 999px;
    background: #eef2fb;
  }

  .tf-section-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 27px 0 15px;
  }

  .tf-section-title {
    margin: 0;
    color: #020b3d;
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  .tf-link-btn {
    border: 0;
    background: transparent;
    color: #0054ff;
    display: inline-flex;
    align-items: center;
    gap: 9px;
    font-family: "Outfit", sans-serif;
    font-size: 17px;
    font-weight: 500;
    cursor: pointer;
  }

  .tf-lesson-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }

  .tf-lesson-card {
    background: #ffffff;
    border: 1px solid #e3eaf8;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
    min-height: 136px;
    border-radius: 11px;
    padding: 19px 18px 17px;
    display: grid;
    grid-template-columns: 48px 1fr 58px;
    grid-template-rows: auto 1fr auto;
    column-gap: 18px;
    align-items: start;
  }

  .tf-lesson-card.active {
    box-shadow: 0 8px 24px rgba(37, 99, 235, 0.06);
  }

  .tf-module-number {
    width: 48px;
    height: 52px;
    border-radius: 8px;
    background: #eef4ff;
    color: #0054ff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    font-weight: 500;
    grid-row: 1 / span 2;
  }

  .tf-lesson-title {
    margin: 5px 0 8px;
    color: #020b3d;
    font-size: 16px;
    font-weight: 600;
    line-height: 20px;
  }

  .tf-module-label {
    margin: 0;
    color: #4d6091;
    font-size: 15px;
    font-weight: 400;
    line-height: 20px;
  }

  .tf-lesson-meta {
    grid-column: 1 / 3;
    align-self: end;
    color: #4d6091;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 400;
  }

  .tf-continue-mini { color: #0054ff; font-weight: 500; }

  .tf-progress-ring {
    width: 58px;
    height: 58px;
    grid-column: 3;
    grid-row: 2 / 4;
    align-self: end;
    justify-self: end;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .tf-progress-ring svg { position: absolute; inset: 0; }

  .tf-progress-ring span { color: #0054ff; font-size: 12px; font-weight: 500; }
  .tf-progress-ring.muted span { color: #6b7a9b; }

  .tf-empty-state {
    padding: 40px 0;
    text-align: center;
    color: #94a3b8;
    font-size: 15px;
  }

  .tf-skeleton {
    background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
    border-radius: 8px;
  }

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  @media (max-width: 1280px) {
    .tf-dashboard { padding: 24px; }
    .tf-hero { grid-template-columns: 160px 1fr 120px; padding-right: 32px; }
    .tf-quick-grid, .tf-lesson-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }

  @media (max-width: 900px) {
    .tf-dashboard-top, .tf-hero { padding-left: 0; }
    .tf-dashboard-top { height: auto; gap: 20px; }
    .tf-hero { grid-template-columns: 1fr; padding: 28px; background-position: right center; }
    .tf-hero-spacer, .tf-board-math { display: none; }
    .tf-quick-grid, .tf-lesson-grid { grid-template-columns: 1fr; }
  }
`;

const ProgressRing = ({ value }) => {
  const radius = 25;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className={`tf-progress-ring${value === 0 ? " muted" : ""}`}>
      <svg width="58" height="58" viewBox="0 0 58 58">
        <circle cx="29" cy="29" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="4" />
        <circle
          cx="29" cy="29" r={radius} fill="none"
          stroke={value === 0 ? "#e2e8f0" : "#0054ff"}
          strokeWidth="4" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          transform="rotate(-90 29 29)"
        />
      </svg>
      <span>{value}%</span>
    </div>
  );
};

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [nextLesson, setNextLesson] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load cached user immediately for fast greeting
    try {
      const stored = localStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    } catch { /* ignore */ }

    Promise.all([
      api("/analytics/dashboard"),
      api("/curriculum/next-lesson?topic=Algebra"),
      api("/auth/me"),
    ])
      .then(([analyticsData, lessonData, meData]) => {
        setAnalytics(analyticsData);
        setNextLesson(lessonData);
        setUser(meData);
        // Keep localStorage fresh
        localStorage.setItem("user", JSON.stringify(meData));
      })
      .catch(() => { /* non-fatal — UI shows whatever loaded */ })
      .finally(() => setLoading(false));
  }, []);

  const fullName = user?.full_name || user?.profile?.full_name || user?.email?.split("@")[0] || "Student";
  const firstName = fullName.split(" ")[0];

  // Build quick-card data from real analytics
  const overallMastery = analytics ? Math.round((analytics.overall_mastery || 0) * 100) : null;
  const accuracy = analytics ? Math.round((analytics.accuracy || 0) * 100) : null;
  const streak = analytics?.current_streak ?? null;
  const sessionsCompleted = analytics?.sessions_completed ?? null;

  const quickCards = [
    {
      icon: BookOpen,
      title: "Today's Focus",
      subtitle: nextLesson ? nextLesson.lesson : "Start a lesson",
      status: nextLesson ? nextLesson.course : "—",
    },
    {
      icon: TrendingUp,
      title: "Overall Mastery",
      subtitle: "Across all skills",
      status: loading ? "—" : overallMastery !== null ? `${overallMastery}%` : "—",
    },
    {
      icon: BarChart3,
      title: "Accuracy",
      subtitle: "Correct answers",
      status: loading ? "—" : accuracy !== null ? `${accuracy}%` : "—",
    },
    {
      icon: Zap,
      title: "Daily Streak",
      subtitle: "Consecutive days",
      status: loading ? "—" : streak !== null ? `${streak} day${streak === 1 ? "" : "s"}` : "—",
    },
    {
      icon: Target,
      title: "Sessions Done",
      subtitle: "Total completed",
      status: "goal",
      value: sessionsCompleted,
    },
  ];

  // Recent sessions as lesson cards
  const recentSessions = analytics?.recent_sessions || [];

  return (
    <main className="tf-dashboard">
      <style>{styles}</style>

      <header className="tf-dashboard-top">
        <div>
          <p className="tf-welcome-small">Welcome back,</p>
          <h1 className="tf-welcome-name">{firstName}!</h1>
          <p className="tf-welcome-subtitle">Your AI Teacher is here to help you learn and grow.</p>
        </div>
      </header>

      {/* Hero */}
      <section className="tf-hero" aria-label="Current lesson">
        <div className="tf-hero-spacer" />
        <div className="tf-hero-copy">
          <p className="tf-hero-label">Your AI Teacher</p>
          <h2 className="tf-hero-heading">I prepared a lesson for you today.</h2>
          <p className="tf-focus-label">Today's focus</p>
          <p className="tf-focus-title">{nextLesson ? nextLesson.lesson : "Start Learning"}</p>
          <button className="tf-primary-btn" type="button" onClick={() => navigate("/classroom")}>
            <span className="tf-play-icon">
              <Play size={13} fill="currentColor" strokeWidth={0} />
            </span>
            Continue Learning
          </button>
        </div>
        <div className="tf-board-math" aria-hidden="true">
          <span className="tf-board-line first">2x + 3 = 11</span>
          <span className="tf-board-line second">2x = 8</span>
          <span className="tf-board-box">x = 4</span>
        </div>
      </section>

      {/* Quick cards */}
      <section className="tf-quick-grid" aria-label="Learning summary">
        {quickCards.map((card) => {
          const Icon = card.icon;
          return (
            <article className="tf-quick-card" key={card.title}>
              <div className="tf-icon-box">
                <Icon size={28} strokeWidth={2.3} />
              </div>
              <h3 className="tf-card-title">{card.title}</h3>
              <p className="tf-card-subtitle">{card.subtitle}</p>
              {card.status === "goal" ? (
                <div>
                  <p className="tf-card-status" style={{ marginBottom: 8 }}>
                    {loading ? "—" : card.value ?? 0} sessions
                  </p>
                  <div className="tf-goal-track" aria-label="Sessions progress">
                    <div
                      className="tf-goal-fill"
                      style={{
                        width: `${Math.min(100, ((card.value ?? 0) / 10) * 100)}%`,
                        height: "100%",
                        borderRadius: "inherit",
                        background: "#0054ff",
                      }}
                    />
                  </div>
                </div>
              ) : (
                <p className="tf-card-status">
                  {loading ? (
                    <span className="tf-skeleton" style={{ display: "inline-block", width: 60, height: 16 }} />
                  ) : (
                    card.status
                  )}
                </p>
              )}
            </article>
          );
        })}
      </section>

      {/* Recent sessions */}
      <section>
        <div className="tf-section-row">
          <h2 className="tf-section-title">Recent Sessions</h2>
          <button type="button" className="tf-link-btn" onClick={() => navigate("/classroom")}>
            View all lessons <ArrowRight size={19} />
          </button>
        </div>

        {loading ? (
          <div className="tf-lesson-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="tf-lesson-card">
                <div className="tf-skeleton" style={{ width: 48, height: 52, gridRow: "1 / span 2" }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div className="tf-skeleton" style={{ height: 16, width: "80%" }} />
                  <div className="tf-skeleton" style={{ height: 12, width: "60%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : recentSessions.length === 0 ? (
          <div className="tf-empty-state">
            <p>No sessions yet. Start your first lesson to see it here!</p>
            <button
              type="button"
              className="tf-primary-btn"
              style={{ marginTop: 16 }}
              onClick={() => navigate("/classroom")}
            >
              Start Learning
            </button>
          </div>
        ) : (
          <div className="tf-lesson-grid">
            {recentSessions.map((session, idx) => {
              const isActive = session.status === "active";
              const skill = analytics?.skill_mastery?.find((s) =>
                s.skill.toLowerCase().includes(session.topic.toLowerCase())
              );
              const progress = skill ? Math.round(skill.mastery * 100) : 0;

              return (
                <article
                  className={`tf-lesson-card${isActive ? " active" : ""}`}
                  key={session.id}
                >
                  <div className="tf-module-number">{idx + 1}</div>
                  <div>
                    <h3 className="tf-lesson-title">{session.topic}</h3>
                    <p className="tf-module-label">
                      {isActive ? "In progress" : "Completed"}
                    </p>
                  </div>
                  <div className="tf-lesson-meta">
                    {isActive ? (
                      <>
                        <Play size={16} fill="#0054ff" strokeWidth={0} />
                        <span className="tf-continue-mini">Continue</span>
                      </>
                    ) : (
                      <>
                        <Clock3 size={16} />
                        <span>{new Date(session.created_at).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                  <ProgressRing value={progress} />
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Skill mastery overview */}
      {!loading && analytics?.skill_mastery && analytics.skill_mastery.length > 0 && (
        <section style={{ marginTop: 32 }}>
          <div className="tf-section-row">
            <h2 className="tf-section-title">Skill Mastery</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
            {analytics.skill_mastery.map((skill) => {
              const pct = Math.round(skill.mastery * 100);
              return (
                <div
                  key={skill.skill}
                  style={{
                    background: "#fff",
                    border: "1px solid #e3eaf8",
                    borderRadius: 11,
                    padding: "16px 18px",
                    boxShadow: "0 4px 12px rgba(15,23,42,0.04)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#020b3d" }}>{skill.skill}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#0054ff" }}>{pct}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 99, background: "#eef2fb", overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", borderRadius: "inherit", background: "#0054ff" }} />
                  </div>
                  <p style={{ margin: "8px 0 0", fontSize: 12, color: "#4d6091" }}>
                    {skill.correct_attempts}/{skill.attempts} correct
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
};

export default StudentDashboard;
