import React from "react";
import { Target, Compass, BookOpen, Activity, Sparkles } from "lucide-react";
import { triggerHaptic } from "../services/haptics";
import "./MobileBottomNav.css";

export function MobileBottomNav({
    activeSpace,
    onSelectSpace,
    onOpenTutor,
    mistakesCount = 0
}) {
    const handleTabClick = (space) => {
        triggerHaptic("light");
        onSelectSpace(space);
    };

    const handleTutorClick = () => {
        triggerHaptic("medium");
        onOpenTutor();
    };

    return (
        <nav className="mobile-bottom-dock" aria-label="Mobile Navigation">
            <div className="mobile-dock-inner">
                {/* 01: TODAY */}
                <button
                    type="button"
                    className={`mobile-dock-item ${activeSpace === "today" ? "active" : ""}`}
                    onClick={() => handleTabClick("today")}
                    aria-label="Today Space"
                >
                    <div className="dock-icon-wrapper">
                        <Target size={20} />
                    </div>
                    <span className="dock-label font-mono">Today</span>
                </button>

                {/* 02: PATH */}
                <button
                    type="button"
                    className={`mobile-dock-item ${activeSpace === "path" ? "active" : ""}`}
                    onClick={() => handleTabClick("path")}
                    aria-label="Path Space"
                >
                    <div className="dock-icon-wrapper">
                        <Compass size={20} />
                    </div>
                    <span className="dock-label font-mono">Path</span>
                </button>

                {/* AI COPILOT HERO BUTTON */}
                <button
                    type="button"
                    className="mobile-dock-item copilot-center-btn"
                    onClick={handleTutorClick}
                    aria-label="Ask AI Intelligence"
                >
                    <div className="dock-copilot-icon">
                        <Sparkles size={20} />
                    </div>
                    <span className="dock-label font-mono">Copilot</span>
                </button>

                {/* 03: KNOWLEDGE */}
                <button
                    type="button"
                    className={`mobile-dock-item ${activeSpace === "knowledge" ? "active" : ""}`}
                    onClick={() => handleTabClick("knowledge")}
                    aria-label="Knowledge Space"
                >
                    <div className="dock-icon-wrapper">
                        <BookOpen size={20} />
                    </div>
                    <span className="dock-label font-mono">Concepts</span>
                </button>

                {/* 04: PRACTICE */}
                <button
                    type="button"
                    className={`mobile-dock-item ${activeSpace === "practice" ? "active" : ""}`}
                    onClick={() => handleTabClick("practice")}
                    aria-label="Practice Space"
                >
                    <div className="dock-icon-wrapper">
                        <Activity size={20} />
                        {mistakesCount > 0 && (
                            <span className="dock-badge font-mono">{mistakesCount}</span>
                        )}
                    </div>
                    <span className="dock-label font-mono">Practice</span>
                </button>
            </div>
        </nav>
    );
}

export default MobileBottomNav;
