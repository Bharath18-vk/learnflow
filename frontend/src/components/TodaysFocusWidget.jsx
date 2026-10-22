import React from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Target, CheckCircle2, Zap, Clock, BookOpen, ArrowRight, Sparkles, Bot, HelpCircle } from "lucide-react";
import "./TodaysFocusWidget.css";

export function TodaysFocusWidget({ nextStep, dailyMinutes = 30, onToggleStep, onOpenQuiz, onOpenTutor }) {
    const handleQuickComplete = (e) => {
        e.stopPropagation();
        confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
        });
        if (nextStep && onToggleStep) {
            onToggleStep(nextStep.id);
        }
    };

    if (!nextStep) {
        return (
            <motion.div 
                className="todays-focus-card completed-focus-state"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                <div className="focus-header">
                    <span className="focus-badge success-badge">
                        <Sparkles className="badge-icon" /> Daily Goal Mastered
                    </span>
                </div>
                <div className="focus-content">
                    <CheckCircle2 className="success-icon-large" />
                    <div>
                        <h3 className="focus-title text-white font-bold">You've completed all active steps!</h3>
                        <p className="focus-desc">Awesome momentum today. Refine your roadmap or generate a new goal to keep leveling up.</p>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div 
            className="todays-focus-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
        >
            <div className="focus-header">
                <span className="focus-badge active-focus-badge">
                    <Target className="badge-icon" /> Today's 5-Minute Focus Target
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <div className="xp-reward-chip">
                        <Zap className="chip-icon" /> +50 XP
                    </div>
                    <span className="focus-time-pill">
                        <Clock className="pill-icon" /> Est. {Math.max(10, Math.round(dailyMinutes / 3))} mins
                    </span>
                </div>
            </div>

            <div className="focus-body">
                <div className="focus-main-info">
                    <span className="focus-category-tag">{nextStep.category || "Core Concept"}</span>
                    <h3 className="focus-step-title">{nextStep.title}</h3>
                    {nextStep.description && (
                        <p className="focus-step-desc">{nextStep.description}</p>
                    )}
                </div>

                <div className="focus-action-section">
                    <button 
                        className="btn-complete-focus"
                        onClick={handleQuickComplete}
                    >
                        <CheckCircle2 className="btn-icon" /> Complete Focus Target
                    </button>

                    <div style={{ display: "flex", gap: "0.5rem", width: "100%" }}>
                        {onOpenTutor && (
                            <button 
                                className="focus-ring"
                                onClick={() => onOpenTutor(nextStep)}
                                style={{
                                    flex: 1,
                                    padding: "0.5rem 0.65rem",
                                    background: "rgba(99, 102, 241, 0.12)",
                                    border: "1px solid rgba(99, 102, 241, 0.3)",
                                    borderRadius: "10px",
                                    color: "#a5b4fc",
                                    fontWeight: 600,
                                    fontSize: "0.8rem",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "0.35rem"
                                }}
                            >
                                <Bot size={14} /> AI Tutor
                            </button>
                        )}
                        {onOpenQuiz && (
                            <button 
                                className="focus-ring"
                                onClick={() => onOpenQuiz(nextStep)}
                                style={{
                                    flex: 1,
                                    padding: "0.5rem 0.65rem",
                                    background: "rgba(251, 191, 36, 0.12)",
                                    border: "1px solid rgba(251, 191, 36, 0.3)",
                                    borderRadius: "10px",
                                    color: "#fbbf24",
                                    fontWeight: 700,
                                    fontSize: "0.8rem",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "0.35rem"
                                }}
                            >
                                <HelpCircle size={14} /> Quiz
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}


