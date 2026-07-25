import React from "react";
import {
  ArrowRight,
  Award,
  Bell,
  BookOpen,
  Flame,
  Medal,
  Star,
  Target,
  Trophy,
  User,
} from "lucide-react";

const timelineItems = [
  { type: "Lesson Completed", title: "Linear Equations", date: "May 22, 2025", icon: BookOpen },
  { type: "Skill Mastered", title: "Solving for x", date: "May 20, 2025", icon: BookOpen },
  { type: "Lesson Completed", title: "One-Step Equations", date: "May 18, 2025", icon: Trophy },
  { type: "Joined Live Class", title: "Algebra • Module 3", date: "May 16, 2025", icon: Award },
  { type: "Lesson Completed", title: "Variables and Expressions", date: "May 14, 2025", icon: BookOpen },
];

const achievements = [
  { title: "First Steps", desc: "Complete 5 lessons", icon: Star },
  { title: "On Track", desc: "Complete 10 lessons", icon: Target },
  { title: "Dedicated Learner", desc: "Study 5 days in a row", icon: BookOpen },
  { title: "Problem Solver", desc: "Master 3 skills", icon: Medal },
  { title: "Consistent", desc: "Study 7 days in a row", icon: Flame },
  { title: "Rising Star", desc: "Complete 20 lessons", icon: Trophy },
];

const styles = `
  .progress-page {
    min-height: 100vh;
    padding: 30px 38px 36px;
    background: #ffffff;
    color: #00145f;
    font-family: "Outfit", sans-serif;
    max-width: 1400px;
    margin: 0 auto;
  }

  .progress-header {
    min-height: 138px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 32px;
    padding: 18px 0;
    margin-bottom: 0;
  }

  .progress-title {
    margin: 0;
    color: #020b3d;
    font-size: 39px;
    font-weight: 700;
    line-height: 48px;
    letter-spacing: -0.02em;
  }

  .progress-subtitle {
    margin: 9px 0 0;
    color: #001a6d;
    font-size: 18px;
    line-height: 28px;
  }

  .progress-actions {
    display: flex;
    align-items: center;
    gap: 24px;
    padding-top: 2px;
  }

  .progress-bell,
  .progress-avatar {
    border: 0;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .progress-bell {
    position: relative;
    width: 48px;
    height: 48px;
    background: #ffffff;
    color: #001a6d;
  }

  .progress-bell::after {
    content: "";
    position: absolute;
    right: 8px;
    top: 7px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #0054ff;
    box-shadow: 0 0 0 3px #ffffff;
  }

  .progress-avatar {
    width: 56px;
    height: 56px;
    background: #eef4ff;
    color: #0054ff;
  }

  .progress-grid-top,
  .progress-grid-main {
    display: grid;
    grid-template-columns: minmax(0, 1.16fr) minmax(0, 1fr);
    gap: 18px;
    margin-bottom: 16px;
  }

  .progress-card {
    border: 1px solid #cfe0ff;
    border-radius: 9px;
    background: #ffffff;
    box-shadow: 0 6px 20px rgba(15, 23, 42, 0.025);
  }

  .progress-card-title {
    margin: 0;
    color: #020b3d;
    font-size: 16px;
    font-weight: 700;
    line-height: 22px;
  }

  .level-card,
  .lessons-card {
    min-height: 338px;
    padding: 22px;
  }

  .level-body {
    height: calc(100% - 30px);
    display: grid;
    grid-template-columns: minmax(240px, 1fr) minmax(280px, 322px);
    gap: 16px;
    align-items: end;
  }

  .level-main {
    min-height: 258px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  .level-ring {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background:
      radial-gradient(circle, #ffffff 57%, transparent 58%),
      conic-gradient(#0054ff 0 68%, #e8eef8 68% 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #0054ff;
    margin-bottom: 12px;
  }

  .level-ring-inner {
    width: 82px;
    height: 82px;
    border-radius: 50%;
    background: #eef4ff;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .level-name {
    margin: 0 0 7px;
    color: #0054ff;
    font-size: 24px;
    font-weight: 700;
    line-height: 30px;
  }

  .muted-text {
    color: #163385;
    font-size: 14px;
    line-height: 21px;
  }

  .progress-track {
    height: 7px;
    border-radius: 999px;
    background: #edf2fb;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    border-radius: inherit;
    background: #0054ff;
  }

  .level-progress {
    width: min(250px, 100%);
    margin: 17px 0 8px;
  }

  .mini-card {
    min-height: 178px;
    padding: 20px 20px 18px;
    align-self: end;
  }

  .mini-stat {
    display: flex;
    align-items: center;
    gap: 20px;
    margin: 16px 0 12px;
  }

  .circle-icon {
    width: 62px;
    height: 62px;
    border-radius: 50%;
    background: #eef4ff;
    color: #0054ff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
  }

  .stat-number {
    display: block;
    color: #0054ff;
    font-size: 42px;
    font-weight: 700;
    line-height: 42px;
  }

  .link-button,
  .outline-button {
    font-family: "Outfit", sans-serif;
    color: #0054ff;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }

  .link-button {
    border: 0;
    background: transparent;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0;
  }

  .lessons-card {
    display: flex;
    flex-direction: column;
  }

  .lessons-stat {
    display: flex;
    align-items: center;
    gap: 28px;
    margin: 34px 0 30px 6px;
  }

  .lessons-number {
    color: #0054ff;
    font-size: 44px;
    font-weight: 700;
    line-height: 48px;
  }

  .lessons-progress {
    width: 76%;
    margin-left: 124px;
  }

  .timeline-card,
  .achievements-card {
    min-height: 394px;
    padding: 21px 22px 10px;
    display: flex;
    flex-direction: column;
  }

  .timeline-list {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 18px;
    padding: 0 26px 0 72px;
  }

  .timeline-list::before {
    content: "";
    position: absolute;
    left: 16px;
    top: 10px;
    bottom: 10px;
    width: 3px;
    border-radius: 99px;
    background: #0054ff;
  }

  .timeline-row {
    min-height: 46px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }

  .timeline-node {
    position: absolute;
    left: -72px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 3px solid #0054ff;
    background: #ffffff;
    z-index: 2;
  }

  .timeline-icon {
    position: absolute;
    left: -40px;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: #eef4ff;
    color: #0054ff;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .timeline-type {
    display: block;
    color: #0054ff;
    font-size: 14px;
    font-weight: 700;
    line-height: 19px;
  }

  .timeline-title,
  .timeline-date {
    color: #001a6d;
    font-size: 14px;
    line-height: 19px;
  }

  .timeline-date {
    white-space: nowrap;
  }

  .achievements-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    row-gap: 20px;
    column-gap: 24px;
    margin-top: 19px;
  }

  .achievement {
    text-align: center;
  }

  .achievement-icon {
    width: 86px;
    height: 86px;
    margin: 0 auto 8px;
    border-radius: 50%;
    border: 1.5px solid #cfe0ff;
    color: #0054ff;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .achievement h3 {
    margin: 0 0 4px;
    color: #020b3d;
    font-size: 14px;
    font-weight: 700;
    line-height: 19px;
  }

  .achievement span {
    color: #163385;
    font-size: 13px;
    line-height: 18px;
  }

  .outline-button {
    width: 100%;
    height: 34px;
    margin-top: auto;
    border: 1px solid #cfe0ff;
    border-radius: 6px;
    background: #ffffff;
  }

  @media (max-width: 1320px) {
    .progress-page {
      padding: 24px;
    }

    .progress-header {
      padding-left: 0;
    }

    .progress-grid-top,
    .progress-grid-main {
      grid-template-columns: 1fr;
    }

    .level-body {
      grid-template-columns: 1fr;
    }

    .lessons-progress {
      width: 100%;
      margin-left: 0;
    }
  }

  @media (max-width: 760px) {
    .progress-page {
      padding: 18px;
    }

    .progress-header {
      flex-direction: column;
    }

    .progress-header {
      min-height: auto;
      gap: 20px;
    }

    .progress-title {
      font-size: 30px;
      line-height: 38px;
    }

    .achievements-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
`;

const ProgressDashboard = () => (
  <main className="progress-page">
    <style>{styles}</style>

    <header className="progress-header">
      <div>
        <h1 className="progress-title">My Progress</h1>
        <p className="progress-subtitle">Track your learning journey and celebrate your growth.</p>
      </div>
      <div className="progress-actions">
        <button className="progress-bell" type="button" aria-label="Notifications">
          <Bell size={28} strokeWidth={1.8} />
        </button>
        <button className="progress-avatar" type="button" aria-label="Profile">
          <User size={32} fill="currentColor" strokeWidth={0} />
        </button>
      </div>
    </header>

    <section className="progress-grid-top">
      <article className="progress-card level-card">
        <h2 className="progress-card-title">Current Level</h2>
        <div className="level-body">
          <div className="level-main">
            <div className="level-ring">
              <div className="level-ring-inner">
                <Award size={48} />
              </div>
            </div>
            <h3 className="level-name">Intermediate</h3>
            <p className="muted-text">You're doing great!</p>
            <div className="progress-track level-progress">
              <div className="progress-fill" style={{ width: "68%" }} />
            </div>
            <span className="muted-text">68% to Advanced</span>
          </div>

          <div className="progress-card mini-card">
            <h3 className="progress-card-title">Skills Mastered</h3>
            <div className="mini-stat">
              <span className="circle-icon">
                <Trophy size={30} />
              </span>
              <div>
                <span className="stat-number">8</span>
                <span className="muted-text">Keep it up!</span>
              </div>
            </div>
            <button className="link-button" type="button">
              View all skills <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </article>

      <article className="progress-card lessons-card">
        <h2 className="progress-card-title">Completed Lessons</h2>
        <div className="lessons-stat">
          <span className="circle-icon" style={{ width: 88, height: 88 }}>
            <BookOpen size={44} />
          </span>
          <div>
            <div className="lessons-number">23</div>
            <span className="muted-text">of 36 Lessons</span>
          </div>
        </div>
        <div className="lessons-progress">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: "64%" }} />
          </div>
          <p className="muted-text" style={{ marginTop: 14 }}>13 lessons remaining</p>
        </div>
      </article>
    </section>

    <section className="progress-grid-main">
      <article className="progress-card timeline-card">
        <h2 className="progress-card-title">Learning Timeline</h2>
        <div className="timeline-list">
          {timelineItems.map((item) => {
            const Icon = item.icon;
            return (
              <div className="timeline-row" key={`${item.type}-${item.date}`}>
                <span className="timeline-node" />
                <span className="timeline-icon">
                  <Icon size={20} />
                </span>
                <div>
                  <span className="timeline-type">{item.type}</span>
                  <span className="timeline-title">{item.title}</span>
                </div>
                <span className="timeline-date">{item.date}</span>
              </div>
            );
          })}
        </div>
        <button className="outline-button" type="button">View full timeline</button>
      </article>

      <article className="progress-card achievements-card">
        <h2 className="progress-card-title">Achievements</h2>
        <div className="achievements-grid">
          {achievements.map((badge) => {
            const Icon = badge.icon;
            return (
              <div className="achievement" key={badge.title}>
                <div className="achievement-icon">
                  <Icon size={38} />
                </div>
                <h3>{badge.title}</h3>
                <span>{badge.desc}</span>
              </div>
            );
          })}
        </div>
        <button className="outline-button" type="button">View all achievements</button>
      </article>
    </section>

  </main>
);

export default ProgressDashboard;
