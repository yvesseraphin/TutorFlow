import React from "react";
import {
  BarChart3,
  Bell,
  BookOpen,
  Briefcase,
  Check,
  ChevronDown,
  ClipboardList,
  Edit3,
  Globe2,
  ShieldCheck,
  SlidersHorizontal,
  Smile,
  Target,
  Trophy,
  User,
} from "lucide-react";

const goals = [
  {
    title: "Improve my math skills",
    subtitle: "Get better at solving equations and problems",
    icon: BarChart3,
  },
  {
    title: "Score 90% or higher",
    subtitle: "Achieve 90% or higher in assessments",
    icon: Trophy,
  },
  {
    title: "Build strong fundamentals",
    subtitle: "Strengthen my basics for advanced topics",
    icon: BookOpen,
  },
];

const preferences = [
  { label: "Preferred Learning Style", value: "Visual", icon: User },
  { label: "Difficulty Level", value: "Medium", icon: BarChart3 },
  { label: "Lesson Duration", value: "45 minutes", icon: Bell },
  { label: "Language", value: "English", icon: Globe2 },
  { label: "AI Tutor Personality", value: "Friendly & Supportive", icon: Smile },
];

const notifications = [
  {
    title: "Lesson Reminders",
    subtitle: "Get reminded about upcoming lessons",
    icon: Bell,
  },
  {
    title: "Homework Reminders",
    subtitle: "Get reminded about homework deadlines",
    icon: ClipboardList,
  },
  {
    title: "AI Feedback & Tips",
    subtitle: "Receive helpful tips and feedback from AI",
    icon: ShieldCheck,
  },
  {
    title: "Product Updates",
    subtitle: "Stay updated with new features and improvements",
    icon: Briefcase,
  },
];

const styles = `
  .profile-page {
    min-height: 100vh;
    max-width: 1400px;
    margin: 0 auto;
    padding: 30px 38px 36px;
    background: #ffffff;
    color: #020b3d;
    font-family: "Outfit", sans-serif;
  }

  .profile-header {
    min-height: 82px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 32px;
  }

  .profile-title {
    margin: 0;
    color: #020b3d;
    font-size: 39px;
    font-weight: 700;
    line-height: 48px;
    letter-spacing: -0.02em;
  }

  .profile-subtitle {
    margin: 7px 0 0;
    color: #001a6d;
    font-size: 15px;
    line-height: 22px;
  }

  .profile-actions {
    display: flex;
    align-items: center;
    gap: 24px;
    padding-top: 2px;
  }

  .profile-bell,
  .profile-avatar-top {
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: #0054ff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .profile-bell {
    position: relative;
    width: 48px;
    height: 48px;
  }

  .profile-bell::after {
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

  .profile-avatar-top {
    width: 56px;
    height: 56px;
    background: #eef4ff;
  }

  .profile-card {
    border: 1px solid #cfe0ff;
    border-radius: 9px;
    background: #ffffff;
    box-shadow: 0 6px 20px rgba(15, 23, 42, 0.025);
  }

  .profile-identity {
    min-height: 176px;
    padding: 26px 58px;
    display: grid;
    grid-template-columns: 140px minmax(0, 1fr) minmax(260px, 0.75fr);
    align-items: center;
    gap: 42px;
    margin-bottom: 18px;
  }

  .profile-photo-wrap {
    position: relative;
    width: 126px;
    height: 126px;
  }

  .profile-photo {
    width: 126px;
    height: 126px;
    border-radius: 50%;
    background:
      radial-gradient(circle at 50% 35%, #0054ff 0 18px, transparent 19px),
      radial-gradient(ellipse at 50% 78%, #0054ff 0 43px, transparent 44px),
      #e8eef8;
  }

  .profile-edit-photo {
    position: absolute;
    right: 0;
    bottom: 10px;
    width: 36px;
    height: 36px;
    border: 1px solid #dbe7fb;
    border-radius: 50%;
    background: #ffffff;
    color: #0054ff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .profile-label {
    display: block;
    margin-bottom: 9px;
    color: #001a6d;
    font-size: 13px;
    line-height: 18px;
  }

  .profile-name,
  .profile-grade {
    margin: 0;
    color: #020b3d;
    font-size: 29px;
    font-weight: 700;
    line-height: 36px;
    letter-spacing: -0.02em;
    display: inline-flex;
    align-items: center;
    gap: 16px;
  }

  .profile-email {
    margin: 8px 0 0;
    color: #001a6d;
    font-size: 15px;
    line-height: 22px;
  }

  .profile-edit-inline {
    border: 0;
    background: transparent;
    color: #0054ff;
    display: inline-flex;
    cursor: pointer;
  }

  .profile-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.14fr);
    gap: 18px;
    margin-bottom: 18px;
  }

  .settings-panel {
    min-height: 312px;
    padding: 22px 26px 24px;
  }

  .panel-heading {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 22px;
  }

  .panel-icon {
    width: 34px;
    height: 34px;
    color: #0054ff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
  }

  .panel-title {
    margin: 0 0 5px;
    color: #020b3d;
    font-size: 18px;
    font-weight: 700;
    line-height: 24px;
  }

  .panel-subtitle {
    margin: 0;
    color: #163385;
    font-size: 14px;
    line-height: 20px;
  }

  .goal-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .goal-row {
    min-height: 62px;
    padding: 10px 20px 10px 12px;
    border: 1px solid #dbe7fb;
    border-radius: 8px;
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr) 26px;
    align-items: center;
    gap: 14px;
  }

  .goal-icon,
  .notification-icon,
  .preference-icon {
    border-radius: 8px;
    background: #f4f8ff;
    color: #0054ff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .goal-icon {
    width: 44px;
    height: 44px;
  }

  .goal-title,
  .notification-title {
    margin: 0 0 4px;
    color: #020b3d;
    font-size: 14px;
    font-weight: 700;
    line-height: 19px;
  }

  .goal-subtitle,
  .notification-subtitle {
    margin: 0;
    color: #163385;
    font-size: 13px;
    line-height: 18px;
  }

  .goal-check {
    width: 21px;
    height: 21px;
    border-radius: 50%;
    background: #0054ff;
    color: #ffffff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .add-goal {
    height: 36px;
    border: 1px solid #dbe7fb;
    border-radius: 6px;
    background: #ffffff;
    color: #0054ff;
    font-family: "Outfit", sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }

  .preference-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .preference-row {
    display: grid;
    grid-template-columns: 40px minmax(180px, 1fr) minmax(220px, 254px);
    align-items: center;
    gap: 12px;
  }

  .preference-icon,
  .notification-icon {
    width: 36px;
    height: 36px;
  }

  .preference-label {
    color: #020b3d;
    font-size: 14px;
    font-weight: 600;
  }

  .preference-select {
    height: 36px;
    padding: 0 12px;
    border: 1px solid #dbe7fb;
    border-radius: 6px;
    color: #001a6d;
    font-size: 13px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .notifications-panel {
    min-height: 284px;
    padding: 22px 26px 24px;
  }

  .notification-row {
    min-height: 56px;
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr) 46px;
    align-items: center;
    gap: 14px;
    border-bottom: 1px solid #e7eefb;
  }

  .notification-row:last-child {
    border-bottom: 0;
  }

  .toggle {
    width: 36px;
    height: 20px;
    border: 0;
    border-radius: 999px;
    background: #0054ff;
    justify-self: end;
    padding: 2px;
    display: flex;
    justify-content: flex-end;
    cursor: pointer;
  }

  .toggle span {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #ffffff;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.14);
  }

  @media (max-width: 1180px) {
    .profile-page {
      padding: 24px;
    }

    .profile-identity,
    .profile-grid {
      grid-template-columns: 1fr;
    }

    .profile-identity {
      padding: 26px;
      gap: 24px;
    }
  }

  @media (max-width: 760px) {
    .profile-page {
      padding: 18px;
    }

    .profile-header {
      flex-direction: column;
      min-height: auto;
    }

    .profile-title {
      font-size: 32px;
      line-height: 40px;
    }

    .preference-row,
    .notification-row,
    .goal-row {
      grid-template-columns: 1fr;
    }

    .toggle {
      justify-self: start;
    }
  }
`;

const Profile = () => (
  <main className="profile-page">
    <style>{styles}</style>

    <header className="profile-header">
      <div>
        <h1 className="profile-title">Profile</h1>
        <p className="profile-subtitle">
          Manage your account and personalize your learning experience.
        </p>
      </div>
      <div className="profile-actions">
        <button className="profile-bell" type="button" aria-label="Notifications">
          <Bell size={30} strokeWidth={1.75} />
        </button>
        <button className="profile-avatar-top" type="button" aria-label="Profile">
          <User size={35} fill="currentColor" strokeWidth={0} />
        </button>
      </div>
    </header>

    <section className="profile-card profile-identity">
      <div className="profile-photo-wrap">
        <div className="profile-photo" aria-hidden="true" />
        <button className="profile-edit-photo" type="button" aria-label="Edit profile photo">
          <Edit3 size={17} />
        </button>
      </div>

      <div>
        <span className="profile-label">Name</span>
        <h2 className="profile-name">
          Yvan Santos
          <button className="profile-edit-inline" type="button" aria-label="Edit name">
            <Edit3 size={18} />
          </button>
        </h2>
        <span className="profile-label" style={{ marginTop: 12 }}>Email</span>
        <p className="profile-email">yvan.santos@example.com</p>
      </div>

      <div>
        <span className="profile-label">Grade</span>
        <h2 className="profile-grade">
          10th Grade
          <button className="profile-edit-inline" type="button" aria-label="Edit grade">
            <Edit3 size={18} />
          </button>
        </h2>
      </div>
    </section>

    <section className="profile-grid">
      <article className="profile-card settings-panel">
        <div className="panel-heading">
          <span className="panel-icon">
            <Target size={29} />
          </span>
          <div>
            <h2 className="panel-title">Goals</h2>
            <p className="panel-subtitle">What do you want to achieve?</p>
          </div>
        </div>

        <div className="goal-list">
          {goals.map((goal) => {
            const Icon = goal.icon;
            return (
              <div className="goal-row" key={goal.title}>
                <span className="goal-icon">
                  <Icon size={25} />
                </span>
                <div>
                  <h3 className="goal-title">{goal.title}</h3>
                  <p className="goal-subtitle">{goal.subtitle}</p>
                </div>
                <span className="goal-check">
                  <Check size={14} strokeWidth={3} />
                </span>
              </div>
            );
          })}
          <button type="button" className="add-goal">+ Add New Goal</button>
        </div>
      </article>

      <article className="profile-card settings-panel">
        <div className="panel-heading">
          <span className="panel-icon">
            <SlidersHorizontal size={29} />
          </span>
          <div>
            <h2 className="panel-title">Study Preferences</h2>
            <p className="panel-subtitle">Customize your learning experience</p>
          </div>
        </div>

        <div className="preference-list">
          {preferences.map((preference) => {
            const Icon = preference.icon;
            return (
              <div className="preference-row" key={preference.label}>
                <span className="preference-icon">
                  <Icon size={20} />
                </span>
                <span className="preference-label">{preference.label}</span>
                <div className="preference-select">
                  <span>{preference.value}</span>
                  <ChevronDown size={16} />
                </div>
              </div>
            );
          })}
        </div>
      </article>
    </section>

    <section className="profile-card notifications-panel">
      <div className="panel-heading" style={{ marginBottom: 14 }}>
        <span className="panel-icon">
          <Bell size={29} />
        </span>
        <div>
          <h2 className="panel-title">Notifications</h2>
          <p className="panel-subtitle">Manage how you receive updates</p>
        </div>
      </div>

      {notifications.map((item) => {
        const Icon = item.icon;
        return (
          <div className="notification-row" key={item.title}>
            <span className="notification-icon">
              <Icon size={20} />
            </span>
            <div>
              <h3 className="notification-title">{item.title}</h3>
              <p className="notification-subtitle">{item.subtitle}</p>
            </div>
            <button type="button" className="toggle" aria-label={`${item.title} enabled`}>
              <span />
            </button>
          </div>
        );
      })}
    </section>
  </main>
);

export default Profile;
