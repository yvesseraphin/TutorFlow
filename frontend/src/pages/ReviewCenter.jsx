import React, { useState } from "react";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  FileText,
  MinusCircle,
  Sparkles,
  User,
  XCircle,
} from "lucide-react";

const assignments = [
  {
    id: 1,
    title: "Linear Equations - Practice Set 1",
    module: "Algebra · Module 3",
    due: "May 28, 2025 - 11:59 PM",
    status: "Pending",
    selected: true,
  },
  {
    id: 2,
    title: "One-Step Equations Worksheet",
    module: "Algebra · Module 3",
    due: "May 26, 2025 - 11:59 PM",
    status: "Completed",
  },
  {
    id: 3,
    title: "Word Problems - Linear Equations",
    module: "Algebra · Module 3",
    due: "May 30, 2025 - 11:59 PM",
    status: "Pending",
  },
  {
    id: 4,
    title: "Variables and Expressions",
    module: "Algebra · Module 2",
    due: "May 24, 2025 - 11:59 PM",
    status: "Completed",
  },
  {
    id: 5,
    title: "Equations Mixed Review",
    module: "Algebra · Module 3",
    due: "June 2, 2025 - 11:59 PM",
    status: "Pending",
  },
];

const mistakes = [
  {
    number: 1,
    prompt: "Solve for x:",
    equation: "2x + 3 = 11",
    answer: "x = 3",
    correct: "x = 4",
  },
  {
    number: 2,
    prompt: "Solve for x:",
    equation: "3x - 5 = 10",
    answer: "x = 4",
    correct: "x = 5",
  },
];

const styles = `
  .homework-page {
    min-height: 100vh;
    padding: 30px 38px 36px;
    max-width: 1400px;
    margin: 0 auto;
    background: #ffffff;
    color: #020b3d;
    font-family: "Outfit", sans-serif;
  }

  .homework-header {
    min-height: 112px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 32px;
    padding: 18px 0;
  }

  .homework-title {
    margin: 0;
    color: #020b3d;
    font-size: 39px;
    font-weight: 700;
    line-height: 48px;
    letter-spacing: -0.02em;
  }

  .homework-subtitle {
    margin: 7px 0 0;
    color: #001a6d;
    font-size: 16px;
    line-height: 24px;
  }

  .homework-actions {
    display: flex;
    align-items: center;
    gap: 24px;
    padding-top: 2px;
  }

  .homework-bell,
  .homework-avatar {
    border: 0;
    border-radius: 50%;
    background: #ffffff;
    color: #0054ff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 8px 22px rgba(15, 23, 42, 0.04);
  }

  .homework-bell {
    width: 48px;
    height: 48px;
    position: relative;
  }

  .homework-bell::after {
    content: "";
    position: absolute;
    right: 9px;
    top: 8px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #0054ff;
    box-shadow: 0 0 0 3px #ffffff;
  }

  .homework-avatar {
    width: 56px;
    height: 56px;
    background: #eef4ff;
  }

  .homework-tabs {
    display: flex;
    gap: 38px;
    margin: 0 -38px 14px;
    padding: 0 38px;
    border-top: 1px solid #e8eef8;
    border-bottom: 1px solid #e8eef8;
  }

  .homework-tab {
    height: 54px;
    padding: 0 8px;
    border: 0;
    border-bottom: 3px solid transparent;
    background: transparent;
    color: #001a6d;
    font-family: "Outfit", sans-serif;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
  }

  .homework-tab.active {
    color: #0054ff;
    border-bottom-color: #0054ff;
    font-weight: 700;
  }

  .homework-grid {
    display: grid;
    grid-template-columns: minmax(390px, 486px) minmax(0, 1fr);
    gap: 16px;
    align-items: stretch;
  }

  .homework-card {
    background: #ffffff;
    border: 1px solid #cfe0ff;
    border-radius: 9px;
    box-shadow: 0 6px 20px rgba(15, 23, 42, 0.025);
  }

  .assignment-panel {
    padding: 16px;
  }

  .subject-select {
    width: min(204px, 100%);
    height: 40px;
    margin-bottom: 16px;
    padding: 0 14px;
    border: 1px solid #d7e4fb;
    border-radius: 7px;
    background: #ffffff;
    color: #1d356c;
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    font-family: "Outfit", sans-serif;
    font-size: 14px;
    font-weight: 500;
  }

  .assignment-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .assignment-item {
    min-height: 104px;
    padding: 18px;
    border: 1px solid #dbe7fb;
    border-radius: 9px;
    background: #ffffff;
    display: grid;
    grid-template-columns: 64px minmax(0, 1fr) auto;
    align-items: center;
    gap: 18px;
    cursor: pointer;
    transition: border-color 0.18s ease, box-shadow 0.18s ease;
  }

  .assignment-item:hover {
    box-shadow: 0 10px 30px rgba(37, 99, 235, 0.06);
  }

  .assignment-item.selected {
    border: 2px solid #0054ff;
    padding: 17px;
    box-shadow: 0 12px 28px rgba(0, 84, 255, 0.08);
  }

  .assignment-icon,
  .banner-icon {
    width: 64px;
    height: 64px;
    border-radius: 10px;
    background: #eef4ff;
    color: #0054ff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .assignment-name {
    margin: 0 0 7px;
    color: #020b3d;
    font-size: 16px;
    font-weight: 700;
    line-height: 21px;
  }

  .assignment-meta,
  .assignment-due,
  .detail-subtitle,
  .mistake-meta {
    color: #163385;
    font-size: 13px;
    line-height: 20px;
  }

  .assignment-due {
    margin-top: 10px;
  }

  .status-badge {
    min-width: 66px;
    height: 28px;
    padding: 0 12px;
    border: 1px solid #9bbcff;
    border-radius: 6px;
    background: #f7fbff;
    color: #0054ff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
  }

  .status-badge.completed {
    border-color: #cdeedb;
    background: #f0fbf5;
    color: #14ae5c;
  }

  .outline-button,
  .retry-button {
    height: 38px;
    border: 1px solid #cfe0ff;
    border-radius: 6px;
    background: #ffffff;
    color: #0054ff;
    font-family: "Outfit", sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease;
  }

  .outline-button {
    width: 100%;
    margin-top: 16px;
  }

  .detail-panel {
    padding: 26px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .detail-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 24px;
  }

  .detail-title {
    margin: 0;
    color: #020b3d;
    font-size: 18px;
    font-weight: 700;
    line-height: 24px;
  }

  .detail-due {
    color: #163385;
    font-size: 14px;
    line-height: 22px;
    white-space: nowrap;
  }

  .primary-button {
    height: 38px;
    margin-top: 12px;
    padding: 0 28px;
    border: 0;
    border-radius: 6px;
    background: #0054ff;
    color: #ffffff;
    font-family: "Outfit", sans-serif;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 10px 22px rgba(0, 84, 255, 0.16);
    transition: background 0.18s ease, transform 0.18s ease;
  }

  .primary-button:hover,
  .study-button:hover {
    background: #1d4ed8;
    transform: translateY(-1px);
  }

  .feedback-box,
  .mistakes-card {
    border: 1px solid #dbe7fb;
    border-radius: 9px;
    background: #ffffff;
  }

  .feedback-box {
    padding: 18px;
  }

  .section-heading {
    margin: 0;
    color: #020b3d;
    font-size: 16px;
    font-weight: 700;
    line-height: 22px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .feedback-content {
    min-height: 116px;
    margin-top: 16px;
    padding: 20px;
    border: 1px solid #dbe7fb;
    border-radius: 8px;
    background: linear-gradient(135deg, #f8faff, #eef4ff);
    display: flex;
    align-items: center;
    gap: 26px;
  }

  .score-ring {
    width: 92px;
    height: 92px;
    border-radius: 50%;
    background:
      radial-gradient(circle, #f8faff 56%, transparent 57%),
      conic-gradient(#0054ff 0 78%, #dbe7fb 78% 100%);
    color: #0054ff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    font-weight: 700;
    flex: 0 0 auto;
  }

  .feedback-title {
    margin: 0 0 6px;
    color: #020b3d;
    font-size: 18px;
    font-weight: 700;
  }

  .feedback-copy {
    margin: 0;
    color: #001a6d;
    font-size: 14px;
    line-height: 22px;
  }

  .stat-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
  }

  .stat-card {
    min-height: 76px;
    border: 1px solid #dbe7fb;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: #0054ff;
    background: #ffffff;
  }

  .stat-value {
    color: #0054ff;
    font-size: 24px;
    font-weight: 700;
    line-height: 28px;
  }

  .stat-label {
    display: block;
    color: #163385;
    font-size: 12px;
    line-height: 18px;
    text-align: center;
  }

  .mistakes-card {
    padding: 14px 16px 18px;
  }

  .mistakes-title {
    margin: 0 0 10px;
    color: #020b3d;
    font-size: 16px;
    font-weight: 700;
  }

  .mistake-row {
    min-height: 82px;
    padding: 12px 10px;
    border: 1px solid #e3ecfb;
    border-radius: 8px;
    background: #ffffff;
    display: grid;
    grid-template-columns: 34px minmax(0, 1fr) minmax(150px, auto) auto;
    align-items: center;
    gap: 16px;
  }

  .mistake-row + .mistake-row {
    margin-top: 10px;
  }

  .mistake-number {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: #0054ff;
    color: #ffffff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
  }

  .equation {
    margin-top: 9px;
    color: #020b3d;
    font-size: 15px;
    font-weight: 700;
    font-style: italic;
    letter-spacing: 0.03em;
  }

  .answer-pill {
    display: inline-flex;
    margin-bottom: 8px;
    padding: 5px 10px;
    border-radius: 6px;
    background: #eef4ff;
    color: #163385;
    font-size: 13px;
    line-height: 18px;
  }

  .answer-pill strong {
    color: #0054ff;
    margin-left: 5px;
  }

  .retry-button {
    width: 64px;
  }

  .retry-button:hover,
  .outline-button:hover {
    border-color: #0054ff;
    background: #f7fbff;
  }

  .study-banner {
    min-height: 86px;
    margin-top: 24px;
    padding: 18px 26px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }

  .banner-copy {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .banner-title {
    margin: 0 0 5px;
    color: #020b3d;
    font-size: 16px;
    font-weight: 700;
  }

  .banner-text {
    margin: 0;
    color: #163385;
    font-size: 14px;
  }

  .study-button {
    height: 38px;
    padding: 0 32px;
    border: 0;
    border-radius: 6px;
    background: #0054ff;
    color: #ffffff;
    font-family: "Outfit", sans-serif;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 10px 22px rgba(0, 84, 255, 0.16);
    transition: background 0.18s ease, transform 0.18s ease;
  }

  @media (max-width: 1180px) {
    .homework-page {
      padding: 24px;
    }

    .homework-tabs {
      margin-left: -24px;
      margin-right: -24px;
      padding-left: 24px;
      padding-right: 24px;
    }

    .homework-grid {
      grid-template-columns: 1fr;
    }

    .mistake-row {
      grid-template-columns: 34px minmax(0, 1fr) auto;
    }

    .retry-button {
      grid-column: 3;
    }
  }

  @media (max-width: 760px) {
    .homework-page {
      padding: 18px;
    }

    .homework-header,
    .detail-top,
    .study-banner,
    .banner-copy {
      flex-direction: column;
      align-items: flex-start;
    }

    .homework-title {
      font-size: 32px;
      line-height: 40px;
    }

    .homework-tabs {
      margin-left: -18px;
      margin-right: -18px;
      padding-left: 18px;
      padding-right: 18px;
      gap: 18px;
    }

    .assignment-item,
    .mistake-row {
      grid-template-columns: 1fr;
    }

    .stat-grid {
      grid-template-columns: 1fr;
    }

    .detail-due {
      white-space: normal;
    }
  }
`;

const ReviewCenter = () => {
  const [activeTab, setActiveTab] = useState("Assignments");
  const [selectedId, setSelectedId] = useState(1);
  const selected = assignments.find((item) => item.id === selectedId) || assignments[0];

  return (
    <main className="homework-page">
      <style>{styles}</style>

      <header className="homework-header">
        <div>
          <h1 className="homework-title">Homework</h1>
          <p className="homework-subtitle">Practice what you learn and improve every day.</p>
        </div>
        <div className="homework-actions">
          <button className="homework-bell" type="button" aria-label="Notifications">
            <Bell size={30} strokeWidth={1.75} />
          </button>
          <button className="homework-avatar" type="button" aria-label="Profile">
            <User size={35} fill="currentColor" strokeWidth={0} />
          </button>
        </div>
      </header>

      <nav className="homework-tabs" aria-label="Homework sections">
        {["Assignments", "Completed", "Pending"].map((tab) => (
          <button
            key={tab}
            type="button"
            className={`homework-tab${activeTab === tab ? " active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

      <section className="homework-grid">
        <aside className="homework-card assignment-panel">
          <button type="button" className="subject-select">
            All Subjects
            <ChevronDown size={18} />
          </button>

          <div className="assignment-list">
            {assignments.map((assignment) => (
              <article
                key={assignment.id}
                className={`assignment-item${assignment.id === selectedId ? " selected" : ""}`}
                onClick={() => setSelectedId(assignment.id)}
              >
                <div className="assignment-icon">
                  <FileText size={32} />
                </div>
                <div>
                  <h2 className="assignment-name">{assignment.title}</h2>
                  <p className="assignment-meta">{assignment.module}</p>
                  <p className="assignment-due">Due: {assignment.due}</p>
                </div>
                <span className="status-badge">{assignment.status}</span>
              </article>
            ))}
          </div>

          <button type="button" className="outline-button">View all assignments</button>
        </aside>

        <section className="homework-card detail-panel">
          <div className="detail-top">
            <div>
              <h2 className="detail-title">{selected.title}</h2>
              <p className="detail-subtitle" style={{ marginTop: 18 }}>
                Solve the following equations. Show all your steps.
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="detail-due">Due: {selected.due}</div>
              <button type="button" className="primary-button">Start Assignment</button>
            </div>
          </div>

          <article className="feedback-box">
            <h3 className="section-heading">
              <Sparkles size={18} color="#0054ff" />
              AI Feedback (from last attempt)
            </h3>
            <div className="feedback-content">
              <div className="score-ring">78%</div>
              <div>
                <h4 className="feedback-title">Good effort, Yvan!</h4>
                <p className="feedback-copy">
                  You're on the right track. Review the mistakes below and try again.
                </p>
              </div>
            </div>
          </article>

          <div className="stat-grid">
            {[
              { label: "Correct", value: "8", icon: CheckCircle2 },
              { label: "Incorrect", value: "2", icon: XCircle },
              { label: "Skipped", value: "0", icon: MinusCircle },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <article className="stat-card" key={stat.label}>
                  <Icon size={23} />
                  <div>
                    <div className="stat-value">{stat.value}</div>
                    <span className="stat-label">{stat.label}</span>
                  </div>
                </article>
              );
            })}
          </div>

          <article className="mistakes-card">
            <h3 className="mistakes-title">Retry Your Mistakes</h3>
            {mistakes.map((mistake) => (
              <div className="mistake-row" key={mistake.number}>
                <span className="mistake-number">{mistake.number}</span>
                <div>
                  <div className="mistake-meta">{mistake.prompt}</div>
                  <div className="equation">{mistake.equation}</div>
                </div>
                <div>
                  <span className="answer-pill">
                    Your answer:<strong>{mistake.answer}</strong>
                  </span>
                  <div className="mistake-meta">Correct answer: {mistake.correct}</div>
                </div>
                <button type="button" className="retry-button">Retry</button>
              </div>
            ))}
            <button type="button" className="outline-button">Retry all mistakes</button>
          </article>
        </section>
      </section>

      <section className="homework-card study-banner">
        <div className="banner-copy">
          <div className="banner-icon">
            <CalendarDays size={34} />
          </div>
          <div>
            <h2 className="banner-title">Stay consistent!</h2>
            <p className="banner-text">Keep practicing a little every day. You've got this!</p>
          </div>
        </div>
        <button type="button" className="study-button">View Study Plan</button>
      </section>
    </main>
  );
};

export default ReviewCenter;
