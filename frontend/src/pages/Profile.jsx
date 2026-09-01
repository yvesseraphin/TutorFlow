import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Camera,
  Lock,
  Trash2,
  Save,
  Plus,
  X,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  GraduationCap,
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
    transition: transform 0.2s ease;
  }

  .tf-user-avatar:hover {
    transform: scale(1.05);
  }

  /* ── Cards ── */
  .pf-card {
    background: #ffffff;
    border: 1px solid #E2E8F0;
    border-radius: 16px;
    padding: 28px 32px;
    margin-bottom: 24px;
    box-shadow: none;
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
    width: 96px;
    height: 96px;
    border-radius: 50%;
    background: #111111;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 34px;
    font-weight: 700;
    cursor: pointer;
    overflow: hidden;
    transition: opacity 0.2s ease;
  }

  .pf-avatar-circle:hover {
    opacity: 0.9;
  }

  .pf-avatar-cam-btn {
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #ffffff;
    border: 1px solid #E2E8F0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #111111;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .pf-avatar-cam-btn:hover {
    background: #f5f5f5;
    transform: scale(1.05);
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
    position: relative;
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
    height: 48px;
    padding: 0 16px;
    border: 1px solid #E2E8F0;
    border-radius: 12px;
    background: #ffffff;
    color: #111111;
    font-family: "Outfit", sans-serif;
    font-size: 15px;
    outline: none;
    transition: border-color 0.15s ease;
    box-sizing: border-box;
  }

  .pf-input:focus {
    border: 2px solid #111111 !important;
  }

  .pf-input:disabled {
    background: #f8fafc;
    color: #64748B;
    cursor: not-allowed;
  }

  /* ── Custom Grade Dropdown ── */
  .pf-dropdown-trigger {
    width: 100%;
    height: 48px;
    padding: 0 40px 0 16px;
    border: 1px solid #E2E8F0;
    border-radius: 12px;
    background: #ffffff;
    color: #111111;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-sizing: border-box;
    font-family: 'Outfit', sans-serif;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    transition: border-color 0.2s ease;
    text-align: left;
    position: relative;
  }

  .pf-dropdown-trigger:hover {
    border-color: #cbd5e1;
  }

  .pf-dropdown-trigger.open,
  .pf-dropdown-trigger:focus {
    border: 2px solid #111111 !important;
    outline: none;
  }

  .pf-dropdown-chevron {
    position: absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: #64748b;
    pointer-events: none;
    transition: transform 0.2s ease;
  }

  .pf-dropdown-chevron.open {
    transform: translateY(-50%) rotate(180deg);
  }

  .pf-dropdown-menu {
    position: absolute;
    left: 0;
    right: 0;
    top: calc(100% + 8px);
    z-index: 50;
    padding: 6px;
    border: 1px solid #E2E8F0;
    border-radius: 14px;
    background: #ffffff;
    box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .pf-dropdown-option {
    width: 100%;
    min-height: 44px;
    padding: 10px 14px;
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: #334155;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    cursor: pointer;
    font-family: 'Outfit', sans-serif;
    font-size: 14.5px;
    font-weight: 500;
    text-align: left;
    transition: background 0.15s ease, color 0.15s ease;
    box-sizing: border-box;
  }

  .pf-dropdown-option:hover,
  .pf-dropdown-option.active {
    background: #f5f5f5;
    color: #111111;
    font-weight: 500;
  }

  .pf-textarea {
    width: 100%;
    min-height: 90px;
    padding: 12px 16px;
    border: 1px solid #E2E8F0;
    border-radius: 12px;
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
    border: 2px solid #111111 !important;
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
    border: 1px solid #E2E8F0;
    border-radius: 8px;
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
    align-items: center;
    color: #666666;
    transition: color 0.15s ease;
  }

  .pf-tag-remove-btn:hover {
    color: #ef4444;
  }

  .pf-add-goal-btn {
    border: 1px dashed #cbd5e1;
    background: transparent;
    padding: 6px 14px;
    border-radius: 8px;
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
    height: 48px;
    padding: 0 28px;
    background: #0a0a0a;
    color: #ffffff;
    border: 0;
    border-radius: 12px;
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
    transform: translateY(-1px);
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
    border-bottom: 1px solid #f1f5f9;
    cursor: pointer;
    transition: all 0.15s ease;
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
    border: 1px solid #E2E8F0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #111111;
    flex-shrink: 0;
  }

  .pf-action-title {
    font-size: 16px;
    font-weight: 600;
    color: #111111;
    margin: 0 0 2px;
  }

  .pf-action-desc {
    font-size: 14px;
    color: #64748b;
    margin: 0;
  }

  /* ── Modal Styles ── */
  .pf-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(6px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .pf-modal-box {
    width: 100%;
    max-width: 440px;
    background: #ffffff;
    border: 1px solid #E2E8F0;
    border-radius: 20px;
    padding: 32px;
    box-shadow: 0 24px 60px -12px rgba(15, 23, 42, 0.25);
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
  }

  .pf-modal-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 20px;
  }

  .pf-modal-title {
    font-size: 22px;
    font-weight: 700;
    color: #111111;
    margin: 0 0 4px;
    letter-spacing: -0.01em;
  }

  .pf-modal-desc {
    font-size: 14px;
    color: #64748b;
    margin: 0;
    line-height: 20px;
  }

  .pf-modal-close-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: none;
    background: #f5f5f5;
    color: #555555;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s ease;
    flex-shrink: 0;
  }

  .pf-modal-close-btn:hover {
    background: #ebebeb;
    color: #111111;
  }

  .pf-modal-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .pf-input-wrap-rel {
    position: relative;
    width: 100%;
  }

  .pf-eye-btn {
    position: absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%);
    background: transparent;
    border: none;
    cursor: pointer;
    color: #64748b;
    display: flex;
    align-items: center;
    padding: 0;
  }

  .pf-modal-actions {
    display: flex;
    gap: 12px;
    margin-top: 8px;
  }

  .pf-btn-cancel {
    flex: 1;
    height: 48px;
    border: 1px solid #E2E8F0;
    border-radius: 12px;
    background: #ffffff;
    color: #111111;
    font-family: "Outfit", sans-serif;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .pf-btn-cancel:hover {
    background: #f5f5f5;
  }

  .pf-btn-primary-modal {
    flex: 1;
    height: 48px;
    border: none;
    border-radius: 12px;
    background: #0a0a0a;
    color: #ffffff;
    font-family: "Outfit", sans-serif;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .pf-btn-primary-modal:hover:not(:disabled) {
    background: #222222;
  }

  .pf-btn-primary-modal:disabled {
    opacity: 0.6;
    cursor: default;
  }

  .pf-btn-danger-modal {
    flex: 1;
    height: 48px;
    border: none;
    border-radius: 12px;
    background: #ef4444;
    color: #ffffff;
    font-family: "Outfit", sans-serif;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .pf-btn-danger-modal:hover:not(:disabled) {
    background: #dc2626;
  }

  .pf-btn-danger-modal:disabled {
    opacity: 0.6;
    cursor: default;
  }

  .pf-danger-banner {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 14px 16px;
    background: #fef2f2;
    border: 1px solid #fee2e2;
    border-radius: 12px;
    color: #991b1b;
    font-size: 13.5px;
    line-height: 20px;
    margin-bottom: 8px;
  }

  /* ── Footer ── */
  .pf-footer {
    text-align: center;
    padding: 40px 0 16px;
    color: #888888;
    font-size: 14px;
  }

  @media (max-width: 768px) {
    .pf-page-wrapper {
      padding: 24px 20px;
    }
    .pf-info-layout {
      flex-direction: column;
      align-items: center;
    }
    .pf-fields-grid {
      width: 100%;
    }
    .pf-field-group.half-row {
      grid-template-columns: 1fr;
    }
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
  const navigate = useNavigate();
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
  const [isGradeOpen, setIsGradeOpen] = useState(false);
  const gradeDropdownRef = useRef(null);
  const avatarInputRef = useRef(null);

  // Password Change State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Account Deletion State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeletePass, setShowDeletePass] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem("tutorflow_cached_profile") || "null");
      const user = JSON.parse(localStorage.getItem("user") || "null");
      return (
        cached?.avatar_url ||
        cached?.profile?.avatar_url ||
        user?.avatar_url ||
        user?.profile?.avatar_url ||
        user?.user_metadata?.avatar_url ||
        user?.user_metadata?.picture ||
        ""
      );
    } catch {
      return "";
    }
  });

  // Handle outside click for Grade dropdown
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (gradeDropdownRef.current && !gradeDropdownRef.current.contains(e.target)) {
        setIsGradeOpen(false);
      }
    };
    if (isGradeOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isGradeOpen]);

  useEffect(() => {
    Promise.all([
      api("/profile").catch(() => null),
      api("/analytics/dashboard").catch(() => null),
    ])
      .then(([profileData]) => {
        if (profileData) {
          setProfile(profileData);
          localStorage.setItem("tutorflow_cached_profile", JSON.stringify(profileData));
          const av =
            profileData.avatar_url ||
            profileData.profile?.avatar_url ||
            profileData.metadata?.avatar_url ||
            profileData.metadata?.picture ||
            "";
          if (av) setAvatarUrl(av);
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

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      notif.error("Image file size must be smaller than 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;
      setAvatarUrl(base64);
      try {
        await api("/profile", {
          method: "PATCH",
          body: JSON.stringify({ avatar_url: base64 }),
        });
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem("user", JSON.stringify({ ...stored, avatar_url: base64 }));
        const cached = JSON.parse(localStorage.getItem("tutorflow_cached_profile") || "{}");
        localStorage.setItem("tutorflow_cached_profile", JSON.stringify({ ...cached, avatar_url: base64 }));
        notif.success("Profile photo updated successfully!");
      } catch {
        notif.error("Failed to save profile photo.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        full_name: form.full_name || undefined,
        grade: form.grade || undefined,
        school: form.school || undefined,
        bio: form.bio || undefined,
        learning_goals: form.learning_goals.length ? form.learning_goals : undefined,
        avatar_url: avatarUrl || undefined,
      };

      const updated = await api("/profile", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      setProfile((prev) => ({ ...prev, ...updated }));

      // Update localStorage
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...stored, full_name: form.full_name, avatar_url: avatarUrl }));

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

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordForm.old_password) {
      notif.error("Please enter your current password.");
      return;
    }
    if (passwordForm.new_password.length < 8) {
      notif.error("New password must be at least 8 characters long.");
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      notif.error("New passwords do not match.");
      return;
    }

    setChangingPassword(true);
    try {
      await api("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          old_password: passwordForm.old_password,
          new_password: passwordForm.new_password,
        }),
      });
      notif.success("Password changed successfully!");
      setShowPasswordModal(false);
      setPasswordForm({ old_password: "", new_password: "", confirm_password: "" });
    } catch (err) {
      notif.error(err.message || "Failed to change password. Please check your current password.");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccountSubmit = async (e) => {
    e.preventDefault();
    if (!deletePassword) {
      notif.error("Please enter your password to confirm deletion.");
      return;
    }

    setDeletingAccount(true);
    try {
      await api("/auth/delete-account", {
        method: "POST",
        body: JSON.stringify({ password: deletePassword }),
      });
      localStorage.clear();
      notif.success("Your account and all associated data have been permanently deleted.");
      setTimeout(() => {
        window.location.href = "/login";
      }, 700);
    } catch (err) {
      notif.error(err.message || "Failed to delete account. Please verify your password.");
      setDeletingAccount(false);
    }
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
        {/* Header */}
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
              style={{ overflow: "hidden" }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile Avatar" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
              ) : (
                initials || "YS"
              )}
            </div>
          </div>
        </header>

        {/* 1. Profile Information Card */}
        <section className="pf-card">
          <div className="pf-card-header">
            <h2 className="pf-card-title">Profile Information</h2>
            <p className="pf-card-desc">Update your personal information and learning profile.</p>
          </div>

          <div className="pf-info-layout">
            <div className="pf-avatar-box">
              <div
                className="pf-avatar-circle"
                onClick={() => avatarInputRef.current?.click()}
                title="Click to upload profile photo"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile Avatar" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  initials || "YS"
                )}
              </div>
              <button
                type="button"
                className="pf-avatar-cam-btn"
                title="Upload Photo"
                aria-label="Upload Photo"
                onClick={() => avatarInputRef.current?.click()}
              >
                <Camera size={15} />
              </button>
              <input
                type="file"
                ref={avatarInputRef}
                style={{ display: "none" }}
                accept="image/*"
                onChange={handleAvatarUpload}
              />
            </div>

            <div className="pf-fields-grid">
              <div className="pf-field-group">
                <label className="pf-label">Full Name</label>
                <input
                  className="pf-input"
                  value={form.full_name}
                  placeholder="Enter your full name"
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
                <div ref={gradeDropdownRef} style={{ position: "relative" }}>
                  <label className="pf-label" style={{ display: "block", marginBottom: 6 }}>Grade / Level</label>
                  <button
                    type="button"
                    className={`pf-dropdown-trigger ${isGradeOpen ? "open" : ""}`}
                    onClick={() => setIsGradeOpen(!isGradeOpen)}
                    aria-haspopup="listbox"
                    aria-expanded={isGradeOpen}
                  >
                    <span>{form.grade || "Select Grade Level"}</span>
                    <ChevronDown className={`pf-dropdown-chevron ${isGradeOpen ? "open" : ""}`} size={18} />
                  </button>

                  {isGradeOpen && (
                    <div className="pf-dropdown-menu" role="listbox">
                      {GRADE_OPTIONS.map((g) => (
                        <button
                          key={g}
                          type="button"
                          className={`pf-dropdown-option ${form.grade === g ? "active" : ""}`}
                          onClick={() => {
                            setForm((f) => ({ ...f, grade: g }));
                            setIsGradeOpen(false);
                          }}
                        >
                          <span>{g}</span>
                          {form.grade === g && <CheckCircle2 size={16} color="#111111" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="pf-label" style={{ display: "block", marginBottom: 6 }}>School</label>
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
                  placeholder="Tell us a little about your learning goals and background..."
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
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                  {addingGoal ? (
                    <input
                      autoFocus
                      className="pf-input"
                      style={{ height: 36, width: 160, padding: "0 12px", fontSize: 13 }}
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
                      <Plus size={14} /> Add Goal
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

        {/* 2. Account Security & Management Card */}
        <section className="pf-card">
          <div className="pf-card-header">
            <h2 className="pf-card-title">Account Security</h2>
            <p className="pf-card-desc">Manage your authentication and account settings.</p>
          </div>

          <div className="pf-account-rows">
            {/* Change Password Row */}
            <div
              className="pf-action-row"
              onClick={() => setShowPasswordModal(true)}
              role="button"
              tabIndex={0}
            >
              <div className="pf-action-left">
                <div className="pf-icon-box">
                  <Lock size={18} />
                </div>
                <div>
                  <h3 className="pf-action-title">Change Password</h3>
                  <p className="pf-action-desc">Update your password securely</p>
                </div>
              </div>
              <ChevronRight size={18} color="#888888" />
            </div>

            {/* Delete Account Row */}
            <div
              className="pf-action-row"
              onClick={() => setShowDeleteModal(true)}
              role="button"
              tabIndex={0}
            >
              <div className="pf-action-left">
                <div className="pf-icon-box" style={{ color: "#ef4444", borderColor: "#fee2e2", background: "#fef2f2" }}>
                  <Trash2 size={18} />
                </div>
                <div>
                  <h3 className="pf-action-title" style={{ color: "#ef4444" }}>Delete Account</h3>
                  <p className="pf-action-desc">Permanently erase your account, diagnostic records, and files</p>
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

      {/* ══════════════════ MODAL: CHANGE PASSWORD ══════════════════ */}
      {showPasswordModal && (
        <div className="pf-modal-backdrop" onClick={() => setShowPasswordModal(false)}>
          <div className="pf-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="pf-modal-header">
              <div>
                <h2 className="pf-modal-title">Change Password</h2>
                <p className="pf-modal-desc">Enter your current password and choose a new one.</p>
              </div>
              <button
                type="button"
                className="pf-modal-close-btn"
                onClick={() => setShowPasswordModal(false)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="pf-modal-form">
              <div className="pf-field-group">
                <label className="pf-label">Current Password</label>
                <div className="pf-input-wrap-rel">
                  <input
                    type={showOldPass ? "text" : "password"}
                    required
                    className="pf-input"
                    placeholder="Enter current password"
                    value={passwordForm.old_password}
                    onChange={(e) => setPasswordForm((f) => ({ ...f, old_password: e.target.value }))}
                  />
                  <button
                    type="button"
                    className="pf-eye-btn"
                    onClick={() => setShowOldPass(!showOldPass)}
                  >
                    {showOldPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="pf-field-group">
                <label className="pf-label">New Password</label>
                <div className="pf-input-wrap-rel">
                  <input
                    type={showNewPass ? "text" : "password"}
                    required
                    minLength={8}
                    className="pf-input"
                    placeholder="At least 8 characters"
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm((f) => ({ ...f, new_password: e.target.value }))}
                  />
                  <button
                    type="button"
                    className="pf-eye-btn"
                    onClick={() => setShowNewPass(!showNewPass)}
                  >
                    {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="pf-field-group">
                <label className="pf-label">Confirm New Password</label>
                <div className="pf-input-wrap-rel">
                  <input
                    type={showConfirmPass ? "text" : "password"}
                    required
                    minLength={8}
                    className="pf-input"
                    placeholder="Confirm new password"
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm((f) => ({ ...f, confirm_password: e.target.value }))}
                  />
                  <button
                    type="button"
                    className="pf-eye-btn"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                  >
                    {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="pf-modal-actions">
                <button
                  type="button"
                  className="pf-btn-cancel"
                  onClick={() => setShowPasswordModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="pf-btn-primary-modal"
                  disabled={changingPassword}
                >
                  {changingPassword ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════ MODAL: DELETE ACCOUNT ══════════════════ */}
      {showDeleteModal && (
        <div className="pf-modal-backdrop" onClick={() => !deletingAccount && setShowDeleteModal(false)}>
          <div className="pf-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="pf-modal-header">
              <div>
                <h2 className="pf-modal-title" style={{ color: "#ef4444" }}>Delete Account</h2>
                <p className="pf-modal-desc">This action cannot be undone.</p>
              </div>
              <button
                type="button"
                className="pf-modal-close-btn"
                onClick={() => !deletingAccount && setShowDeleteModal(false)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="pf-danger-banner">
              <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                All your learning history, diagnostic assessments, topic mastery, memories, and files will be permanently erased.
              </div>
            </div>

            <form onSubmit={handleDeleteAccountSubmit} className="pf-modal-form">
              <div className="pf-field-group">
                <label className="pf-label">Enter your password to confirm</label>
                <div className="pf-input-wrap-rel">
                  <input
                    type={showDeletePass ? "text" : "password"}
                    required
                    className="pf-input"
                    placeholder="Enter your password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="pf-eye-btn"
                    onClick={() => setShowDeletePass(!showDeletePass)}
                  >
                    {showDeletePass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="pf-modal-actions">
                <button
                  type="button"
                  className="pf-btn-cancel"
                  disabled={deletingAccount}
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="pf-btn-danger-modal"
                  disabled={deletingAccount || !deletePassword}
                >
                  {deletingAccount ? "Deleting Account..." : "Permanently Delete Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;

