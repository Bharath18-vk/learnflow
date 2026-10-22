import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { 
    X, 
    Sparkles, 
    CheckCircle2, 
    XCircle, 
    AlertTriangle, 
    BookOpen, 
    Code2, 
    HelpCircle, 
    ArrowRight, 
    RotateCcw, 
    Flame, 
    TrendingUp, 
    ShieldCheck, 
    Lightbulb 
} from "lucide-react";
import { createConceptRemediation, submitRemediationReassessment } from "../services/api";
import "./RemediationModal.css";

export function RemediationModal({ 
    contentId, 
    concept, 
    onClose, 
    onMasteryUpdated 
}) {
    const [step, setStep] = useState("loading"); // 'loading' | 'refresher' | 'quiz' | 'celebration'
    const [remediation, setRemediation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Quiz State
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [submittingQuiz, setSubmittingQuiz] = useState(false);
    const [reassessmentResult, setReassessmentResult] = useState(null);

    useEffect(() => {
        if (!concept || !contentId) return;

        const loadRemediation = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await createConceptRemediation(contentId, concept.id || concept.concept_id);
                setRemediation(data);
                setStep("refresher");
            } catch (err) {
                console.error("Failed to load remediation:", err);
                setError(err.message || "Failed to generate targeted remediation module.");
            } finally {
                setLoading(false);
            }
        };

        loadRemediation();
    }, [contentId, concept]);

    const handleSelectAnswer = (qIndex, answer) => {
        setSelectedAnswers(prev => ({
            ...prev,
            [String(qIndex)]: answer
        }));
    };

    const handleQuizSubmit = async () => {
        if (!remediation) return;
        try {
            setSubmittingQuiz(true);
            const res = await submitRemediationReassessment(
                contentId,
                remediation.id,
                selectedAnswers
            );
            setReassessmentResult(res);

            if (res.passed) {
                confetti({
                    particleCount: 90,
                    spread: 75,
                    origin: { y: 0.6 }
                });
            }

            setStep("celebration");
            if (onMasteryUpdated) {
                onMasteryUpdated(res);
            }
        } catch (err) {
            console.error("Reassessment submission error:", err);
            setError(err.message || "Failed to submit reassessment.");
        } finally {
            setSubmittingQuiz(false);
        }
    };

    const miniQuiz = remediation?.mini_quiz || [];
    const allAnswered = miniQuiz.length > 0 && miniQuiz.every((_, idx) => !!selectedAnswers[String(idx + 1)]);

    return (
        <AnimatePresence>
            <div className="remediation-backdrop" onClick={onClose}>
                <motion.div 
                    className="remediation-modal"
                    onClick={(e) => e.stopPropagation()}
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.3 }}
                >
                    {/* Header */}
                    <div className="remediation-header">
                        <div className="remed-header-left">
                            <span className="remed-badge">
                                <Sparkles size={14} className="remed-sparkle-icon" />
                                10-Minute Targeted Refresher
                            </span>
                            <h3 className="remed-title">
                                {remediation?.title || `Mastering ${concept?.concept_name || "Core Concept"}`}
                            </h3>
                        </div>
                        <button className="remed-close-btn" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>

                    {/* Modal Content Body */}
                    <div className="remediation-body">
                        {loading && (
                            <div className="remed-loading-state">
                                <div className="remed-spinner" />
                                <h4>Generating Targeted Refresher...</h4>
                                <p>Personalizing diagnostic review and active recall checks for {concept?.concept_name}.</p>
                            </div>
                        )}

                        {error && (
                            <div className="remed-error-banner">
                                <AlertTriangle size={18} />
                                <p>{error}</p>
                            </div>
                        )}

                        {/* STEP 1: Targeted Refresher & Mental Model */}
                        {!loading && step === "refresher" && remediation && (
                            <motion.div 
                                className="remed-step-container"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                {/* Diagnosis Callout */}
                                {remediation.diagnosis_summary && (
                                    <div className="remed-diagnosis-box">
                                        <div className="diag-box-header">
                                            <Lightbulb size={16} className="text-amber-400" />
                                            <span>The Core Misconception & Mental Model</span>
                                        </div>
                                        <p>{remediation.diagnosis_summary}</p>
                                    </div>
                                )}

                                {/* Targeted Explanation Markdown */}
                                <div className="remed-explanation-content">
                                    {remediation.targeted_explanation.split("\n\n").map((para, pIdx) => {
                                        if (para.startsWith("### ")) {
                                            return <h4 key={pIdx} className="remed-h4">{para.replace("### ", "")}</h4>;
                                        }
                                        if (para.startsWith("> ")) {
                                            return (
                                                <div key={pIdx} className="remed-quote-callout">
                                                    {para.replace("> ", "")}
                                                </div>
                                            );
                                        }
                                        return <p key={pIdx}>{para}</p>;
                                    })}
                                </div>

                                {/* Code Example */}
                                {remediation.code_example && (
                                    <div className="remed-code-card">
                                        <div className="code-card-header">
                                            <Code2 size={14} className="text-blue-400" />
                                            <span>Correct Pattern Reference</span>
                                        </div>
                                        <pre className="remed-code-pre">
                                            <code>{remediation.code_example}</code>
                                        </pre>
                                    </div>
                                )}

                                {/* Focused Exercises / Recall Check */}
                                {remediation.focused_exercises && remediation.focused_exercises.length > 0 && (
                                    <div className="remed-exercises-box">
                                        <h4 className="exercises-heading">
                                            <CheckCircle2 size={15} className="text-emerald-400" /> Quick Active Check
                                        </h4>
                                        {remediation.focused_exercises.map((ex, exIdx) => (
                                            <div key={exIdx} className="exercise-item">
                                                <p className="ex-prompt"><strong>Q:</strong> {ex.instruction || ex.prompt}</p>
                                                {ex.solution && (
                                                    <p className="ex-solution"><strong>Insight:</strong> {ex.solution}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="remed-footer-action">
                                    <button 
                                        className="btn-remed-next"
                                        onClick={() => setStep("quiz")}
                                    >
                                        <span>Ready for Mini-Quiz ({miniQuiz.length} Questions)</span>
                                        <ArrowRight size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 2: Mini-Reassessment Quiz */}
                        {!loading && step === "quiz" && remediation && (
                            <motion.div 
                                className="remed-step-container"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                            >
                                <div className="quiz-header-banner">
                                    <h4>Verify Your Understanding</h4>
                                    <p>Answer these 2 targeted verification questions to cement your mastery.</p>
                                </div>

                                <div className="quiz-questions-list">
                                    {miniQuiz.map((q, qIdx) => {
                                        const qNum = qIdx + 1;
                                        const currentAns = selectedAnswers[String(qNum)];

                                        return (
                                            <div key={qIdx} className="remed-quiz-card">
                                                <span className="quiz-q-num">Question {qNum}</span>
                                                <h4 className="quiz-q-title">{q.question}</h4>

                                                <div className="quiz-options-list">
                                                    {(q.options || []).map((opt, optIdx) => {
                                                        const isSelected = currentAns === opt;
                                                        return (
                                                            <div 
                                                                key={optIdx}
                                                                className={`quiz-option-item ${isSelected ? "selected" : ""}`}
                                                                onClick={() => handleSelectAnswer(qNum, opt)}
                                                            >
                                                                <div className="option-radio">
                                                                    {isSelected && <div className="radio-inner" />}
                                                                </div>
                                                                <span className="option-text">{opt}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="remed-footer-action">
                                    <button 
                                        className="btn-remed-secondary"
                                        onClick={() => setStep("refresher")}
                                    >
                                        Back to Refresher
                                    </button>
                                    <button 
                                        className="btn-remed-next"
                                        disabled={!allAnswered || submittingQuiz}
                                        onClick={handleQuizSubmit}
                                    >
                                        <span>{submittingQuiz ? "Evaluating..." : "Submit Mini-Quiz"}</span>
                                        <ArrowRight size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 3: Mastery Gain Celebration */}
                        {!loading && step === "celebration" && reassessmentResult && (
                            <motion.div 
                                className="remed-step-container celebration-step"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                <div className="celebration-hero">
                                    {reassessmentResult.passed ? (
                                        <div className="celebration-icon-wrap icon-success">
                                            <CheckCircle2 size={44} className="text-emerald-400" />
                                        </div>
                                    ) : (
                                        <div className="celebration-icon-wrap icon-review">
                                            <AlertTriangle size={44} className="text-amber-400" />
                                        </div>
                                    )}

                                    <h3 className="celebration-title">
                                        {reassessmentResult.passed 
                                            ? "Concept Solidified!" 
                                            : "Keep Practicing!"}
                                    </h3>
                                    <p className="celebration-desc">
                                        {reassessmentResult.passed
                                            ? `You answered ${reassessmentResult.correct_count} of ${reassessmentResult.total_questions} questions correctly on the mini-quiz.`
                                            : "Review the answers below and try the mini-quiz once more."}
                                    </p>
                                </div>

                                {/* Score & Mastery Level Up Card */}
                                <div className="mastery-gain-card">
                                    <div className="gain-metric-box">
                                        <span className="metric-tag">Baseline Score</span>
                                        <span className="score-val text-slate-400">
                                            {Math.round(reassessmentResult.baseline_mastery)}%
                                        </span>
                                    </div>

                                    <div className="gain-arrow-wrap">
                                        <TrendingUp size={24} className="text-emerald-400" />
                                        {reassessmentResult.improvement_points > 0 && (
                                            <span className="gain-pts-badge">
                                                +{reassessmentResult.improvement_points} pts
                                            </span>
                                        )}
                                    </div>

                                    <div className="gain-metric-box">
                                        <span className="metric-tag">New Mastery Score</span>
                                        <span className="score-val text-emerald-400">
                                            {Math.round(reassessmentResult.post_mastery)}%
                                        </span>
                                        <span className="level-promote-tag">
                                            Level: {reassessmentResult.new_mastery_level}
                                        </span>
                                    </div>
                                </div>

                                {/* Question Feedback Breakdown */}
                                <div className="reassess-eval-list">
                                    {(reassessmentResult.evaluations || []).map((ev, evIdx) => (
                                        <div key={evIdx} className={`reassess-eval-card ${ev.is_correct ? "eval-correct" : "eval-wrong"}`}>
                                            <div className="eval-status-row">
                                                {ev.is_correct ? <CheckCircle2 size={16} className="text-emerald-400" /> : <XCircle size={16} className="text-red-400" />}
                                                <span className="eval-q-title">{ev.question}</span>
                                            </div>
                                            <p className="eval-exp-text">{ev.explanation}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="remed-footer-action center-action">
                                    {reassessmentResult.passed ? (
                                        <button className="btn-remed-next" onClick={onClose}>
                                            <span>Continue Learning</span>
                                            <CheckCircle2 size={16} />
                                        </button>
                                    ) : (
                                        <button className="btn-remed-secondary" onClick={() => setStep("refresher")}>
                                            <RotateCcw size={16} />
                                            <span>Review Refresher Again</span>
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
export default RemediationModal;
