import React, { useState } from "react";
import { Stage, Layer, Line } from "react-konva";
import {
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  Bookmark,
  Calculator,
  ChevronDown,
  ClipboardList,
  Clock3,
  Divide,
  Eraser,
  File,
  FileText,
  GraduationCap,
  FunctionSquare,
  Hand,
  Highlighter,
  Home,
  Expand,
  LogOut,
  Mic,
  MoreHorizontal,
  MousePointer2,
  PenLine,
  Phone,
  Play,
  PlaySquare,
  Plus,
  Redo2,
  Search,
  Send,
  Settings,
  Sparkles,
  Shapes,
  Trash2,
  Trophy,
  Type,
  Undo2,
  User,
  Video,
  Volume2,
} from "lucide-react";

const subjects = [
  {
    name: "Algebra",
    description: "Build strong foundations in algebra.",
    progress: 68,
    lessons: 12,
    level: "Beginner",
    icon: Calculator,
  },
  {
    name: "Functions",
    description: "Understand relations, functions and graphs.",
    progress: 45,
    lessons: 10,
    level: "Intermediate",
    icon: FunctionSquare,
  },
  {
    name: "Geometry",
    description: "Explore shapes, angles and theorems.",
    progress: 30,
    lessons: 8,
    level: "Beginner",
    icon: Shapes,
  },
  {
    name: "Statistics",
    description: "Learn data, graphs and probability.",
    progress: 20,
    lessons: 7,
    level: "Beginner",
    icon: BarChart3,
  },
  {
    name: "Pre-Algebra",
    description: "Review essential math skills.",
    progress: 75,
    lessons: 9,
    level: "Review",
    icon: Divide,
  },
  {
    name: "More Subjects",
    description: "Coming soon.",
    progress: null,
    lessons: null,
    level: null,
    icon: MoreHorizontal,
    comingSoon: true,
  },
];

const styles = `
  .lessons-page {
    min-height: 100vh;
    padding: 30px 38px 36px;
    background: #ffffff;
    color: #0f172a;
    font-family: "Outfit", sans-serif;
    max-width: 1400px;
    margin: 0 auto;
  }

  .lessons-header {
    min-height: 138px;
    padding: 18px 0;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
  }

  .lessons-title {
    margin: 0;
    color: #020b3d;
    font-size: 39px;
    font-weight: 700;
    line-height: 48px;
    letter-spacing: -0.035em;
  }

  .lessons-subtitle {
    margin: 9px 0 0;
    color: #263d73;
    font-size: 18px;
    font-weight: 400;
    line-height: 28px;
  }

  .lessons-actions {
    display: flex;
    align-items: center;
    gap: 24px;
  }

  .lessons-bell {
    position: relative;
    width: 48px;
    height: 48px;
    border: 0;
    border-radius: 50%;
    background: #ffffff;
    color: #1d356c;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .lessons-bell::after {
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

  .lessons-avatar {
    width: 61px;
    height: 61px;
    border: 0;
    border-radius: 50%;
    background: #eef4ff;
    color: #0054ff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .lessons-content {
    padding: 0;
    max-width: 100%;
    margin: 0;
  }

  .lesson-detail-page {
    min-height: 100vh;
    padding: 42px 48px;
    background: #ffffff;
    color: #0f172a;
    font-family: "Outfit", sans-serif;
    display: grid;
    grid-template-columns: minmax(0, 2.2fr) 380px;
    gap: 32px;
    align-items: start;
  }

  .back-button {
    height: 32px;
    display: inline-flex;
    align-items: center;
    gap: 12px;
    border: 0;
    background: transparent;
    color: #334155;
    font-family: "Outfit", sans-serif;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    margin-bottom: 40px;
  }

  .back-button:hover {
    color: #2563eb;
  }

  .detail-top-actions {
    position: absolute;
    right: 48px;
    top: 32px;
    display: flex;
    align-items: center;
    gap: 24px;
  }

  .lesson-hero {
    display: flex;
    gap: 46px;
    align-items: flex-start;
  }

  .lesson-icon-large {
    width: 126px;
    height: 126px;
    border-radius: 28px;
    background: #eef4ff;
    color: #0054ff;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    font-size: 22px;
    font-weight: 700;
    font-style: italic;
  }

  .lesson-kicker {
    margin: 8px 0 20px;
    color: #0054ff;
    font-size: 15px;
    font-weight: 700;
    line-height: 20px;
  }

  .lesson-title-large {
    margin: 0;
    color: #020b3d;
    font-size: 42px;
    font-weight: 700;
    line-height: 50px;
    letter-spacing: -0.035em;
  }

  .lesson-description-large {
    max-width: 620px;
    margin: 16px 0 0;
    color: #263d73;
    font-size: 17px;
    font-weight: 400;
    line-height: 29px;
  }

  .lesson-meta {
    display: flex;
    align-items: center;
    gap: 18px;
    margin-top: 22px;
    color: #334f87;
    font-size: 15px;
    font-weight: 500;
  }

  .lesson-meta-item {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .meta-divider {
    width: 1px;
    height: 18px;
    background: #e2e8f0;
  }

  .status-badge {
    padding: 8px 16px;
    border-radius: 999px;
    background: #eef4ff;
    color: #0054ff;
    font-size: 14px;
    font-weight: 600;
  }

  .detail-tabs {
    display: flex;
    gap: 46px;
    margin-top: 36px;
    border-top: 1px solid #e2e8f0;
    border-bottom: 1px solid #eef2f7;
  }

  .detail-tab {
    padding: 22px 0 16px;
    border: 0;
    border-bottom: 3px solid transparent;
    background: transparent;
    color: #334f87;
    font-family: "Outfit", sans-serif;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
  }

  .detail-tab.active {
    color: #0054ff;
    font-weight: 600;
    border-bottom-color: #0054ff;
  }

  .detail-stack {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 20px;
  }

  .detail-card {
    border: 1px solid #dfe8f7;
    border-radius: 14px;
    background: #ffffff;
    box-shadow: 0 6px 20px rgba(15, 23, 42, 0.04);
  }

  .overview-card {
    min-height: 210px;
    padding: 28px 24px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 330px;
    align-items: center;
    gap: 24px;
    overflow: hidden;
  }

  .detail-card h2 {
    margin: 0 0 14px;
    color: #020b3d;
    font-size: 21px;
    font-weight: 700;
    line-height: 30px;
  }

  .overview-card p {
    max-width: 560px;
    margin: 0;
    color: #263d73;
    font-size: 15.5px;
    line-height: 26px;
  }

  .board-illustration {
    height: 162px;
    position: relative;
    background: radial-gradient(circle at 82% 80%, #dbeafe 0 30%, transparent 31%);
  }

  .mini-board {
    position: absolute;
    right: 42px;
    top: 26px;
    width: 220px;
    height: 144px;
    border-radius: 12px;
    border: 7px solid #9bbcff;
    background: #ffffff;
    box-shadow: 0 16px 30px rgba(37, 99, 235, 0.18);
    color: #0054ff;
    font-family: "Comic Sans MS", cursive;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    font-size: 17px;
  }

  .mini-board-box {
    border: 2px solid #0054ff;
    padding: 4px 14px;
    transform: rotate(-1deg);
  }

  .mini-pen {
    position: absolute;
    right: 55px;
    bottom: -2px;
    width: 14px;
    height: 72px;
    border-radius: 99px;
    background: linear-gradient(#0054ff 0 22%, #8cb2ff 22% 76%, #0054ff 76%);
    transform: rotate(28deg);
  }

  .flow-card {
    padding: 24px 26px 26px;
  }

  .lesson-flow {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-top: 22px;
  }

  .flow-step {
    width: 132px;
    text-align: center;
  }

  .step-icon-wrap {
    width: 82px;
    height: 82px;
    margin: 0 auto 16px;
    border-radius: 50%;
    background: #eef4ff;
    color: #0054ff;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  .step-number {
    position: absolute;
    left: -8px;
    bottom: -7px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #0054ff;
    color: #ffffff;
    font-size: 12px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .flow-step h3 {
    margin: 0 0 8px;
    color: #020b3d;
    font-size: 16px;
    font-weight: 700;
  }

  .flow-step p {
    margin: 0;
    color: #263d73;
    font-size: 14px;
    line-height: 22px;
  }

  .flow-arrow {
    margin-top: 35px;
    color: #334f87;
  }

  .tip-banner {
    min-height: 78px;
    padding: 18px 20px;
    border: 1px solid #dce9ff;
    border-radius: 12px;
    background: linear-gradient(135deg, #f7faff, #eef4ff);
    display: flex;
    align-items: center;
    gap: 18px;
  }

  .tip-banner h3 {
    margin: 0 0 5px;
    color: #020b3d;
    font-size: 18px;
    font-weight: 700;
  }

  .tip-banner p {
    margin: 0;
    color: #263d73;
    font-size: 14px;
  }

  .detail-sidebar {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-top: 70px;
  }

  .side-card {
    padding: 24px;
  }

  .side-card h2 {
    margin: 0 0 18px;
    color: #020b3d;
    font-size: 21px;
    font-weight: 700;
  }

  .teacher-card {
    text-align: center;
  }

  .teacher-card h2 {
    text-align: left;
  }

  .teacher-avatar {
    width: 116px;
    height: 116px;
    margin: 4px auto 12px;
    border-radius: 50%;
    background: url("/background_hero.png") 0% 48% / 420px 116px no-repeat;
  }

  .teacher-name {
    margin: 0;
    color: #0054ff;
    font-size: 24px;
    font-weight: 700;
  }

  .teacher-sub {
    margin: 5px 0 16px;
    color: #263d73;
    font-size: 15.5px;
  }

  .personality-box {
    padding: 14px;
    border-radius: 8px;
    background: linear-gradient(135deg, #f7faff, #eef4ff);
    color: #263d73;
    font-size: 14.5px;
    line-height: 24px;
  }

  .detail-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 12px 0;
    color: #263d73;
    font-size: 14.5px;
  }

  .detail-row:not(:last-child) {
    border-bottom: 1px solid #f1f5f9;
  }

  .detail-label {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    font-weight: 500;
  }

  .detail-value {
    color: #263d73;
    font-weight: 500;
    text-align: right;
  }

  .ready-card p {
    margin: -4px 0 18px;
    color: #263d73;
    font-size: 15px;
    line-height: 26px;
  }

  .start-button,
  .save-button {
    width: 100%;
    height: 52px;
    border-radius: 8px;
    font-family: "Outfit", sans-serif;
    font-size: 17px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    cursor: pointer;
  }

  .start-button {
    border: 0;
    background: #0054ff;
    color: #ffffff;
    box-shadow: 0 10px 28px rgba(37, 99, 235, 0.24);
  }

  .save-button {
    margin-top: 12px;
    border: 1px solid #dfe8f7;
    background: #ffffff;
    color: #0054ff;
  }

  .live-lesson {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    z-index: 9999;
    display: grid;
    grid-template-columns: 240px 250px minmax(520px, 1fr) 320px;
    overflow: hidden;
    background: #ffffff;
    color: #020b3d;
    font-family: "Outfit", sans-serif;
  }

  .live-main-sidebar {
    border-right: 1px solid #eef2f7;
    padding: 28px 18px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background: #ffffff;
  }

  .live-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #0054ff;
    font-size: 26px;
    font-weight: 700;
    margin-bottom: 62px;
  }

  .live-logo img {
    width: 48px;
    height: 48px;
    object-fit: contain;
  }

  .live-nav {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .live-nav-item,
  .live-logout {
    height: 48px;
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: #1d356c;
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 0 12px;
    font-family: "Outfit", sans-serif;
    font-size: 15px;
    font-weight: 500;
  }

  .live-nav-item.active {
    background: #0054ff;
    color: #ffffff;
  }

  .classroom-rail {
    border-right: 1px solid #eef2f7;
    padding: 96px 20px 28px;
    display: flex;
    flex-direction: column;
    background: #ffffff;
  }

  .rail-heading {
    margin: 0 0 22px;
    color: #020b3d;
    font-size: 15px;
    font-weight: 700;
  }

  .rail-item {
    height: 44px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: #1d356c;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 12px;
    font-family: "Outfit", sans-serif;
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 12px;
  }

  .rail-item.active {
    background: #eef4ff;
    color: #0054ff;
  }

  .lesson-progress-card {
    margin-top: auto;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 18px;
  }

  .lesson-progress-card h3 {
    margin: 0 0 16px;
    font-size: 13px;
    font-weight: 700;
  }

  .live-progress-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #0054ff;
    font-size: 16px;
    font-weight: 700;
  }

  .live-progress-track {
    height: 6px;
    margin: 12px 0 18px;
    border-radius: 99px;
    background: #e8eef8;
  }

  .live-progress-fill {
    width: 68%;
    height: 100%;
    border-radius: inherit;
    background: #0054ff;
  }

  .teacher-panel {
    border-right: 1px solid #eef2f7;
    padding: 96px 20px 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    overflow: auto;
    background: #ffffff;
  }

  .live-section-title {
    margin: 0;
    color: #020b3d;
    font-size: 15px;
    font-weight: 700;
  }

  .live-teacher-card,
  .teacher-message,
  .teacher-controls,
  .voice-panel {
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    background: #ffffff;
  }

  .live-teacher-card {
    padding: 12px;
    text-align: center;
  }

  .teacher-photo {
    height: 172px;
    border-radius: 10px;
    background: url("/background_hero.png") 0% 50% / 610px 172px no-repeat;
  }

  .live-teacher-card h2 {
    margin: 10px 0 4px;
    color: #020b3d;
    font-size: 16px;
    font-weight: 700;
  }

  .voice-bars {
    height: 18px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: #0054ff;
  }

  .voice-bars span {
    width: 3px;
    border-radius: 99px;
    background: currentColor;
    animation: voiceWave 1s ease-in-out infinite;
  }

  .voice-bars span:nth-child(2n) {
    animation-delay: 0.16s;
  }

  .voice-bars span:nth-child(3n) {
    animation-delay: 0.28s;
  }

  @keyframes voiceWave {
    0%, 100% { height: 5px; opacity: .55; }
    50% { height: 17px; opacity: 1; }
  }

  .speaking-badge {
    display: inline-flex;
    margin-top: 6px;
    padding: 5px 13px;
    border-radius: 999px;
    background: #dcfce7;
    color: #15803d;
    font-size: 12px;
    font-weight: 700;
  }

  .teacher-message {
    padding: 16px;
    background: #f8faff;
    color: #020b3d;
    font-size: 15px;
    line-height: 26px;
  }

  .teacher-controls {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    padding: 14px;
    gap: 12px;
  }

  .control-button {
    border: 0;
    background: transparent;
    color: #1d356c;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 7px;
    font-family: "Outfit", sans-serif;
    font-size: 11px;
  }

  .voice-panel {
    padding: 18px;
  }

  .voice-panel h3 {
    margin: 0 0 18px;
    font-size: 15px;
  }

  .wave-row {
    margin-top: 12px;
    display: grid;
    grid-template-columns: 1fr 28px;
    align-items: center;
    gap: 10px;
    color: #0054ff;
  }

  .wave-row.muted {
    color: #bfdbfe;
  }

  .wave-label {
    color: #334f87;
    font-size: 12px;
  }

  .whiteboard-zone {
    display: flex;
    flex-direction: column;
    padding: 96px 14px 14px;
    overflow: hidden;
    background: #ffffff;
  }

  .live-topbar {
    grid-column: 1 / -1;
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    height: 88px;
    border-bottom: 1px solid #eef2f7;
    background: #ffffff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 28px 0 30px;
    z-index: 2;
  }

  .live-title h1 {
    margin: 0 0 6px;
    font-size: 16px;
    font-weight: 700;
  }

  .live-title p {
    margin: 0;
    color: #334f87;
    font-size: 14px;
  }

  .live-dot {
    color: #0054ff;
    margin: 0 14px;
  }

  .top-actions {
    display: flex;
    gap: 16px;
    align-items: center;
  }

  .top-action,
  .end-lesson {
    height: 42px;
    border-radius: 8px;
    border: 1px solid #dfe8f7;
    background: #ffffff;
    color: #1d356c;
    padding: 0 16px;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-family: "Outfit", sans-serif;
    font-size: 14px;
    font-weight: 500;
  }

  .icon-action {
    width: 42px;
    padding: 0;
    justify-content: center;
  }

  .end-lesson {
    color: #ef4444;
    border-color: #fecaca;
  }

  .whiteboard-card {
    flex: 1;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    overflow: hidden;
    display: grid;
    grid-template-rows: 48px minmax(0, 1fr);
    min-height: 0;
  }

  .whiteboard-header {
    border-bottom: 1px solid #eef2f7;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 14px;
  }

  .whiteboard-header h2 {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
  }

  .tool-row {
    display: flex;
    align-items: center;
    gap: 12px;
    color: #334f87;
  }

  .tool-button {
    width: 34px;
    height: 34px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: inherit;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .tool-button.active {
    background: #eef4ff;
    color: #0054ff;
  }

  .board-canvas {
    position: relative;
    padding: 28px 38px 76px;
    overflow: hidden;
    background: #ffffff;
    font-family: "Comic Sans MS", "Bradley Hand ITC", cursive;
  }

  .board-canvas h3 {
    margin: 0 0 20px;
    color: #0f172a;
    font-size: 24px;
    font-weight: 500;
    text-decoration: underline;
    text-decoration-color: #0054ff;
    text-underline-offset: 8px;
  }

  .blue-write { color: #0054ff; }
  .black-write { color: #0f172a; }
  .red-write { color: #ef4444; }
  .green-write { color: #16a34a; }

  .equation-block {
    width: 520px;
    margin-left: 4px;
    color: #0f172a;
    font-size: 20px;
    line-height: 1.9;
  }

  .boxed-answer {
    display: inline-block;
    border: 2px solid #0054ff;
    padding: 2px 18px;
    margin: 8px 18px 0 86px;
  }

  .board-divider {
    height: 1px;
    background: #475569;
    margin: 20px 0;
  }

  .error-note {
    position: absolute;
    right: 44px;
    top: 620px;
    color: #ef4444;
    font-size: 18px;
    line-height: 1.35;
    transform: rotate(-3deg);
  }

  .drawing-toolbar {
    position: absolute;
    left: 34px;
    right: 34px;
    bottom: 18px;
    height: 58px;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    background: #ffffff;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
    display: flex;
    align-items: center;
    gap: 18px;
    padding: 0 18px;
  }

  .marker {
    width: 18px;
    height: 42px;
    border-radius: 8px 8px 4px 4px;
    background: linear-gradient(#111827 0 28%, #d1d5db 28%);
  }

  .color-dot {
    width: 20px;
    height: 20px;
    border-radius: 50%;
  }

  .chat-panel {
    border-left: 1px solid #eef2f7;
    padding-top: 96px;
    display: grid;
    grid-template-rows: 48px minmax(0, 1fr) 104px;
    background: #ffffff;
  }

  .chat-tabs {
    border: 1px solid #e2e8f0;
    border-bottom: 0;
    border-radius: 12px 12px 0 0;
    margin: 0 14px;
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .chat-tab {
    border: 0;
    border-bottom: 3px solid transparent;
    background: transparent;
    color: #334f87;
    font-family: "Outfit", sans-serif;
    font-size: 14px;
    font-weight: 600;
  }

  .chat-tab.active {
    color: #0054ff;
    border-bottom-color: #0054ff;
  }

  .chat-scroll {
    margin: 0 14px;
    border-left: 1px solid #e2e8f0;
    border-right: 1px solid #e2e8f0;
    padding: 22px 16px;
    overflow: auto;
    display: flex;
    flex-direction: column;
    gap: 22px;
  }

  .chat-message {
    display: flex;
    gap: 12px;
    color: #263d73;
    font-size: 13px;
    line-height: 23px;
  }

  .chat-avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: url("/background_hero.png") 0% 49% / 126px 34px no-repeat;
    flex: 0 0 auto;
  }

  .message-head {
    display: flex;
    justify-content: space-between;
    gap: 18px;
    color: #020b3d;
    font-weight: 700;
    margin-bottom: 5px;
  }

  .message-time {
    color: #64748b;
    font-weight: 400;
    white-space: nowrap;
  }

  .student-bubble {
    align-self: flex-end;
    max-width: 220px;
    padding: 14px;
    border-radius: 9px;
    background: #eef4ff;
    color: #020b3d;
    font-size: 13px;
    line-height: 23px;
  }

  .quick-replies {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: auto;
  }

  .quick-replies button {
    height: 30px;
    border: 1px solid #dfe8f7;
    border-radius: 7px;
    background: #ffffff;
    color: #334f87;
    padding: 0 12px;
    font-family: "Outfit", sans-serif;
    font-size: 12px;
  }

  .chat-input-wrap {
    margin: 0 14px 14px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 12px;
  }

  .chat-input {
    width: 100%;
    border: 0;
    outline: 0;
    font-family: "Outfit", sans-serif;
    font-size: 13px;
    color: #020b3d;
  }

  .chat-input-actions {
    margin-top: 18px;
    display: flex;
    justify-content: space-between;
    color: #0054ff;
  }

  .subjects-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 32px;
  }

  .subjects-title {
    margin: 0;
    color: #020b3d;
    font-size: 22px;
    font-weight: 700;
    line-height: 32px;
  }

  .sort-wrap {
    display: flex;
    align-items: center;
    gap: 16px;
    color: #263d73;
    font-size: 16px;
    font-weight: 400;
  }

  .sort-select {
    height: 48px;
    min-width: 224px;
    padding: 0 17px;
    border: 1px solid #dce6f8;
    border-radius: 10px;
    background: #ffffff;
    color: #020b3d;
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    font-size: 17px;
    font-weight: 500;
  }

  .subject-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px;
  }

  .subject-card {
    min-height: 252px;
    padding: 24px;
    border: 1px solid #dfe8f7;
    border-radius: 14px;
    background: #ffffff;
    box-shadow: 0 6px 18px rgba(15, 23, 42, 0.035);
    display: flex;
    flex-direction: column;
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  }

  .subject-card:hover {
    transform: translateY(-3px);
    border-color: #cfe0ff;
    box-shadow: 0 20px 50px rgba(37, 99, 235, 0.08);
  }

  .subject-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
  }

  .subject-intro {
    display: grid;
    grid-template-columns: 72px minmax(0, 1fr);
    gap: 16px;
    align-items: start;
    min-width: 0;
  }

  .subject-icon {
    width: 64px;
    height: 64px;
    border-radius: 13px;
    background: #eef4ff;
    color: #0054ff;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .subject-name {
    margin: 5px 0 8px;
    color: #020b3d;
    font-size: 20px;
    font-weight: 700;
    line-height: 28px;
    letter-spacing: -0.02em;
  }

  .subject-description {
    margin: 0;
    color: #263d73;
    font-size: 15.5px;
    font-weight: 400;
    line-height: 24px;
  }

  .subject-arrow {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 1px solid #dfe8f7;
    background: #ffffff;
    color: #263d73;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex: 0 0 auto;
  }

  .progress-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 32px;
    color: #263d73;
    font-size: 15.5px;
    font-weight: 400;
  }

  .progress-value {
    font-weight: 500;
  }

  .progress-track {
    height: 7px;
    margin-top: 13px;
    border-radius: 20px;
    overflow: hidden;
    background: #e8eef8;
  }

  .progress-fill {
    height: 100%;
    border-radius: inherit;
    background: #0054ff;
  }

  .subject-bottom {
    margin-top: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #263d73;
    font-size: 15px;
    font-weight: 400;
  }

  .lesson-count {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .subject-level {
    color: #0054ff;
    font-weight: 500;
  }

  .coming-copy {
    margin-top: auto;
    color: #263d73;
    font-size: 16px;
    line-height: 25px;
  }

  .content-list-view {
    padding: 32px 40px;
    height: 100%;
    overflow-y: auto;
    background: #ffffff;
    display: flex;
    flex-direction: column;
  }

  .content-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
    margin-top: 64px;
  }

  .content-header h2 {
    margin: 0;
    color: #020b3d;
    font-size: 20px;
    font-weight: 700;
  }

  .content-search {
    position: relative;
    width: 280px;
  }

  .content-search input {
    width: 100%;
    height: 40px;
    padding: 0 16px 0 40px;
    border: 1px solid #eef2f7;
    border-radius: 8px;
    background: #f8faff;
    color: #020b3d;
    font-family: "Outfit", sans-serif;
    font-size: 14px;
    transition: all 0.2s ease;
  }

  .content-search input:focus {
    outline: none;
    border-color: #0054ff;
    background: #ffffff;
    box-shadow: 0 0 0 3px rgba(0, 84, 255, 0.1);
  }

  .content-search svg {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
  }

  .content-tabs {
    display: flex;
    align-items: center;
    gap: 32px;
    border-bottom: 1px solid #eef2f7;
    margin-bottom: 32px;
  }

  .content-tab {
    padding: 0 0 16px;
    border: 0;
    background: transparent;
    color: #64748b;
    font-size: 15px;
    font-weight: 500;
    position: relative;
    cursor: pointer;
    font-family: "Outfit", sans-serif;
    transition: color 0.2s ease;
  }

  .content-tab:hover {
    color: #020b3d;
  }

  .content-tab.active {
    color: #0054ff;
    font-weight: 600;
  }

  .content-tab.active::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    width: 100%;
    height: 2px;
    background: #0054ff;
    border-radius: 2px 2px 0 0;
  }

  .content-cards-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .content-card {
    display: flex;
    align-items: center;
    padding: 24px;
    border: 1px solid #eef2f7;
    border-radius: 12px;
    background: #ffffff;
    transition: all 0.2s ease;
  }

  .content-card:hover {
    border-color: #cfe0ff;
    box-shadow: 0 8px 24px rgba(37, 99, 235, 0.04);
    transform: translateY(-2px);
  }

  .content-card-icon {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    background: #f8faff;
    border: 1px solid #eef2f7;
    color: #0054ff;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 24px;
    flex-shrink: 0;
  }

  .content-card-info {
    flex: 1;
    min-width: 0;
    margin-right: 24px;
  }

  .content-card-title {
    margin: 0 0 6px;
    color: #020b3d;
    font-size: 16px;
    font-weight: 600;
  }

  .content-card-desc {
    margin: 0 0 8px;
    color: #475569;
    font-size: 14px;
    line-height: 1.5;
  }

  .content-card-meta {
    margin: 0;
    color: #64748b;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .content-card-meta span:first-child {
    color: #0054ff;
    font-weight: 500;
  }

  .content-card-btn {
    padding: 8px 24px;
    border: 1px solid #eef2f7;
    border-radius: 8px;
    background: #ffffff;
    color: #0054ff;
    font-size: 14px;
    font-weight: 600;
    font-family: "Outfit", sans-serif;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .content-card-btn:hover {
    background: #f8faff;
    border-color: #cfe0ff;
  }

  .whiteboard-sidebar {
    border-left: 1px solid #eef2f7;
    padding: 96px 20px 20px;
    display: flex;
    flex-direction: column;
    gap: 32px;
    overflow: auto;
    background: #ffffff;
  }

  .wb-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .wb-section h3 {
    margin: 0;
    color: #020b3d;
    font-size: 15px;
    font-weight: 700;
  }

  .wb-tools-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 10px;
  }

  .wb-tool-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 78px;
    border: 1px solid #eef2f7;
    border-radius: 12px;
    background: #ffffff;
    color: #334f87;
    font-family: "Outfit", sans-serif;
    font-size: 12px;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .wb-tool-btn:hover {
    border-color: #cfe0ff;
    background: #f8faff;
  }

  .wb-tool-btn.active {
    border-color: #0054ff;
    background: #eef4ff;
    color: #0054ff;
  }

  .wb-pages-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .wb-new-page {
    display: flex;
    align-items: center;
    gap: 4px;
    border: 0;
    background: transparent;
    color: #0054ff;
    font-size: 13px;
    font-weight: 600;
  }

  .wb-pages-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .wb-page-card {
    display: flex;
    align-items: stretch;
    border: 1px solid #eef2f7;
    border-radius: 10px;
    padding: 14px;
    gap: 14px;
    background: #ffffff;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .wb-page-card.active {
    border-color: #0054ff;
    background: #f8faff;
  }

  .wb-page-num {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #eef2f7;
    color: #334f87;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    flex: 0 0 auto;
  }

  .wb-page-card.active .wb-page-num {
    background: #0054ff;
    color: #ffffff;
  }

  .wb-page-preview {
    flex: 1;
    min-width: 0;
  }
  
  .fake-preview-title {
    color: #020b3d;
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .fake-preview-subtitle {
    color: #64748b;
    font-size: 11px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .wb-sidebar-footer {
    margin-top: auto;
    padding-top: 16px;
  }

  .wb-clear-btn {
    width: 100%;
    height: 44px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #ffffff;
    color: #0054ff;
    font-size: 14px;
    font-weight: 600;
    font-family: "Outfit", sans-serif;
  }
  .wb-clear-btn:hover {
    background: #f8faff;
  }

  @media (max-width: 1180px) {
    .lessons-page {
      padding: 24px;
    }

    .lessons-header {
      padding-left: 0;
    }

    .subject-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 760px) {
    .lessons-header,
    .subjects-toolbar {
      flex-direction: column;
      align-items: flex-start;
    }

    .lessons-header {
      padding: 0;
      gap: 20px;
    }

    .lessons-content {
      padding: 0;
    }

    .subject-grid {
      grid-template-columns: 1fr;
    }
  }
`;

const SubjectCard = ({ subject, onOpen }) => {
  const Icon = subject.icon;

  return (
    <article className="subject-card" onClick={() => !subject.comingSoon && onOpen(subject)}>
      <div className="subject-top">
        <div className="subject-intro">
          <div className="subject-icon">
            <Icon size={32} strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="subject-name">{subject.name}</h2>
            <p className="subject-description">{subject.description}</p>
          </div>
        </div>
        <button
          type="button"
          className="subject-arrow"
          aria-label={`Open ${subject.name}`}
          onClick={(event) => {
            event.stopPropagation();
            if (!subject.comingSoon) onOpen(subject);
          }}
        >
          <ArrowRight size={22} />
        </button>
      </div>

      {subject.comingSoon ? (
        <p className="coming-copy">Stay tuned for more exciting subjects!</p>
      ) : (
        <>
          <div className="progress-row">
            <span>Progress</span>
            <span className="progress-value">{subject.progress}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${subject.progress}%` }} />
          </div>
          <div className="subject-bottom">
            <span className="lesson-count">
              <Clock3 size={18} />
              {subject.lessons} lessons
            </span>
            <span className="subject-level">{subject.level}</span>
          </div>
        </>
      )}
    </article>
  );
};

const VoiceBars = ({ muted = false }) => (
  <div className={`voice-bars${muted ? " muted" : ""}`} aria-hidden="true">
    {[8, 14, 9, 18, 11, 16, 7, 15, 10, 18, 8, 13].map((height, index) => (
      <span key={index} style={{ height }} />
    ))}
  </div>
);

const ContentListView = ({ type }) => {
  const [activeTab, setActiveTab] = useState("All");

  const mockData = {
    Resources: [
      { id: 1, title: "Linear Equations - Study Guide", desc: "A comprehensive guide covering key concepts, formulas, and step-by-step methods.", type: "pdf", size: "2.4 MB" },
      { id: 2, title: "Introduction to Linear Equations", desc: "Watch this short video to understand what linear equations are and how they work.", type: "video", size: "8:12" },
      { id: 3, title: "Practice Worksheet 1", desc: "Solve basic linear equations with one variable. Includes solutions.", type: "pdf", size: "1.1 MB" },
      { id: 4, title: "Real-World Examples", desc: "See how linear equations are used in everyday life with real-world problems.", type: "pdf", size: "1.6 MB" },
      { id: 5, title: "Solving Linear Equations - Full Lesson", desc: "Complete lesson walkthrough with examples and explanations.", type: "video", size: "24:18" },
      { id: 6, title: "Quick Reference Sheet", desc: "Formulas and steps summary for quick revision.", type: "pdf", size: "0.6 MB" },
    ],
    "Lesson Notes": [
      { id: 1, title: "Class Notes - Module 3 Lesson 1", desc: "Introduction to algebra and variables.", type: "pdf", size: "1.2 MB" },
      { id: 2, title: "Class Notes - Module 3 Lesson 2", desc: "Balancing equations and simple operations.", type: "pdf", size: "1.5 MB" },
      { id: 3, title: "Teacher's Highlights", desc: "Important things to remember for the upcoming quiz.", type: "pdf", size: "0.8 MB" },
    ],
    Homework: [
      { id: 1, title: "Homework Assignment 3", desc: "Complete problems 1-15 in the workbook.", type: "pdf", size: "1.0 MB" },
      { id: 2, title: "Extra Credit - Word Problems", desc: "Optional word problems for extra credit points.", type: "pdf", size: "0.5 MB" },
      { id: 3, title: "Video Solution Guide", desc: "Step by step video solving the homework problems.", type: "video", size: "12:05" },
    ]
  };

  const tabs = ["All " + type, "Guides", "Worksheets", "Videos", "Examples", "Practice"];
  const items = mockData[type] || mockData.Resources;

  return (
    <div className="content-list-view">
      <div className="content-header">
        <h2>{type}</h2>
        <div className="content-search">
          <Search size={18} />
          <input placeholder={`Search ${type.toLowerCase()}...`} />
        </div>
      </div>
      
      <div className="content-tabs">
        {tabs.map((tab, i) => (
          <button 
            key={i} 
            className={`content-tab${activeTab === tab ? " active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="content-cards-container">
        {items.map(item => (
          <div className="content-card" key={item.id}>
            <div className="content-card-icon">
              {item.type === "video" ? <PlaySquare size={28} strokeWidth={1.5} /> : <File size={28} strokeWidth={1.5} />}
            </div>
            <div className="content-card-info">
              <h3 className="content-card-title">{item.title}</h3>
              <p className="content-card-desc">{item.desc}</p>
              <p className="content-card-meta">
                <span>{item.type === "video" ? "Video" : "PDF"}</span>
                <span>•</span>
                <span>{item.size}</span>
              </p>
            </div>
            <button className="content-card-btn">View</button>
          </div>
        ))}
      </div>
    </div>
  );
};

const WhiteboardSidebar = ({ activeTool, setActiveTool, onClear }) => {
  const tools = [
    { id: "pointer", icon: MousePointer2, label: "Select" },
    { id: "pen", icon: PenLine, label: "Pen" },
    { id: "highlighter", icon: Highlighter, label: "Highlighter" },
    { id: "eraser", icon: Eraser, label: "Eraser" },
    { id: "type", icon: Type, label: "Text" },
    { id: "shapes", icon: Shapes, label: "Shapes" },
  ];

  return (
    <aside className="whiteboard-sidebar">
      <div className="wb-section">
        <h3>Tools</h3>
        <div className="wb-tools-grid">
          {tools.map((t) => (
            <button
              key={t.id}
              className={`wb-tool-btn${activeTool === t.id ? " active" : ""}`}
              onClick={() => setActiveTool(t.id)}
            >
              <t.icon size={22} strokeWidth={1.5} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="wb-section">
        <div className="wb-pages-header">
          <h3>Whiteboard Pages</h3>
          <button className="wb-new-page"><Plus size={14} /> New Page</button>
        </div>
        <div className="wb-pages-list">
          <div className="wb-page-card active">
            <div className="wb-page-num">1</div>
            <div className="wb-page-preview">
               <div className="fake-preview-title">Solving Linear Equations</div>
               <div className="fake-preview-subtitle">Example 1:</div>
            </div>
          </div>
          <div className="wb-page-card">
            <div className="wb-page-num">2</div>
            <div className="wb-page-preview">
               <div className="fake-preview-title">More Examples</div>
               <div className="fake-preview-subtitle">4x + 2 = 18</div>
            </div>
          </div>
          <div className="wb-page-card">
            <div className="wb-page-num">3</div>
            <div className="wb-page-preview">
               <div className="fake-preview-title">Word Problem</div>
               <div className="fake-preview-subtitle">John has x apples...</div>
            </div>
          </div>
          <div className="wb-page-card">
            <div className="wb-page-num">4</div>
            <div className="wb-page-preview">
               <div className="fake-preview-title">Practice Time</div>
               <div className="fake-preview-subtitle">Solve for x:</div>
            </div>
          </div>
        </div>
      </div>

      <div className="wb-sidebar-footer">
        <button className="wb-clear-btn" onClick={onClear}>Clear Whiteboard</button>
      </div>
    </aside>
  );
};

const InteractiveWhiteboard = ({ activeTool, setActiveTool, activeColor, setActiveColor, clearTrigger }) => {
  const containerRef = React.useRef(null);

  const [lines, setLines] = useState([]);
  const [history, setHistory] = useState([[]]);
  const [historyStep, setHistoryStep] = useState(0);
  const isDrawing = React.useRef(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      const rect = container.getBoundingClientRect();
      setDimensions({ width: rect.width, height: rect.height });
    };

    updateDimensions();
    const observer = new ResizeObserver(updateDimensions);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (clearTrigger > 0) {
      saveHistory([]);
      setLines([]);
    }
  }, [clearTrigger]);

  const saveHistory = (newLines) => {
    const nextHistory = history.slice(0, historyStep + 1);
    nextHistory.push(newLines);
    setHistory(nextHistory);
    setHistoryStep(nextHistory.length - 1);
  };

  const handlePointerDown = (e) => {
    if (activeTool === "pointer") return;
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    setLines([...lines, {
      tool: activeTool,
      color: activeColor,
      points: [pos.x, pos.y]
    }]);
  };

  const handlePointerMove = (e) => {
    if (!isDrawing.current || activeTool === "pointer") return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    let lastLine = lines[lines.length - 1];

    // add point
    lastLine.points = lastLine.points.concat([point.x, point.y]);

    // replace last
    lines.splice(lines.length - 1, 1, lastLine);
    setLines(lines.concat());
  };

  const handlePointerUp = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    saveHistory(lines);
  };

  const handleUndo = () => {
    if (historyStep > 0) {
      setHistoryStep(historyStep - 1);
      setLines(history[historyStep - 1]);
    }
  };

  const handleRedo = () => {
    if (historyStep < history.length - 1) {
      setHistoryStep(historyStep + 1);
      setLines(history[historyStep + 1]);
    }
  };

  const handleClear = () => {
    saveHistory([]);
    setLines([]);
  };

  const headerTools = [
    { id: "undo", icon: Undo2, label: "Undo", action: handleUndo },
    { id: "redo", icon: Redo2, label: "Redo", action: handleRedo },
    { id: "clear", icon: Trash2, label: "Clear Board", action: handleClear },
    { id: "maximize", icon: Expand, label: "Maximize", action: () => {} },
  ];

  const markers = [
    { color: "#0f172a", gradient: "linear-gradient(#111827 0 28%, #d1d5db 28%)", label: "Black Marker" },
    { color: "#0054ff", gradient: "linear-gradient(#0054ff 0 28%, #bfdbfe 28%)", label: "Blue Marker" },
    { color: "#16a34a", gradient: "linear-gradient(#16a34a 0 28%, #bbf7d0 28%)", label: "Green Marker" },
    { color: "#ef4444", gradient: "linear-gradient(#ef4444 0 28%, #fecaca 28%)", label: "Red Marker" },
  ];

  const colorDots = [
    { color: "#000000", label: "Black" },
    { color: "#0054ff", label: "Blue" },
    { color: "#22c55e", label: "Green" },
    { color: "#ef4444", label: "Red" },
    { color: "#8b5cf6", label: "Purple" },
  ];

  return (
    <article className="whiteboard-card">
      <div className="whiteboard-header">
        <h2>Whiteboard</h2>
        <div className="tool-row">
          {headerTools.map((item) => {
            const Icon = item.icon;
            return (
              <button
                type="button"
                className="tool-button"
                key={item.id}
                title={item.label}
                onClick={item.action}
              >
                <Icon size={20} />
              </button>
            );
          })}
        </div>
      </div>
      <div className="board-canvas" ref={containerRef} style={{ position: "relative" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 5,
            cursor: activeTool === "pen" || activeTool === "highlighter" ? "crosshair" : activeTool === "eraser" ? "cell" : "default",
            pointerEvents: activeTool === "pointer" ? "none" : "auto",
            touchAction: "none",
          }}
        >
          {dimensions.width > 0 && dimensions.height > 0 && (
            <Stage
              width={dimensions.width}
              height={dimensions.height}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              <Layer>
                {lines.map((line, i) => (
                  <Line
                    key={i}
                    points={line.points}
                    stroke={line.color}
                    strokeWidth={line.tool === "highlighter" ? 28 : line.tool === "eraser" ? 36 : 3.5}
                    tension={0.5}
                    lineCap="round"
                    lineJoin="round"
                    globalCompositeOperation={
                      line.tool === "eraser" ? "destination-out" : "source-over"
                    }
                    opacity={line.tool === "highlighter" ? 0.4 : 1}
                  />
                ))}
              </Layer>
            </Stage>
          )}
        </div>
        <div style={{ position: "relative", zIndex: 1, pointerEvents: "none", userSelect: "none" }}>
          <h3>Solving Linear Equations</h3>
          <div className="equation-block">
            <p className="blue-write">Example 1:</p>
            <p style={{ textAlign: "center" }}>2x + 3 = 11</p>
            <p className="blue-write">Step 1: Subtract 3 from both sides</p>
            <p style={{ textAlign: "center" }}>
              2x + 3 <span className="red-write">- 3</span> = 11 <span className="red-write">- 3</span>
            </p>
            <p style={{ textAlign: "center" }}>2x = 8</p>
            <p className="blue-write">Step 2: Divide both sides by 2</p>
            <p style={{ textAlign: "center" }}>
              <span style={{ textDecoration: "underline" }}>2x</span> ={" "}
              <span style={{ textDecoration: "underline" }}>8</span>
            </p>
            <p>
              <span className="boxed-answer">x = 4</span>
              <span className="green-write">✓ Solution!</span>
            </p>
            <div className="board-divider" />
            <p className="blue-write">Example 2:</p>
            <p style={{ textAlign: "center" }}>3x - 5 = 10</p>
            <p style={{ textAlign: "center" }}>
              3x - 5 <span className="red-write">+ 5</span> = 10 <span className="red-write">+ 5</span>
            </p>
            <p style={{ textAlign: "center" }}>3x = 15</p>
            <p style={{ textAlign: "center" }}>
              <span style={{ border: "2px solid #ef4444", borderRadius: "50%", padding: "2px 28px" }}>x = 5</span>
            </p>
            <p className="blue-write">Correct solution:</p>
            <p>3x = 15 ⇒ x = 15/3 ⇒ <span className="boxed-answer" style={{ marginLeft: 12 }}>x = 5</span></p>
          </div>
          <div className="error-note">
            Careful! You need to
            <br />
            divide by 3, not 1.
          </div>
        </div>

        <div className="drawing-toolbar" style={{ zIndex: 10 }}>
          {markers.map((m) => (
            <button
              key={m.color}
              type="button"
              onClick={() => {
                setActiveColor(m.color);
                setActiveTool("pen");
              }}
              style={{
                border: 0,
                background: "transparent",
                padding: 0,
                cursor: "pointer",
              }}
              title={m.label}
            >
              <div
                className="marker"
                style={{
                  background: m.gradient,
                  transform: activeColor === m.color && activeTool === "pen" ? "translateY(-4px)" : "none",
                  boxShadow: activeColor === m.color && activeTool === "pen" ? "0 4px 10px rgba(0,84,255,0.3)" : "none",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                }}
              />
            </button>
          ))}
          {colorDots.map((c) => (
            <button
              key={c.color}
              type="button"
              onClick={() => {
                setActiveColor(c.color);
                setActiveTool("pen");
              }}
              style={{
                border: 0,
                background: "transparent",
                padding: 0,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title={c.label}
            >
              <span
                className="color-dot"
                style={{
                  background: c.color,
                  transform: activeColor === c.color && activeTool === "pen" ? "scale(1.3)" : "scale(1)",
                  boxShadow: activeColor === c.color && activeTool === "pen" ? "0 0 0 3px rgba(0, 84, 255, 0.35)" : "none",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                }}
              />
            </button>
          ))}
          <button
            type="button"
            className="tool-button"
            style={{ border: "1px solid #dfe8f7", marginLeft: "auto" }}
            title="Clear Board"
            onClick={handleClear}
          >
            <Plus size={20} />
          </button>
        </div>
      </div>
    </article>
  );
};

const LiveLesson = ({ onEnd }) => {
  const [activeRailTab, setActiveRailTab] = useState("Whiteboard");
  const [activeTool, setActiveTool] = useState("pen");
  const [activeColor, setActiveColor] = useState("#0054ff");
  const [clearTrigger, setClearTrigger] = useState(0);

  const railItems = [
    { label: "Overview", icon: Home },
    { label: "Whiteboard", icon: PenLine },
    { label: "Resources", icon: FileText },
    { label: "Lesson Notes", icon: BookOpen },
    { label: "Homework", icon: ClipboardList },
  ];

  const isWhiteboard = activeRailTab === "Whiteboard";

  return (
    <main 
      className="live-lesson"
      style={{
        gridTemplateColumns: isWhiteboard
          ? "240px minmax(520px, 1fr) 320px"
          : "240px 250px minmax(520px, 1fr) 320px",
      }}
    >
      <style>{styles}</style>

      <header className="live-topbar">
        <div className="live-title">
          <h1>
            Linear Equations <span className="live-dot">•</span>
            <span style={{ color: "#0054ff" }}>Live Lesson</span>
          </h1>
          <p>Module 3 • Lesson 3</p>
        </div>
        <div className="top-actions">
          <button type="button" className="top-action">
            <Hand size={19} color="#0054ff" />
            Raise Hand
          </button>
          <button type="button" className="top-action icon-action">
            <Volume2 size={19} />
          </button>
          <button type="button" className="top-action icon-action">
            <Settings size={19} />
          </button>
          <button type="button" className="end-lesson" onClick={onEnd}>
            <Phone size={18} />
            End Lesson
          </button>
        </div>
      </header>

      <aside className="classroom-rail">
        <h2 className="rail-heading">Classroom</h2>
        {railItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeRailTab === item.label;
          return (
            <button
              type="button"
              className={`rail-item${isActive ? " active" : ""}`}
              key={item.label}
              onClick={() => setActiveRailTab(item.label)}
            >
              <Icon size={19} />
              {item.label}
            </button>
          );
        })}
        <div className="lesson-progress-card">
          <h3>Lesson Progress</h3>
          <div className="live-progress-row">
            <span />
            <span>68%</span>
          </div>
          <div className="live-progress-track">
            <div className="live-progress-fill" />
          </div>
          <p style={{ margin: 0, color: "#334f87", fontSize: 12 }}>You're doing great! 🎉</p>
        </div>
      </aside>

      {!isWhiteboard && (
        <section className="teacher-panel">
          <h2 className="live-section-title">Teacher</h2>
          <article className="live-teacher-card">
            <div className="teacher-photo" />
            <h2>TutorFlow AI</h2>
            <VoiceBars />
            <br />
            <span className="speaking-badge">• Speaking</span>
          </article>
          <article className="teacher-message">
            Today we are learning how to solve linear equations.
          </article>
          <div className="teacher-controls">
            {[
              { label: "Mute", icon: Mic },
              { label: "Camera", icon: Video },
              { label: "Settings", icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button type="button" className="control-button" key={item.label}>
                  <Icon size={22} />
                  {item.label}
                </button>
              );
            })}
          </div>
          <article className="voice-panel">
            <h3>Voice & Audio</h3>
            <span className="wave-label">AI Teacher</span>
            <div className="wave-row">
              <VoiceBars />
              <Volume2 size={18} />
            </div>
            <span className="wave-label" style={{ display: "block", marginTop: 16 }}>You</span>
            <div className="wave-row muted">
              <VoiceBars muted />
              <Mic size={18} />
            </div>
          </article>
        </section>
      )}

      <section className="whiteboard-zone">
        {(activeRailTab === "Resources" || activeRailTab === "Lesson Notes" || activeRailTab === "Homework") ? (
          <ContentListView type={activeRailTab} />
        ) : (
          <InteractiveWhiteboard 
            activeTool={activeTool} 
            setActiveTool={setActiveTool} 
            activeColor={activeColor}
            setActiveColor={setActiveColor}
            clearTrigger={clearTrigger} 
          />
        )}
      </section>

      {isWhiteboard ? (
        <WhiteboardSidebar 
          activeTool={activeTool} 
          setActiveTool={setActiveTool} 
          onClear={() => setClearTrigger(t => t + 1)} 
        />
      ) : (
        <aside className="chat-panel">
          <div className="chat-tabs">
            <button type="button" className="chat-tab active">Class Chat</button>
            <button type="button" className="chat-tab">Transcript</button>
          </div>
          <div className="chat-scroll">
            {[
              ["TutorFlow AI", "10:02 AM", "Let's solve this together. Remember, we want to isolate the variable on one side."],
              ["TutorFlow AI", "10:04 AM", "Good question! We subtract 3 from both sides to keep the equation balanced."],
              ["TutorFlow AI", "10:05 AM", "Great! Let's try the next one together. I'll guide you step by step."],
            ].map((message) => (
              <div className="chat-message" key={message[1]}>
                <div className="chat-avatar" />
                <div>
                  <div className="message-head">
                    <span>{message[0]}</span>
                    <span className="message-time">{message[1]}</span>
                  </div>
                  <p style={{ margin: 0 }}>{message[2]}</p>
                </div>
              </div>
            ))}
            <div className="student-bubble">
              <div className="message-head">
                <span>You</span>
                <span className="message-time">10:03 AM</span>
              </div>
              I don't understand why we subtract 3 from both sides.
            </div>
            <div className="student-bubble">
              <div className="message-head">
                <span>You</span>
                <span className="message-time">10:05 AM</span>
              </div>
              Ohh, that makes sense now!
            </div>
            <div className="quick-replies">
              <button type="button">Explain again</button>
              <button type="button">More examples</button>
              <button type="button">What is a linear equation?</button>
            </div>
          </div>
          <div className="chat-input-wrap">
            <input className="chat-input" placeholder="Type a message..." />
            <div className="chat-input-actions">
              <Mic size={18} />
              <Send size={18} />
            </div>
          </div>
        </aside>
      )}
    </main>
  );
};

const AIClassroom = () => {
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [liveLesson, setLiveLesson] = useState(false);

  if (liveLesson) {
    return <LiveLesson onEnd={() => setLiveLesson(false)} />;
  }

  if (selectedSubject) {
    return (
      <main className="lesson-detail-page">
        <style>{styles}</style>

        <div className="detail-top-actions">
          <button type="button" className="lessons-bell" aria-label="Notifications">
            <Bell size={30} strokeWidth={1.75} />
          </button>
          <button type="button" className="lessons-avatar" aria-label="Profile">
            <User size={35} fill="currentColor" strokeWidth={0} />
          </button>
        </div>

        <section>
          <button type="button" className="back-button" onClick={() => setSelectedSubject(null)}>
            <ArrowRight size={20} style={{ transform: "rotate(180deg)" }} />
            Back to My Lessons
          </button>

          <div className="lesson-hero">
            <div className="lesson-icon-large">ax+by=c</div>
            <div>
              <p className="lesson-kicker">Algebra • Module 3 • Lesson 3</p>
              <h1 className="lesson-title-large">Linear Equations</h1>
              <p className="lesson-description-large">
                Learn how to solve linear equations in one variable and apply them to
                real-world problems.
              </p>
              <div className="lesson-meta">
                <span className="lesson-meta-item">
                  <Clock3 size={17} />
                  35 min
                </span>
                <span className="meta-divider" />
                <span className="lesson-meta-item">
                  <BarChart3 size={17} />
                  Beginner
                </span>
                <span className="meta-divider" />
                <span className="status-badge">In Progress</span>
              </div>
            </div>
          </div>

          <nav className="detail-tabs" aria-label="Lesson sections">
            {["Overview", "Objectives", "Skills You’ll Learn", "Resources", "Preview"].map(
              (tab, index) => (
                <button
                  type="button"
                  className={`detail-tab${index === 0 ? " active" : ""}`}
                  key={tab}
                >
                  {tab}
                </button>
              )
            )}
          </nav>

          <div className="detail-stack">
            <article className="detail-card overview-card">
              <div>
                <h2>Overview</h2>
                <p>
                  In this lesson, you’ll learn what linear equations are, how to solve
                  them step by step, and how to check your solutions. You’ll also solve
                  real-world examples to strengthen your understanding.
                </p>
              </div>
              <div className="board-illustration" aria-hidden="true">
                <div className="mini-board">
                  <span>2x + 3 = 11</span>
                  <span>2x = 8</span>
                  <span className="mini-board-box">x = 4</span>
                </div>
                <div className="mini-pen" />
              </div>
            </article>

            <article className="detail-card flow-card">
              <h2>What you’ll do in this lesson</h2>
              <div className="lesson-flow">
                {[
                  { title: "Watch", text: "Watch your AI Teacher explain the concept.", icon: Play },
                  { title: "Practice", text: "Solve guided examples together.", icon: PenLine },
                  { title: "Apply", text: "Answer practice questions.", icon: BookOpen },
                  { title: "Master", text: "Complete a quick quiz to level up.", icon: Trophy },
                ].map((step, index, array) => {
                  const Icon = step.icon;
                  return (
                    <React.Fragment key={step.title}>
                      <div className="flow-step">
                        <div className="step-icon-wrap">
                          <Icon size={32} />
                          <span className="step-number">{index + 1}</span>
                        </div>
                        <h3>{step.title}</h3>
                        <p>{step.text}</p>
                      </div>
                      {index < array.length - 1 && (
                        <ArrowRight className="flow-arrow" size={22} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </article>

            <aside className="tip-banner">
              <Sparkles size={30} color="#0054ff" />
              <div>
                <h3>Tip</h3>
                <p>Take notes on the key steps and ask questions anytime during the lesson.</p>
              </div>
            </aside>
          </div>
        </section>

        <aside className="detail-sidebar">
          <article className="detail-card side-card teacher-card">
            <h2>Your Teacher</h2>
            <div className="teacher-avatar" />
            <p className="teacher-name">TutorFlow AI</p>
            <p className="teacher-sub">Your personal AI Teacher</p>
            <div className="personality-box">
              Patient • Supportive • Clear
              <br />
              Always here to help you succeed.
            </div>
          </article>

          <article className="detail-card side-card">
            <h2>Lesson Details</h2>
            {[
              { label: "Subject", value: "Algebra", icon: BookOpen },
              { label: "Module", value: "Module 3: Linear Equations", icon: GraduationCap },
              { label: "Lesson", value: "Lesson 3 of 9", icon: Calculator },
              { label: "Level", value: "Beginner", icon: BarChart3 },
              { label: "Estimated Time", value: "35 minutes", icon: Clock3 },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div className="detail-row" key={item.label}>
                  <span className="detail-label">
                    <Icon size={17} />
                    {item.label}
                  </span>
                  <span className="detail-value">{item.value}</span>
                </div>
              );
            })}
          </article>

          <article className="detail-card side-card ready-card">
            <h2>Ready to begin?</h2>
            <p>Join your AI Teacher and start learning at your own pace.</p>
            <button type="button" className="start-button" onClick={() => setLiveLesson(true)}>
              <Play size={20} fill="currentColor" strokeWidth={0} />
              Start Lesson
            </button>
            <button type="button" className="save-button">
              <Bookmark size={20} />
              Save for Later
            </button>
          </article>
        </aside>
      </main>
    );
  }

  return (
    <main className="lessons-page">
      <style>{styles}</style>

      <header className="lessons-header">
        <div>
          <h1 className="lessons-title">My Lessons</h1>
          <p className="lessons-subtitle">All your subjects and courses in one place.</p>
        </div>

        <div className="lessons-actions">
          <button type="button" className="lessons-bell" aria-label="Notifications">
            <Bell size={30} strokeWidth={1.75} />
          </button>
          <button type="button" className="lessons-avatar" aria-label="Profile">
            <User size={35} fill="currentColor" strokeWidth={0} />
          </button>
        </div>
      </header>

      <section className="lessons-content">
        <div className="subjects-toolbar">
          <h2 className="subjects-title">Your Subjects</h2>
          <div className="sort-wrap">
            <span>Sort by</span>
            <button type="button" className="sort-select">
              Recently Accessed
              <ChevronDown size={20} color="#9aa9c3" />
            </button>
          </div>
        </div>

        <div className="subject-grid">
          {subjects.map((subject) => (
            <SubjectCard subject={subject} key={subject.name} onOpen={setSelectedSubject} />
          ))}
        </div>

      </section>
    </main>
  );
};

export default AIClassroom;
