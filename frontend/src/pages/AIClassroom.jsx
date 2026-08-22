import React, { useState, useEffect, useRef } from "react";
import { Stage, Layer, Line } from "react-konva";
import { api } from "../lib/api";
import { AudioStreamPlayer, AudioStreamRecorder, unlockAudioContext } from "../lib/liveAudio";
import {
  Activity,
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
  Flame,
  GraduationCap,
  FunctionSquare,
  Hand,
  Highlighter,
  Home,
  Expand,
  LogOut,
  Mic,
  MicOff,
  MoreHorizontal,
  MousePointer2,
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

const sortSubjects = (sortBy) => {
  const availableSubjects = subjects.filter((subject) => !subject.comingSoon);
  const comingSoonSubjects = subjects.filter((subject) => subject.comingSoon);

  const sorted = [...availableSubjects].sort((a, b) => {
    switch (sortBy) {
      case "progress-desc":
        return b.progress - a.progress;
      case "progress-asc":
        return a.progress - b.progress;
      case "lessons-desc":
        return b.lessons - a.lessons;
      case "name":
        return a.name.localeCompare(b.name);
      case "level":
        return a.level.localeCompare(b.level);
      default:
        return subjects.indexOf(a) - subjects.indexOf(b);
    }
  });

  return [...sorted, ...comingSoonSubjects];
};

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
    display: flex;
    flex-direction: column;
    min-height: 0;
    height: 100%;
  }

  .whiteboard-header {
    height: 48px;
    min-height: 48px;
    border-bottom: 1px solid #eef2f7;
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
    cursor: pointer;
  }

  .tool-button.active {
    background: #eef4ff;
    color: #0054ff;
  }

  .board-canvas {
    position: relative;
    flex: 1;
    min-height: 0;
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
    left: 14px;
    right: 14px;
    bottom: 14px;
    height: 52px;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    background: #ffffff;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
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
    border-left: 1px solid #eef2f7;
    padding-top: 96px;
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    background: #ffffff;
    overflow: hidden;
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
    padding: 16px;
    overflow-y: auto;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 16px;
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
    padding: 0 46px 0 17px;
    border: 1px solid #E2E8F0;
    border-radius: 10px;
    background: #ffffff;
    color: #64748B;
    appearance: none;
    cursor: pointer;
    font-family: "Outfit", sans-serif;
    font-size: 17px;
    font-weight: 400;
  }

  .sort-select:hover {
    border-color: #cbd5e1;
  }

  .sort-select:focus {
    outline: none;
    border-color: #1a56db;
    box-shadow: none;
  }

  .sort-select option {
    font-family: "Outfit", sans-serif;
    font-weight: 400;
    color: #64748B;
    background: #ffffff;
  }

  .sort-control {
    position: relative;
  }

  .sort-chevron {
    position: absolute;
    top: 50%;
    right: 17px;
    color: #9aa9c3;
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
          <div style={{ padding: "32px 0", textAlign: "center" }}>
            <p style={{ color: "#64748b", fontSize: 14 }}>Loading {type.toLowerCase()} from database...</p>
          </div>
        ) : materials.length === 0 ? (
          <div style={{ padding: "40px 24px", textAlign: "center", border: "1px dashed #cbd5e1", borderRadius: 12, background: "#f8fafc", margin: "16px 0", width: "100%" }}>
            <FileText size={36} color="#94a3b8" style={{ marginBottom: 12 }} />
            <h3 style={{ margin: "0 0 6px 0", color: "#0f172a", fontSize: 16, fontWeight: 600 }}>No {type} yet for {topic}</h3>
            <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>Study guides and materials will appear here when created in your database.</p>
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

const InteractiveWhiteboard = ({
  activeTool,
  setActiveTool,
  activeColor,
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
  const stageRef = React.useRef(null);

  const [lines, setLines] = useState([]);
  const [history, setHistory] = useState([[]]);
  const [historyStep, setHistoryStep] = useState(0);
  const isDrawing = React.useRef(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const debounceTimerRef = React.useRef(null);

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
    if (!stageRef.current || !onCanvasFrame) return;
    try {
      const dataUrl = stageRef.current.toDataURL({ mimeType: "image/jpeg", quality: 0.6, pixelRatio: 1 });
      onCanvasFrame(dataUrl, triggerTurn);
    } catch (e) {
      console.warn("Canvas frame capture error:", e);
    }
  }, [onCanvasFrame]);

  const scheduleEmitFrame = React.useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      emitFrame(false);
    }, 800);
  }, [emitFrame]);

  React.useEffect(() => {
    if (clearTrigger > 0) {
      saveHistory([]);
      setLines([]);
      scheduleEmitFrame();
    }
  }, [clearTrigger, scheduleEmitFrame]);

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

    lastLine.points = lastLine.points.concat([point.x, point.y]);
    lines.splice(lines.length - 1, 1, lastLine);
    setLines(lines.concat());
  };

  const handlePointerUp = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    saveHistory(lines);
    scheduleEmitFrame();
  };

  const handleUndo = () => {
    if (historyStep > 0) {
      setHistoryStep(historyStep - 1);
      setLines(history[historyStep - 1]);
      scheduleEmitFrame();
    }
  };

  const handleRedo = () => {
    if (historyStep < history.length - 1) {
      setHistoryStep(historyStep + 1);
      setLines(history[historyStep + 1]);
      scheduleEmitFrame();
    }
  };

  const handleClear = () => {
    saveHistory([]);
    setLines([]);
    scheduleEmitFrame();
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
                background: "#eff6ff",
                color: "#0054ff",
                fontSize: 12,
                fontWeight: 600,
                border: "1px solid #bfdbfe",
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#0054ff", animation: "pulse 1.5s infinite" }} />
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
            cursor: activeTool === "pen" || activeTool === "highlighter" ? "crosshair" : activeTool === "eraser" ? "cell" : "default",
            pointerEvents: activeTool === "pointer" ? "none" : "auto",
            touchAction: "none",
          }}
        >
          {dimensions.width > 0 && dimensions.height > 0 && (
            <Stage
              ref={stageRef}
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
              background: "linear-gradient(135deg, #0054ff, #4338ca)",
              color: "#ffffff",
              padding: "8px 14px",
              borderRadius: 10,
              boxShadow: "0 8px 24px rgba(0, 84, 255, 0.35)",
              fontSize: 14,
              fontWeight: 600,
              zIndex: 7,
              pointerEvents: "none",
              display: "flex",
              alignItems: "center",
              gap: 8,
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            <Sparkles size={16} />
            <span>{hint.text}</span>
          </div>
        ))}

        {/* Lesson content overlay — driven by props */}
        {(lessonTitle || (lessonSteps && lessonSteps.length > 0)) && (
          <div style={{ position: "relative", zIndex: 1, pointerEvents: "none", userSelect: "none" }}>
            {lessonTitle && <h3>{lessonTitle}</h3>}
            {lessonSteps && lessonSteps.length > 0 && (
              <div className="equation-block">
                {lessonSteps.map((step, idx) => (
                  <p
                    key={idx}
                    style={{ textAlign: step.align || "left" }}
                    className={step.style || ""}
                  >
                    {step.text}
                  </p>
                ))}
              </div>
            )}
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
            onClick={() => emitFrame(true)}
            style={{
              height: 38,
              padding: "0 14px",
              borderRadius: 8,
              background: "#0054ff",
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
              boxShadow: "0 4px 12px rgba(0, 84, 255, 0.2)",
            }}
            title="Ask AI Teacher to inspect whiteboard work"
          >
            <Zap size={15} />
            <span>Check My Board</span>
          </button>
          <button
            type="button"
            className="tool-button"
            style={{ border: "1px solid #dfe8f7" }}
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

const LiveLesson = ({ onEnd, lessonTitle = "Live Lesson", lessonSubtitle = "", lessonProgress = 0 }) => {
  const [activeRailTab, setActiveRailTab] = useState("Overview");
  const [activeTool, setActiveTool] = useState("pen");
  const [activeColor, setActiveColor] = useState("#0054ff");
  const [clearTrigger, setClearTrigger] = useState(0);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMicStreaming, setIsMicStreaming] = useState(false);
  const [studentVolume, setStudentVolume] = useState(0);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [aiHighlights, setAiHighlights] = useState([]);
  const [aiHints, setAiHints] = useState([]);
  const [liveTranscript, setLiveTranscript] = useState("");

  const wsRef = useRef(null);
  const playerRef = useRef(null);
  const recorderRef = useRef(null);
  const chatScrollRef = useRef(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, liveTranscript, loadingAI]);

  // Setup Live Audio Player & WebSocket (Single persistent session)
  useEffect(() => {
    let isMounted = true;

    // 1. Initialize Audio Player
    const player = new AudioStreamPlayer({
      onPlayStateChange: (playing) => {
        if (isMounted) setIsSpeaking(playing);
      },
    });
    playerRef.current = player;

    // 2. Initialize Audio Recorder
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

    // 3. Connect to WebSocket
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//localhost:8080/api/v1/live-tutor`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!isMounted) return;
      setIsLiveConnected(true);
      setLoadingAI(false);
      // Send initial opening message to trigger the teacher's greeting
      const initTopic = lessonTitle || "Algebra";
      ws.send(
        JSON.stringify({
          type: "text",
          text: `Hello teacher! Please start our 1-on-1 live lesson on ${initTopic}. Greet me warmly and ask an opening question to get us started.`,
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "ready") {
          setIsLiveConnected(true);
        } else if (msg.type === "audio" && msg.data) {
          // Play low-latency 24kHz PCM chunk
          if (!isMuted && playerRef.current) {
            playerRef.current.playChunk(msg.data, 24000);
          }
        } else if (msg.type === "text_delta" && msg.text) {
          setLiveTranscript((prev) => prev + msg.text);
        } else if (msg.type === "turn_complete") {
          setLiveTranscript((current) => {
            if (current.trim()) {
              const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              setChatMessages((prev) => [...prev, { sender: "ai", text: current.trim(), time: now }]);
            }
            return "";
          });
        } else if (msg.type === "interrupted") {
          // Native Barge-in: student spoke, stop AI playback instantly!
          if (playerRef.current) {
            playerRef.current.interrupt();
          }
          setIsSpeaking(false);
        } else if (msg.type === "tool_call") {
          // AI co-drawing & annotation tool handling
          const { call_id, name, args } = msg;
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
          } else if (name === "write_board_hint") {
            const newHint = {
              id: Date.now(),
              text: args.text,
              x: args.x || 15,
              y: args.y || 15,
            };
            setAiHints((prev) => [...prev, newHint]);
          } else if (name === "clear_board_annotations") {
            setAiHighlights([]);
            setAiHints([]);
          }

          // Acknowledge tool call back to Gemini
          if (ws.readyState === WebSocket.OPEN) {
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

  const speechRecRef = useRef(null);
  const speechSilenceTimerRef = useRef(null);

  // Toggle Live Microphone Streaming
  const toggleLiveMic = async () => {
    unlockAudioContext();
    if (isMicStreaming) {
      recorderRef.current?.stop();
      if (speechSilenceTimerRef.current) clearTimeout(speechSilenceTimerRef.current);
      if (speechRecRef.current) {
        try { speechRecRef.current.abort(); } catch(e) {}
      }
      setIsMicStreaming(false);
    } else {
      try {
        await recorderRef.current?.start();
        setIsMicStreaming(true);

        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRec) {
          const rec = new SpeechRec();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = "en-US";

          rec.onresult = (evt) => {
            let interimTranscript = "";
            let finalTranscript = "";

            for (let i = evt.resultIndex; i < evt.results.length; ++i) {
              if (evt.results[i].isFinal) {
                finalTranscript += evt.results[i][0].transcript;
              } else {
                interimTranscript += evt.results[i][0].transcript;
              }
            }

            const currentSpoken = (finalTranscript || interimTranscript).trim();
            if (currentSpoken) {
              setChatInput(currentSpoken);
              handleInterrupt();

              if (speechSilenceTimerRef.current) clearTimeout(speechSilenceTimerRef.current);

              if (finalTranscript) {
                handleSendMessage(currentSpoken);
                setChatInput("");
              } else {
                // Short answers (e.g. "4", "x is 5", "subtract 3") trigger auto-send after 900ms pause!
                speechSilenceTimerRef.current = setTimeout(() => {
                  if (currentSpoken) {
                    handleSendMessage(currentSpoken);
                    setChatInput("");
                  }
                }, 900);
              }
            }
          };

          rec.onerror = (e) => {
            console.warn("Speech recognition warning:", e);
          };

          rec.onend = () => {
            if (isMicStreaming && speechRecRef.current) {
              try { rec.start(); } catch(e) {}
            }
          };

          try { rec.start(); speechRecRef.current = rec; } catch(e) {}
        }
      } catch (err) {
        console.error("Could not access microphone:", err);
        alert("Could not access your microphone. Please allow microphone permissions in your browser.");
      }
    }
  };

  // Instant interruption / barge-in action
  const handleInterrupt = () => {
    if (playerRef.current) {
      playerRef.current.interrupt();
    }
    setIsSpeaking(false);
  };

  // Push Canvas Frame over WebSocket to Gemini
  const handleCanvasFrame = (dataUrl, triggerTurn = false) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "canvas_frame",
          data: dataUrl,
          mime_type: "image/jpeg",
          trigger_turn: triggerTurn,
          prompt: triggerTurn ? "Please look at my whiteboard drawing and give me quick, clear feedback on what I just wrote." : undefined,
        })
      );
    }
  };

  const handleSendMessage = (textToSend = null) => {
    const text = (textToSend || chatInput).trim();
    if (!text) return;

    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setChatMessages((prev) => [...prev, { sender: "student", text, time: now }]);
    if (!textToSend) setChatInput("");

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // If AI is currently talking, interrupt it first
      handleInterrupt();
      wsRef.current.send(JSON.stringify({ type: "text", text }));
    }
  };

  const toggleMute = () => {
    if (!isMuted && playerRef.current) {
      playerRef.current.interrupt();
      setIsSpeaking(false);
    }
    setIsMuted((prev) => !prev);
  };

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
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1>
              {lessonTitle} <span className="live-dot">•</span>
            </h1>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: isLiveConnected ? "#eff6ff" : "#fef2f2",
                color: isLiveConnected ? "#0054ff" : "#ef4444",
                padding: "4px 12px",
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 700,
                border: `1px solid ${isLiveConnected ? "#bfdbfe" : "#fecaca"}`,
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
            onClick={toggleLiveMic}
            style={{
              background: isMicStreaming ? "#fee2e2" : "#f0fdf4",
              color: isMicStreaming ? "#ef4444" : "#16a34a",
              borderColor: isMicStreaming ? "#fca5a5" : "#bbf7d0",
              fontWeight: 600,
            }}
          >
            {isMicStreaming ? <Mic size={18} /> : <MicOff size={18} />}
            {isMicStreaming ? "Live Mic ON" : "Turn Mic ON"}
          </button>
          <button
            type="button"
            className="top-action icon-action"
            onClick={toggleMute}
            title={isMuted ? "Unmute AI Voice" : "Mute AI Voice"}
          >
            {isMuted ? <VolumeX size={19} color="#ef4444" /> : <Volume2 size={19} color="#0054ff" />}
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
            onClick={() => {
              recorderRef.current?.stop();
              playerRef.current?.destroy();
              wsRef.current?.close();
              onEnd();
            }}
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
          {lessonProgress >= 50 && <p style={{ margin: 0, color: "#334f87", fontSize: 12 }}>You're doing great!</p>}
        </div>
      </aside>

      {!isWhiteboard && (
        <section className="teacher-panel">
          <h2 className="live-section-title">Teacher</h2>
          <article className="live-teacher-card">
            <div className="teacher-photo" />
            <h2>TutorFlow AI</h2>
            <VoiceBars active={isSpeaking} muted={isMuted} />
            <br />
            <span className="speaking-badge">
              {isSpeaking ? "• Speaking Live" : isMuted ? "• Muted" : "• Listening Live"}
            </span>
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
              {isMicStreaming ? <Mic size={22} color="#0054ff" /> : <MicOff size={22} color="#ef4444" />}
              <span>{isMicStreaming ? "Mic On" : "Mic Off"}</span>
            </button>
            <button
              type="button"
              className={`control-button${isMuted ? " muted" : ""}`}
              onClick={toggleMute}
              title={isMuted ? "Unmute AI" : "Mute AI"}
            >
              {isMuted ? <VolumeX size={22} color="#ef4444" /> : <Volume2 size={22} color="#0054ff" />}
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
              <Volume2 size={18} color={isSpeaking ? "#0054ff" : "#94a3b8"} />
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
                  background: isMicStreaming ? "#fee2e2" : "#f1f5f9",
                  color: isMicStreaming ? "#ef4444" : "#64748b",
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
        {activeRailTab === "Resources" || activeRailTab === "Lesson Notes" || activeRailTab === "Homework" ? (
          <ContentListView type={activeRailTab} topic={lessonTitle} />
        ) : (
          <InteractiveWhiteboard
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
          onClear={() => setClearTrigger((t) => t + 1)}
        />
      ) : (
        <aside className="chat-panel">
          <div className="chat-tabs">
            <button type="button" className="chat-tab active">Class Chat</button>
            <button type="button" className="chat-tab">Live Feed</button>
          </div>
          <div className="chat-scroll" ref={chatScrollRef}>
            {chatMessages.length === 0 && !liveTranscript && (
              <p style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "24px 0" }}>
                AI Teacher is listening & watching the whiteboard. Speak or write anytime!
              </p>
            )}
            {chatMessages.map((msg, idx) =>
              msg.sender === "ai" ? (
                <div className="chat-message" key={idx}>
                  <div className="chat-avatar" />
                  <div>
                    <div className="message-head">
                      <span>TutorFlow AI</span>
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
              <div className="chat-message" style={{ borderLeft: "3px solid #0054ff", paddingLeft: 8 }}>
                <div className="chat-avatar" />
                <div>
                  <div className="message-head">
                    <span style={{ color: "#0054ff", fontWeight: 700 }}>TutorFlow AI (Live)</span>
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
            <input
              className="chat-input"
              placeholder={isMicStreaming ? "Speaking live or type a message..." : "Type or turn on Live Mic..."}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && chatInput.trim()) {
                  handleSendMessage();
                }
              }}
            />
            <div className="chat-input-actions">
              <button
                type="button"
                onClick={toggleLiveMic}
                style={{
                  border: 0,
                  background: isMicStreaming ? "#fee2e2" : "transparent",
                  color: isMicStreaming ? "#ef4444" : "#64748b",
                  padding: 6,
                  borderRadius: 6,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                title={isMicStreaming ? "Live microphone is streaming. Click to mute." : "Click to stream voice"}
              >
                <Mic size={18} className={isMicStreaming ? "pulse-icon" : ""} />
              </button>
              <Send
                size={18}
                style={{ cursor: chatInput.trim() ? "pointer" : "default", color: chatInput.trim() ? "#0054ff" : "#94a3b8" }}
                onClick={() => {
                  if (chatInput.trim()) {
                    handleSendMessage();
                  }
                }}
              />
            </div>
          </div>
        </aside>
      )}
    </main>
  );
};

const AIClassroom = () => {
  const [subjectsList, setSubjectsList] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [nextLessonData, setNextLessonData] = useState(null);
  const [liveLesson, setLiveLesson] = useState(false);
  const [sortBy, setSortBy] = useState("recent");

  useEffect(() => {
    setLoadingSubjects(true);
    Promise.all([
      api("/curriculum").catch(() => null),
      api("/analytics/dashboard").catch(() => null),
    ]).then(([currData, analyticsData]) => {
      if (currData?.courses) {
        const masteryMap = {};
        if (analyticsData?.skill_mastery) {
          analyticsData.skill_mastery.forEach(sm => {
            masteryMap[sm.skill] = sm.mastery;
          });
        }

        const dynamicSubjects = Object.keys(currData.courses).map(courseName => {
          const lessonsList = currData.courses[courseName] || [];
          let totalMastery = 0;
          let countedSkills = 0;

          lessonsList.forEach(les => {
            (les.skills || []).forEach(sk => {
              if (sk in masteryMap) {
                totalMastery += masteryMap[sk];
                countedSkills++;
              }
            });
          });

          const realProgress = countedSkills > 0 ? Math.round((totalMastery / countedSkills) * 100) : 0;
          const matchingIcon = (courseName.includes("Algebra") && !courseName.includes("Pre"))
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
            lessons: lessonsList.length * 3,
            level: "Intermediate",
            icon: matchingIcon,
            lessonsList,
          };
        });

        dynamicSubjects.push({
          name: "More Subjects",
          description: "Coming soon.",
          progress: null,
          lessons: null,
          level: null,
          icon: MoreHorizontal,
          comingSoon: true,
        });

        setSubjectsList(dynamicSubjects);
      }
      setLoadingSubjects(false);
    });
  }, []);

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
      />
    );
  }

  if (selectedSubject) {
    return (
      <main className="lesson-detail-page">
        <style>{styles}</style>

        <div className="detail-top-actions">
          <button type="button" className="lessons-bell" aria-label="Notifications">
            <Bell size={30} strokeWidth={1.75} />
          </button>
        </div>

        <section>
          <button type="button" className="back-button" onClick={() => setSelectedSubject(null)}>
            <ArrowRight size={20} style={{ transform: "rotate(180deg)" }} />
            Back to My Lessons
          </button>

          <div className="lesson-hero">
            {(() => {
              const details = getSubjectDetails(selectedSubject.name);
              return <div className="lesson-icon-large">{details.badge}</div>;
            })()}
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
                <p style={{ margin: "0 0 12px 0", color: "#263d73", fontSize: "15.5px", lineHeight: "26px" }}>
                  {selectedSubject.detailDescription || getSubjectDetails(selectedSubject.name).detailDescription}
                </p>
                {nextLessonData?.outcomes && (
                  <div>
                    <p style={{ fontWeight: 600, marginBottom: 6, color: "#0054ff", fontSize: "14.5px" }}>
                      Target Lesson: {nextLessonData.lesson}
                    </p>
                    <ul style={{ margin: 0, paddingLeft: 18, color: "#263d73", fontSize: "14px", lineHeight: "22px" }}>
                      {nextLessonData.outcomes.map((out, idx) => (
                        <li key={idx} style={{ marginBottom: 3 }}>{out}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="board-illustration" aria-hidden="true">
                {(() => {
                  const details = getSubjectDetails(selectedSubject.name);
                  return (
                    <div className="mini-board">
                      <span>{details.board[0]}</span>
                      <span>{details.board[1]}</span>
                      <span className="mini-board-box">{details.board[2]}</span>
                    </div>
                  );
                })()}
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

        <div className="lessons-actions">
          <button type="button" className="lessons-bell" aria-label="Notifications">
            <Bell size={30} strokeWidth={1.75} />
          </button>
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
            [1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="subject-card" style={{ opacity: 0.6 }}>
                <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                  <div className="tf-skeleton" style={{ width: 44, height: 44, borderRadius: 12 }} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div className="tf-skeleton" style={{ height: 18, width: "60%" }} />
                    <div className="tf-skeleton" style={{ height: 14, width: "90%" }} />
                  </div>
                </div>
                <div className="tf-skeleton" style={{ height: 6, borderRadius: 99, marginBottom: 12 }} />
                <div className="tf-skeleton" style={{ height: 14, width: "40%" }} />
              </div>
            ))
          ) : (
            subjectsList.map((subject) => (
              <SubjectCard subject={subject} key={subject.name} onOpen={setSelectedSubject} />
            ))
          )}
        </div>

      </section>
    </main>
  );
};

export default AIClassroom;
