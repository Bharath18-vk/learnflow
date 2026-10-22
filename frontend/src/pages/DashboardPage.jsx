import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
    Flame,
    Plus,
    CheckCircle2,
    Circle,
    Clock,
    User,
    Download,
    BookOpen,
    Play,
    Video,
    ExternalLink,
    ChevronDown,
    Award,
    HelpCircle,
    Check,
    ArrowRight,
    GraduationCap,
    Code2,
    FileText,
    Terminal,
    Trash2,
    Calendar,
    Target,
    Briefcase,
    Zap,
    AlertTriangle,
    ShieldCheck,
    Sparkles,
    ChevronUp,
    Layers,
    Sliders,
    Info,
    CheckCircle
} from "lucide-react";

import { ThemeToggle } from "../components/ui";
import { ProfileModal } from "../components/ProfileModal";
import { StepQuizModal } from "../components/StepQuizModal";
import { ExportModal } from "../components/ExportModal";
import { DashboardMasterySummary } from "../components/DashboardMasterySummary";
import { triggerHaptic } from "../services/haptics";
import {
    getActiveRoadmap,
    getAllUserGoals,
    activateGoal,
    deleteGoal,
    toggleStepCompletion,
    getVerificationStatus,
    getActiveLearningSession,
    getDashboardMasterySummary
} from "../services/api";
import "./DashboardPage.css";

// Helper function to resolve dynamic source icons and styling
function getResourceMeta(res) {
    const title = (res.title || "").toLowerCase();
    const url = (res.url || "").toLowerCase();
    const type = (res.resource_type || "").toLowerCase();

    // YouTube / Video
    if (url.includes("youtube.com") || url.includes("youtu.be") || title.includes("youtube") || title.includes("video") || type === "video" || type === "youtube") {
        return {
            typeClass: "video",
            icon: <Play size={12} className="res-icon video-icon" fill="currentColor" />
        };
    }

    // GitHub / Code / Repositories
    if (url.includes("github.com") || url.includes("gitlab.com") || title.includes("github") || title.includes("repository") || title.includes("repo") || type === "practice" || type === "project") {
        return {
            typeClass: "github",
            icon: <Code2 size={12} className="res-icon github-icon" />
        };
    }

    // Coursera / Udemy / Courses
    if (url.includes("coursera.org") || url.includes("udemy.com") || url.includes("edx.org") || title.includes("course") || title.includes("coursera") || title.includes("udemy") || type === "course") {
        return {
            typeClass: "course",
            icon: <GraduationCap size={12} className="res-icon course-icon" />
        };
    }

    // Practice / Exercises / Interactive
    if (url.includes("leetcode.com") || url.includes("hackerrank.com") || title.includes("practice") || title.includes("exercise") || title.includes("drill")) {
        return {
            typeClass: "practice",
            icon: <Terminal size={12} className="res-icon practice-icon" />
        };
    }

    // Official Docs / Guides
    return {
        typeClass: "docs",
        icon: <FileText size={12} className="res-icon docs-icon" />
    };
}

export function DashboardPage() {
    const navigate = useNavigate();

    // Data State
    const [progressData, setProgressData] = useState(null);
    const [userGoals, setUserGoals] = useState([]);
    const [securityStatus, setSecurityStatus] = useState(null);
    const [activeSession, setActiveSession] = useState(null);
    const [masterySummary, setMasterySummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal State
    const [profileOpen, setProfileOpen] = useState(false);
    const [exportOpen, setExportOpen] = useState(false);
    const [quizStep, setQuizStep] = useState(null);
    const [deleteConfirmGoal, setDeleteConfirmGoal] = useState(null);
    const [showReasoning, setShowReasoning] = useState(true);

    // Goal Dropdown State
    const [goalDropdownOpen, setGoalDropdownOpen] = useState(false);
    const goalDropdownRef = useRef(null);

    // Lock body scroll when delete confirmation modal is open
    useEffect(() => {
        if (deleteConfirmGoal) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [deleteConfirmGoal]);

    // Close goal dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (goalDropdownRef.current && !goalDropdownRef.current.contains(event.target)) {
                setGoalDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Initial Data Fetching
    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [roadmapRes, goalsRes, secRes, sessionRes, masteryRes] = await Promise.all([
                getActiveRoadmap().catch(() => null),
                getAllUserGoals().catch(() => []),
                getVerificationStatus().catch(() => null),
                getActiveLearningSession().catch(() => null),
                getDashboardMasterySummary().catch(() => null)
            ]);

            if (!roadmapRes || !roadmapRes.roadmap) {
                navigate("/onboarding");
                return;
            }

            setProgressData(roadmapRes);
            setUserGoals(goalsRes || []);
            setSecurityStatus(secRes);
            setActiveSession(sessionRes);
            setMasterySummary(masteryRes);
        } catch (err) {
            console.error("Dashboard Load Error:", err);
            setError("Failed to load your learning dashboard. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    // Derived Step Metrics
    const steps = useMemo(() => {
        if (!progressData?.roadmap?.steps) return [];
        return [...progressData.roadmap.steps].sort((a, b) => (a.order_index || a.order || 0) - (b.order_index || b.order || 0));
    }, [progressData]);

    const completedCount = useMemo(() => {
        return steps.filter((s) => s.is_completed).length;
    }, [steps]);

    const progressPercentage = useMemo(() => {
        if (steps.length === 0) return 0;
        return Math.round((completedCount / steps.length) * 100);
    }, [completedCount, steps.length]);

    const activeStep = useMemo(() => {
        return steps.find((s) => !s.is_completed) || steps[steps.length - 1] || null;
    }, [steps]);

    // Group steps by phase
    const phasedSteps = useMemo(() => {
        const phases = {};
        steps.forEach(step => {
            const phaseNum = step.phase_number || 1;
            const phaseTitle = step.phase_title || `Phase ${phaseNum}: Core Foundations`;
            if (!phases[phaseNum]) {
                phases[phaseNum] = {
                    number: phaseNum,
                    title: phaseTitle,
                    steps: [],
                    totalHours: 0
                };
            }
            phases[phaseNum].steps.push(step);
            phases[phaseNum].totalHours += (step.estimated_hours || 5.0);
        });
        return Object.values(phases).sort((a, b) => a.number - b.number);
    }, [steps]);

    // Handle Goal Switching
    const handleSwitchGoal = async (goalId) => {
        setGoalDropdownOpen(false);
        try {
            setLoading(true);
            await activateGoal(goalId);
            await fetchDashboardData();
        } catch (err) {
            console.error("Goal Switch Error:", err);
            setLoading(false);
        }
    };

    // Handle Roadmap Deletion
    const handleDeleteGoal = async (goalId) => {
        setDeleteConfirmGoal(null);
        try {
            setLoading(true);
            await deleteGoal(goalId);
            triggerHaptic("notification");
            await fetchDashboardData();
        } catch (err) {
            console.error("Delete Goal Error:", err);
            setError("Failed to delete roadmap.");
            setLoading(false);
        }
    };

    // Toggle Step Completion
    const handleToggleStep = async (stepId) => {
        triggerHaptic("stepComplete");
        try {
            const updated = await toggleStepCompletion(stepId);
            const isCompletedNow = !steps.find(s => s.id === stepId)?.is_completed;

            if (isCompletedNow) {
                confetti({
                    particleCount: 50,
                    spread: 60,
                    origin: { y: 0.8 }
                });
            }

            // Update local state instantly
            setProgressData((prev) => {
                if (!prev || !prev.roadmap) return prev;
                const newSteps = prev.roadmap.steps.map((s) =>
                    s.id === stepId ? { ...s, is_completed: isCompletedNow } : s
                );
                return {
                    ...prev,
                    completed_steps: isCompletedNow ? prev.completed_steps + 1 : Math.max(0, prev.completed_steps - 1),
                    roadmap: { ...prev.roadmap, steps: newSteps }
                };
            });
        } catch (err) {
            console.error("Step Toggle Error:", err);
        }
    };

    // Handle Quiz Completion
    const handleQuizCompleted = () => {
        confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
        });
        fetchDashboardData();
    };

    if (loading) {
        return (
            <div className="simple-loading-screen">
                <div className="simple-spinner" />
                <p>Loading your personalized roadmap...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="simple-error-screen">
                <h2>Something went wrong</h2>
                <p>{error}</p>
                <button className="simple-btn primary" onClick={fetchDashboardData}>Retry</button>
            </div>
        );
    }

    const commitment = progressData?.commitment || {};
    const feasibility = progressData?.feasibility || {};
    const roadmap = progressData?.roadmap || {};
    const reasoningList = roadmap?.personalization_reasoning || [];
    const deferredList = roadmap?.deferred_topics || [];

    return (
        <div className="simple-dashboard-layout">
            {/* Top Navigation Bar */}
            <header className="simple-nav">
                <div className="nav-container">
                    <div className="nav-left">
                        <Link to="/" className="nav-brand">
                            <span className="brand-dot" />
                            <span className="brand-name">LearnWise</span>
                        </Link>

                        {/* Goal Selector Dropdown */}
                        <div className="goal-dropdown-wrapper" ref={goalDropdownRef}>
                            <button
                                type="button"
                                className="goal-dropdown-btn"
                                onClick={() => setGoalDropdownOpen(!goalDropdownOpen)}
                            >
                                <span className="goal-title-text">{progressData?.title || progressData?.goal_title || roadmap?.title || "Learning Roadmap"}</span>
                                <ChevronDown size={15} />
                            </button>

                            {goalDropdownOpen && (
                                <div className="goal-dropdown-menu">
                                    <div className="dropdown-label">Your Learning Paths</div>
                                    {userGoals.map((g) => (
                                        <div
                                            key={g.id}
                                            className={`dropdown-item-row ${g.is_active ? "active" : ""}`}
                                        >
                                            <button
                                                type="button"
                                                className="dropdown-item-btn"
                                                onClick={() => handleSwitchGoal(g.id)}
                                            >
                                                <span className="dropdown-item-title">{g.title}</span>
                                                {g.is_active && <Check size={14} className="check-icon" />}
                                            </button>
                                            <button
                                                type="button"
                                                className="dropdown-item-delete-btn"
                                                title={`Delete ${g.title}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setGoalDropdownOpen(false);
                                                    setDeleteConfirmGoal(g);
                                                }}
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    ))}
                                    <div className="dropdown-divider" />
                                    <Link to="/onboarding" className="dropdown-item new-goal-item" onClick={() => setGoalDropdownOpen(false)}>
                                        <Plus size={14} />
                                        <span>Create New Personalized Path</span>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="nav-right">
                        {/* Streak & XP Badges */}
                        <div className="stat-pill streak">
                            <Flame size={15} className="streak-icon" />
                            <span>{progressData?.streak_days || 1}d Streak</span>
                        </div>
                        <div className="stat-pill xp">
                            <Award size={15} className="xp-icon" />
                            <span>{progressData?.user_stats?.xp_points || progressData?.xp || 0} XP</span>
                        </div>

                        {/* Action Buttons */}
                        <button
                            type="button"
                            className="nav-icon-btn"
                            onClick={() => setExportOpen(true)}
                            title="Export Roadmap"
                        >
                            <Download size={16} />
                        </button>

                        <ThemeToggle />

                        <button
                            type="button"
                            className="nav-icon-btn profile-btn"
                            onClick={() => setProfileOpen(true)}
                            title="Account Profile"
                        >
                            <User size={16} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="dashboard-main-container">
                {/* 1. Header Hero Card */}
                <section className="goal-hero-card">
                    <div className="goal-hero-header">
                        <div className="goal-hero-left">
                            <div className="kicker-row">
                                <span className="goal-kicker">PERSONALIZED LEARNING ROADMAP</span>
                                <span className="outcome-pill font-mono">{progressData?.target_outcome || "Job-ready"}</span>
                                <span className="depth-pill font-mono">{progressData?.desired_depth || "Balanced"}</span>
                            </div>
                            <h1 className="goal-main-title">{progressData?.title || roadmap?.title}</h1>
                            {roadmap?.description && (
                                <p className="goal-summary-desc">{roadmap.description}</p>
                            )}
                        </div>

                        <div className="goal-meta-badges">
                            <button
                                type="button"
                                className="meta-badge delete-roadmap-badge"
                                onClick={() => setDeleteConfirmGoal({
                                    id: progressData.goal_id,
                                    title: progressData.title || roadmap?.title || "this roadmap"
                                })}
                                title="Delete this roadmap"
                            >
                                <Trash2 size={13} />
                                <span>Delete Path</span>
                            </button>
                        </div>
                    </div>

                    {/* Progress Track */}
                    <div className="goal-progress-box">
                        <div className="progress-labels">
                            <span className="font-display">Overall Roadmap Completion</span>
                            <span className="progress-value font-mono">{completedCount} of {steps.length} Milestones ({progressPercentage}%)</span>
                        </div>
                        <div className="progress-track">
                            <div className="progress-fill" style={{ width: `${progressPercentage}%` }} />
                        </div>
                    </div>
                </section>

                {/* 2. Commitment & Feasibility Telemetry Banner */}
                <section className="feasibility-telemetry-card">
                    <div className="telemetry-grid">
                        <div className="telemetry-item">
                            <span className="t-label font-mono"><Clock size={12} /> STUDY COMMITMENT</span>
                            <span className="t-val font-display">
                                {progressData?.daily_minutes || 30}m/day • {progressData?.days_per_week || 5}d/wk
                            </span>
                            <span className="t-sub font-mono">({commitment.weekly_hours || 2.5} hrs / week)</span>
                        </div>

                        <div className="telemetry-item">
                            <span className="t-label font-mono"><Layers size={12} /> TOTAL CURRICULUM</span>
                            <span className="t-val font-display">
                                {roadmap?.total_estimated_hours || 40} hrs
                            </span>
                            <span className="t-sub font-mono">~{roadmap?.estimated_duration_weeks || 16} weeks duration</span>
                        </div>

                        <div className="telemetry-item">
                            <span className="t-label font-mono"><Calendar size={12} /> TARGET DEADLINE</span>
                            <span className="t-val font-display">
                                {progressData?.deadline ? progressData.deadline : "Self-Paced"}
                            </span>
                            <span className="t-sub font-mono">
                                {commitment.days_until_deadline ? `${commitment.days_until_deadline} days remaining` : "Flexible pacing"}
                            </span>
                        </div>

                        <div className="telemetry-item">
                            <span className="t-label font-mono"><Target size={12} /> PROJECTED FINISH</span>
                            <span className="t-val font-display highlight-date">
                                {roadmap?.projected_completion_date || "Continuous"}
                            </span>
                            <span className="t-sub font-mono">Calculated from velocity</span>
                        </div>
                    </div>

                    {/* Feasibility Alert Ribbon */}
                    <div className={`feasibility-alert-ribbon ${feasibility.status || roadmap.feasibility_status || "realistic"}`}>
                        <div className="alert-content">
                            {feasibility.status === "infeasible" || roadmap.feasibility_status === "infeasible" ? (
                                <>
                                    <AlertTriangle size={18} className="alert-icon-crimson" />
                                    <div>
                                        <span className="alert-title font-display">Over-Capacity Schedule Alert</span>
                                        <p className="alert-text font-sans">
                                            {feasibility.notes || roadmap.feasibility_notes || "Your target deadline requires more weekly hours than committed. We have prioritized essential milestones and deferred optional modules."}
                                        </p>
                                    </div>
                                </>
                            ) : feasibility.status === "tight" || roadmap.feasibility_status === "tight" ? (
                                <>
                                    <Zap size={18} className="alert-icon-amber" />
                                    <div>
                                        <span className="alert-title font-display">Intensive Study Pace</span>
                                        <p className="alert-text font-sans">
                                            {feasibility.notes || roadmap.feasibility_notes || "Your schedule is tight. Consistent weekly study will ensure you hit your target deadline on time."}
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <ShieldCheck size={18} className="alert-icon-emerald" />
                                    <div>
                                        <span className="alert-title font-display">Realistic & Achievable Schedule</span>
                                        <p className="alert-text font-sans">
                                            {feasibility.notes || roadmap.feasibility_notes || "Your committed study velocity comfortably covers the required milestone hours before your target completion date."}
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </section>

                {/* 3. Personalization Insights Rationale Card */}
                {reasoningList.length > 0 && (
                    <section className="personalization-insights-card">
                        <div
                            className="insights-header"
                            onClick={() => setShowReasoning(!showReasoning)}
                        >
                            <div className="insights-title-box">
                                <Sparkles size={16} className="sparkle-indigo" />
                                <h3 className="font-display">Why this roadmap? • Personalization Rationale</h3>
                            </div>
                            <button type="button" className="toggle-btn" aria-label="Toggle rationale">
                                {showReasoning ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                        </div>

                        {showReasoning && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="insights-body"
                            >
                                <ul className="reasoning-list font-sans">
                                    {reasoningList.map((reason, idx) => (
                                        <li key={idx} className="reasoning-item">
                                            <span className="bullet-indicator" />
                                            <span>{reason}</span>
                                        </li>
                                    ))}
                                </ul>

                                {progressData?.existing_knowledge && progressData.existing_knowledge.trim().length > 0 && (
                                    <div className="prior-knowledge-tag-banner font-mono">
                                        <Check size={12} />
                                        <span>Recognized Prior Knowledge: <strong>{progressData.existing_knowledge}</strong> (Introductory duplicates omitted)</span>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </section>
                )}

                {/* 3.5. Skill Mastery Telemetry */}
                {masterySummary && masterySummary.has_active_mastery && (
                    <DashboardMasterySummary summary={masterySummary} />
                )}

                {/* 4. Active Learning Session / Focus Banner */}
                {activeSession && activeSession.has_active_session ? (
                    <section className="continue-learning-card">
                        <div className="continue-learning-content">
                            <div className="continue-kicker-row font-mono">
                                <span className="continue-badge">ACTIVE LEARNING SESSION</span>
                                <span className="continue-phase">Phase 0{activeSession.phase_number || 1} • Milestone #{activeSession.milestone_order_index || 1}</span>
                            </div>
                            <h3 className="continue-title font-display">{activeSession.milestone_title}</h3>
                            <p className="continue-subtext font-sans">
                                Current progress: <strong>{activeSession.progress_percentage}%</strong>
                                {activeSession.current_section_title && ` • Currently on: "${activeSession.current_section_title}"`}
                            </p>
                            <div className="continue-progress-bar">
                                <div className="continue-progress-fill" style={{ width: `${activeSession.progress_percentage}%` }} />
                            </div>
                        </div>
                        <div className="continue-actions">
                            <Link
                                to={`/learn/${activeSession.milestone_id}`}
                                className="simple-btn primary continue-study-btn font-display"
                            >
                                <Play size={16} fill="currentColor" />
                                <span>Resume Learning Experience →</span>
                            </Link>
                        </div>
                    </section>
                ) : activeStep && !activeStep.is_completed ? (
                    <section className="active-step-banner">
                        <div className="banner-content">
                            <span className="banner-kicker">NEXT UP • PHASE {activeStep.phase_number || 1} • MILESTONE #{activeStep.order_index || 1}</span>
                            <h3 className="banner-title">{activeStep.title}</h3>
                            <p className="banner-desc">{activeStep.description}</p>
                            <div className="active-step-pills font-mono">
                                <span className="active-pill priority">{activeStep.priority || "Essential"}</span>
                                <span className="active-pill hours">⏱ ~{activeStep.estimated_hours || 5.0} hrs</span>
                                <span className="active-pill difficulty">{activeStep.difficulty || "Beginner"}</span>
                            </div>
                        </div>
                        <div className="banner-actions">
                            <Link
                                to={`/learn/${activeStep.id}`}
                                className="simple-btn primary start-learning-btn font-display"
                            >
                                <BookOpen size={16} />
                                <span>Start Learning Unit →</span>
                            </Link>
                            <button
                                type="button"
                                className="simple-btn secondary"
                                onClick={() => handleToggleStep(activeStep.id)}
                                title="Quick mark complete without internal lesson"
                            >
                                <CheckCircle2 size={15} />
                                <span>Mark Done</span>
                            </button>
                        </div>
                    </section>
                ) : null}

                {/* 5. Phased Roadmap Milestones */}
                <section className="roadmap-steps-section">
                    <div className="section-title-row">
                        <h2 className="section-heading">Curriculum Milestones by Phase</h2>
                        <span className="phase-count-badge font-mono">{phasedSteps.length} Structured Phases</span>
                    </div>

                    <div className="phases-container">
                        {phasedSteps.map((phase) => {
                            const phaseCompleted = phase.steps.every(s => s.is_completed);
                            const phaseCompletedCount = phase.steps.filter(s => s.is_completed).length;

                            return (
                                <div key={phase.number} className={`phase-block ${phaseCompleted ? "phase-done" : ""}`}>
                                    {/* Phase Header */}
                                    <div className="phase-header-bar">
                                        <div className="phase-title-left">
                                            <span className="phase-badge font-mono">PHASE 0{phase.number}</span>
                                            <h3 className="phase-title font-display">{phase.title?.replace(/^Phase\s*\d+\s*:\s*/i, "") || phase.title}</h3>
                                        </div>
                                        <div className="phase-meta-right font-mono">
                                            <span className="phase-hours">~{phase.totalHours.toFixed(1)} hrs</span>
                                            <span className="phase-progress-tag">
                                                {phaseCompletedCount}/{phase.steps.length} Completed
                                            </span>
                                        </div>
                                    </div>

                                    {/* Steps inside this phase */}
                                    <div className="steps-list">
                                        {phase.steps.map((step) => {
                                            const isCompleted = step.is_completed;
                                            const isActive = activeStep?.id === step.id;
                                            const priority = step.priority || (step.is_essential ? "Essential" : "Optional");

                                            return (
                                                <div
                                                    key={step.id}
                                                    className={`step-card ${isCompleted ? "completed" : ""} ${isActive ? "active-focus" : ""}`}
                                                >
                                                    <div className="step-card-left">
                                                        <button
                                                            type="button"
                                                            className={`step-checkbox ${isCompleted ? "checked" : ""}`}
                                                            onClick={() => handleToggleStep(step.id)}
                                                            aria-label={`Mark milestone ${step.order_index} ${isCompleted ? "incomplete" : "complete"}`}
                                                        >
                                                            {isCompleted ? <CheckCircle2 size={20} className="check-svg" /> : <Circle size={20} />}
                                                        </button>
                                                    </div>

                                                    <div className="step-card-body">
                                                        <div className="step-title-row">
                                                            <span className="step-number font-mono">#{step.order_index}</span>
                                                            <h4 className="step-title font-display">{step.title}</h4>
                                                            
                                                            {/* Priority & Hour Badges */}
                                                            <span className={`priority-tag font-mono ${priority.toLowerCase()}`}>
                                                                {priority}
                                                            </span>
                                                            <span className="step-time-badge font-mono">
                                                                <Clock size={11} />
                                                                <span>{step.estimated_hours || 5.0} hrs</span>
                                                            </span>
                                                            <span className="step-difficulty-badge font-mono">
                                                                {step.difficulty || "Beginner"}
                                                            </span>
                                                        </div>

                                                        <p className="step-description font-sans">{step.description}</p>

                                                        {/* Prerequisites tags */}
                                                        {step.prerequisites && step.prerequisites.length > 0 && (
                                                             <div className="step-prereqs-row font-mono">
                                                                <span className="prereq-label">Prerequisites:</span>
                                                                {step.prerequisites.map((req, rIdx) => (
                                                                    <span key={rIdx} className="prereq-pill">{req}</span>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* Curated Resources */}
                                                        {step.resources && step.resources.length > 0 && (
                                                            <div className="step-resources-list">
                                                                <span className="res-header font-mono">Study Resources:</span>
                                                                <div className="res-items">
                                                                    {step.resources.map((res, rIdx) => {
                                                                        const meta = getResourceMeta(res);
                                                                        return (
                                                                            <a
                                                                                key={res.id || rIdx}
                                                                                href={res.url}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className={`resource-link ${meta.typeClass}`}
                                                                            >
                                                                                {meta.icon}
                                                                                <span>{res.title}</span>
                                                                                <ExternalLink size={10} className="ext-icon" />
                                                                            </a>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="step-card-actions">
                                                        {/* Direct Link to Milestone Learning Experience */}
                                                        <Link
                                                            to={`/learn/${step.id}`}
                                                            className={`step-action-btn learn-btn ${isCompleted ? "completed" : isActive ? "active-learn" : ""}`}
                                                            title={isCompleted ? "Review Milestone Lesson" : "Start Milestone Lesson"}
                                                        >
                                                            {isCompleted ? (
                                                                <>
                                                                    <BookOpen size={14} />
                                                                    <span>Review</span>
                                                                </>
                                                            ) : isActive ? (
                                                                <>
                                                                    <Play size={14} fill="currentColor" />
                                                                    <span>Learn</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <BookOpen size={14} />
                                                                    <span>Learn</span>
                                                                </>
                                                            )}
                                                        </Link>

                                                        <button
                                                            type="button"
                                                            className="step-action-btn quiz-btn"
                                                            onClick={() => setQuizStep(step)}
                                                            title="Take Micro Quiz"
                                                        >
                                                            <HelpCircle size={14} />
                                                            <span>Quiz</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* 6. Deferred Topics Section */}
                {deferredList.length > 0 && (
                    <section className="deferred-topics-card">
                        <div className="deferred-card-header">
                            <div className="deferred-title-box">
                                <Layers size={16} className="deferred-icon" />
                                <h3 className="font-display">Deferred Modules (Out of Scope for This Cycle)</h3>
                            </div>
                            <span className="deferred-badge font-mono">Time Constraint Optimization</span>
                        </div>
                        <p className="deferred-subtext font-sans">
                            To ensure your roadmap remains 100% achievable within your available weekly study budget, the following secondary or advanced topics were excluded from the critical path:
                        </p>
                        <div className="deferred-items-grid font-sans">
                            {deferredList.map((item, idx) => (
                                <div key={idx} className="deferred-item-pill">
                                    <span className="deferred-dot" />
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </main>

            {/* Micro-Quiz Modal */}
            <StepQuizModal
                isOpen={Boolean(quizStep)}
                onClose={() => setQuizStep(null)}
                step={quizStep}
                onQuizCompleted={handleQuizCompleted}
            />

            {/* Export Roadmap Modal */}
            <ExportModal
                isOpen={exportOpen}
                onClose={() => setExportOpen(false)}
                roadmapData={progressData?.roadmap}
            />

            {/* Profile & Security Modal */}
            <ProfileModal
                isOpen={profileOpen}
                onClose={() => setProfileOpen(false)}
                securityStatus={securityStatus}
                activeGoalsCount={userGoals.length}
                onLogout={() => {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    navigate("/login");
                }}
            />

            {/* Delete Confirmation Modal */}
            {deleteConfirmGoal && createPortal(
                <div className="modal-backdrop" onClick={() => setDeleteConfirmGoal(null)}>
                    <div className="simple-confirm-card" onClick={(e) => e.stopPropagation()}>
                        <div className="confirm-icon-danger">
                            <Trash2 size={24} />
                        </div>
                        <h3 className="confirm-title">Delete Roadmap?</h3>
                        <p className="confirm-message">
                            Are you sure you want to delete <strong>&quot;{deleteConfirmGoal.title}&quot;</strong>? This action will permanently remove all milestone progress, quiz scores, and personalized resources.
                        </p>
                        <div className="confirm-actions">
                            <button
                                type="button"
                                className="simple-btn secondary"
                                onClick={() => setDeleteConfirmGoal(null)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="simple-btn danger"
                                onClick={() => handleDeleteGoal(deleteConfirmGoal.id)}
                            >
                                <Trash2 size={15} />
                                <span>Delete Roadmap</span>
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

export default DashboardPage;

