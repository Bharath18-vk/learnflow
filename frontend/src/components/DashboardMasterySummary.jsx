import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
    Award, 
    Sparkles, 
    AlertTriangle, 
    CheckCircle2, 
    ArrowRight, 
    ShieldCheck, 
    TrendingUp,
    Zap
} from "lucide-react";
import "./DashboardMasterySummary.css";

export function DashboardMasterySummary({ summary }) {
    if (!summary || !summary.has_active_mastery) {
        return null;
    }

    const percentage = Math.round(summary.mastery_percentage || 0);
    const level = summary.mastery_level || "NOT_STARTED";
    const strongCount = summary.strong_count || 0;
    const developingCount = summary.developing_count || 0;
    const weakCount = summary.weak_count || 0;
    const topWeak = summary.top_weak_concept;

    const getLevelBadge = (lvl) => {
        switch (lvl) {
            case "MASTERED":
                return {
                    label: "Mastered",
                    className: "level-mastered",
                    icon: <CheckCircle2 size={15} className="text-emerald-400" />
                };
            case "PROFICIENT":
                return {
                    label: "Proficient",
                    className: "level-proficient",
                    icon: <ShieldCheck size={15} className="text-blue-400" />
                };
            case "DEVELOPING":
                return {
                    label: "Developing",
                    className: "level-developing",
                    icon: <Sparkles size={15} className="text-amber-400" />
                };
            case "LEARNING":
                return {
                    label: "Learning",
                    className: "level-learning",
                    icon: <AlertTriangle size={15} className="text-orange-400" />
                };
            default:
                return {
                    label: "Not Started",
                    className: "level-not-started",
                    icon: <Award size={15} className="text-slate-400" />
                };
        }
    };

    const levelBadge = getLevelBadge(level);

    return (
        <section className="dashboard-mastery-card">
            <div className="mastery-card-header">
                <div className="mastery-card-kicker-row">
                    <span className="mastery-kicker font-mono">
                        <TrendingUp size={13} className="kicker-icon" />
                        SKILL MASTERY TELEMETRY
                    </span>
                    <span className="mastery-phase-badge font-mono">
                        {summary.phase_title || "Active Phase"}
                    </span>
                </div>
                <h3 className="mastery-card-title font-display">
                    {summary.milestone_title || "Active Milestone"}
                </h3>
            </div>

            <div className="mastery-card-body">
                {/* Score & Gauge Section */}
                <div className="mastery-gauge-col">
                    <div className="mastery-score-display">
                        <span className="mastery-number font-mono">{percentage}%</span>
                        <div className={`mastery-level-pill ${levelBadge.className}`}>
                            {levelBadge.icon}
                            <span>{levelBadge.label}</span>
                        </div>
                    </div>
                    <div className="mastery-gauge-track">
                        <motion.div 
                            className={`mastery-gauge-fill ${levelBadge.className}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                    </div>
                </div>

                {/* Concept Distribution Stats */}
                <div className="mastery-breakdown-stats">
                    <div className="breakdown-stat-item strong">
                        <span className="stat-num font-mono">{strongCount}</span>
                        <span className="stat-label">Mastered</span>
                    </div>
                    <div className="breakdown-stat-item developing">
                        <span className="stat-num font-mono">{developingCount}</span>
                        <span className="stat-label">Developing</span>
                    </div>
                    <div className="breakdown-stat-item weak">
                        <span className="stat-num font-mono">{weakCount}</span>
                        <span className="stat-label">Needs Practice</span>
                    </div>
                </div>
            </div>

            {/* Targeted Weak Concept Alert if any */}
            {topWeak && (
                <div className="mastery-weakness-alert">
                    <div className="weakness-info">
                        <Zap size={16} className="weakness-icon" />
                        <span className="weakness-text">
                            Weak concept detected: <strong>{topWeak}</strong>
                        </span>
                    </div>
                    <Link 
                        to={`/learn/${summary.milestone_id}?tab=mastery`}
                        className="btn-quick-remedy font-display"
                    >
                        <span>Fix Concept</span>
                        <ArrowRight size={13} />
                    </Link>
                </div>
            )}

            {/* Card Footer Actions */}
            <div className="mastery-card-footer">
                <Link
                    to={`/learn/${summary.milestone_id}?tab=mastery`}
                    className="mastery-detail-link font-display"
                >
                    <span>View Granular Concept Diagnostics</span>
                    <ArrowRight size={14} />
                </Link>
            </div>
        </section>
    );
}

export default DashboardMasterySummary;
