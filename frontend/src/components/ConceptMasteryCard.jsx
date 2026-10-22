import React from "react";
import { motion } from "framer-motion";
import { 
    CheckCircle2, 
    AlertTriangle, 
    HelpCircle, 
    Sparkles, 
    ArrowRight, 
    Clock, 
    Flame, 
    ShieldCheck, 
    RotateCcw 
} from "lucide-react";
import "./ConceptMasteryCard.css";

export function ConceptMasteryCard({ concept, onStartRemediation }) {
    const score = Math.round(concept.mastery_score || 0);
    const level = concept.mastery_level || "NOT_STARTED";
    const isWeak = score < 50;

    const getLevelConfig = (lvl) => {
        switch (lvl) {
            case "MASTERED":
                return {
                    label: "Mastered",
                    colorClass: "level-mastered",
                    bgClass: "bg-mastered",
                    borderClass: "border-mastered",
                    icon: <CheckCircle2 size={16} className="text-emerald-400" />
                };
            case "PROFICIENT":
                return {
                    label: "Proficient",
                    colorClass: "level-proficient",
                    bgClass: "bg-proficient",
                    borderClass: "border-proficient",
                    icon: <ShieldCheck size={16} className="text-blue-400" />
                };
            case "DEVELOPING":
                return {
                    label: "Developing",
                    colorClass: "level-developing",
                    bgClass: "bg-developing",
                    borderClass: "border-developing",
                    icon: <Sparkles size={16} className="text-amber-400" />
                };
            case "LEARNING":
                return {
                    label: "Learning",
                    colorClass: "level-learning",
                    bgClass: "bg-learning",
                    borderClass: "border-learning",
                    icon: <AlertTriangle size={16} className="text-orange-400" />
                };
            default:
                return {
                    label: "Not Started",
                    colorClass: "level-not-started",
                    bgClass: "bg-not-started",
                    borderClass: "border-not-started",
                    icon: <HelpCircle size={16} className="text-slate-400" />
                };
        }
    };

    const cfg = getLevelConfig(level);

    return (
        <motion.div 
            className={`concept-mastery-card ${cfg.borderClass} ${isWeak ? "is-weak-card" : ""}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="concept-card-header">
                <div className="concept-info-col">
                    <div className="concept-title-row">
                        <span className="concept-indicator-icon">{cfg.icon}</span>
                        <h4 className="concept-card-name">{concept.concept_name}</h4>
                    </div>
                    {concept.description && (
                        <p className="concept-card-desc">{concept.description}</p>
                    )}
                </div>

                <div className="concept-score-pill">
                    <span className={`score-digit ${cfg.colorClass}`}>{score}%</span>
                    <span className={`level-badge ${cfg.bgClass} ${cfg.colorClass}`}>
                        {cfg.label}
                    </span>
                </div>
            </div>

            {/* Progress Gauge Bar */}
            <div className="mastery-progress-track">
                <motion.div 
                    className={`mastery-progress-fill ${cfg.bgClass}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                />
            </div>

            {/* Metrics Breakdown Row */}
            <div className="concept-card-footer">
                <div className="concept-metrics-group">
                    <span className="metric-chip">
                        <RotateCcw size={12} className="metric-icon" />
                        {concept.attempts_count || 0} attempts
                    </span>
                    {concept.correct_attempts > 0 && (
                        <span className="metric-chip success-chip">
                            <CheckCircle2 size={12} className="metric-icon" />
                            {concept.correct_attempts} correct
                        </span>
                    )}
                    {concept.practice_quality > 0 && (
                        <span className="metric-chip quality-chip">
                            <Flame size={12} className="metric-icon" />
                            {Math.round(concept.practice_quality * 100)}% practice quality
                        </span>
                    )}
                </div>

                {isWeak && onStartRemediation && (
                    <button 
                        className="btn-remediation-trigger"
                        onClick={() => onStartRemediation(concept)}
                    >
                        <Sparkles size={14} className="remed-sparkle" />
                        <span>Fix in 10 Min</span>
                        <ArrowRight size={14} />
                    </button>
                )}
            </div>
        </motion.div>
    );
}
export default ConceptMasteryCard;
