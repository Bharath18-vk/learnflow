import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    CheckCircle2, 
    XCircle, 
    AlertTriangle, 
    Sparkles, 
    ArrowRight, 
    RotateCcw, 
    ChevronDown, 
    ChevronUp, 
    HelpCircle,
    Target,
    Layers,
    BookOpen
} from "lucide-react";
import "./AssessmentResultView.css";

export function AssessmentResultView({ 
    result, 
    onRetake, 
    onStartRemediation, 
    onGoToOverview, 
    onNextMilestone 
}) {
    const [expandedQuestion, setExpandedQuestion] = useState(null);
    const passed = result?.passed;
    const score = Math.round(result?.score_percentage || 0);

    const toggleQuestion = (idx) => {
        setExpandedQuestion(expandedQuestion === idx ? null : idx);
    };

    return (
        <motion.div 
            className="assessment-result-container"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
        >
            {/* Header Score Card */}
            <div className={`assessment-score-banner ${passed ? "banner-passed" : "banner-failed"}`}>
                <div className="banner-left">
                    <div className="status-pill">
                        {passed ? (
                            <>
                                <CheckCircle2 size={16} className="text-emerald-400" />
                                <span>Assessment Passed (≥60%)</span>
                            </>
                        ) : (
                            <>
                                <AlertTriangle size={16} className="text-orange-400" />
                                <span>Needs Conceptual Review (&lt;60%)</span>
                            </>
                        )}
                    </div>
                    <h2 className="banner-title">
                        {passed ? "Solid Mastery Demonstrated!" : "Let's Strengthen Those Foundations"}
                    </h2>
                    <p className="banner-subtitle">
                        {result?.personalized_feedback || (
                            passed
                                ? "You've proven strong comprehension across core concepts for this milestone."
                                : "A few critical concepts need reinforcement before advancing to ensure long-term mastery."
                        )}
                    </p>
                </div>

                <div className="banner-score-circle">
                    <span className="score-number">{score}%</span>
                    <span className="score-label">
                        {result?.correct_count} of {result?.total_questions} Correct
                    </span>
                    {result?.attempt_number && (
                        <span className="attempt-tag">Attempt #{result.attempt_number}</span>
                    )}
                </div>
            </div>

            {/* Diagnostics & Concept Breakdown Grid */}
            <div className="diagnostics-grid">
                {/* Strengths */}
                {result?.strengths && result.strengths.length > 0 && (
                    <div className="diag-card diag-strength">
                        <div className="diag-header">
                            <CheckCircle2 size={16} className="text-emerald-400" />
                            <h4>Demonstrated Strengths</h4>
                        </div>
                        <ul className="concept-pill-list">
                            {result.strengths.map((s, idx) => (
                                <li key={idx} className="concept-pill pill-strength">
                                    {s}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Developing */}
                {result?.developing && result.developing.length > 0 && (
                    <div className="diag-card diag-developing">
                        <div className="diag-header">
                            <Sparkles size={16} className="text-amber-400" />
                            <h4>Developing Concepts</h4>
                        </div>
                        <ul className="concept-pill-list">
                            {result.developing.map((d, idx) => (
                                <li key={idx} className="concept-pill pill-developing">
                                    {d}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Weaknesses */}
                {result?.weaknesses && result.weaknesses.length > 0 && (
                    <div className="diag-card diag-weakness">
                        <div className="diag-header">
                            <AlertTriangle size={16} className="text-red-400" />
                            <h4>Requires Targeted Review</h4>
                        </div>
                        <div className="weak-concept-actions">
                            {result.weaknesses.map((w, idx) => (
                                <div key={idx} className="weak-item-row">
                                    <span className="weak-concept-name">{w}</span>
                                    {onStartRemediation && (
                                        <button 
                                            className="btn-fix-concept"
                                            onClick={() => onStartRemediation({ concept_name: w })}
                                        >
                                            <Sparkles size={13} />
                                            <span>Fix in 10 Min</span>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Question by Question Review */}
            <div className="questions-review-section">
                <h3 className="section-title">
                    <Layers size={18} /> Detailed Answer Evaluations
                </h3>
                <div className="question-eval-list">
                    {(result?.evaluations || []).map((evalItem, idx) => {
                        const isCorrect = evalItem.is_correct;
                        const isExpanded = expandedQuestion === idx;

                        return (
                            <div 
                                key={evalItem.question_id || idx}
                                className={`eval-card ${isCorrect ? "eval-correct" : "eval-incorrect"}`}
                            >
                                <div 
                                    className="eval-card-header"
                                    onClick={() => toggleQuestion(idx)}
                                >
                                    <div className="eval-status-indicator">
                                        {isCorrect ? (
                                            <CheckCircle2 size={20} className="text-emerald-400" />
                                        ) : (
                                            <XCircle size={20} className="text-red-400" />
                                        )}
                                        <span className="question-index-tag">Q{idx + 1}</span>
                                    </div>

                                    <div className="eval-question-text">
                                        <p>{evalItem.question}</p>
                                        {evalItem.concept_name && (
                                            <span className="eval-concept-tag">
                                                {evalItem.concept_name} • {evalItem.difficulty || "medium"}
                                            </span>
                                        )}
                                    </div>

                                    <button className="eval-toggle-btn">
                                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                    </button>
                                </div>

                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div 
                                            className="eval-card-body"
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <div className="answers-comparison-grid">
                                                <div className="answer-block user-answer-block">
                                                    <span className="answer-block-label">Your Response:</span>
                                                    <p className={`answer-val ${isCorrect ? "text-emerald-400" : "text-red-400"}`}>
                                                        {evalItem.user_answer ? String(evalItem.user_answer) : "No answer submitted"}
                                                    </p>
                                                </div>

                                                {!isCorrect && (
                                                    <div className="answer-block correct-answer-block">
                                                        <span className="answer-block-label">Correct Answer:</span>
                                                        <p className="answer-val text-emerald-400 font-semibold">
                                                            {String(evalItem.correct_answer)}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {evalItem.explanation && (
                                                <div className="explanation-callout">
                                                    <HelpCircle size={15} className="exp-icon" />
                                                    <p>{evalItem.explanation}</p>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Action Buttons Footer */}
            <div className="assessment-actions-footer">
                <button className="btn-secondary-action" onClick={onRetake}>
                    <RotateCcw size={16} />
                    <span>Retake Assessment</span>
                </button>

                {passed ? (
                    <button className="btn-primary-action" onClick={onNextMilestone || onGoToOverview}>
                        <span>{result?.milestone_completed ? "Advance to Next Milestone" : "Return to Lesson"}</span>
                        <ArrowRight size={16} />
                    </button>
                ) : (
                    <button className="btn-primary-action" onClick={onGoToOverview}>
                        <BookOpen size={16} />
                        <span>Review Lesson Content</span>
                    </button>
                )}
            </div>
        </motion.div>
    );
}
export default AssessmentResultView;
