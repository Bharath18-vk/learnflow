import React from "react";
import { motion } from "framer-motion";
import { Flame, Shield, Zap, Trophy, Award, Sparkles } from "lucide-react";
import "./GamificationHeader.css";

export function GamificationHeader({ userStats }) {
    if (!userStats) return null;

    const {
        current_streak = 0,
        longest_streak = 0,
        streak_freezes = 1,
        xp_points = 0,
        level = 1,
        level_title = "Novice Learner",
        xp_into_level = 0,
        xp_for_next_level = 100,
        level_progress_percentage = 0
    } = userStats;

    return (
        <motion.div 
            className="gamification-bar-container"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            {/* Left: Streak & Shield Badge */}
            <div className="gamification-stat-group">
                <div className={`streak-badge ${current_streak > 0 ? "active-streak" : ""}`}>
                    <Flame className="stat-icon flame-icon" />
                    <div className="stat-text-column">
                        <div className="stat-value">{current_streak} Day Streak</div>
                        <div className="stat-sublabel">Personal Best: {longest_streak}d</div>
                    </div>
                </div>

                <div className="shield-badge" title="Streak Freeze Shield protects your streak if you miss a day!">
                    <Shield className="stat-icon shield-icon" />
                    <span className="shield-count">{streak_freezes} Freeze {streak_freezes === 1 ? 'Shield' : 'Shields'}</span>
                </div>
            </div>

            {/* Right: XP & Level Progress */}
            <div className="gamification-level-group">
                <div className="level-badge">
                    <Trophy className="stat-icon trophy-icon" />
                    <div className="level-info">
                        <span className="level-title font-semibold">Lvl {level} • {level_title}</span>
                        <span className="xp-total"><Zap className="xp-icon" /> {xp_points} Total XP</span>
                    </div>
                </div>

                <div className="xp-progress-column">
                    <div className="xp-progress-header">
                        <span className="xp-label"><Sparkles className="sparkle-icon" /> {xp_into_level} / {xp_for_next_level} XP</span>
                        <span className="next-level-label">Lvl {level + 1}</span>
                    </div>
                    <div className="xp-progress-bar-bg">
                        <motion.div 
                            className="xp-progress-bar-fill"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, level_progress_percentage)}%` }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
