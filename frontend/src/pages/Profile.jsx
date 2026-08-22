import React, { useEffect, useState } from "react";
import {
  User,
  Mail,
  BookOpen,
  GraduationCap,
  Building2,
  Target,
  Save,
  Edit3,
  CheckCircle,
  AlertCircle,
  Plus,
  X,
} from "lucide-react";
import { api } from "../lib/api";
import { useNotification } from "../components/NotificationBanner";

const styles = `
  .pf-page {
    min-height: 100vh;
    padding: 30px 38px 48px;
    background: #ffffff;
    color: #0f172a;
    font-family: "Outfit", sans-serif;
    max-width: 900px;
    margin: 0 auto;
  }

  .pf-header {
    margin-bottom: 32px;
  }

  .pf-title {
    margin: 0 0 6px;
    color: #020b3d;
    font-size: 32px;
    font-weight: 700;
    letter-spacing: -0.03em;
  }

  .pf-subtitle {
    margin: 0;
    color: #475b8f;
    font-size: 17px;
    font-weight: 400;
  }

  .pf-avatar-row {
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 28px;
    border: 1px solid #e3eaf8;
    border-radius: 16px;
    background: #f8faff;
    margin-bottom: 24px;
  }

  .pf-avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: linear-gradient(135deg, #0054ff 0%, #4d94ff 100%);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    font-weight: 700;
    flex-shrink: 0;
    letter-spacing: -0.02em;
  }

  .pf-avatar-info h2 {
    margin: 0 0 4px;
    color: #020b3d;
    font-size: 22px;
    font-weight: 700;
  }

  .pf-avatar-info p {
    margin: 0;
    color: #475b8f;
    font-size: 15px;
  }

  .pf-card {
    border: 1px solid #e3eaf8;
    border-radius: 16px;
    background: #ffffff;
    box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
    margin-bottom: 20px;
    overflow: hidden;
  }

  .pf-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid #eef2f7;
  }

  .pf-card-title {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0;
    color: #020b3d;
    font-size: 17px;
    font-weight: 700;
  }

  .pf-edit-btn {
    height: 36px;
    padding: 0 16px;
    border: 1px solid #dfe8f7;
    border-radius: 8px;
    background: #ffffff;
    color: #0054ff;
    font-family: "Outfit", sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: background 0.15s, border-color 0.15s;
  }

  .pf-edit-btn:hover {
    background: #eef4ff;
    border-color: #a3c0ff;
  }

  .pf-card-body {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .pf-field-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  .pf-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .pf-field.full {
    grid-column: 1 / -1;
  }

  .pf-label {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #4d6091;
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .pf-value {
    color: #020b3d;
    font-size: 16px;
    font-weight: 500;
    min-height: 24px;
  }

  .pf-value.empty {
    color: #94a3b8;
    font-style: italic;
    font-weight: 400;
  }

  .pf-input {
    height: 48px;
    padding: 0 14px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    background: #ffffff;
    color: #020b3d;
    font-family: "Outfit", sans-serif;
    font-size: 15px;
    outline: none;
    transition: border-color 0.2s;
    width: 100%;
    box-sizing: border-box;
  }

  .pf-input:focus {
    border-color: #0054ff;
    box-shadow: 0 0 0 3px rgba(0, 84, 255, 0.08);
  }

  .pf-textarea {
    padding: 12px 14px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    background: #ffffff;
    color: #020b3d;
    font-family: "Outfit", sans-serif;
    font-size: 15px;
    outline: none;
    transition: border-color 0.2s;
    width: 100%;
    box-sizing: border-box;
    resize: vertical;
    min-height: 80px;
  }

  .pf-textarea:focus {
    border-color: #0054ff;
    box-shadow: 0 0 0 3px rgba(0, 84, 255, 0.08);
  }

  .pf-select {
    height: 48px;
    padding: 0 14px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    background: #ffffff;
    color: #020b3d;
    font-family: "Outfit", sans-serif;
    font-size: 15px;
    outline: none;
    cursor: pointer;
    width: 100%;
    box-sizing: border-box;
    appearance: none;
  }

  .pf-select:focus {
    border-color: #0054ff;
    box-shadow: 0 0 0 3px rgba(0, 84, 255, 0.08);
  }

  .pf-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  .pf-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    border-radius: 999px;
    background: #eef4ff;
    color: #0054ff;
    font-size: 14px;
    font-weight: 500;
  }

  .pf-tag-remove {
    border: 0;
    background: transparent;
    color: #0054ff;
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    opacity: 0.7;
  }

  .pf-tag-remove:hover { opacity: 1; }

  .pf-tag-add {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 32px;
    padding: 0 12px;
    border: 1px dashed #a3c0ff;
    border-radius: 999px;
    background: transparent;
    color: #0054ff;
    font-family: "Outfit", sans-serif;
    font-size: 14px;
    cursor: pointer;
  }

  .pf-tag-input {
    height: 32px;
    padding: 0 10px;
    border: 1px solid #0054ff;
    border-radius: 999px;
    background: #eef4ff;
    color: #020b3d;
    font-family: "Outfit", sans-serif;
    font-size: 14px;
    outline: none;
    width: 160px;
  }

  .pf-save-row {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 24px;
    border-top: 1px solid #eef2f7;
  }

  .pf-cancel-btn {
    height: 44px;
    padding: 0 20px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    background: #ffffff;
    color: #475b8f;
    font-family: "Outfit", sans-serif;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
  }

  .pf-save-btn {
    height: 44px;
    padding: 0 24px;
    border: 0;
    border-radius: 10px;
    background: #0054ff;
    color: #ffffff;
    font-family: "Outfit", sans-serif;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 8px 20px rgba(0, 84, 255, 0.22);
    transition: background 0.15s;
  }

  .pf-save-btn:hover { background: #1d4ed8; }
  .pf-save-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  .pf-toast {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 18px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 20px;
  }

  .pf-toast.success {
    background: #f0fdf4;
    border: 1px solid #86efac;
    color: #15803d;
  }

  .pf-toast.error {
    background: #fef2f2;
    border: 1px solid #fca5a5;
    color: #dc2626;
  }

  .pf-stat-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }

  .pf-stat {
    padding: 18px 20px;
    border: 1px solid #e3eaf8;
    border-radius: 12px;
    background: #f8faff;
    text-align: center;
  }

  .pf-stat-value {
    font-size: 26px;
    font-weight: 700;
    color: #0054ff;
    letter-spacing: -0.02em;
  }

  .pf-stat-label {
    margin-top: 4px;
    font-size: 13px;
    color: #475b8f;
    font-weight: 500;
  }

  .pf-skeleton {
    background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
    border-radius: 8px;
    height: 20px;
  }

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

const GRADE_OPTIONS = [
  "8th Grade", "9th Grade", "10th Grade", "11th Grade", "12th Grade", "College",
];

const Profile = () => {
  const notif = useNotification();
  const [profile, setProfile] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editable form state
  const [form, setForm] = useState({
    full_name: "",
    grade: "",
    school: "",
    bio: "",
    learning_goals: [],
  });
  const [newGoal, setNewGoal] = useState("");
  const [addingGoal, setAddingGoal] = useState(false);

  useEffect(() => {
    Promise.all([api("/profile"), api("/analytics/dashboard")])
      .then(([profileData, analyticsData]) => {
        setProfile(profileData);
        setAnalytics(analyticsData);
        setForm({
          full_name: profileData.full_name || profileData.profile?.full_name || "",
          grade: profileData.grade || profileData.profile?.grade || "",
          school: profileData.school || profileData.profile?.school || "",
          bio: profileData.bio || profileData.profile?.bio || "",
          learning_goals: profileData.learning_goals || profileData.profile?.learning_goals || [],
        });
      })
      .catch(() => {
        notif.error("Failed to load profile. Please try again.");
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
      // Keep localStorage user fresh
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...stored, full_name: form.full_name }));
      setEditing(false);
      notif.success("Profile updated successfully!");
    } catch (err) {
      notif.error(err.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form to current profile
    setForm({
      full_name: profile?.full_name || profile?.profile?.full_name || "",
      grade: profile?.grade || profile?.profile?.grade || "",
      school: profile?.school || profile?.profile?.school || "",
      bio: profile?.bio || profile?.profile?.bio || "",
      learning_goals: profile?.learning_goals || profile?.profile?.learning_goals || [],
    });
    setEditing(false);
    setAddingGoal(false);
    setNewGoal("");
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

  // Derive display values
  const displayName =
    profile?.full_name || profile?.profile?.full_name || profile?.email?.split("@")[0] || "Student";
  const displayEmail = profile?.email || "—";
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const overallMastery = analytics ? Math.round((analytics.overall_mastery || 0) * 100) : null;
  const accuracy = analytics ? Math.round((analytics.accuracy || 0) * 100) : null;
  const streak = analytics?.current_streak ?? null;

  return (
    <main className="pf-page">
      <style>{styles}</style>

      <header className="pf-header">
        <h1 className="pf-title">My Profile</h1>
        <p className="pf-subtitle">Manage your account details and learning preferences.</p>
      </header>

      {toast && (
        <div className={`pf-toast ${toast.type}`}>
          {toast.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {toast.message}
        </div>
      )}

      {/* Avatar + name row */}
      <div className="pf-avatar-row">
        {loading ? (
          <div className="pf-avatar" style={{ background: "#e2e8f0" }} />
        ) : (
          <div className="pf-avatar">{initials || "S"}</div>
        )}
        <div className="pf-avatar-info">
          {loading ? (
            <>
              <div className="pf-skeleton" style={{ width: 180, marginBottom: 8 }} />
              <div className="pf-skeleton" style={{ width: 220, height: 14 }} />
            </>
          ) : (
            <>
              <h2>{displayName}</h2>
              <p>{displayEmail}</p>
            </>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="pf-stat-row" style={{ marginBottom: 20 }}>
        {[
          { label: "Overall Mastery", value: loading ? "—" : overallMastery !== null ? `${overallMastery}%` : "—" },
          { label: "Accuracy", value: loading ? "—" : accuracy !== null ? `${accuracy}%` : "—" },
          { label: "Day Streak", value: loading ? "—" : streak !== null ? `${streak}` : "—" },
        ].map((s) => (
          <div className="pf-stat" key={s.label}>
            <div className="pf-stat-value">{s.value}</div>
            <div className="pf-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Personal info card */}
      <div className="pf-card">
        <div className="pf-card-header">
          <h2 className="pf-card-title">
            <User size={18} color="#0054ff" />
            Personal Information
          </h2>
          {!editing && (
            <button className="pf-edit-btn" onClick={() => setEditing(true)}>
              <Edit3 size={15} />
              Edit
            </button>
          )}
        </div>

        <div className="pf-card-body">
          {/* Full name + email */}
          <div className="pf-field-row">
            <div className="pf-field">
              <span className="pf-label">
                <User size={14} /> Full Name
              </span>
              {editing ? (
                <input
                  className="pf-input"
                  value={form.full_name}
                  placeholder="Your full name"
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                />
              ) : loading ? (
                <div className="pf-skeleton" style={{ width: "70%" }} />
              ) : (
                <span className={`pf-value${!displayName ? " empty" : ""}`}>
                  {displayName || "Not set"}
                </span>
              )}
            </div>

            <div className="pf-field">
              <span className="pf-label">
                <Mail size={14} /> Email Address
              </span>
              {loading ? (
                <div className="pf-skeleton" style={{ width: "80%" }} />
              ) : (
                <span className="pf-value" style={{ color: "#475b8f" }}>{displayEmail}</span>
              )}
            </div>
          </div>

          {/* Grade + school */}
          <div className="pf-field-row">
            <div className="pf-field">
              <span className="pf-label">
                <GraduationCap size={14} /> Grade / Level
              </span>
              {editing ? (
                <select
                  className="pf-select"
                  value={form.grade}
                  onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))}
                >
                  <option value="">Select grade…</option>
                  {GRADE_OPTIONS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              ) : loading ? (
                <div className="pf-skeleton" style={{ width: "50%" }} />
              ) : (
                <span className={`pf-value${!form.grade ? " empty" : ""}`}>
                  {form.grade || "Not set"}
                </span>
              )}
            </div>

            <div className="pf-field">
              <span className="pf-label">
                <Building2 size={14} /> School
              </span>
              {editing ? (
                <input
                  className="pf-input"
                  value={form.school}
                  placeholder="Your school name"
                  onChange={(e) => setForm((f) => ({ ...f, school: e.target.value }))}
                />
              ) : loading ? (
                <div className="pf-skeleton" style={{ width: "60%" }} />
              ) : (
                <span className={`pf-value${!form.school ? " empty" : ""}`}>
                  {form.school || "Not set"}
                </span>
              )}
            </div>
          </div>

          {/* Bio */}
          <div className="pf-field full">
            <span className="pf-label">
              <BookOpen size={14} /> Bio
            </span>
            {editing ? (
              <textarea
                className="pf-textarea"
                value={form.bio}
                placeholder="Tell us a little about yourself…"
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              />
            ) : loading ? (
              <div className="pf-skeleton" style={{ height: 40, width: "90%" }} />
            ) : (
              <span className={`pf-value${!form.bio ? " empty" : ""}`}>
                {form.bio || "No bio yet."}
              </span>
            )}
          </div>

          {/* Learning goals */}
          <div className="pf-field full">
            <span className="pf-label">
              <Target size={14} /> Learning Goals
            </span>
            {loading ? (
              <div className="pf-skeleton" style={{ height: 32, width: "50%" }} />
            ) : (
              <div className="pf-tags">
                {form.learning_goals.map((goal) => (
                  <span className="pf-tag" key={goal}>
                    {goal}
                    {editing && (
                      <button className="pf-tag-remove" onClick={() => removeGoal(goal)} aria-label={`Remove ${goal}`}>
                        <X size={12} />
                      </button>
                    )}
                  </span>
                ))}
                {editing && (
                  addingGoal ? (
                    <input
                      autoFocus
                      className="pf-tag-input"
                      placeholder="Type goal…"
                      value={newGoal}
                      onChange={(e) => setNewGoal(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addGoal();
                        if (e.key === "Escape") { setAddingGoal(false); setNewGoal(""); }
                      }}
                      onBlur={addGoal}
                    />
                  ) : (
                    <button className="pf-tag-add" onClick={() => setAddingGoal(true)}>
                      <Plus size={13} /> Add goal
                    </button>
                  )
                )}
                {!editing && form.learning_goals.length === 0 && (
                  <span className="pf-value empty">No goals set yet.</span>
                )}
              </div>
            )}
          </div>
        </div>

        {editing && (
          <div className="pf-save-row">
            <button className="pf-cancel-btn" onClick={handleCancel}>Cancel</button>
            <button className="pf-save-btn" onClick={handleSave} disabled={saving}>
              <Save size={16} />
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      {/* Account info card (read-only) */}
      <div className="pf-card">
        <div className="pf-card-header">
          <h2 className="pf-card-title">
            <Mail size={18} color="#0054ff" />
            Account
          </h2>
        </div>
        <div className="pf-card-body">
          <div className="pf-field-row">
            <div className="pf-field">
              <span className="pf-label"><Mail size={14} /> Email</span>
              <span className="pf-value" style={{ color: "#475b8f" }}>{displayEmail}</span>
            </div>
            <div className="pf-field">
              <span className="pf-label"><User size={14} /> Account Type</span>
              <span className="pf-value">Student</span>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>
            To change your email or password, use the{" "}
            <a href="/forgot-password" style={{ color: "#0054ff", textDecoration: "none", fontWeight: 600 }}>
              password reset
            </a>{" "}
            flow.
          </p>
        </div>
      </div>
    </main>
  );
};

export default Profile;
