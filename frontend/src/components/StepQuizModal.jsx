import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
    X,
    HelpCircle,
    CheckCircle2,
    XCircle,
    Zap,
    Trophy,
    Loader2,
    ArrowRight,
    RefreshCw,
    Target,
    Activity
} from "lucide-react";
import { getStepQuiz, submitStepQuiz } from "../services/api";
import "./StepQuizModal.css";

export function StepQuizModal({ isOpen, onClose, step, onQuizCompleted }) {
    const [loading, setLoading] = useState(true);
    const [quizData, setQuizData] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOptions, setSelectedOptions] = useState({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [submitResult, setSubmitResult] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen && step) {
            fetchQuiz();
        }
    }, [isOpen, step]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    // Keyboard shortcuts for option selection (1-4 or A-D, Enter to advance)
    useEffect(() => {
        if (!isOpen || isSubmitted || !quizData?.questions?.length) return;

        const handleKeyDown = (e) => {
            const currentQ = quizData.questions[currentIndex];
            if (!currentQ) return;

            const key = e.key.toLowerCase();
            const optionMap = { "1": 0, "a": 0, "2": 1, "b": 1, "3": 2, "c": 2, "4": 3, "d": 3 };

            if (optionMap[key] !== undefined && optionMap[key] < currentQ.options.length) {
                handleOptionSelect(currentIndex, optionMap[key]);
            } else if (e.key === "Enter") {
                if (selectedOptions[currentIndex] !== undefined) {
                    if (currentIndex < quizData.questions.length - 1) {
                        setCurrentIndex(prev => prev + 1);
                    } else {
                        handleSubmitQuiz();
                    }
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, isSubmitted, quizData, currentIndex, selectedOptions]);

    const fetchQuiz = async () => {
        setLoading(true);
        setError("");
        setIsSubmitted(false);
        setSubmitResult(null);
        setSelectedOptions({});
        setCurrentIndex(0);
        try {
            const data = await getStepQuiz(step.id);
            setQuizData(data);
        } catch (err) {
            console.error("Error loading step quiz:", err);
            setError(err.message || "Could not generate quiz questions.");
        } finally {
            setLoading(false);
        }
    };

    const handleOptionSelect = (qIdx, optionIdx) => {
        if (isSubmitted) return;
        setSelectedOptions((prev) => ({
            ...prev,
            [qIdx]: optionIdx
        }));
    };

    const recordMistakeIntelligence = (questions, selected, stepObj, evaluations = []) => {
        try {
            const mistakes = [];
            questions.forEach((q, idx) => {
                const evalItem = evaluations?.find(e => e.question_index === idx);
                const isCorrect = evalItem ? evalItem.is_correct : (selected[idx] === q.correct_index);
                if (!isCorrect) {
                    const correctIdx = evalItem ? evalItem.correct_index : (q.correct_index ?? 0);
                    const explanation = evalItem ? evalItem.explanation : q.explanation;
                    mistakes.push({
                        stepId: stepObj.id,
                        stepTitle: stepObj.title,
                        category: stepObj.category || "Core Concept",
                        question: q.question,
                        userAnswer: q.options[selected[idx]],
                        correctAnswer: q.options[correctIdx],
                        explanation: explanation,
                        timestamp: new Date().toISOString()
                    });
                }
            });

            if (mistakes.length > 0) {
                const stored = JSON.parse(localStorage.getItem("learnwise_mistakes") || "[]");
                const updated = [...mistakes, ...stored].slice(0, 30);
                localStorage.setItem("learnwise_mistakes", JSON.stringify(updated));
            }
        } catch (e) {
            console.warn("Could not save mistake intelligence:", e);
        }
    };

    const handleSubmitQuiz = async () => {
        if (!quizData?.questions || submitting) return;
        setSubmitting(true);

        try {
            const res = await submitStepQuiz(step.id, selectedOptions, quizData.quiz_session_token);
            setSubmitResult(res);
            setIsSubmitted(true);

            // Record any mistake data for Practice Space using server evaluations
            recordMistakeIntelligence(quizData.questions, selectedOptions, step, res.evaluations);

            if (res.passed) {
                confetti({
                    particleCount: 80,
                    spread: 70,
                    origin: { y: 0.55 }
                });
                if (onQuizCompleted) {
                    onQuizCompleted(res.progress);
                }
            }
        } catch (err) {
            setError(err.message || "Failed to process quiz submission.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen || !step) return null;

    const questions = quizData?.questions || [];
    const currentQ = questions[currentIndex];
    const totalQ = questions.length;
    const allAnswered = questions.every((_, idx) => selectedOptions[idx] !== undefined);

    return createPortal(
        <AnimatePresence>
            <div className="quiz-modal-overlay" onClick={onClose}>
                <motion.div 
                    className="quiz-modal-card"
                    onClick={(e) => e.stopPropagation()}
                    initial={{ opacity: 0, scale: 0.95, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 16 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                >
                    {/* Header */}
                    <div className="quiz-modal-header">
                        <div className="quiz-header-title">
                            <span className="quiz-badge font-mono">
                                <Zap size={14} /> Cognitive Focus Mode (+50 XP)
                            </span>
                            <h2 className="font-display">{step.title}</h2>
                        </div>
                        <button className="quiz-close-btn" onClick={onClose} aria-label="Close quiz">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="quiz-modal-body">
                        {loading ? (
                            <div className="quiz-loader-container font-sans">
                                <Loader2 className="quiz-spin-icon" size={32} />
                                <p className="font-mono">Synthesizing targeted assessment for "{step.title}"...</p>
                            </div>
                        ) : error ? (
                            <div className="quiz-error-state font-sans">
                                <p>{error}</p>
                                <button className="btn-retry font-interactive" onClick={fetchQuiz}>
                                    <RefreshCw size={14} /> Try Again
                                </button>
                            </div>
                        ) : isSubmitted ? (
                            /* RESULTS & CONSEQUENCE SUMMARY */
                            <div className="quiz-results-container">
                                <div className="result-icon-wrapper">
                                    {submitResult?.passed ? (
                                        <Trophy className="result-trophy-icon" size={40} />
                                    ) : (
                                        <Activity className="result-fail-icon" size={40} />
                                    )}
                                </div>
                                <h3 className="result-title font-display">
                                    {submitResult?.passed ? "Concept Mastered" : "Practice Recorded"}
                                </h3>
                                <p className="result-score-text font-mono">
                                    Score: <strong>{submitResult?.score}</strong> / <strong>{submitResult?.total}</strong>
                                </p>

                                {submitResult?.passed ? (
                                    <div className="xp-claimed-banner font-interactive">
                                        <Zap size={16} />
                                        <span>+50 XP Claimed • Knowledge Node Stabilized</span>
                                    </div>
                                ) : (
                                    <p className="result-subtext font-sans">
                                        Mistakes have been logged in your Practice Space to help target upcoming drills.
                                    </p>
                                )}

                                {/* Question Review List */}
                                <div className="quiz-review-list font-sans">
                                    {questions.map((q, idx) => {
                                        const evalItem = submitResult?.evaluations?.find(e => e.question_index === idx);
                                        const userAns = selectedOptions[idx];
                                        const isCorrect = evalItem ? evalItem.is_correct : (userAns === q.correct_index);
                                        const explanation = evalItem ? evalItem.explanation : q.explanation;
                                        return (
                                            <div key={idx} className={`review-item ${isCorrect ? "correct" : "incorrect"}`}>
                                                <div className="review-question-header">
                                                    {isCorrect ? <CheckCircle2 size={16} className="text-success" /> : <XCircle size={16} className="text-danger" />}
                                                    <span className="review-q-text font-display">Q{idx + 1}: {q.question}</span>
                                                </div>
                                                {explanation && <p className="review-explanation">{explanation}</p>}
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="quiz-modal-footer">
                                    {!submitResult?.passed && (
                                        <button className="btn-secondary font-interactive" onClick={fetchQuiz}>
                                            <RefreshCw size={14} /> Retry Drill
                                        </button>
                                    )}
                                    <button className="btn-primary font-interactive" onClick={onClose}>
                                        Continue Learning
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* QUESTION FOCUS SCREEN */
                            <div className="quiz-question-container">
                                {/* Pagination Progress */}
                                <div className="quiz-progress-bar-container font-mono">
                                    <div className="quiz-progress-labels">
                                        <span>Question {currentIndex + 1} of {totalQ}</span>
                                        <span>{Math.round(((currentIndex + 1) / totalQ) * 100)}%</span>
                                    </div>
                                    <div className="quiz-progress-track">
                                        <div 
                                            className="quiz-progress-fill" 
                                            style={{ width: `${((currentIndex + 1) / totalQ) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                {currentQ && (
                                    <div className="question-card">
                                        <h3 className="question-text font-display">{currentQ.question}</h3>
                                        <div className="quiz-options-grid">
                                            {currentQ.options.map((opt, optIdx) => {
                                                const isSelected = selectedOptions[currentIndex] === optIdx;
                                                return (
                                                    <button
                                                        key={optIdx}
                                                        className={`option-btn font-interactive ${isSelected ? "selected" : ""}`}
                                                        onClick={() => handleOptionSelect(currentIndex, optIdx)}
                                                    >
                                                        <span className="option-letter font-mono">{String.fromCharCode(65 + optIdx)}</span>
                                                        <span className="option-label">{opt}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Navigation Footer */}
                                <div className="quiz-modal-footer">
                                    <button
                                        className="btn-secondary font-interactive"
                                        disabled={currentIndex === 0}
                                        onClick={() => setCurrentIndex((prev) => prev - 1)}
                                    >
                                        Previous
                                    </button>

                                    {currentIndex < totalQ - 1 ? (
                                        <button
                                            className="btn-primary font-interactive"
                                            disabled={selectedOptions[currentIndex] === undefined}
                                            onClick={() => setCurrentIndex((prev) => prev + 1)}
                                        >
                                            Next Question <ArrowRight size={14} />
                                        </button>
                                    ) : (
                                        <button
                                            className="btn-submit-quiz font-interactive"
                                            disabled={!allAnswered || submitting}
                                            onClick={handleSubmitQuiz}
                                        >
                                            {submitting ? <Loader2 size={15} className="quiz-spin-icon" /> : <Zap size={15} />}
                                            <span>Submit & Claim +50 XP</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
}
export default StepQuizModal;
