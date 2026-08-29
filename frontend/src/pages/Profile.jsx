import React, { useEffect, useState } from "react";
import {
  Bell,
  Camera,
  Lock,
  Trash2,
  Save,
  Plus,
  X,
  ChevronRight,
} from "lucide-react";
import { api } from "../lib/api";
import { useNotification } from "../components/NotificationBanner";
import NotificationDropdown from "../components/NotificationDropdown";

const styles = `
  .pf-page-wrapper {
    min-height: 100vh;
    background: #ffffff;
    padding: 32px 40px 48px;
    font-family: "Outfit", sans-serif;
    color: #111111;
  }

  .pf-page-container {
    max-width: 1100px;
    margin: 0 auto;
  }

  /* ── Unified Dashboard Header ── */
  .pf-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 32px;
  }

  .pf-welcome-title {
    margin: 0;
    font-size: 34px;
    font-weight: 700;
    line-height: 1.2;
    color: #111111;
    letter-spacing: -0.02em;
  }

  .pf-welcome-subtitle {
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

  /* ── Cards ── */
  .pf-card {
    background: #ffffff;
    border: 1px solid #f0f0f0;
    border-radius: 16px;
    padding: 28px 32px;
    margin-bottom: 24px;
    box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02);
  }

  .pf-card-header {
    margin-bottom: 24px;
  }

  .pf-card-title {
    margin: 0 0 6px;
    font-size: 20px;
    font-weight: 700;
    color: #111111;
    letter-spacing: -0.01em;
  }

  .pf-card-desc {
    margin: 0;
    font-size: 15px;
    color: #666666;
  }

  /* ── Profile Information ── */
  .pf-info-layout {
    display: flex;
    gap: 36px;
    align-items: flex-start;
  }

  .pf-avatar-box {
    position: relative;
    flex-shrink: 0;
  }

  .pf-avatar-circle {
    width: 88px;
    height: 88px;
    border-radius: 50%;
    background: #111111;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    font-weight: 700;
  }

  .pf-avatar-cam-btn {
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #ffffff;
    border: 1px solid #e5e5e5;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #111111;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .pf-avatar-cam-btn:hover {
    background: #f5f5f5;
  }

  .pf-fields-grid {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .pf-field-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .pf-field-group.half-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
  }

  .pf-label {
    font-size: 14px;
    font-weight: 600;
    color: #111111;
  }

  .pf-input {
    width: 100%;
    height: 44px;
    padding: 0 16px;
    border: 1px solid #e5e5e5;
    border-radius: 8px;
    background: #ffffff;
    color: #111111;
    font-family: "Outfit", sans-serif;
    font-size: 15px;
    outline: none;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
    box-sizing: border-box;
  }

  .pf-input:focus {
    border-color: #111111;
    box-shadow: 0 0 0 1px #111111;
  }

  .pf-input:disabled {
    background: #fafafa;
    color: #777777;
    cursor: not-allowed;
  }

  .pf-select {
    width: 100%;
    height: 44px;
    padding: 0 16px;
    border: 1px solid #e5e5e5;
    border-radius: 8px;
    background: #ffffff;
    color: #111111;
    font-family: "Outfit", sans-serif;
    font-size: 15px;
    outline: none;
    cursor: pointer;
    transition: border-color 0.15s ease;
    box-sizing: border-box;
  }

  .pf-select:focus {
    border-color: #111111;
  }

  .pf-textarea {
    width: 100%;
    min-height: 90px;
    padding: 12px 16px;
    border: 1px solid #e5e5e5;
    border-radius: 8px;
    background: #ffffff;
    color: #111111;
    font-family: "Outfit", sans-serif;
    font-size: 15px;
    outline: none;
    resize: vertical;
    transition: border-color 0.15s ease;
    box-sizing: border-box;
  }

  .pf-textarea:focus {
    border-color: #111111;
    box-shadow: 0 0 0 1px #111111;
  }

  .pf-tags-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 4px;
  }

  .pf-tag-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    background: #f5f5f5;
    border: 1px solid #ebebeb;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    color: #111111;
  }

  .pf-tag-remove-btn {
    border: 0;
    background: transparent;
    cursor: pointer;
    padding: 0;
    display: flex;
    color: #666666;
  }

  .pf-tag-remove-btn:hover {
    color: #ef4444;
  }

  .pf-add-goal-btn {
    border: 1px dashed #cccccc;
    background: transparent;
    padding: 6px 14px;
    border-radius: 6px;
    font-family: "Outfit", sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: #555555;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    transition: all 0.15s ease;
  }

  .pf-add-goal-btn:hover {
    border-color: #111111;
    color: #111111;
    background: #fafafa;
  }

  .pf-save-btn-row {
    display: flex;
    justify-content: flex-end;
    margin-top: 10px;
  }

  .pf-save-btn {
    height: 44px;
    padding: 0 28px;
    background: #0a0a0a;
    color: #ffffff;
    border: 0;
    border-radius: 8px;
    font-family: "Outfit", sans-serif;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .pf-save-btn:hover:not(:disabled) {
    background: #222222;
  }

  .pf-save-btn:disabled {
    opacity: 0.6;
    cursor: default;
  }

  /* ── Account Section ── */
  .pf-account-rows {
    display: flex;
    flex-direction: column;
  }

  .pf-action-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 0;
    border-bottom: 1px solid #f5f5f5;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .pf-action-row:last-child {
    border-bottom: 0;
    padding-bottom: 4px;
  }

  .pf-action-row:first-child {
    padding-top: 4px;
  }

  .pf-action-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .pf-icon-box {
    width: 42px;
    height: 42px;
    border-radius: 10px;
    background: #ffffff;
    border: 1px solid #e5e5e5;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #111111;
    flex-shrink: 0;
  }

  .pf-action-title {
    font-size: 15px;
    font-weight: 600;
    color: #111111;
    margin: 0 0 2px;
  }

  .pf-action-desc {
    font-size: 13.5px;
    color: #666666;
    margin: 0;
  }

  /* ── Footer ── */
  .pf-footer {
    text-align: center;
    padding: 40px 0 16px;
    color: #888888;
    font-size: 14px;
  }
`;

const GRADE_OPTIONS = [
  "8th Grade",
  "9th Grade",
  "10th Grade",
  "11th Grade",
  "12th Grade",
  "College",
];

const Profile = () => {
  const notif = useNotification();
  const [profile, setProfile] = useState(() => {
    try {
      const cached = localStorage.getItem("tutorflow_cached_profile");
      if (cached) return JSON.parse(cached);
      const user = localStorage.getItem("user");
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(() => {
    return !localStorage.getItem("tutorflow_cached_profile");
  });
  const [saving, setSaving] = useState(false);

  // Form state initialized immediately from cache if available
  const [form, setForm] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem("tutorflow_cached_profile") || "null");
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const source = cached || user || {};
      return {
        full_name: source.full_name || source.profile?.full_name || "",
        grade: source.grade || source.profile?.grade || "",
        school: source.school || source.profile?.school || "",
        bio: source.bio || source.profile?.bio || "",
        learning_goals: source.learning_goals || source.profile?.learning_goals || [],
      };
    } catch {
      return {
        full_name: "",
        grade: "",
        school: "",
        bio: "",
        learning_goals: [],
      };
    }
  });

  const [newGoal, setNewGoal] = useState("");
  const [addingGoal, setAddingGoal] = useState(false);

  useEffect(() => {
    Promise.all([
      api("/profile").catch(() => null),
      api("/analytics/dashboard").catch(() => null),
    ])
      .then(([profileData]) => {
        if (profileData) {
          setProfile(profileData);
          localStorage.setItem("tutorflow_cached_profile", JSON.stringify(profileData));
          setForm({
            full_name: profileData.full_name || profileData.profile?.full_name || "",
            grade: profileData.grade || profileData.profile?.grade || "",
            school: profileData.school || profileData.profile?.school || "",
            bio: profileData.bio || profileData.profile?.bio || "",
            learning_goals: profileData.learning_goals || profileData.profile?.learning_goals || [],
          });
        }
      })
      .catch(() => {
        if (!localStorage.getItem("tutorflow_cached_profile")) {
          notif.error("Failed to load profile. Please try again.");
        }
      })
      .finally(() => setLoading(false));
  }, [notif]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        full_name: form.full_name || undefined,
        grade: form.grade || undefined,
        school: form.school || undefined,
        bio: form.bio || undefined,
        learning_goals: form.learning_goals.length ? form.learning_goals : undefined,
      };

      const updated = await api("/profile", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      setProfile((prev) => ({ ...prev, ...updated }));

      // Update localStorage
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...stored, full_name: form.full_name }));

      notif.success("Profile updated successfully!");
    } catch (err) {
      notif.error(err.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const addGoal = () => {
    const trimmed = newGoal.trim();
    if (trimmed && !form.learning_goals.includes(trimmed)) {
      setForm((f) => ({ ...f, learning_goals: [...f.learning_goals, trimmed] }));
    }
    setNewGoal("");
    setAddingGoal(false);
  };

  const removeGoal = (goal) => {
    setForm((f) => ({ ...f, learning_goals: f.learning_goals.filter((g) => g !== goal) }));
  };

  const displayName =
    form.full_name || profile?.full_name || profile?.profile?.full_name || profile?.email?.split("@")[0] || "";
  const displayEmail = profile?.email || "";

  const initials = displayName
    ? displayName
        .split(" ")
        .filter(Boolean)
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : (displayEmail ? displayEmail[0].toUpperCase() : "U");

  return (
    <div className="pf-page-wrapper">
      <style>{styles}</style>

      <div className="pf-page-container">
        {/* Unified Dashboard / My Lessons Header */}
        <header className="pf-header">
          <div>
            <h1 className="pf-welcome-title">Settings</h1>
            <p className="pf-welcome-subtitle">Manage your account, preferences, and learning experience.</p>
          </div>

          <div className="tf-header-actions">
            <NotificationDropdown>
              <button type="button" className="tf-bell-btn" title="Notifications" aria-label="Notifications">
                <Bell size={22} strokeWidth={2} />
              </button>
            </NotificationDropdown>
            <div
              className="tf-user-avatar"
              title="Profile"
            >
              {initials || "YS"}
            </div>
          </div>
        </header>

        {/* 1. Profile Information Card */}
        <section className="pf-card">
          <div className="pf-card-header">
            <h2 className="pf-card-title">Profile Information</h2>
          </div>

          <div className="pf-info-layout">
            <div className="pf-avatar-box">
              <div className="pf-avatar-circle">
                {initials || "YS"}
              </div>
              <button type="button" className="pf-avatar-cam-btn" title="Upload Photo" aria-label="Upload Photo">
                <Camera size={14} />
              </button>
            </div>

            <div className="pf-fields-grid">
              <div className="pf-field-group">
                <label className="pf-label">Full Name</label>
                <input
                  className="pf-input"
                  value={form.full_name}
                  placeholder="Full Name"
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                />
              </div>

              <div className="pf-field-group">
                <label className="pf-label">Email</label>
                <input
                  className="pf-input"
                  value={displayEmail}
                  disabled
                  placeholder="Email"
                />
              </div>

              <div className="pf-field-group half-row">
                <div>
                  <label className="pf-label">Grade / Level</label>
                  <select
                    className="pf-select"
                    value={form.grade}
                    onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))}
                  >
                    <option value="">Select Grade</option>
                    {GRADE_OPTIONS.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="pf-label">School</label>
                  <input
                    className="pf-input"
                    value={form.school}
                    placeholder="Your School"
                    onChange={(e) => setForm((f) => ({ ...f, school: e.target.value }))}
                  />
                </div>
              </div>

              <div className="pf-field-group">
                <label className="pf-label">Bio</label>
                <textarea
                  className="pf-textarea"
                  value={form.bio}
                  placeholder="Tell us about yourself..."
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                />
              </div>

              <div className="pf-field-group">
                <label className="pf-label">Learning Goals</label>
                <div className="pf-tags-list">
                  {form.learning_goals.map((g) => (
                    <span className="pf-tag-item" key={g}>
                      {g}
                      <button
                        type="button"
                        className="pf-tag-remove-btn"
                        onClick={() => removeGoal(g)}
                        aria-label={`Remove goal ${g}`}
                      >
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                  {addingGoal ? (
                    <input
                      autoFocus
                      className="pf-input"
                      style={{ height: 34, width: 150, padding: "0 10px", fontSize: 13 }}
                      placeholder="Add goal..."
                      value={newGoal}
                      onChange={(e) => setNewGoal(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addGoal();
                        if (e.key === "Escape") { setAddingGoal(false); setNewGoal(""); }
                      }}
                      onBlur={addGoal}
                    />
                  ) : (
                    <button type="button" className="pf-add-goal-btn" onClick={() => setAddingGoal(true)}>
                      <Plus size={13} /> Add Goal
                    </button>
                  )}
                </div>
              </div>

              <div className="pf-save-btn-row">
                <button
                  type="button"
                  className="pf-save-btn"
                  onClick={handleSave}
                  disabled={saving || loading}
                >
                  <Save size={16} />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Account Card */}
        <section className="pf-card">
          <div className="pf-card-header">
            <h2 className="pf-card-title">Account</h2>
            <p className="pf-card-desc">Manage your account settings.</p>
          </div>

          <div className="pf-account-rows">
            <div
              className="pf-action-row"
              onClick={() => notif.info("Password change flow opened.")}
            >
              <div className="pf-action-left">
                <div className="pf-icon-box">
                  <Lock size={18} />
                </div>
                <div>
                  <h3 className="pf-action-title">Change Password</h3>
                  <p className="pf-action-desc">Update your password</p>
                </div>
              </div>
              <ChevronRight size={18} color="#888888" />
            </div>

            <div
              className="pf-action-row"
              onClick={() => notif.error("Account deletion requires confirmation.")}
            >
              <div className="pf-action-left">
                <div className="pf-icon-box">
                  <Trash2 size={18} />
                </div>
                <div>
                  <h3 className="pf-action-title">Delete Account</h3>
                  <p className="pf-action-desc">Permanently delete your account and all data</p>
                </div>
              </div>
              <ChevronRight size={18} color="#888888" />
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="pf-footer">
          TutorFlow © 2025. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default Profile;
