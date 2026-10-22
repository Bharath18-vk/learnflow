import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    Compass,
    Sparkles,
    Zap,
    Target,
    BookOpen,
    HelpCircle,
    ArrowRight,
    CornerDownLeft,
    Flame,
    X,
    Activity,
    Layers
} from "lucide-react";
import "./CommandCenter.css";

export function CommandCenter({
    isOpen,
    onClose,
    onNavigateTab,
    onOpenStep,
    onStartQuiz,
    onOpenAiTutor,
    onSwitchGoal,
    onCreateGoal,
    activeRoadmap,
    allGoals = [],
    currentStep = null
}) {
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);

    // Focus input on open
    useEffect(() => {
        if (isOpen) {
            setQuery("");
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    // Build intelligent action items
    const steps = activeRoadmap?.steps || [];
    const lowerQuery = query.toLowerCase().trim();

    const baseActions = [
        {
            id: "today",
            title: "Go to Today's Intention",
            subtitle: currentStep ? `Continue active concept: ${currentStep.title}` : "Jump to active learning objective",
            icon: Target,
            category: "Navigation",
            keywords: ["today", "study", "continue", "now", "learn", "current"],
            run: () => {
                onNavigateTab?.("today");
                onClose();
            }
        },
        {
            id: "path-constellation",
            title: "Explore Knowledge Constellation",
            subtitle: "Open spatial concept map and prerequisite links",
            icon: Compass,
            category: "Navigation",
            keywords: ["constellation", "graph", "map", "path", "nodes", "prerequisites"],
            run: () => {
                onNavigateTab?.("path");
                onClose();
            }
        },
        {
            id: "practice-mistakes",
            title: "Review Mistakes & Practice Space",
            subtitle: "Diagnose concept weaknesses and run targeted drills",
            icon: Activity,
            category: "Practice",
            keywords: ["mistake", "practice", "weak", "drill", "fail", "stuck", "error"],
            run: () => {
                onNavigateTab?.("practice");
                onClose();
            }
        },
        {
            id: "knowledge-space",
            title: "Inspect Knowledge Mastery",
            subtitle: "Analyze retention and concept confidence",
            icon: Layers,
            category: "Knowledge",
            keywords: ["knowledge", "mastery", "retention", "score", "progress", "all"],
            run: () => {
                onNavigateTab?.("knowledge");
                onClose();
            }
        },
        ...(currentStep ? [
            {
                id: "current-quiz",
                title: `Start Focus Quiz: ${currentStep.title}`,
                subtitle: "Test cognitive retention (+50 XP)",
                icon: Zap,
                category: "Action",
                keywords: ["quiz", "test", "exam", "question", "evaluate", "grade"],
                run: () => {
                    onStartQuiz?.(currentStep);
                    onClose();
                }
            },
            {
                id: "current-tutor-explain",
                title: `Ask AI to Explain: ${currentStep.title}`,
                subtitle: "Break down concept in simple terms",
                icon: Sparkles,
                category: "Intelligence",
                keywords: ["explain", "simple", "clarity", "tutor", "understand", "what is"],
                run: () => {
                    onOpenAiTutor?.(currentStep, "explain_simple");
                    onClose();
                }
            },
            {
                id: "current-tutor-guide",
                title: `Ask AI to Guide Practice on: ${currentStep.title}`,
                subtitle: "Get Socratic hints and reasoning prompts",
                icon: HelpCircle,
                category: "Intelligence",
                keywords: ["guide", "hint", "help", "solve", "how to", "socratic"],
                run: () => {
                    onOpenAiTutor?.(currentStep, "guide_hint");
                    onClose();
                }
            },
            {
                id: "current-tutor-challenge",
                title: `Challenge Drill on: ${currentStep.title}`,
                subtitle: "Generate a progressively harder problem",
                icon: Flame,
                category: "Intelligence",
                keywords: ["challenge", "hard", "problem", "code", "interview"],
                run: () => {
                    onOpenAiTutor?.(currentStep, "challenge_hard");
                    onClose();
                }
            }
        ] : []),
        {
            id: "create-goal",
            title: "Synthesize New Learning Roadmap",
            subtitle: "Build a custom AI roadmap for a new skill",
            icon: BookOpen,
            category: "Roadmap",
            keywords: ["new", "create", "roadmap", "goal", "build", "generate", "synthesis"],
            run: () => {
                onCreateGoal?.();
                onClose();
            }
        }
    ];

    // Add step search matches
    const stepActions = steps.map(step => ({
        id: `step-${step.id}`,
        title: `Step: ${step.title}`,
        subtitle: `${step.category || "Core Concept"} • ${step.is_completed ? "Completed" : "In Progress"}`,
        icon: step.is_completed ? Zap : Target,
        category: "Curriculum Step",
        keywords: [step.title.toLowerCase(), (step.category || "").toLowerCase()],
        run: () => {
            onOpenStep?.(step);
            onClose();
        }
    }));

    // Add goal switcher actions
    const goalActions = allGoals.map(goal => ({
        id: `goal-${goal.id}`,
        title: `Switch to Goal: ${goal.title}`,
        subtitle: `${goal.skill_level || "Beginner"} • ${goal.is_active ? "Active Goal" : "Saved Goal"}`,
        icon: Compass,
        category: "Goals",
        keywords: [goal.title.toLowerCase(), "switch", "goal"],
        run: () => {
            onSwitchGoal?.(goal.id);
            onClose();
        }
    }));

    const allCommands = [...baseActions, ...stepActions, ...goalActions];

    // Filter commands by query (matches title, subtitle, or keywords)
    const filteredCommands = lowerQuery
        ? allCommands.filter(cmd => 
            cmd.title.toLowerCase().includes(lowerQuery) ||
            cmd.subtitle.toLowerCase().includes(lowerQuery) ||
            cmd.keywords.some(k => k.includes(lowerQuery))
        )
        : baseActions;

    // Keyboard navigation
    const handleKeyDown = (e) => {
        if (e.key === "Escape") {
            onClose();
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % (filteredCommands.length || 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (filteredCommands[selectedIndex]) {
                filteredCommands[selectedIndex].run();
            }
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <div className="command-overlay" onClick={onClose}>
                <motion.div
                    className="command-palette"
                    onClick={e => e.stopPropagation()}
                    initial={{ opacity: 0, scale: 0.96, y: -16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -16 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                >
                    {/* Command Search Bar */}
                    <div className="command-input-row">
                        <Search size={18} className="command-search-icon" />
                        <input
                            ref={inputRef}
                            type="text"
                            className="command-input"
                            placeholder="Type an intention (e.g. 'What should I study?', 'Start quiz', 'Explain recursion')..."
                            value={query}
                            onChange={e => {
                                setQuery(e.target.value);
                                setSelectedIndex(0);
                            }}
                            onKeyDown={handleKeyDown}
                        />
                        <button className="command-close-btn" onClick={onClose} aria-label="Close command center">
                            <X size={16} />
                        </button>
                    </div>

                    {/* Results / Intent List */}
                    <div className="command-results-list">
                        {filteredCommands.length === 0 ? (
                            <div className="command-empty-state">
                                <p className="command-empty-title font-display">No matching intentions found</p>
                                <p className="command-empty-subtitle font-sans">
                                    Try searching for concepts, quizzes, tutor questions, or roadmap goals.
                                </p>
                            </div>
                        ) : (
                            filteredCommands.map((cmd, idx) => {
                                const IconComponent = cmd.icon;
                                const isSelected = idx === selectedIndex;
                                return (
                                    <div
                                        key={cmd.id}
                                        className={`command-item ${isSelected ? "selected" : ""}`}
                                        onClick={() => cmd.run()}
                                        onMouseEnter={() => setSelectedIndex(idx)}
                                    >
                                        <div className="command-item-icon-box">
                                            <IconComponent size={16} />
                                        </div>
                                        <div className="command-item-text">
                                            <div className="command-item-title-row">
                                                <span className="command-item-title font-interactive">{cmd.title}</span>
                                                <span className="command-item-badge font-mono">{cmd.category}</span>
                                            </div>
                                            <span className="command-item-subtitle font-sans">{cmd.subtitle}</span>
                                        </div>
                                        {isSelected && (
                                            <div className="command-item-enter font-mono">
                                                <CornerDownLeft size={12} />
                                                <span>EXEC</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Telemetry Footer */}
                    <div className="command-footer">
                        <div className="command-footer-hints font-mono">
                            <span><kbd>↑</kbd> <kbd>↓</kbd> Navigate</span>
                            <span><kbd>↵</kbd> Select</span>
                            <span><kbd>ESC</kbd> Close</span>
                        </div>
                        <span className="command-footer-brand font-hero">LearnWise Intelligence</span>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
}
