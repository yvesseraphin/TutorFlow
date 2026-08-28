import React, { useState, useEffect } from "react";
import { X, CheckCircle2, AlertCircle, Sparkles, ArrowRight, Activity, RotateCcw } from "lucide-react";
import { api } from "../lib/api";

export default function DiagnosticModal({ isOpen, onClose, targetTopic = null, onComplete = null }) {
  const [loading, setLoading] = useState(true);
  const [assessmentId, setAssessmentId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selectedOption, setSelectedOption] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [report, setReport] = useState(null);

  useEffect(() => {
    if (isOpen) {
      startAssessment();
    }
  }, [isOpen, targetTopic]);

  async function startAssessment() {
    setLoading(true);
    setReport(null);
    setCurrentIndex(0);
    setAnswers([]);
    setSelectedOption("");
    try {
      const res = await api("/diagnostics/start", {
        method: "POST",
        body: JSON.stringify({
          subject: "Mathematics",
          target_topic: targetTopic,
        }),
      });
      setAssessmentId(res.assessment_id);
      setQuestions(res.questions || []);
    } catch (err) {
      console.error("Failed to start diagnostic:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleOptionSelect(opt) {
    setSelectedOption(opt);
  }

  async function handleNextQuestion() {
    if (!selectedOption) return;
    const currentQ = questions[currentIndex];
    const newAnswer = {
      question_text: currentQ.question,
      topic_tested: currentQ.topic_tested,
      prerequisite_skill: currentQ.prerequisite_skill,
      difficulty: currentQ.difficulty,
      student_answer: selectedOption,
      correct_answer: currentQ.correct_answer,
    };

    const updatedAnswers = [...answers, newAnswer];
    setAnswers(updatedAnswers);
    setSelectedOption("");

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Complete & Submit
      setSubmitting(true);
      try {
        const result = await api("/diagnostics/submit", {
          method: "POST",
          body: JSON.stringify({
            assessment_id: assessmentId,
            answers: updatedAnswers,
          }),
        });
        setReport(result);
        if (onComplete) onComplete(result);
      } catch (err) {
        console.error("Failed to submit diagnostic:", err);
      } finally {
        setSubmitting(false);
      }
    }
  }

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.6)",
      backdropFilter: "blur(6px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: "20px",
      fontFamily: "'Outfit', sans-serif"
    }}>
      <div style={{
        background: "#ffffff",
        borderRadius: "24px",
        maxWidth: "640px",
        width: "100%",
        boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        border: "1px solid #f0f0f0"
      }}>
        {/* Modal Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "24px 32px",
          borderBottom: "1px solid #f3f4f6"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "#111111",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff"
            }}>
              <Activity size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#111111" }}>
                Diagnostic Check
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "#f9fafb",
              border: "none",
              borderRadius: "50%",
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#6b7280"
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "32px", maxHeight: "75vh", overflowY: "auto" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <Sparkles size={36} color="#111111" style={{ animation: "spin 2s linear infinite" }} />
              <p style={{ marginTop: "16px", color: "#4b5563", fontWeight: "500" }}>
                Preparing diagnostic questions...
              </p>
            </div>
          ) : report ? (
            /* Report View */
            <div>
              <div style={{
                textAlign: "center",
                padding: "24px",
                background: "#f9fafb",
                borderRadius: "16px",
                marginBottom: "24px",
                border: "1px solid #e5e7eb"
              }}>
                <div style={{
                  fontSize: "36px",
                  fontWeight: "800",
                  color: "#111111"
                }}>
                  {Math.round(report.overall_score * 100)}%
                </div>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#111111", marginTop: "4px" }}>
                  Accuracy: {report.total_correct} of {report.total_questions} Correct
                </div>
                <p style={{ fontSize: "13px", color: "#555555", marginTop: "8px", lineHeight: "1.5" }}>
                  {report.evaluation_summary}
                </p>
              </div>

              {report.detected_gaps && report.detected_gaps.length > 0 ? (
                <div style={{ marginBottom: "24px" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#111111", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <AlertCircle size={16} color="#111111" />
                    Recommended Review Topics:
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {report.detected_gaps.map((gap, idx) => (
                      <div key={idx} style={{
                        padding: "12px 16px",
                        background: "#f9fafb",
                        border: "1px solid #e5e7eb",
                        borderRadius: "12px",
                        fontSize: "13px",
                        color: "#111111",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}>
                        <span style={{ fontWeight: "600" }}>{gap}</span>
                        <span style={{ fontSize: "12px", background: "#111111", color: "#ffffff", padding: "4px 10px", borderRadius: "6px", fontWeight: "600" }}>
                          Review
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: "16px",
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  color: "#111111",
                  fontSize: "14px",
                  fontWeight: "600",
                  marginBottom: "24px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <CheckCircle2 size={18} color="#111111" />
                  All foundational skills verified! Ready for next lessons.
                </div>
              )}

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button
                  onClick={startAssessment}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "12px",
                    border: "1px solid #e5e7eb",
                    background: "#ffffff",
                    fontWeight: "600",
                    fontSize: "14px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <RotateCcw size={16} /> Retake
                </button>
                <button
                  onClick={onClose}
                  style={{
                    padding: "10px 24px",
                    borderRadius: "12px",
                    border: "none",
                    background: "#111111",
                    color: "#ffffff",
                    fontWeight: "600",
                    fontSize: "14px",
                    cursor: "pointer"
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          ) : questions.length > 0 ? (
            /* Question Step View */
            <div>
              {/* Progress Indicator */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "#111111" }}>
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span style={{ fontSize: "12px", color: "#6b7280", background: "#f3f4f6", padding: "4px 10px", borderRadius: "8px" }}>
                  {questions[currentIndex].topic_tested}
                </span>
              </div>

              {/* Progress Bar */}
              <div style={{ width: "100%", height: "6px", background: "#f3f4f6", borderRadius: "999px", marginBottom: "24px", overflow: "hidden" }}>
                <div style={{
                  width: `${((currentIndex + 1) / questions.length) * 100}%`,
                  height: "100%",
                  background: "#111111",
                  borderRadius: "999px",
                  transition: "width 0.3s ease"
                }} />
              </div>

              {/* Question Box */}
              <div style={{
                fontSize: "18px",
                fontWeight: "700",
                color: "#111827",
                marginBottom: "24px",
                lineHeight: "1.4"
              }}>
                {questions[currentIndex].question}
              </div>

              {/* Options */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "32px" }}>
                {questions[currentIndex].options.map((opt, i) => {
                  const isSelected = selectedOption === opt;
                  return (
                    <button
                      key={i}
                      onClick={() => handleOptionSelect(opt)}
                      style={{
                        padding: "16px 20px",
                        borderRadius: "14px",
                        border: isSelected ? "2px solid #111111" : "1px solid #e5e7eb",
                        background: isSelected ? "#f9fafb" : "#ffffff",
                        color: isSelected ? "#111111" : "#374151",
                        fontSize: "15px",
                        fontWeight: isSelected ? "700" : "500",
                        textAlign: "left",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        transition: "all 0.15s ease"
                      }}
                    >
                      <span>{opt}</span>
                      {isSelected && <CheckCircle2 size={18} color="#111111" />}
                    </button>
                  );
                })}
              </div>

              {/* Action */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  disabled={!selectedOption || submitting}
                  onClick={handleNextQuestion}
                  style={{
                    padding: "12px 28px",
                    borderRadius: "12px",
                    border: "none",
                    background: selectedOption ? "#111111" : "#e5e7eb",
                    color: selectedOption ? "#ffffff" : "#9ca3af",
                    fontWeight: "700",
                    fontSize: "15px",
                    cursor: selectedOption ? "pointer" : "not-allowed",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "background 0.2s"
                  }}
                >
                  {submitting ? "Analyzing..." : (currentIndex + 1 === questions.length ? "Submit & Analyze" : "Next Question")}
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          ) : (
            <p style={{ color: "#6b7280", textAlign: "center" }}>No diagnostic questions available at this moment.</p>
          )}
        </div>
      </div>
    </div>
  );
}
