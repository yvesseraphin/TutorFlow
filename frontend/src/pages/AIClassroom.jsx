import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Stage, Layer, Line } from "react-konva";
import { api } from "../lib/api";
import { AudioStreamPlayer, AudioStreamRecorder, unlockAudioContext } from "../lib/liveAudio";
import NotificationDropdown from "../components/NotificationDropdown";
import {
  Activity,
  ArrowRight,
  ArrowUp,
  BarChart3,
  Bell,
  BookOpen,
  Bookmark,
  Calculator,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock3,
  Divide,
  Download,
  Eraser,
  File,
  FileDown,
  FileText,
  Flame,
  GraduationCap,
  FunctionSquare,
  Hand,
  Highlighter,
  Home,
  Expand,
  Minimize2,
  Image as ImageIcon,
  LogOut,
  Mic,
  MicOff,
  MoreHorizontal,
  MousePointer2,
  Paperclip,
  PenLine,
  Phone,
  Play,
  PlaySquare,
  Plus,
  Radio,
  Redo2,
  Search,
  Send,
  Settings,
  Shapes,
  Sparkles,
  Square,
  Trash2,
  Trophy,
  Type,
  Undo2,
  Video,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";


const SUBJECT_DETAILS = {
  "Pre-Algebra": {
    badge: "÷ × + −",
    cardDescription: "Review essential math skills.",
    detailDescription: "Review arithmetic, order of operations (PEMDAS), signed numbers, fractions, and introductory ratios.",
    board: ["(3 + 5) × 2", "8 × 2", "= 16"],
  },
  "Algebra": {
    badge: "ax+by=c",
    cardDescription: "Build strong foundations in algebra.",
    detailDescription: "Master variables, expressions, combining like terms, and solving linear equations step by step.",
    board: ["2x + 3 = 11", "2x = 8", "x = 4"],
  },
  "Functions": {
    badge: "f(x)=y",
    cardDescription: "Understand relations, functions and graphs.",
    detailDescription: "Understand mathematical relations, function notation, domain and range, function tables, and linear graphs.",
    board: ["f(x) = 2x + 1", "f(3) = 2(3) + 1", "f(3) = 7"],
  },
  "Geometry": {
    badge: "A=½bh",
    cardDescription: "Explore shapes, angles and theorems.",
    detailDescription: "Explore geometric shapes, angles, triangle theorems, area, volume, and spatial reasoning.",
    board: ["A = ½ × b × h", "b = 6, h = 4", "A = 12"],
  },
  "Statistics": {
    badge: "x̄=Σx/n",
    cardDescription: "Learn data, graphs and probability.",
    detailDescription: "Analyze data displays, measures of central tendency (mean, median, mode), graphs, and probability.",
    board: ["Mean = Σx / n", "(4 + 8 + 6) / 3", "x̄ = 6"],
  },
};

const getSubjectDetails = (subjectName) => {
  return SUBJECT_DETAILS[subjectName] || {
    badge: "ax+by=c",
    cardDescription: `Learn ${subjectName} concepts.`,
    detailDescription: `Master key concepts and step-by-step problem solving in ${subjectName}.`,
    board: ["2x + 3 = 11", "2x = 8", "x = 4"],
  };
};



const sortOptions = [
  { value: "recent", label: "Recently Accessed" },
  { value: "progress-desc", label: "Progress: High to Low" },
  { value: "progress-asc", label: "Progress: Low to High" },
  { value: "lessons-desc", label: "Most Lessons" },
  { value: "name", label: "Name: A to Z" },
  { value: "level", label: "Level" },
];



const styles = `
  .lessons-page {
    min-height: 100vh;
    padding: 32px 40px 48px;
    background: #ffffff;
    color: #111111;
    font-family: "Outfit", sans-serif;
    max-width: 1260px;
    margin: 0 auto;
  }

  .lessons-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 32px;
  }

  .lessons-title {
    margin: 0;
    color: #111111;
    font-size: 34px;
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: -0.02em;
  }

  .lessons-subtitle {
    margin: 6px 0 0;
    color: #666666;
    font-size: 18px;
    font-weight: 400;
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
    color: #111111;
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
    background: #f5f5f5;
    color: #111111;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    font-size: 22px;
    font-weight: 700;
    font-style: italic;
  }

  .lesson-kicker {
    margin: 8px 0 14px;
    color: #111111;
    font-size: 15px;
    font-weight: 700;
    line-height: 20px;
  }

  .lesson-title-large {
    margin: 0;
    color: #111111;
    font-size: 34px;
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: -0.02em;
  }

  .lesson-description-large {
    max-width: 620px;
    margin: 14px 0 0;
    color: #666666;
    font-size: 17px;
    font-weight: 400;
    line-height: 28px;
  }

  .lesson-meta {
    display: flex;
    align-items: center;
    gap: 18px;
    margin-top: 22px;
    color: #666666;
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
    background: #f5f5f5;
    color: #111111;
    font-size: 14px;
    font-weight: 600;
  }

  .detail-stack {
    display: flex;
    flex-direction: column;
    gap: 18px;
    margin-top: 28px;
  }

  .detail-card {
    border: 1px solid #f0f0f0;
    border-radius: 16px;
    background: #ffffff;
    box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.04);
  }

  .overview-card {
    padding: 28px;
    display: flex;
    flex-direction: column;
    gap: 22px;
  }

  .overview-hero-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 260px;
    align-items: center;
    gap: 24px;
  }

  .detail-card h2 {
    margin: 0 0 14px;
    color: #111111;
    font-size: 21px;
    font-weight: 700;
    line-height: 30px;
  }

  .overview-card p {
    margin: 0;
    color: #666666;
    font-size: 15.5px;
    line-height: 26px;
  }

  .detail-board-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .detail-whiteboard-img {
    width: 100%;
    max-height: 175px;
    object-fit: contain;
    filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.07));
  }

  .detail-section-block {
    padding-top: 20px;
    border-top: 1px solid #f0f0f0;
  }

  .detail-section-title {
    margin: 0 0 12px;
    color: #111111;
    font-size: 17px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .objectives-list {
    margin: 0;
    padding-left: 20px;
    color: #555555;
    font-size: 15px;
    line-height: 24px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .skills-tags-wrap {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .skill-badge {
    padding: 7px 14px;
    background: #f5f5f5;
    color: #111111;
    border-radius: 999px;
    font-size: 14px;
    font-weight: 600;
  }

  .resources-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }

  .resource-item {
    padding: 12px 14px;
    border: 1px solid #f0f0f0;
    border-radius: 12px;
    background: #fafafa;
    display: flex;
    align-items: center;
    gap: 10px;
    color: #111111;
    font-size: 14px;
    font-weight: 500;
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .resource-item:hover {
    border-color: #e5e5e5;
    background: #f5f5f5;
  }

  .preview-lessons-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .preview-lesson-row {
    padding: 12px 16px;
    border-radius: 10px;
    background: #fafafa;
    border: 1px solid #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 14.5px;
    color: #111111;
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
    background: #f5f5f5;
    color: #111111;
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
    background: #111111;
    color: #ffffff;
    font-size: 12px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .flow-step h3 {
    margin: 0 0 8px;
    color: #111111;
    font-size: 16px;
    font-weight: 700;
  }

  .flow-step p {
    margin: 0;
    color: #666666;
    font-size: 14px;
    line-height: 22px;
  }

  .flow-arrow {
    margin-top: 35px;
    color: #888888;
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
    color: #111111;
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
    background: url("/bot.webp") center / cover no-repeat;
  }

  .teacher-name {
    margin: 0;
    color: #111111;
    font-size: 24px;
    font-weight: 700;
  }

  .teacher-sub {
    margin: 5px 0 16px;
    color: #666666;
    font-size: 15.5px;
  }

  .personality-box {
    padding: 14px;
    border-radius: 10px;
    background: #f9f9f9;
    border: 1px solid #f0f0f0;
    color: #555555;
    font-size: 14.5px;
    line-height: 24px;
  }

  .detail-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 12px 0;
    color: #666666;
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
    color: #111111;
    font-weight: 600;
    text-align: right;
  }

  .ready-card p {
    margin: -4px 0 18px;
    color: #666666;
    font-size: 15px;
    line-height: 26px;
  }

  .start-button,
  .save-button {
    width: 100%;
    height: 52px;
    border-radius: 12px;
    font-family: "Outfit", sans-serif;
    font-size: 17px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .start-button {
    border: 0;
    background: #0a0a0a;
    color: #ffffff;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
  }

  .start-button:hover {
    background: #222222;
  }

  .save-button {
    margin-top: 12px;
    border: 1px solid #e5e5e5;
    background: #ffffff;
    color: #111111;
  }

  .save-button:hover {
    background: #f5f5f5;
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
    color: #444444;
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 0 12px;
    font-family: "Outfit", sans-serif;
    font-size: 15px;
    font-weight: 500;
  }

  .live-nav-item.active {
    background: #0a0a0a;
    color: #ffffff;
  }

  .classroom-rail {
    border-right: 1px solid #f0f0f0;
    padding: 96px 20px 28px;
    display: flex;
    flex-direction: column;
    background: #ffffff;
  }

  .rail-heading {
    margin: 0 0 22px;
    color: #111111;
    font-size: 15px;
    font-weight: 700;
  }

  .rail-item {
    height: 44px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: #444444;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 12px;
    font-family: "Outfit", sans-serif;
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 12px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .rail-item:hover {
    background: #fafafa;
  }

  .rail-item.active {
    background: #f5f5f5;
    color: #111111;
    font-weight: 600;
  }

  .lesson-progress-card {
    margin-top: auto;
    border: 1px solid #f0f0f0;
    border-radius: 14px;
    padding: 18px;
  }

  .lesson-progress-card h3 {
    margin: 0 0 16px;
    font-size: 13px;
    font-weight: 700;
    color: #111111;
  }

  .live-progress-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #111111;
    font-size: 16px;
    font-weight: 700;
  }

  .live-progress-track {
    height: 6px;
    margin: 12px 0 18px;
    border-radius: 99px;
    background: #f0f0f0;
  }

  .live-progress-fill {
    width: 68%;
    height: 100%;
    border-radius: inherit;
    background: #0a0a0a;
  }

  .teacher-panel {
    border-right: 1px solid #f0f0f0;
    padding: 96px 20px 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    overflow: auto;
    background: #ffffff;
  }

  .live-section-title {
    margin: 0;
    color: #111111;
    font-size: 15px;
    font-weight: 700;
  }

  .live-teacher-card,
  .teacher-message,
  .teacher-controls,
  .voice-panel {
    border: 1px solid #f0f0f0;
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
    background: url("/bot.webp") center / contain no-repeat;
    background-color: #fafafa;
  }

  .live-teacher-card h2 {
    margin: 10px 0 4px;
    color: #111111;
    font-size: 16px;
    font-weight: 700;
  }

  .voice-bars {
    height: 18px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: #111111;
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
    background: #fafafa;
    color: #111111;
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
    color: #444444;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 7px;
    font-family: "Outfit", sans-serif;
    font-size: 11px;
    cursor: pointer;
  }

  .voice-panel {
    padding: 18px;
  }

  .voice-panel h3 {
    margin: 0 0 18px;
    font-size: 15px;
    color: #111111;
  }

  .wave-row {
    margin-top: 12px;
    display: grid;
    grid-template-columns: 1fr 28px;
    align-items: center;
    gap: 10px;
    color: #111111;
  }

  .wave-row.muted {
    color: #cccccc;
  }

  .wave-label {
    color: #666666;
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
    border-bottom: 1px solid #f0f0f0;
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
    color: #111111;
  }

  .live-title p {
    margin: 0;
    color: #666666;
    font-size: 14px;
  }

  .live-dot {
    color: #111111;
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
    border-radius: 6px;
    border: 1px solid #e5e5e5;
    background: #ffffff;
    color: #111111;
    padding: 0 16px;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-family: "Outfit", sans-serif;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .top-action:hover {
    background: #f5f5f5;
  }

  .icon-action {
    width: 42px;
    padding: 0;
    justify-content: center;
  }

  .end-lesson {
    color: #ef4444;
    border-color: #fecaca;
    background: #fef2f2;
  }

  .end-lesson:hover {
    background: #fee2e2;
  }

  .whiteboard-card {
    flex: 1;
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-height: 0;
    height: 100%;
  }

  .whiteboard-header {
    height: 48px;
    min-height: 48px;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 14px;
    background: #ffffff;
  }

  .whiteboard-header h2 {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: #111111;
  }

  .tool-row {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #555555;
  }

  .tool-button {
    width: 34px;
    height: 34px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: inherit;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .tool-button:hover {
    background: #f5f5f5;
  }

  .tool-button.active {
    background: #f5f5f5;
    color: #111111;
  }

  .board-canvas {
    position: relative;
    flex: 1;
    min-height: 0;
    overflow: hidden;
    background: #ffffff;
    font-family: "Outfit", sans-serif;
  }

  .board-canvas h3 {
    margin: 0 0 20px;
    color: #111111;
    font-size: 24px;
    font-weight: 600;
    text-decoration: underline;
    text-decoration-color: #111111;
    text-underline-offset: 8px;
  }

  .blue-write { color: #111111; }
  .black-write { color: #111111; }
  .red-write { color: #ef4444; }
  .green-write { color: #16a34a; }

  .equation-block {
    width: 520px;
    margin-left: 4px;
    color: #111111;
    font-size: 20px;
    line-height: 1.9;
  }

  .boxed-answer {
    display: inline-block;
    border: 2px solid #111111;
    padding: 2px 18px;
    margin: 8px 18px 0 86px;
    border-radius: 4px;
  }

  .board-divider {
    height: 1px;
    background: #e2e8f0;
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
    left: 14px;
    right: 14px;
    bottom: 14px;
    height: 52px;
    border: 1px solid #e5e5e5;
    border-radius: 12px;
    background: #ffffff;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 14px;
    z-index: 20;
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
    border-left: 1px solid #f0f0f0;
    padding-top: 96px;
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    background: #ffffff;
    overflow: hidden;
  }

  .chat-header {
    height: 48px;
    min-height: 48px;
    border-bottom: 1px solid #f0f0f0;
    padding: 0 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #ffffff;
  }

  .chat-header h3 {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: #111111;
  }

  .live-chat-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    color: #111111;
    background: #f5f5f5;
    padding: 3px 10px;
    border-radius: 999px;
    border: 1px solid #e5e5e5;
  }

  .chat-scroll {
    padding: 16px;
    overflow-y: auto;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .chat-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 36px 16px 20px;
    margin: auto 0;
  }

  .chat-empty-icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    background: #f5f5f5;
    border: 1px solid #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 14px;
  }

  .chat-empty-state h4 {
    margin: 0 0 6px;
    font-size: 16px;
    font-weight: 700;
    color: #111111;
  }

  .chat-empty-state p {
    margin: 0;
    color: #666666;
    font-size: 13.5px;
    line-height: 20px;
    max-width: 240px;
  }

  .chat-message {
    display: flex;
    gap: 12px;
    color: #444444;
    font-size: 13.5px;
    line-height: 22px;
  }

  .chat-avatar {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background: url("/bot.webp") center / contain no-repeat;
    background-color: #fafafa;
    border: 1px solid #e5e5e5;
    flex-shrink: 0;
  }

  .message-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    color: #111111;
    font-weight: 700;
    margin-bottom: 4px;
  }

  .message-time {
    color: #888888;
    font-weight: 400;
    white-space: nowrap;
    font-size: 12px;
  }

  .student-bubble {
    align-self: flex-end;
    max-width: 240px;
    padding: 12px 14px;
    border-radius: 8px;
    background: #f5f5f5;
    border: 1px solid #f0f0f0;
    color: #111111;
    font-size: 13.5px;
    line-height: 22px;
  }

  .quick-replies {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: auto;
    padding-top: 8px;
  }

  .quick-replies button {
    height: 30px;
    border: 1px solid #e5e5e5;
    border-radius: 6px;
    background: #ffffff;
    color: #111111;
    padding: 0 12px;
    font-family: "Outfit", sans-serif;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .quick-replies button:hover {
    background: #f5f5f5;
    border-color: #cccccc;
  }

  .chat-input-wrap {
    margin: 10px 14px 14px;
    border: 1px solid #e5e5e5;
    border-radius: 8px;
    padding: 10px 12px;
    background: #ffffff;
    display: flex;
    flex-direction: column;
    gap: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .chat-input-wrap:focus-within {
    border-color: #111111;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  }

  .attached-file-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #f5f5f5;
    border: 1px solid #e5e5e5;
    border-radius: 6px;
    padding: 4px 8px;
    font-size: 12px;
    color: #111111;
    font-weight: 500;
    max-width: max-content;
  }

  .attached-file-remove {
    background: transparent;
    border: 0;
    padding: 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    color: #666666;
  }

  .attached-file-remove:hover {
    color: #ef4444;
  }

  .chat-input {
    width: 100%;
    border: 0;
    outline: 0;
    font-family: "Outfit", sans-serif;
    font-size: 13.5px;
    color: #111111;
    background: transparent;
    padding: 2px 0;
  }

  .chat-input::placeholder {
    color: #94a3b8;
  }

  .chat-input-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #111111;
    padding-top: 2px;
  }

  .chat-action-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .chat-icon-btn {
    border: 0;
    background: #f5f5f5;
    color: #555555;
    padding: 6px;
    border-radius: 6px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
  }

  .chat-icon-btn:hover {
    background: #ebebeb;
    color: #111111;
  }

  .whiteboard-sidebar {
    border-left: 1px solid #f0f0f0;
    padding-top: 96px;
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    background: #ffffff;
    overflow: hidden;
  }

  .wb-section {
    padding: 16px 18px;
    border-bottom: 1px solid #f0f0f0;
  }

  .wb-section h3 {
    margin: 0 0 14px;
    font-size: 14px;
    font-weight: 700;
    color: #111111;
  }

  .wb-tools-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .wb-tool-btn {
    height: 42px;
    border: 1px solid #e5e5e5;
    border-radius: 6px;
    background: #ffffff;
    color: #111111;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 12px;
    font-family: "Outfit", sans-serif;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .wb-tool-btn:hover {
    background: #f5f5f5;
    border-color: #111111;
    color: #111111;
  }

  .wb-tool-btn.active {
    background: #0a0a0a !important;
    border-color: #0a0a0a !important;
    color: #ffffff !important;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .wb-pages-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .wb-pages-header h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
    color: #111111;
  }

  .wb-new-page {
    border: 0;
    background: #0a0a0a;
    color: #ffffff;
    border-radius: 6px;
    padding: 6px 12px;
    font-family: "Outfit", sans-serif;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    transition: all 0.15s ease;
  }

  .wb-new-page:hover {
    background: #222222;
  }

  .wb-pages-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    overflow-y: auto;
    max-height: 280px;
  }

  .wb-page-card {
    border: 1px solid #e5e5e5;
    border-radius: 6px;
    padding: 10px 12px;
    background: #ffffff;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .wb-page-card:hover {
    background: #fafafa;
    border-color: #cccccc;
  }

  .wb-page-card.active {
    border: 2px solid #0a0a0a;
    background: #f9f9f9;
  }

  .wb-page-num {
    width: 26px;
    height: 26px;
    border-radius: 4px;
    background: #f0f0f0;
    color: #111111;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
  }

  .wb-page-card.active .wb-page-num {
    background: #0a0a0a;
    color: #ffffff;
  }

  .fake-preview-title {
    font-size: 13px;
    font-weight: 600;
    color: #111111;
  }

  .fake-preview-subtitle {
    font-size: 11.5px;
    color: #666666;
  }

  .wb-sidebar-footer {
    margin-top: auto;
    padding: 16px 18px;
    border-top: 1px solid #f0f0f0;
  }

  .wb-clear-btn {
    width: 100%;
    height: 42px;
    border: 1px solid #e5e5e5;
    border-radius: 6px;
    background: #0a0a0a;
    color: #ffffff;
    font-family: "Outfit", sans-serif;
    font-size: 13.5px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .wb-clear-btn:hover {
    background: #222222;
  }

  .tf-empty-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 0 20px;
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
    font-size: 16px;
    font-weight: 400;
    color: #777777;
    margin: 0;
  }

  /* ── Interactive Quiz & Homework ── */
  .quiz-container {
    padding: 28px 32px;
    height: 100%;
    overflow-y: auto;
    background: #ffffff;
    max-width: 800px;
    margin: 0 auto;
  }

  .quiz-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid #f0f0f0;
  }

  .quiz-header h2 {
    margin: 0;
    font-size: 22px;
    font-weight: 700;
    color: #111111;
  }

  .quiz-score-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 999px;
    background: #f5f5f5;
    border: 1px solid #e5e5e5;
    font-size: 13px;
    font-weight: 700;
    color: #111111;
  }

  .quiz-card {
    background: #ffffff;
    border: 1px solid #e5e5e5;
    border-radius: 16px;
    padding: 28px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
    margin-bottom: 20px;
  }

  .quiz-step-tag {
    font-size: 12.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #888888;
    margin-bottom: 10px;
  }

  .quiz-question-text {
    font-size: 18px;
    font-weight: 700;
    color: #111111;
    line-height: 26px;
    margin: 0 0 20px;
  }

  .quiz-options-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 24px;
  }

  .quiz-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    border: 1px solid #e5e5e5;
    border-radius: 12px;
    background: #ffffff;
    font-family: "Outfit", sans-serif;
    font-size: 15px;
    font-weight: 500;
    color: #111111;
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: left;
  }

  .quiz-option:hover:not(:disabled) {
    border-color: #111111;
    background: #fafafa;
  }

  .quiz-option.selected {
    border-color: #111111;
    background: #f5f5f5;
    font-weight: 600;
  }

  .quiz-option.correct {
    border-color: #16a34a !important;
    background: #f0fdf4 !important;
    color: #16a34a !important;
    font-weight: 700;
  }

  .quiz-option.incorrect {
    border-color: #ef4444 !important;
    background: #fef2f2 !important;
    color: #ef4444 !important;
  }

  .quiz-feedback {
    padding: 14px 18px;
    border-radius: 12px;
    margin-bottom: 20px;
    font-size: 14px;
    line-height: 22px;
  }

  .quiz-feedback.correct {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    color: #166534;
  }

  .quiz-feedback.incorrect {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #991b1b;
  }

  .quiz-actions-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .quiz-submit-btn {
    height: 44px;
    padding: 0 24px;
    border-radius: 10px;
    background: #0a0a0a;
    color: #ffffff;
    border: 0;
    font-family: "Outfit", sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .quiz-submit-btn:hover:not(:disabled) {
    background: #222222;
  }

  .quiz-submit-btn:disabled {
    opacity: 0.5;
    cursor: default;
  }

  .quiz-hint-btn {
    height: 44px;
    padding: 0 18px;
    border-radius: 10px;
    background: #ffffff;
    color: #111111;
    border: 1px solid #e5e5e5;
    font-family: "Outfit", sans-serif;
    font-size: 13.5px;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: all 0.15s ease;
  }

  .quiz-hint-btn:hover {
    background: #f5f5f5;
    border-color: #111111;
  }

  /* ── Session Summary Modal ── */
  .summary-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(5px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }

  .summary-modal {
    background: #ffffff;
    border: 1px solid #e5e5e5;
    border-radius: 8px;
    width: 100%;
    max-width: 580px;
    min-height: 520px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25);
    overflow: hidden;
  }

  .summary-modal-header {
    padding: 24px 36px 18px;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .summary-modal-header h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: #111111;
  }

  .summary-modal-body {
    padding: 32px 42px;
    display: flex;
    flex-direction: column;
    gap: 22px;
    flex: 1;
    justify-content: center;
  }

  .summary-stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .summary-stat-box {
    background: #fafafa;
    border: 1px solid #f0f0f0;
    border-radius: 6px;
    padding: 12px 14px;
    text-align: center;
  }

  .summary-stat-number {
    font-size: 17px;
    font-weight: 800;
    color: #111111;
    margin-bottom: 2px;
  }

  .summary-stat-label {
    font-size: 11.5px;
    color: #777777;
    font-weight: 500;
  }

  .summary-export-options {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .summary-export-btn {
    width: 100%;
    height: 44px;
    border-radius: 6px;
    border: 1px solid #e5e5e5;
    background: #ffffff;
    color: #111111;
    font-family: "Outfit", sans-serif;
    font-size: 13.5px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .summary-export-btn:hover {
    background: #f5f5f5;
    border-color: #111111;
  }

  .summary-modal-footer {
    padding: 16px 36px 28px;
    border-top: 1px solid #f0f0f0;
    display: flex;
    gap: 12px;
  }

  .summary-secondary-btn {
    flex: 1;
    height: 44px;
    border-radius: 6px;
    background: #ffffff;
    color: #111111;
    border: 1px solid #e5e5e5;
    font-family: "Outfit", sans-serif;
    font-size: 13.5px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .summary-secondary-btn:hover {
    background: #f5f5f5;
    border-color: #111111;
  }

  .summary-finish-btn {
    flex: 1;
    height: 44px;
    border-radius: 6px;
    background: #0a0a0a;
    color: #ffffff;
    border: 0;
    font-family: "Outfit", sans-serif;
    font-size: 13.5px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .summary-finish-btn:hover {
    background: #222222;
  }

  .content-list-view {
    padding: 24px;
    background: #ffffff;
    height: 100%;
    overflow-y: auto;
  }

  .content-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }

  .content-header h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: #111111;
  }

  .content-search {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    border: 1px solid #e5e5e5;
    border-radius: 10px;
    background: #fafafa;
    color: #666666;
  }

  .content-search input {
    border: 0;
    outline: 0;
    background: transparent;
    font-family: "Outfit", sans-serif;
    font-size: 14px;
    color: #111111;
  }

  .content-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
    overflow-x: auto;
    padding-bottom: 4px;
  }

  .content-tab {
    padding: 8px 16px;
    border: 1px solid #e5e5e5;
    border-radius: 999px;
    background: #ffffff;
    color: #555555;
    font-family: "Outfit", sans-serif;
    font-size: 13.5px;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s ease;
  }

  .content-tab:hover {
    background: #f5f5f5;
    border-color: #cccccc;
    color: #111111;
  }

  .content-tab.active {
    background: #0a0a0a;
    border-color: #0a0a0a;
    color: #ffffff;
    font-weight: 600;
  }

  .content-cards-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .content-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 20px;
    border: 1px solid #f0f0f0;
    border-radius: 14px;
    background: #ffffff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
    transition: all 0.2s ease;
  }

  .content-card:hover {
    border-color: #e5e5e5;
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  }

  .content-card-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #111111;
    flex-shrink: 0;
  }

  .content-card-info {
    flex: 1;
    min-width: 0;
  }

  .content-card-title {
    margin: 0 0 4px;
    font-size: 15.5px;
    font-weight: 600;
    color: #111111;
  }

  .content-card-desc {
    margin: 0 0 6px;
    font-size: 13.5px;
    color: #666666;
    line-height: 18px;
  }

  .content-card-meta {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: #888888;
    font-weight: 500;
  }

  .content-card-btn {
    padding: 8px 18px;
    border: 1px solid #111111;
    border-radius: 8px;
    background: #ffffff;
    color: #111111;
    font-family: "Outfit", sans-serif;
    font-size: 13.5px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .content-card-btn:hover {
    background: #0a0a0a;
    color: #ffffff;
  }

  .subjects-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
  }

  .subjects-title {
    margin: 0;
    color: #111111;
    font-size: 24px;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  .sort-wrap {
    display: flex;
    align-items: center;
    gap: 16px;
    color: #555555;
    font-size: 16px;
    font-weight: 500;
  }

  .sort-select {
    height: 46px;
    min-width: 220px;
    padding: 0 42px 0 16px;
    border: 1px solid #e5e5e5;
    border-radius: 10px;
    background: #ffffff;
    color: #111111;
    appearance: none;
    cursor: pointer;
    font-family: "Outfit", sans-serif;
    font-size: 16px;
    font-weight: 500;
    transition: border-color 0.2s ease;
  }

  .sort-select:hover {
    border-color: #cccccc;
  }

  .sort-select:focus {
    outline: none;
    border-color: #111111;
    box-shadow: none;
  }

  .sort-select option {
    font-family: "Outfit", sans-serif;
    font-weight: 400;
    color: #111111;
    background: #ffffff;
  }

  .sort-control {
    position: relative;
  }

  .sort-chevron {
    position: absolute;
    top: 50%;
    right: 16px;
    color: #888888;
    pointer-events: none;
    transform: translateY(-50%);
  }

  .subject-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px;
  }

  .subject-card {
    min-height: 252px;
    padding: 24px;
    border: 1px solid #f0f0f0;
    border-radius: 16px;
    background: #ffffff;
    box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02);
    display: flex;
    flex-direction: column;
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
    cursor: pointer;
  }

  .subject-card:hover {
    transform: translateY(-2px);
    border-color: #e5e5e5;
    box-shadow: 0 8px 24px -2px rgba(0, 0, 0, 0.06);
  }

  .subject-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
  }

  .subject-intro {
    display: grid;
    grid-template-columns: 60px minmax(0, 1fr);
    gap: 14px;
    align-items: start;
    min-width: 0;
  }

  .subject-icon {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    background: #f5f5f5;
    color: #111111;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .subject-name {
    margin: 4px 0 6px;
    color: #111111;
    font-size: 20px;
    font-weight: 700;
    line-height: 1.3;
    letter-spacing: -0.02em;
  }

  .subject-description {
    margin: 0;
    color: #666666;
    font-size: 15px;
    font-weight: 400;
    line-height: 22px;
  }

  .subject-arrow {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 1px solid #f0f0f0;
    background: #ffffff;
    color: #111111;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex: 0 0 auto;
    transition: all 0.2s ease;
  }

  .subject-card:hover .subject-arrow {
    background: #0a0a0a;
    color: #ffffff;
    border-color: #0a0a0a;
  }

  .progress-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 28px;
    color: #666666;
    font-size: 15px;
    font-weight: 500;
  }

  .progress-value {
    color: #111111;
    font-weight: 600;
  }

  .progress-track {
    height: 6px;
    margin-top: 10px;
    border-radius: 99px;
    overflow: hidden;
    background: #f0f0f0;
  }

  .progress-fill {
    height: 100%;
    border-radius: inherit;
    background: #0a0a0a;
  }

  .subject-bottom {
    margin-top: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #777777;
    font-size: 14px;
    font-weight: 400;
    padding-top: 14px;
  }

  .lesson-count {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #666666;
  }

  .subject-level {
    color: #111111;
    font-weight: 600;
  }

  .coming-copy {
    margin-top: auto;
    color: #777777;
    font-size: 15px;
    line-height: 22px;
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


// Convert raw math expressions & LaTeX symbols into concise, natural spoken dialogue for real-time voice
const cleanTextForSpeech = (text) => {
  if (!text) return "";

  let cleaned = text
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "$1 over $2")
    .replace(/\\sqrt\{([^}]+)\}/g, "square root of $1")
    .replace(/\\sqrt\s*([a-zA-Z0-9]+)/g, "square root of $1")
    .replace(/\\times/g, " times ")
    .replace(/\\div/g, " divided by ")
    .replace(/\\pm/g, " plus or minus ")
    .replace(/\\cdot/g, " times ")
    .replace(/\\le|\\leq/g, " less than or equal to ")
    .replace(/\\ge|\\geq/g, " greater than or equal to ")
    .replace(/\\ne|\\neq/g, " is not equal to ")
    .replace(/\\pi/g, " pi ")
    .replace(/\\theta/g, " theta ")
    .replace(/\\alpha/g, " alpha ")
    .replace(/\\beta/g, " beta ")
    .replace(/\\infty/g, " infinity ")
    .replace(/([a-zA-Z0-9]+)\^2/g, "$1 squared")
    .replace(/([a-zA-Z0-9]+)\^3/g, "$1 cubed")
    .replace(/([a-zA-Z0-9]+)\^([a-zA-Z0-9]+)/g, "$1 to the power of $2")
    .replace(/\$\$/g, "")
    .replace(/\$/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/#+\s+/g, "")
    .replace(/[*•-]\s+/g, "")
    .replace(/\\/g, "")
    .replace(/[\n\r]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Extract the first crisp conversational sentence / question (max 20 words) for fast, snappy spoken dialogue like ChatGPT Voice
  const sentences = cleaned.match(/[^.!?]+[.!?]+/g) || [cleaned];
  const firstSentence = (sentences[0] || cleaned).trim();
  const words = firstSentence.split(" ");
  if (words.length > 20) {
    return words.slice(0, 18).join(" ") + "...";
  }
  return firstSentence;
};

// Translate LaTeX symbols and math equations into clean, beautiful HTML/JSX
const parseMathSymbols = (str) => {
  if (!str) return str;
  return str
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "$1 / $2")
    .replace(/\\sqrt\{([^}]+)\}/g, "√($1)")
    .replace(/\\sqrt\s*([a-zA-Z0-9]+)/g, "√$1")
    .replace(/\\times/g, "×")
    .replace(/\\div/g, "÷")
    .replace(/\\pm/g, "±")
    .replace(/\\cdot/g, "·")
    .replace(/\\le|\\leq/g, "≤")
    .replace(/\\ge|\\geq/g, "≥")
    .replace(/\\ne|\\neq/g, "≠")
    .replace(/\\pi/g, "π")
    .replace(/\\theta/g, "θ")
    .replace(/\\alpha/g, "α")
    .replace(/\\beta/g, "β")
    .replace(/\\infty/g, "∞");
};

const formatAIText = (text) => {
  if (!text) return null;
  const lines = text.split("\n");

  return lines.map((line, lIdx) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={lIdx} style={{ height: 4 }} />;

    const isBullet = trimmed.startsWith("* ") || trimmed.startsWith("- ") || trimmed.startsWith("• ");
    const lineContent = isBullet ? trimmed.replace(/^[*•-]\s+/, "") : trimmed;

    // Split by Markdown formatting AND Math expressions ($...$ or $$...$$)
    const parts = lineContent.split(/(\$\$.*?\$\$|\$.*?\$|\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    const renderedParts = parts.map((part, pIdx) => {
      if ((part.startsWith("$$") && part.endsWith("$$") && part.length > 4) ||
        (part.startsWith("$") && part.endsWith("$") && part.length > 2)) {
        const rawMath = part.replace(/^\$+|\$+$/g, "");
        const cleanMath = parseMathSymbols(rawMath);
        return (
          <span
            key={pIdx}
            style={{
              fontFamily: "'Courier New', Courier, monospace",
              fontWeight: 600,
              color: "#0054ff",
              background: "#eef4ff",
              padding: "2px 6px",
              borderRadius: 4,
              display: "inline-block",
              margin: "0 2px",
            }}
          >
            {cleanMath}
          </span>
        );
      }
      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
        return <strong key={pIdx} style={{ fontWeight: 700, color: "#0054ff" }}>{parseMathSymbols(part.slice(2, -2))}</strong>;
      }
      if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
        return <strong key={pIdx} style={{ fontWeight: 600 }}>{parseMathSymbols(part.slice(1, -1))}</strong>;
      }
      if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
        return <code key={pIdx} style={{ background: "#eef4ff", color: "#0054ff", padding: "2px 6px", borderRadius: 4, fontFamily: "monospace" }}>{parseMathSymbols(part.slice(1, -1))}</code>;
      }
      return parseMathSymbols(part);
    });

    if (isBullet) {
      return (
        <div key={lIdx} style={{ display: "flex", gap: 8, alignItems: "flex-start", margin: "4px 0" }}>
          <span style={{ color: "#0054ff", fontWeight: 700, lineHeight: "22px" }}>•</span>
          <div style={{ flex: 1 }}>{renderedParts}</div>
        </div>
      );
    }

    return (
      <p key={lIdx} style={{ margin: "0 0 6px 0", lineHeight: "22px" }}>
        {renderedParts}
      </p>
    );
  });
};

const VoiceBars = ({ muted = false, active = false }) => (
  <div className={`voice-bars${muted || !active ? " muted" : ""}`} aria-hidden="true">
    {[8, 14, 9, 18, 11, 16, 7, 15, 10, 18, 8, 13].map((height, index) => (
      <span
        key={index}
        style={{
          height: (muted || !active) ? 4 : height,
          animationPlayState: (muted || !active) ? "paused" : "running",
          transition: "height 0.2s ease",
        }}
      />
    ))}
  </div>
);


const ContentListView = ({ type, topic = "Algebra" }) => {
  const [activeTab, setActiveTab] = useState("All");
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api(`/tutor/materials?category=${encodeURIComponent(type)}&topic=${encodeURIComponent(topic)}`)
      .then((data) => {
        if (isMounted) {
          setMaterials(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setMaterials([]);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [type, topic]);

  const tabs = ["All " + type, "Guides", "Worksheets", "Videos", "Examples", "Practice"];

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
        {loading ? (
          <div style={{ padding: "64px 0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div className="tf-spinner" />
          </div>
        ) : materials.length === 0 ? (
          <div className="tf-empty-wrap" style={{ padding: "48px 0" }}>
            <div className="tf-empty-icon-circle">
              <img
                src="/book.webp"
                alt="Empty state illustration"
                style={{ width: "96px", height: "96px", objectFit: "contain", transform: "scale(1.1)" }}
              />
            </div>
            <h3 className="tf-empty-title">No {type.toLowerCase()} yet</h3>
            <p className="tf-empty-desc">Materials for {topic} will appear here soon.</p>
          </div>
        ) : (
          materials.map(item => (
            <div className="content-card" key={item.id}>
              <div className="content-card-icon">
                {item.content_type === "video" ? <PlaySquare size={28} strokeWidth={1.5} /> : <File size={28} strokeWidth={1.5} />}
              </div>
              <div className="content-card-info">
                <h3 className="content-card-title">{item.title}</h3>
                <p className="content-card-desc">{item.description}</p>
                <p className="content-card-meta">
                  <span>{item.content_type || "PDF"}</span>
                  <span>•</span>
                  <span>{item.file_size || "1.0 MB"}</span>
                </p>
              </div>
              <button className="content-card-btn">View</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const SessionSummaryModal = ({
  isOpen,
  onClose,
  onFinish,
  lessonTitle = "Lesson",
  pagesCount = 1,
  chatMessages = [],
  stageRef = null,
}) => {
  if (!isOpen) return null;

  const handleExportPNG = () => {
    try {
      if (stageRef?.current) {
        const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });
        const link = document.createElement("a");
        link.download = `${lessonTitle.replace(/\s+/g, "_")}_Whiteboard.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (e) {
      console.warn("Error exporting PNG:", e);
    }
  };

  const handleExportNotes = () => {
    try {
      const header = `# Lesson Summary: ${lessonTitle}\nDate: ${new Date().toLocaleDateString()}\n\n`;
      const messagesText = chatMessages
        .map((m) => `[${m.time || "Time"}] ${m.sender === "ai" ? "Tutor AI" : "You"}: ${m.text}`)
        .join("\n\n");
      const fullText = header + "## Class Notes & Transcript:\n\n" + (messagesText || "No chat transcript recorded.");

      const blob = new Blob([fullText], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `${lessonTitle.replace(/\s+/g, "_")}_Notes.txt`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn("Error exporting notes:", e);
    }
  };

  return (
    <div className="summary-overlay" onClick={onClose}>
      <div className="summary-modal" onClick={(e) => e.stopPropagation()}>
        <div className="summary-modal-header">
          <h2>Lesson Summary & Export</h2>
          <button
            type="button"
            onClick={onClose}
            style={{ border: 0, background: "transparent", cursor: "pointer", padding: 4, display: "flex", color: "#666666" }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="summary-modal-body">
          <div className="summary-stats-grid">
            <div className="summary-stat-box">
              <div className="summary-stat-number" style={{ fontSize: 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lessonTitle}</div>
              <div className="summary-stat-label">Topic</div>
            </div>
            <div className="summary-stat-box">
              <div className="summary-stat-number">{pagesCount}</div>
              <div className="summary-stat-label">Board Pages</div>
            </div>
            <div className="summary-stat-box">
              <div className="summary-stat-number">{chatMessages.length}</div>
              <div className="summary-stat-label">Exchanges</div>
            </div>
          </div>

          <div className="summary-export-options">
            <button type="button" className="summary-export-btn" onClick={handleExportPNG}>
              <Download size={18} />
              <span>Download Whiteboard Snapshot (.PNG)</span>
            </button>
            <button type="button" className="summary-export-btn" onClick={handleExportNotes}>
              <FileDown size={18} />
              <span>Download Study Notes & Transcript (.TXT)</span>
            </button>
          </div>
        </div>

        <div className="summary-modal-footer">
          <button type="button" className="summary-secondary-btn" onClick={onClose}>
            Resume Lesson
          </button>
          <button type="button" className="summary-finish-btn" onClick={onFinish}>
            End
          </button>
        </div>
      </div>
    </div>
  );
};

const WhiteboardSidebar = ({
  activeTool,
  setActiveTool,
  onClear,
  pages = [],
  activePageId = 1,
  onSelectPage,
  onCreatePage,
}) => {
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
          <button type="button" className="wb-new-page" onClick={onCreatePage}>
            <Plus size={14} /> New Page
          </button>
        </div>
        <div className="wb-pages-list">
          {pages.map((p, idx) => (
            <div
              key={p.id}
              className={`wb-page-card${activePageId === p.id ? " active" : ""}`}
              onClick={() => onSelectPage && onSelectPage(p.id)}
            >
              <div className="wb-page-num">{idx + 1}</div>
              <div className="wb-page-preview">
                <div className="fake-preview-title">{p.title || `Page ${idx + 1}`}</div>
                <div className="fake-preview-subtitle">
                  {p.subtitle || (p.lines?.length > 0 ? `${p.lines.length} strokes drawn` : "Empty canvas")}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="wb-sidebar-footer">
        <button type="button" className="wb-clear-btn" onClick={onClear}>Clear Page</button>
      </div>
    </aside>
  );
};

const InteractiveWhiteboard = ({
  stageRef,
  lines = [],
  setLines,
  activeTool = "pen",
  setActiveTool,
  activeColor = "#111111",
  setActiveColor,
  clearTrigger,
  lessonTitle,
  lessonSteps,
  onCanvasFrame,
  aiHighlights = [],
  aiHints = [],
  isLiveConnected = false,
}) => {
  const containerRef = React.useRef(null);
  const localStageRef = React.useRef(null);
  const effectiveStageRef = stageRef || localStageRef;

  const [localLines, setLocalLines] = useState(lines || []);
  const linesRef = React.useRef(localLines);
  linesRef.current = localLines;

  const [history, setHistory] = useState([lines || []]);
  const [historyStep, setHistoryStep] = useState(0);
  const isDrawing = React.useRef(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const debounceTimerRef = React.useRef(null);

  // Sync with parent page lines
  React.useEffect(() => {
    setLocalLines(lines || []);
    linesRef.current = lines || [];
  }, [lines]);

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

  const emitFrame = React.useCallback((triggerTurn = false) => {
    if (!effectiveStageRef.current || !onCanvasFrame) return;
    try {
      const dataUrl = effectiveStageRef.current.toDataURL({ mimeType: "image/jpeg", quality: 0.6, pixelRatio: 1 });
      onCanvasFrame(dataUrl, triggerTurn);
    } catch (e) {
      console.warn("Canvas frame capture error:", e);
    }
  }, [effectiveStageRef, onCanvasFrame]);

  const scheduleEmitFrame = React.useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      emitFrame(false);
    }, 800);
  }, [emitFrame]);

  const saveHistory = (newLines) => {
    const nextHistory = history.slice(0, historyStep + 1);
    nextHistory.push(newLines);
    setHistory(nextHistory);
    setHistoryStep(nextHistory.length - 1);
  };

  React.useEffect(() => {
    if (clearTrigger > 0) {
      saveHistory([]);
      linesRef.current = [];
      setLocalLines([]);
      if (setLines) setLines([]);
      scheduleEmitFrame();
    }
  }, [clearTrigger]);

  const handlePointerDown = (e) => {
    if (activeTool === "pointer") return;
    isDrawing.current = true;
    const stage = effectiveStageRef.current || e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;

    let strokeColor = activeColor || "#111111";
    let strokeWidth = 3.5;
    let toolType = activeTool;

    if (activeTool === "highlighter") {
      strokeWidth = 26;
    } else if (activeTool === "eraser") {
      strokeWidth = 36;
    } else if (activeTool === "shapes") {
      toolType = "shape-rect";
    }

    const newLine = {
      tool: toolType,
      color: strokeColor,
      strokeWidth,
      points: [pos.x, pos.y],
      startPos: pos,
    };

    const next = [...linesRef.current, newLine];
    linesRef.current = next;
    setLocalLines(next);
  };

  const handlePointerMove = (e) => {
    if (!isDrawing.current || activeTool === "pointer") return;
    const stage = effectiveStageRef.current || e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;

    const current = linesRef.current;
    if (current.length === 0) return;

    const last = current[current.length - 1];

    if (last.tool === "shape-rect") {
      const { x: x1, y: y1 } = last.startPos || { x: pos.x, y: pos.y };
      const x2 = pos.x;
      const y2 = pos.y;
      const updated = {
        ...last,
        points: [x1, y1, x2, y1, x2, y2, x1, y2, x1, y1],
      };
      const next = [...current.slice(0, -1), updated];
      linesRef.current = next;
      setLocalLines(next);
    } else {
      const updated = {
        ...last,
        points: [...last.points, pos.x, pos.y],
      };
      const next = [...current.slice(0, -1), updated];
      linesRef.current = next;
      setLocalLines(next);
    }
  };

  const handlePointerUp = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    saveHistory(linesRef.current);
    if (setLines) {
      setLines(linesRef.current);
    }
    scheduleEmitFrame();
  };

  const handleUndo = () => {
    if (historyStep > 0) {
      const nextStep = historyStep - 1;
      setHistoryStep(nextStep);
      const prevLines = history[nextStep] || [];
      linesRef.current = prevLines;
      setLocalLines(prevLines);
      if (setLines) setLines(prevLines);
      scheduleEmitFrame();
    }
  };

  const handleRedo = () => {
    if (historyStep < history.length - 1) {
      const nextStep = historyStep + 1;
      setHistoryStep(nextStep);
      const nextLines = history[nextStep] || [];
      linesRef.current = nextLines;
      setLocalLines(nextLines);
      if (setLines) setLines(nextLines);
      scheduleEmitFrame();
    }
  };

  const handleClear = () => {
    saveHistory([]);
    linesRef.current = [];
    setLocalLines([]);
    if (setLines) setLines([]);
    scheduleEmitFrame();
  };

  const cardRef = React.useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (cardRef.current?.requestFullscreen) {
        cardRef.current.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  React.useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const headerTools = [
    { id: "undo", icon: Undo2, label: "Undo", action: handleUndo },
    { id: "redo", icon: Redo2, label: "Redo", action: handleRedo },
    { id: "clear", icon: Trash2, label: "Clear Board", action: handleClear },
    { id: "maximize", icon: isFullscreen ? Minimize2 : Expand, label: isFullscreen ? "Exit Fullscreen" : "Fullscreen", action: toggleFullscreen },
  ];

  const markers = [
    { color: "#111111", gradient: "linear-gradient(#111111 0 28%, #d1d5db 28%)", label: "Black Marker" },
    { color: "#16a34a", gradient: "linear-gradient(#16a34a 0 28%, #bbf7d0 28%)", label: "Green Marker" },
    { color: "#ef4444", gradient: "linear-gradient(#ef4444 0 28%, #fecaca 28%)", label: "Red Marker" },
    { color: "#6b7280", gradient: "linear-gradient(#6b7280 0 28%, #e5e7eb 28%)", label: "Gray Marker" },
  ];

  const colorDots = [
    { color: "#111111", label: "Black" },
    { color: "#16a34a", label: "Green" },
    { color: "#ef4444", label: "Red" },
    { color: "#6b7280", label: "Gray" },
    { color: "#8b5cf6", label: "Purple" },
  ];

  return (
    <article className="whiteboard-card" ref={cardRef}>
      <div className="whiteboard-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2>Whiteboard</h2>
          {isLiveConnected && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "3px 10px",
                borderRadius: 20,
                background: "#f0fdf4",
                color: "#16a34a",
                fontSize: 12,
                fontWeight: 600,
                border: "1px solid #bbf7d0",
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#16a34a", animation: "pulse 1.5s infinite" }} />
              AI Watching Live
            </span>
          )}
        </div>
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
            cursor: activeTool === "pen" || activeTool === "highlighter" ? "crosshair" : activeTool === "eraser" ? "cell" : activeTool === "shapes" ? "crosshair" : "default",
            pointerEvents: "auto",
            touchAction: "none",
          }}
        >
          {dimensions.width > 0 && dimensions.height > 0 && (
            <Stage
              ref={effectiveStageRef}
              width={dimensions.width}
              height={dimensions.height}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onMouseUp={handlePointerUp}
              onTouchStart={handlePointerDown}
              onTouchMove={handlePointerMove}
              onTouchEnd={handlePointerUp}
            >
              <Layer>
                {localLines.map((line, i) => (
                  <Line
                    key={i}
                    points={line.points}
                    stroke={line.tool === "eraser" ? "#ffffff" : line.color || "#111111"}
                    strokeWidth={line.strokeWidth || (line.tool === "highlighter" ? 26 : line.tool === "eraser" ? 36 : 3.5)}
                    tension={line.tool === "shape-rect" ? 0 : 0.4}
                    closed={line.tool === "shape-rect"}
                    lineCap="round"
                    lineJoin="round"
                    globalCompositeOperation={
                      line.tool === "eraser" ? "destination-out" : "source-over"
                    }
                    opacity={line.tool === "highlighter" ? 0.35 : 1}
                  />
                ))}
              </Layer>
            </Stage>
          )}
        </div>

        {/* AI Live Teacher Annotations / Highlights */}
        {aiHighlights.map((hl, idx) => (
          <div
            key={hl.id || idx}
            style={{
              position: "absolute",
              left: `${hl.x}%`,
              top: `${hl.y}%`,
              width: `${hl.width || 24}%`,
              height: `${hl.height || 16}%`,
              border: "3px dashed #ef4444",
              borderRadius: 12,
              backgroundColor: "rgba(239, 68, 68, 0.12)",
              boxShadow: "0 0 16px rgba(239, 68, 68, 0.3)",
              pointerEvents: "none",
              zIndex: 6,
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "flex-end",
              padding: "4px 8px",
              animation: "pulse 1.5s infinite ease-in-out",
            }}
          >
            {hl.label && (
              <span style={{ background: "#ef4444", color: "#fff", fontSize: 11, fontWeight: 700, borderRadius: 4, padding: "2px 6px" }}>
                {hl.label}
              </span>
            )}
          </div>
        ))}

        {/* AI Live Teacher Hint Tooltip */}
        {aiHints.map((hint, idx) => (
          <div
            key={hint.id || idx}
            style={{
              position: "absolute",
              left: `${hint.x || 10}%`,
              top: `${hint.y || 10}%`,
              background: "#111111",
              color: "#ffffff",
              padding: "8px 14px",
              borderRadius: 10,
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25)",
              fontSize: 14,
              fontWeight: 600,
              zIndex: 7,
              pointerEvents: "none",
              display: "flex",
              alignItems: "center",
              gap: 8,
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <Sparkles size={16} />
            <span>{hint.text}</span>
          </div>
        ))}

        {/* Whiteboard Header: Only title, no hardcoded content */}
        {lessonTitle && (
          <div style={{ position: "relative", zIndex: 1, pointerEvents: "none", userSelect: "none", padding: "28px 32px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, borderBottom: "2px solid #111111", paddingBottom: 6 }}>
              <h3 style={{ margin: 0, color: "#111111", fontSize: 22, fontWeight: 700, letterSpacing: "-0.01em" }}>
                {lessonTitle}
              </h3>
            </div>
          </div>
        )}

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
                  boxShadow: activeColor === m.color && activeTool === "pen" ? "0 4px 10px rgba(0,0,0,0.25)" : "none",
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
                  boxShadow: activeColor === c.color && activeTool === "pen" ? "0 0 0 3px rgba(0, 0, 0, 0.25)" : "none",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                }}
              />
            </button>
          ))}
          <button
            type="button"
            onClick={() => emitFrame(true)}
            style={{
              height: 38,
              padding: "0 14px",
              borderRadius: 8,
              background: "#0a0a0a",
              color: "#ffffff",
              border: 0,
              fontFamily: "Outfit, sans-serif",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              marginLeft: "auto",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            }}
            title="Ask AI Teacher to inspect whiteboard work"
          >
            <Zap size={15} />
            <span>Check My Board</span>
          </button>
          <button
            type="button"
            className="tool-button"
            style={{ border: "1px solid #e5e5e5" }}
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

const LiveLesson = ({ onEnd, lessonTitle = "Live Lesson", lessonSubtitle = "", lessonProgress = 0, userId = "" }) => {
  const [activeRailTab, setActiveRailTab] = useState("Overview");
  const [activeTool, setActiveTool] = useState("pen");
  const [activeColor, setActiveColor] = useState("#111111");
  const [clearTrigger, setClearTrigger] = useState(0);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [attachedFile, setAttachedFile] = useState(null);
  const fileInputRef = useRef(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const isMutedRef = useRef(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMicStreaming, setIsMicStreaming] = useState(false);
  const [studentVolume, setStudentVolume] = useState(0);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [aiHighlights, setAiHighlights] = useState([]);
  const [aiHints, setAiHints] = useState([]);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  // Multi-page Whiteboard Support
  const [pages, setPages] = useState([
    { id: 1, title: lessonTitle || "Interactive Whiteboard", subtitle: lessonSubtitle || "Live Workspace", lines: [] },
  ]);
  const [activePageId, setActivePageId] = useState(1);

  const wsRef = useRef(null);
  const playerRef = useRef(null);
  const recorderRef = useRef(null);
  const chatScrollRef = useRef(null);
  const stageRef = useRef(null);

  const currentPage = pages.find((p) => p.id === activePageId) || pages[0] || { id: 1, lines: [] };
  const currentLines = currentPage?.lines || [];

  const handleCreatePage = () => {
    const nextId = pages.length > 0 ? Math.max(...pages.map((p) => p.id)) + 1 : 1;
    const newPage = {
      id: nextId,
      title: `Whiteboard Page ${nextId}`,
      subtitle: `Created at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      lines: [],
    };
    setPages((prev) => [...prev, newPage]);
    setActivePageId(nextId);
  };

  const handleCurrentLinesChange = (newLines) => {
    setPages((prev) =>
      prev.map((p) => (p.id === activePageId ? { ...p, lines: newLines } : p))
    );
  };

  const handleClearPage = () => {
    setPages((prev) =>
      prev.map((p) => (p.id === activePageId ? { ...p, lines: [] } : p))
    );
    setClearTrigger((t) => t + 1);
  };

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, liveTranscript, loadingAI]);

  useEffect(() => {
    let isMounted = true;
    const player = new AudioStreamPlayer({
      onPlayStateChange: (playing) => {
        if (isMounted) setIsSpeaking(playing);
      },
    });
    playerRef.current = player;

    const recorder = new AudioStreamRecorder({
      onChunk: (base64Pcm) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "audio", data: base64Pcm }));
        }
      },
      onLevel: (vol) => {
        if (isMounted) setStudentVolume(vol);
      },
    });
    recorderRef.current = recorder;

    const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";
    const wsUrl = apiBase.replace(/^http/, "ws") + "/live-tutor";
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = async () => {
      if (!isMounted) return;
      setLoadingAI(true);
      const initTopic = lessonTitle || "Algebra";
      ws.send(
        JSON.stringify({
          topic: initTopic,
          user_id: userId,
          type: "handshake",
        })
      );
      try {
        await unlockAudioContext();
        await recorder.start();
        if (isMounted) setIsMicStreaming(true);
      } catch (err) {
        console.log("Microphone ready upon user interaction:", err);
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "ready") {
          setIsLiveConnected(true);
          setLoadingAI(false);
        } else if (msg.type === "reconnecting") {
          setIsLiveConnected(false);
          setLoadingAI(true);
          const t = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          setChatMessages((prev) => [
            ...prev,
            { sender: "ai", text: "Reconnecting to AI tutor... please wait.", time: t },
          ]);
        } else if (msg.type === "error") {
          setIsLiveConnected(false);
          setLoadingAI(false);
          const errTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          const errMsg = msg.message || "The AI tutor session could not start. Please try again.";
          setChatMessages((prev) => [
            ...prev,
            { sender: "ai", text: `Session error: ${errMsg}`, time: errTime },
          ]);
        } else if (msg.type === "audio" && msg.data) {
          setLoadingAI(false);
          if (!isMutedRef.current && playerRef.current) {
            playerRef.current.playChunk(msg.data, 24000);
          }
        } else if ((msg.type === "text_delta" || msg.type === "text") && msg.text) {
          setLoadingAI(false);
          const raw = msg.text;
          if (!raw.includes("**Acknowledge") && !raw.includes("**Plan") && !raw.includes("**Thought") && !raw.includes("**Reasoning")) {
            setLiveTranscript((prev) => prev + raw);
          }
        } else if (msg.type === "turn_complete") {
          setLoadingAI(false);
          setLiveTranscript((current) => {
            const cleaned = current
              .replace(/\*\*[^*]+\*\*/g, "")
              .replace(/^(Thought|Thinking|Plan|Acknowledge|Reasoning):.*/gim, "")
              .trim();
            if (cleaned) {
              const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              setChatMessages((prev) => [...prev, { sender: "ai", text: cleaned, time: now }]);
            }
            return "";
          });
        } else if (msg.type === "interrupted") {
          if (playerRef.current) {
            playerRef.current.interrupt();
          }
          setIsSpeaking(false);
        } else if (msg.type === "whiteboard_action" || msg.type === "tool_call") {
          const name = msg.tool || msg.name;
          const args = msg.args || {};
          const call_id = msg.call_id;

          if (name === "highlight_board") {
            const newHl = {
              id: Date.now(),
              x: args.x || 10,
              y: args.y || 10,
              width: args.width || 25,
              height: args.height || 18,
              label: args.label || "Check this",
            };
            setAiHighlights((prev) => [...prev, newHl]);
          } else if (name === "write_board_hint" || name === "write_math_equation") {
            const newHint = {
              id: Date.now(),
              text: args.latex || args.text,
              x: args.x || 20,
              y: args.y || 20,
              explanation: args.explanation,
            };
            setAiHints((prev) => [...prev, newHint]);
          } else if (name === "show_socratic_hint") {
            const hintMsg = args.hint_text || args.hint;
            if (hintMsg) {
              const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              setChatMessages((prev) => [...prev, { sender: "ai", text: `Hint: ${hintMsg}`, time: now }]);
            }
          } else if (name === "clear_board_annotations") {
            setAiHighlights([]);
            setAiHints([]);
          }

          if (call_id && ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: "tool_response",
                call_id,
                name,
                result: { status: "ok" },
              })
            );
          }
        }
      } catch (err) {
        console.warn("Error processing live WebSocket message:", err);
      }
    };

    ws.onclose = () => {
      if (isMounted) setIsLiveConnected(false);
    };

    ws.onerror = (err) => {
      console.error("Live WebSocket error:", err);
      if (isMounted) setIsLiveConnected(false);
    };

    return () => {
      isMounted = false;
      if (recorderRef.current) recorderRef.current.stop();
      if (playerRef.current) playerRef.current.destroy();
      if (wsRef.current) wsRef.current.close();
    };
  }, [lessonTitle]);

  const toggleLiveMic = async () => {
    if (!isMicStreaming) {
      try {
        await unlockAudioContext();
        await recorderRef.current?.start();
        setIsMicStreaming(true);
      } catch (err) {
        console.error("Microphone access denied or error:", err);
      }
    } else {
      recorderRef.current?.stop();
      setIsMicStreaming(false);
      setStudentVolume(0);
    }
  };

  const toggleMute = () => {
    const next = !isMuted;
    isMutedRef.current = next;
    setIsMuted(next);
    if (next && playerRef.current) {
      playerRef.current.interrupt();
    }
  };

  const handleInterrupt = () => {
    if (playerRef.current) {
      playerRef.current.interrupt();
    }
    setIsSpeaking(false);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "interrupt" }));
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
    }
  };

  const handleSendMessage = async (customText) => {
    const textToSend = customText || chatInput;
    if (!textToSend.trim() && !attachedFile) return;

    try {
      await unlockAudioContext();
    } catch (e) {}

    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const fullText = attachedFile
      ? `${textToSend ? textToSend + " " : ""}[Attached: ${attachedFile.name}]`
      : textToSend;

    setChatMessages((prev) => [...prev, { sender: "student", text: fullText, time }]);
    if (!customText) setChatInput("");
    setAttachedFile(null);
    setLoadingAI(true);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "text", text: fullText }));
    } else {
      const errTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setChatMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Connection lost. Please wait a moment and try again.", time: errTime },
      ]);
      setLoadingAI(false);
    }
  };

  const handleCanvasFrame = (base64Image) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "canvas_frame", data: base64Image }));
    }
  };

  const formatAIText = (text) => {
    if (!text) return "";
    const cleaned = text
      .replace(/\*\*[^*]+\*\*/g, "")
      .replace(/^(Thought|Thinking|Plan|Acknowledge|Reasoning):.*/gim, "")
      .trim();
    if (!cleaned) return "";
    return cleaned.split("\n").map((line, i) => (
      <React.Fragment key={i}>
        {line}
        <br />
      </React.Fragment>
    ));
  };

  const railItems = [
    { label: "Overview", icon: Activity },
    { label: "Whiteboard", icon: PenLine },
    { label: "Lesson Notes", icon: FileText },
    { label: "Resources", icon: BookOpen },
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
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1>
              {lessonTitle} <span className="live-dot">•</span>
            </h1>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: isLiveConnected ? "#f0fdf4" : "#f5f5f5",
                color: isLiveConnected ? "#16a34a" : "#222222",
                padding: "4px 12px",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 700,
                border: `1px solid ${isLiveConnected ? "#bbf7d0" : "#e5e5e5"}`,
              }}
            >
              <Radio size={14} className={isLiveConnected ? "pulse-icon" : ""} />
              {isLiveConnected ? "Real-Time AI Teacher Live" : "Connecting..."}
            </span>
          </div>
          {lessonSubtitle && <p>{lessonSubtitle}</p>}
        </div>
        <div className="top-actions">
          <button
            type="button"
            className="top-action"
            onClick={() => setShowSummaryModal(true)}
            style={{
              background: "#ffffff",
              color: "#111111",
              borderColor: "#e5e5e5",
              fontWeight: 600,
            }}
            title="Export Whiteboard & Notes"
          >
            <Download size={17} />
            Export
          </button>
          <button
            type="button"
            className="top-action"
            onClick={toggleLiveMic}
            style={{
              background: isMicStreaming ? "#f0fdf4" : "#ffffff",
              color: isMicStreaming ? "#16a34a" : "#111111",
              borderColor: isMicStreaming ? "#bbf7d0" : "#e5e5e5",
              fontWeight: 600,
            }}
          >
            {isMicStreaming ? <Mic size={18} color="#16a34a" /> : <MicOff size={18} color="#666666" />}
            {isMicStreaming ? "Live Mic ON" : "Turn Mic ON"}
          </button>
          <button
            type="button"
            className="top-action icon-action"
            onClick={toggleMute}
            title={isMuted ? "Unmute AI Voice" : "Mute AI Voice"}
          >
            {isMuted ? <VolumeX size={19} color="#ef4444" /> : <Volume2 size={19} color="#111111" />}
          </button>
          <button
            type="button"
            className="top-action"
            onClick={handleInterrupt}
            style={{ color: "#ef4444", display: isSpeaking ? "inline-flex" : "none" }}
            title="Interrupt AI Teacher"
          >
            <Square size={16} fill="currentColor" />
            Interrupt
          </button>
          <button
            type="button"
            className="end-lesson"
            onClick={() => setShowSummaryModal(true)}
          >
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
            <span>{lessonProgress}%</span>
          </div>
          <div className="live-progress-track">
            <div className="live-progress-fill" style={{ width: `${lessonProgress}%` }} />
          </div>
        </div>
      </aside>

      {!isWhiteboard && (
        <section className="teacher-panel">
          <h2 className="live-section-title">Teacher</h2>
          <article className="live-teacher-card">
            <div className="teacher-photo" />
            <h2>Tutor AI</h2>
            <VoiceBars active={isSpeaking} muted={isMuted} />
          </article>
          <article className="teacher-message">
            {liveTranscript ? (
              formatAIText(liveTranscript)
            ) : chatMessages.filter((m) => m.sender === "ai").length > 0 ? (
              formatAIText(chatMessages.filter((m) => m.sender === "ai").slice(-1)[0].text)
            ) : (
              lessonTitle ? `Today we are exploring: ${lessonTitle}. I'm watching the whiteboard in real time!` : "Welcome to your real-time AI lesson!"
            )}
          </article>
          <div className="teacher-controls">
            <button
              type="button"
              className={`control-button${isMicStreaming ? " active" : ""}`}
              onClick={toggleLiveMic}
              title={isMicStreaming ? "Mute Microphone" : "Unmute Microphone"}
            >
              {isMicStreaming ? <Mic size={22} color="#16a34a" /> : <MicOff size={22} color="#ef4444" />}
              <span>{isMicStreaming ? "Mic On" : "Mic Off"}</span>
            </button>
            <button
              type="button"
              className={`control-button${isMuted ? " muted" : ""}`}
              onClick={toggleMute}
              title={isMuted ? "Unmute AI" : "Mute AI"}
            >
              {isMuted ? <VolumeX size={22} color="#ef4444" /> : <Volume2 size={22} color="#111111" />}
              <span>{isMuted ? "Unmute" : "Mute"}</span>
            </button>
            <button type="button" className="control-button" onClick={handleInterrupt} title="Interrupt AI">
              <Square size={20} color="#ef4444" fill={isSpeaking ? "#ef4444" : "none"} />
              <span>Stop AI</span>
            </button>
          </div>
          <article className="voice-panel">
            <h3>Voice & Audio Stream</h3>
            <span className="wave-label">AI Teacher (24kHz Live Audio)</span>
            <div className="wave-row">
              <VoiceBars active={isSpeaking} muted={isMuted} />
              <Volume2 size={18} color={isSpeaking ? "#111111" : "#94a3b8"} />
            </div>
            <span className="wave-label" style={{ display: "block", marginTop: 16 }}>
              Student Mic {isMicStreaming ? "(Streaming 16kHz PCM)" : "(Muted)"}
            </span>
            <div className="wave-row">
              <VoiceBars active={isMicStreaming && studentVolume > 0.05} />
              <button
                type="button"
                onClick={toggleLiveMic}
                style={{
                  border: 0,
                  background: isMicStreaming ? "#f0fdf4" : "#f5f5f5",
                  color: isMicStreaming ? "#16a34a" : "#666666",
                  padding: 6,
                  borderRadius: 8,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                title={isMicStreaming ? "Click to pause mic" : "Click to stream mic"}
              >
                {isMicStreaming ? <Mic size={18} /> : <MicOff size={18} />}
              </button>
            </div>
          </article>
        </section>
      )}

      <section className="whiteboard-zone">
        {activeRailTab === "Resources" || activeRailTab === "Lesson Notes" ? (
          <ContentListView type={activeRailTab} topic={lessonTitle} />
        ) : (
          <InteractiveWhiteboard
            stageRef={stageRef}
            lines={currentLines}
            setLines={handleCurrentLinesChange}
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            activeColor={activeColor}
            setActiveColor={setActiveColor}
            clearTrigger={clearTrigger}
            lessonTitle={lessonTitle}
            lessonSteps={[]}
            onCanvasFrame={handleCanvasFrame}
            aiHighlights={aiHighlights}
            aiHints={aiHints}
            isLiveConnected={isLiveConnected}
          />
        )}
      </section>

      {isWhiteboard ? (
        <WhiteboardSidebar
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          onClear={handleClearPage}
          pages={pages}
          activePageId={activePageId}
          onSelectPage={setActivePageId}
          onCreatePage={handleCreatePage}
        />
      ) : (
        <aside className="chat-panel">
          <div className="chat-header">
            <h3>Class Chat</h3>
            <span className="live-chat-badge">
              <Sparkles size={13} />
              Tutor AI
            </span>
          </div>
          <div className="chat-scroll" ref={chatScrollRef}>
            {chatMessages.length === 0 && !liveTranscript && (
              <div className="chat-empty-state">
                <div className="chat-empty-icon">
                  <Sparkles size={24} color="#111111" />
                </div>
                <h4>Start a Conversation</h4>
                <p>Ask a question, upload a worksheet, or ask Tutor AI to inspect your whiteboard.</p>
              </div>
            )}
            {chatMessages.map((msg, idx) =>
              msg.sender === "ai" ? (
                <div className="chat-message" key={idx}>
                  <div className="chat-avatar" />
                  <div>
                    <div className="message-head">
                      <span>Tutor AI</span>
                      <span className="message-time">{msg.time}</span>
                    </div>
                    <div>{formatAIText(msg.text)}</div>
                  </div>
                </div>
              ) : (
                <div className="student-bubble" key={idx}>
                  <div className="message-head">
                    <span>You</span>
                    <span className="message-time">{msg.time}</span>
                  </div>
                  <p style={{ margin: 0 }}>{msg.text}</p>
                </div>
              )
            )}
            {liveTranscript && (
              <div className="chat-message" style={{ borderLeft: "3px solid #111111", paddingLeft: 8 }}>
                <div className="chat-avatar" />
                <div>
                  <div className="message-head">
                    <span style={{ color: "#111111", fontWeight: 700 }}>Tutor AI (Live)</span>
                    <span className="message-time">Now</span>
                  </div>
                  <div>{formatAIText(liveTranscript)}</div>
                </div>
              </div>
            )}

            <div className="quick-replies">
              <button type="button" onClick={() => handleSendMessage("Explain this step by step")}>Explain step by step</button>
              <button type="button" onClick={() => handleSendMessage("Can you give me a hint for this problem?")}>Give me a hint</button>
              <button type="button" onClick={() => handleSendMessage("Is my calculation on the board correct?")}>Check my board</button>
              <button type="button" onClick={() => handleSendMessage("I solved it! What is next?")}>I solved it!</button>
            </div>
          </div>
          <div className="chat-input-wrap">
            {attachedFile && (
              <div className="attached-file-chip">
                <FileText size={14} />
                <span style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {attachedFile.name}
                </span>
                <button
                  type="button"
                  className="attached-file-remove"
                  onClick={() => setAttachedFile(null)}
                  title="Remove file"
                >
                  <X size={13} />
                </button>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFileUpload}
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
            <input
              className="chat-input"
              placeholder={isMicStreaming ? "Speaking live or type a message..." : "Type a message or attach a file..."}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (chatInput.trim() || attachedFile)) {
                  handleSendMessage();
                }
              }}
            />
            <div className="chat-input-actions">
              <div className="chat-action-left">
                <button
                  type="button"
                  className="chat-icon-btn"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload image or file"
                >
                  <Paperclip size={17} />
                </button>
                <button
                  type="button"
                  onClick={toggleLiveMic}
                  style={{
                    border: 0,
                    background: isMicStreaming ? "#f0fdf4" : "#f5f5f5",
                    color: isMicStreaming ? "#16a34a" : "#555555",
                    padding: "6px 10px",
                    borderRadius: 8,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    transition: "all 0.15s ease",
                  }}
                  title={isMicStreaming ? "Live microphone is streaming. Click to mute." : "Click to stream voice"}
                >
                  {isMicStreaming ? <Mic size={16} className="pulse-icon" /> : <MicOff size={16} />}
                  <span>{isMicStreaming ? "Mic On" : "Mic Off"}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (chatInput.trim() || attachedFile) {
                    handleSendMessage();
                  }
                }}
                style={{
                  border: 0,
                  background: (chatInput.trim() || attachedFile) ? "#0a0a0a" : "#f5f5f5",
                  color: (chatInput.trim() || attachedFile) ? "#ffffff" : "#a1a1aa",
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: (chatInput.trim() || attachedFile) ? "pointer" : "default",
                  transition: "all 0.15s ease",
                }}
                title="Send message"
              >
                <ArrowUp size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </aside>
      )}

      <SessionSummaryModal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        onFinish={() => {
          recorderRef.current?.stop();
          playerRef.current?.destroy();
          wsRef.current?.close();
          onEnd();
        }}
        lessonTitle={lessonTitle}
        pagesCount={pages.length}
        chatMessages={chatMessages}
        stageRef={stageRef}
      />
    </main>
  );
};

const buildSubjectsList = (courses, skillMastery = []) => {
  if (!courses || Object.keys(courses).length === 0) return [];
  const masteryMap = {};
  skillMastery.forEach((sm) => {
    masteryMap[sm.skill] = sm.mastery;
  });

  const dynamicSubjects = Object.keys(courses).map((courseName) => {
    const lessonsList = courses[courseName] || [];
    let totalMastery = 0;
    let countedSkills = 0;

    lessonsList.forEach((les) => {
      (les.skills || []).forEach((sk) => {
        if (sk in masteryMap) {
          totalMastery += masteryMap[sk];
          countedSkills++;
        } else {
          const matchingKey = Object.keys(masteryMap).find(
            (k) =>
              k.toLowerCase() === sk.toLowerCase() ||
              sk.toLowerCase().includes(k.toLowerCase()) ||
              k.toLowerCase().includes(sk.toLowerCase())
          );
          if (matchingKey) {
            totalMastery += masteryMap[matchingKey];
            countedSkills++;
          }
        }
      });
    });

    const realProgress = countedSkills > 0 ? Math.round((totalMastery / countedSkills) * 100) : 0;
    const matchingIcon =
      courseName.includes("Algebra") && !courseName.includes("Pre")
        ? Calculator
        : courseName.includes("Functions")
        ? FunctionSquare
        : courseName.includes("Geometry")
        ? Shapes
        : courseName.includes("Statistics")
        ? BarChart3
        : Divide;

    const details = getSubjectDetails(courseName);

    return {
      name: courseName,
      description: details.cardDescription,
      detailDescription: details.detailDescription,
      progress: realProgress,
      lessons: lessonsList.length,
      level: "Intermediate",
      icon: matchingIcon,
      lessonsList,
    };
  });

  dynamicSubjects.push({
    name: "More Subjects",
    description: "Stay tuned for more subjects.",
    progress: null,
    lessons: null,
    level: null,
    icon: MoreHorizontal,
    comingSoon: true,
  });

  return dynamicSubjects;
};

const AIClassroom = () => {
  const navigate = useNavigate();
  const [user] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const firstName = user?.full_name?.split(" ")[0] || "Student";
  const [subjectsList, setSubjectsList] = useState(() => {
    try {
      const cachedCurr = JSON.parse(localStorage.getItem("tutorflow_cached_curriculum") || "null");
      const cachedAnalytics = JSON.parse(localStorage.getItem("tutorflow_cached_analytics") || "null");
      if (cachedCurr?.courses) {
        return buildSubjectsList(cachedCurr.courses, cachedAnalytics?.skill_mastery || []);
      }
      return [];
    } catch {
      return [];
    }
  });
  const [loadingSubjects, setLoadingSubjects] = useState(() => {
    return !localStorage.getItem("tutorflow_cached_curriculum");
  });
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [nextLessonData, setNextLessonData] = useState(null);
  const [liveLesson, setLiveLesson] = useState(false);
  const [sortBy, setSortBy] = useState("recent");
  const [loadError, setLoadError] = useState(false);

  const fetchSubjects = useCallback(() => {
    if (!localStorage.getItem("tutorflow_cached_curriculum")) {
      setLoadingSubjects(true);
    }
    setLoadError(false);

    Promise.all([
      api("/curriculum").catch(() => null),
      api("/analytics/dashboard").catch(() => null),
    ]).then(([currData, analyticsData]) => {
      if (currData?.courses && Object.keys(currData.courses).length > 0) {
        localStorage.setItem("tutorflow_cached_curriculum", JSON.stringify(currData));
        if (analyticsData) {
          localStorage.setItem("tutorflow_cached_analytics", JSON.stringify(analyticsData));
        }
        const subjects = buildSubjectsList(currData.courses, analyticsData?.skill_mastery || []);
        setSubjectsList(subjects);
      } else {
        if (!localStorage.getItem("tutorflow_cached_curriculum")) {
          setSubjectsList([]);
          setLoadError(true);
        }
      }
      setLoadingSubjects(false);
    });
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const sortedSubjects = useMemo(() => {
    const available = subjectsList.filter((s) => !s.comingSoon);
    const comingSoon = subjectsList.filter((s) => s.comingSoon);

    const sorted = [...available].sort((a, b) => {
      switch (sortBy) {
        case "progress-desc":
          return (b.progress || 0) - (a.progress || 0);
        case "progress-asc":
          return (a.progress || 0) - (b.progress || 0);
        case "lessons-desc":
          return (b.lessons || 0) - (a.lessons || 0);
        case "name":
          return a.name.localeCompare(b.name);
        case "level":
          return (a.level || "").localeCompare(b.level || "");
        default:
          return 0;
      }
    });

    return [...sorted, ...comingSoon];
  }, [subjectsList, sortBy]);

  useEffect(() => {
    if (selectedSubject && !selectedSubject.comingSoon) {
      api(`/curriculum/next-lesson?topic=${encodeURIComponent(selectedSubject.name)}`)
        .then(data => setNextLessonData(data))
        .catch(() => setNextLessonData(null));
    }
  }, [selectedSubject]);

  if (liveLesson) {
    const title = selectedSubject ? selectedSubject.name : "Live Lesson";
    const subtitle = selectedSubject ? `${selectedSubject.subject || "Algebra"} • ${selectedSubject.module || ""}` : "";
    const progress = selectedSubject ? (selectedSubject.progress || 0) : 0;
    return (
      <LiveLesson
        onEnd={() => setLiveLesson(false)}
        lessonTitle={title}
        lessonSubtitle={subtitle}
        lessonProgress={progress}
        userId={user?.id || ""}
      />
    );
  }

  if (selectedSubject) {
    return (
      <main className="lesson-detail-page">
        <style>{styles}</style>

        <div className="detail-top-actions">
          <div className="tf-header-actions">
            <button type="button" className="tf-bell-btn" aria-label="Notifications">
              <Bell size={22} strokeWidth={2} />
            </button>
            <div
              className="tf-user-avatar"
              onClick={() => navigate("/profile")}
              title="View Profile"
            >
              {firstName ? firstName[0].toUpperCase() : "M"}
            </div>
          </div>
        </div>

        <section>
          <button type="button" className="back-button" onClick={() => setSelectedSubject(null)}>
            <ArrowRight size={20} style={{ transform: "rotate(180deg)" }} />
            Back to My Lessons
          </button>

          <div className="lesson-hero">
            <div className="lesson-icon-large">
              {(() => {
                const Icon = selectedSubject.icon || Calculator;
                return <Icon size={52} strokeWidth={2} />;
              })()}
            </div>
            <div>
              <p className="lesson-kicker">{selectedSubject.name} • {selectedSubject.level || "Beginner"}</p>
              <h1 className="lesson-title-large">{selectedSubject.name}</h1>
              <p className="lesson-description-large">
                {selectedSubject.detailDescription || selectedSubject.description || getSubjectDetails(selectedSubject.name).detailDescription}
              </p>
              <div className="lesson-meta">
                <span className="lesson-meta-item">
                  <Clock3 size={17} />
                  35 min
                </span>
                <span className="meta-divider" />
                <span className="lesson-meta-item">
                  <BarChart3 size={17} />
                  {selectedSubject.level || "Intermediate"}
                </span>
                <span className="meta-divider" />
                <span className="status-badge">In Progress</span>
              </div>
            </div>
          </div>

          <div className="detail-stack">
            <article className="detail-card overview-card">
              {/* Overview & Whiteboard */}
              <div className="overview-hero-row">
                <div>
                  <h2>Overview</h2>
                  <p>
                    {selectedSubject.detailDescription || getSubjectDetails(selectedSubject.name).detailDescription}
                  </p>
                  {nextLessonData?.outcomes && (
                    <div style={{ marginTop: 14 }}>
                      <p style={{ fontWeight: 600, marginBottom: 6, color: "#111111", fontSize: "14.5px" }}>
                        Target Lesson: {nextLessonData.lesson}
                      </p>
                      <ul style={{ margin: 0, paddingLeft: 18, color: "#666666", fontSize: "14px", lineHeight: "22px" }}>
                        {nextLessonData.outcomes.map((out, idx) => (
                          <li key={idx} style={{ marginBottom: 3 }}>{out}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="detail-board-wrap" aria-hidden="true">
                  <img
                    src="/whiteboard.webp"
                    alt="Interactive Whiteboard"
                    className="detail-whiteboard-img"
                  />
                </div>
              </div>

              {/* Objectives */}
              <div className="detail-section-block">
                <h3 className="detail-section-title">
                  <ClipboardList size={18} />
                  Objectives
                </h3>
                <ul className="objectives-list">
                  {(() => {
                    const allOutcomes = selectedSubject.lessonsList?.flatMap((les) => les.outcomes || []) || [];
                    if (allOutcomes.length > 0) {
                      return allOutcomes.slice(0, 5).map((outcome, idx) => (
                        <li key={idx}>{outcome}</li>
                      ));
                    }
                    return (
                      <>
                        <li>Master foundational concepts and operations in {selectedSubject.name}.</li>
                        <li>Solve multi-step problems with AI Socratic guidance.</li>
                        <li>Apply mathematical problem-solving strategies in guided interactive exercises.</li>
                      </>
                    );
                  })()}
                </ul>
              </div>

              {/* Skills You'll Learn */}
              <div className="detail-section-block">
                <h3 className="detail-section-title">
                  <GraduationCap size={18} />
                  Skills You’ll Learn
                </h3>
                <div className="skills-tags-wrap">
                  {(() => {
                    const allSkills = Array.from(
                      new Set(
                        selectedSubject.lessonsList?.flatMap((les) =>
                          (les.skills || []).map((s) => s.replace(/^[^:]+:\s*/, ""))
                        ) || []
                      )
                    );
                    if (allSkills.length > 0) {
                      return allSkills.map((skill) => (
                        <span key={skill} className="skill-badge">
                          {skill}
                        </span>
                      ));
                    }
                    return [selectedSubject.name, "Problem Solving", "Mathematical Reasoning", "Step-by-Step Proofs"].map(
                      (skill) => (
                        <span key={skill} className="skill-badge">
                          {skill}
                        </span>
                      )
                    );
                  })()}
                </div>
              </div>

              {/* Course Modules */}
              {selectedSubject.lessonsList && selectedSubject.lessonsList.length > 0 && (
                <div className="detail-section-block">
                  <h3 className="detail-section-title">
                    <BookOpen size={18} />
                    Course Modules ({selectedSubject.lessonsList.length})
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {selectedSubject.lessonsList.map((les, lIdx) => (
                      <div
                        key={lIdx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "12px 16px",
                          background: "#fafafa",
                          borderRadius: "12px",
                          border: "1px solid #ebebeb",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "14.5px", color: "#111111" }}>
                            {lIdx + 1}. {les.title}
                          </div>
                          {les.outcomes && les.outcomes.length > 0 && (
                            <div style={{ fontSize: "13px", color: "#666666", marginTop: "2px" }}>
                              {les.outcomes[0]}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setLiveLesson(true)}
                          style={{
                            padding: "6px 14px",
                            background: "#111111",
                            color: "#ffffff",
                            borderRadius: "8px",
                            border: 0,
                            fontSize: "12.5px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Start
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resources */}
              <div className="detail-section-block">
                <h3 className="detail-section-title">
                  <FileText size={18} />
                  Resources
                </h3>
                <div className="resources-grid">
                  <div className="resource-item">
                    <BookOpen size={16} />
                    <span>Practice Worksheets</span>
                  </div>
                  <div className="resource-item">
                    <File size={16} />
                    <span>Formula Cheat Sheet</span>
                  </div>
                  <div className="resource-item">
                    <PenLine size={16} />
                    <span>Whiteboard Notes</span>
                  </div>
                </div>
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

          </div>
        </section>

        <aside className="detail-sidebar">
          <article className="detail-card side-card teacher-card">
            <h2>Your Teacher</h2>
            <div className="teacher-avatar" />
            <p className="teacher-name">Tutor AI</p>
            <p className="teacher-sub">Your personal AI Teacher</p>
          </article>

          <article className="detail-card side-card">
            <h2>Lesson Details</h2>
            {[
              { label: "Subject", value: selectedSubject.name, icon: BookOpen },
              { label: "Level", value: selectedSubject.level || "Beginner", icon: BarChart3 },
              { label: "Lessons", value: selectedSubject.lessons ? `${selectedSubject.lessons} lessons` : "—", icon: Calculator },
              { label: "Estimated Time", value: selectedSubject.lessons ? `${selectedSubject.lessons * 3} min` : "—", icon: Clock3 },
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

        <div className="tf-header-actions">
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
            {user?.full_name ? user.full_name[0].toUpperCase() : (user?.email ? user.email[0].toUpperCase() : "S")}
          </div>
        </div>
      </header>

      <section className="lessons-content">
        <div className="subjects-toolbar">
          <h2 className="subjects-title">Your Subjects</h2>
          <div className="sort-wrap">
            <span>Sort by</span>
            <div className="sort-control">
              <select
                className="sort-select"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                aria-label="Sort subjects"
              >
                {sortOptions.map((option) => (
                  <option value={option.value} key={option.value}>{option.label}</option>
                ))}
              </select>
              <ChevronDown className="sort-chevron" size={20} aria-hidden="true" />
            </div>
          </div>
        </div>

        <div className="subject-grid">
          {loadingSubjects ? (
            <div
              style={{
                gridColumn: "1 / -1",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "260px",
                gap: "14px",
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  border: "3px solid #f0f0f0",
                  borderTopColor: "#111111",
                  borderRadius: "50%",
                  animation: "spin 0.7s linear infinite",
                }}
              />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <p
                style={{
                  color: "#666666",
                  fontSize: "16px",
                  margin: 0,
                  fontWeight: 500,
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                Loading subjects…
              </p>
            </div>
          ) : sortedSubjects.length === 0 ? (
            <div
              className="tf-empty-wrap"
              style={{
                gridColumn: "1 / -1",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "260px",
                padding: "48px 16px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "#f5f5f5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "16px",
                }}
              >
                <BookOpen size={28} color="#111111" />
              </div>
              <h3 style={{ margin: "0 0 6px", fontSize: "18px", fontWeight: 700, color: "#111111" }}>
                {loadError ? "Could not load subjects" : "No subjects available"}
              </h3>
              <p style={{ margin: "0 0 16px", fontSize: "14px", color: "#666666", maxWidth: "340px" }}>
                {loadError
                  ? "We could not connect to the curriculum service. Please check your connection and try again."
                  : "Curriculum courses will appear here once configured."}
              </p>
              <button
                type="button"
                onClick={fetchSubjects}
                style={{
                  padding: "10px 22px",
                  background: "#111111",
                  color: "#ffffff",
                  borderRadius: "12px",
                  border: 0,
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Retry
              </button>
            </div>
          ) : (
            sortedSubjects.map((subject) => (
              <SubjectCard subject={subject} key={subject.name} onOpen={setSelectedSubject} />
            ))
          )}
        </div>

      </section>
    </main>
  );
};

export default AIClassroom;
