import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
    ArrowLeft,
    CheckCircle2,
    Circle,
    Clock,
    BookOpen,
    Code2,
    HelpCircle,
    Bookmark,
    FileText,
    Copy,
    Check,
    ChevronRight,
    ChevronLeft,
    Sparkles,
    Play,
    Terminal,
    GraduationCap,
    ExternalLink,
    AlertCircle,
    Lightbulb,
    Trash2,
    Edit2,
    Plus,
    X,
    RotateCcw,
    Layers,
    Target,
    Menu,
    ChevronDown,
    ChevronUp,
    ShieldCheck,
    TrendingUp,
    Award,
    Zap
} from "lucide-react";

import { ThemeToggle } from "../components/ui";
import { ConceptMasteryCard } from "../components/ConceptMasteryCard";
import { AssessmentResultView } from "../components/AssessmentResultView";
import { RemediationModal } from "../components/RemediationModal";
import { triggerHaptic } from "../services/haptics";
import {
    getMilestoneLearning,
    generateMilestoneLearning,
    updateLearningProgress,
    submitCheckpointAssessment,
    getLearningNotes,
    createLearningNote,
    updateLearningNote,
    deleteLearningNote,
    toggleLearningBookmark,
    getConceptMastery,
    getWeakConcepts,
    getPublicAssessmentQuestions
} from "../services/api";
import "./LearningPage.css";

// Helper for resource icons
function getResourceIcon(type = "docs") {
    switch (type.toLowerCase()) {
        case "video":
        case "youtube":
            return <Play size={14} className="res-icon-red" fill="currentColor" />;
        case "practice":
        case "github":
            return <Code2 size={14} className="res-icon-purple" />;
        case "course":
            return <GraduationCap size={14} className="res-icon-amber" />;
        case "article":
            return <BookOpen size={14} className="res-icon-emerald" />;
        default:
            return <FileText size={14} className="res-icon-blue" />;
    }
}

export default function LearningPage() {
    const { stepId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Data State
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState(null);
    const [milestoneMeta, setMilestoneMeta] = useState(null);
    const [learningContent, setLearningContent] = useState(null);
    const [progress, setProgress] = useState(null);

    // Phase 3: Mastery & Remediation State
    const [conceptMasteryList, setConceptMasteryList] = useState([]);
    const [remediationTargetConcept, setRemediationTargetConcept] = useState(null);
    const [isRemediationOpen, setIsRemediationOpen] = useState(false);
    const [publicQuestions, setPublicQuestions] = useState([]);

    // Navigation & View State
    // activeTab: 'overview' | 'mastery' | 'section-{index}' | 'practice' | 'checkpoint' | 'resources'
    const [activeTab, setActiveTab] = useState(searchParams.get("tab") === "mastery" ? "mastery" : "overview");
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Active Learning State (in-section checks)
    const [activeCheckAnswers, setActiveCheckAnswers] = useState({});
    const [activeCheckSubmitted, setActiveCheckSubmitted] = useState({});

    // Practice State
    const [practiceCopied, setPracticeCopied] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const [showSolution, setShowSolution] = useState(false);
    const [hintsUsedCount, setHintsUsedCount] = useState(0);
    const [solutionViewed, setSolutionViewed] = useState(false);

    // Checkpoint State
    const [checkpointAnswers, setCheckpointAnswers] = useState({});
    const [checkpointResult, setCheckpointResult] = useState(null);
    const [submittingCheckpoint, setSubmittingCheckpoint] = useState(false);

    // Notes State
    const [notesDrawerOpen, setNotesDrawerOpen] = useState(false);
    const [notes, setNotes] = useState([]);
    const [newNoteContent, setNewNoteContent] = useState("");
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [editingNoteContent, setEditingNoteContent] = useState("");
    const [savingNote, setSavingNote] = useState(false);

    // Bookmark State
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [copiedCodeIndex, setCopiedCodeIndex] = useState(null);

    // Phase 3: Data Loaders
    const loadConceptMastery = async (contentId) => {
        if (!contentId) return;
        try {
            const data = await getConceptMastery(contentId);
            const list = Array.isArray(data) ? data : (data?.concepts || []);
            setConceptMasteryList(list);
        } catch (err) {
            console.error("Load Concept Mastery Error:", err);
            setConceptMasteryList([]);
        }
    };

    const loadPublicQuestions = async (contentId) => {
        if (!contentId) return;
        try {
            const data = await getPublicAssessmentQuestions(contentId);
            if (data && data.length > 0) {
                setPublicQuestions(data);
            }
        } catch (err) {
            console.error("Load Public Questions Error:", err);
        }
    };

    // 1. Initial Load
    const loadContent = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await getMilestoneLearning(stepId);
            setMilestoneMeta({
                milestone_id: res.milestone_id,
                milestone_title: res.milestone_title,
                phase_number: res.phase_number,
                phase_title: res.phase_title,
                difficulty: res.difficulty,
                estimated_hours: res.estimated_hours
            });

            if (res.has_content && res.content) {
                setLearningContent(res.content);
                setProgress(res.content.progress || null);
                
                if (res.content.progress) {
                    setHintsUsedCount(res.content.progress.practice_hints_used || 0);
                    setSolutionViewed(res.content.progress.practice_solution_viewed || false);
                }

                // Load Concept Mastery & Questions
                loadConceptMastery(res.content.id);
                loadPublicQuestions(res.content.id);

                if (searchParams.get("tab") === "mastery") {
                    setActiveTab("mastery");
                } else if (res.content.progress && res.content.progress.current_section_index !== undefined) {
                    const secIdx = res.content.progress.current_section_index;
                    if (secIdx > 0 && res.content.sections && res.content.sections.length > secIdx) {
                        setActiveTab(`section-${secIdx}`);
                    }
                }
            } else {
                // Trigger auto-generation
                handleGenerateContent(false);
            }
        } catch (err) {
            console.error("Load Learning Error:", err);
            setError(err.message || "Failed to load milestone learning content.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadContent();
    }, [stepId]);

    // 2. Load Notes when content is ready
    useEffect(() => {
        if (learningContent?.id) {
            getLearningNotes(learningContent.id)
                .then(data => setNotes(data || []))
                .catch(err => console.error("Load notes error:", err));
        }
    }, [learningContent?.id]);

    // 3. On-Demand Generator Handler
    const handleGenerateContent = async (force = false) => {
        try {
            setGenerating(true);
            setError(null);
            const res = await generateMilestoneLearning(stepId, force);
            if (res.has_content && res.content) {
                setLearningContent(res.content);
                setProgress(res.content.progress || null);
                loadConceptMastery(res.content.id);
                loadPublicQuestions(res.content.id);
                setActiveTab("overview");
                triggerHaptic("notification");
            } else {
                setError("Failed to generate content for this milestone.");
            }
        } catch (err) {
            console.error("Generation Error:", err);
            setError(err.message || "Failed to generate tailored learning lesson.");
        } finally {
            setGenerating(false);
        }
    };

    // 4. Progress Sync Handler
    const handleSectionCompleted = async (sectionOrderIndex) => {
        if (!learningContent?.id) return;
        triggerHaptic("stepComplete");

        try {
            const nextIdx = sectionOrderIndex;
            const updated = await updateLearningProgress(learningContent.id, {
                current_section_index: nextIdx,
                completed_section_index: sectionOrderIndex
            });
            setProgress(updated);

            const totalSections = learningContent.sections?.length || 0;
            if (sectionOrderIndex < totalSections) {
                setActiveTab(`section-${sectionOrderIndex}`);
            } else {
                setActiveTab("practice");
            }
        } catch (err) {
            console.error("Progress update error:", err);
        }
    };

    // 5. Practice Complete Handler
    const handleMarkPracticeComplete = async () => {
        if (!learningContent?.id) return;
        triggerHaptic("stepComplete");
        try {
            const updated = await updateLearningProgress(learningContent.id, {
                practice_completed: true,
                practice_hints_used: hintsUsedCount,
                practice_solution_viewed: solutionViewed
            });
            setProgress(updated);
            // Refresh mastery calculation with new practice evidence
            loadConceptMastery(learningContent.id);
            setActiveTab("checkpoint");
        } catch (err) {
            console.error("Practice progress error:", err);
        }
    };

    // 6. Checkpoint Submission Handler
    const handleSubmitCheckpoint = async (e) => {
        e.preventDefault();
        if (!learningContent?.id) return;

        const questionsToEvaluate = publicQuestions.length > 0 ? publicQuestions : (learningContent.checkpoint_questions || []);
        const totalQ = questionsToEvaluate.length;
        const answeredCount = Object.keys(checkpointAnswers).length;
        if (answeredCount < totalQ) {
            alert(`Please answer all ${totalQ} questions before submitting.`);
            return;
        }

        try {
            setSubmittingCheckpoint(true);
            const result = await submitCheckpointAssessment(learningContent.id, checkpointAnswers);
            setCheckpointResult(result);
            // Instantly refresh granular concept mastery breakdown
            loadConceptMastery(learningContent.id);

            if (result.passed) {
                confetti({
                    particleCount: 100,
                    spread: 80,
                    origin: { y: 0.6 }
                });
                triggerHaptic("success");
            } else {
                triggerHaptic("error");
            }
        } catch (err) {
            console.error("Checkpoint error:", err);
            alert("Failed to submit checkpoint assessment.");
        } finally {
            setSubmittingCheckpoint(false);
        }
    };

    // Remediation Handlers
    const handleStartRemediation = (concept) => {
        let target = concept;
        if (concept && !concept.id && !concept.concept_id && concept.concept_name) {
            const found = (conceptMasteryList || []).find(
                c => c.concept_name === concept.concept_name
            ) || (learningContent?.concepts || []).find(
                c => c.name === concept.concept_name
            );
            if (found) {
                target = { ...concept, id: found.concept_id || found.id, concept_id: found.concept_id || found.id };
            }
        }
        setRemediationTargetConcept(target);
        setIsRemediationOpen(true);
    };

    const handleRemediationMasteryUpdated = () => {
        if (learningContent?.id) {
            loadConceptMastery(learningContent.id);
        }
    };

    // 7. Notes Handlers
    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!newNoteContent.trim() || !learningContent?.id) return;
        try {
            setSavingNote(true);
            const created = await createLearningNote(learningContent.id, {
                content: newNoteContent.trim()
            });
            setNotes([created, ...notes]);
            setNewNoteContent("");
        } catch (err) {
            console.error("Add note error:", err);
        } finally {
            setSavingNote(false);
        }
    };

    const handleUpdateNote = async (noteId) => {
        if (!editingNoteContent.trim()) return;
        try {
            setSavingNote(true);
            const updated = await updateLearningNote(noteId, { content: editingNoteContent.trim() });
            setNotes(notes.map(n => n.id === noteId ? updated : n));
            setEditingNoteId(null);
            setEditingNoteContent("");
        } catch (err) {
            console.error("Update note error:", err);
        } finally {
            setSavingNote(false);
        }
    };

    const handleDeleteNote = async (noteId) => {
        try {
            await deleteLearningNote(noteId);
            setNotes(notes.filter(n => n.id !== noteId));
        } catch (err) {
            console.error("Delete note error:", err);
        }
    };

    // 8. Bookmark Handler
    const handleToggleBookmark = async () => {
        if (!learningContent?.id) return;
        try {
            const bmark = await toggleLearningBookmark(learningContent.id, {
                title: milestoneMeta?.milestone_title || learningContent.title
            });
            setIsBookmarked(bmark.id > 0);
            triggerHaptic("selection");
        } catch (err) {
            console.error("Bookmark toggle error:", err);
        }
    };

    // Helper to copy code
    const handleCopyCode = (code, index) => {
        navigator.clipboard.writeText(code);
        setCopiedCodeIndex(index);
        setTimeout(() => setCopiedCodeIndex(null), 2000);
        triggerHaptic("selection");
    };

    // Derived values
    const sections = learningContent?.sections || [];
    const completedSecIndices = useMemo(() => {
        return progress?.completed_sections || [];
    }, [progress]);

    const currentProgressPercent = useMemo(() => {
        return progress?.progress_percentage || 0;
    }, [progress]);

    const avgMasteryScore = useMemo(() => {
        if (!Array.isArray(conceptMasteryList) || conceptMasteryList.length === 0) return 0;
        const sum = conceptMasteryList.reduce((acc, c) => acc + (c.mastery_score || 0), 0);
        return Math.round(sum / conceptMasteryList.length);
    }, [conceptMasteryList]);

    // Render Loading / Generating Screen
    if (loading || generating) {
        return (
            <div className="learning-loading-screen">
                <div className="learning-spinner" />
                <h2 className="font-display">
                    {generating ? "Preparing Your Tailored Lesson..." : "Loading Learning Environment..."}
                </h2>
                <p className="loading-subtext font-sans">
                    {generating
                        ? "Curating pedagogical explanations, progressive examples, hands-on practice, and assessments matched to your skill profile."
                        : "Retrieving your lesson curriculum and saved notes."}
                </p>
                <div className="loading-tag font-mono">
                    <Sparkles size={13} />
                    <span>Personalized • Interactive • Real-World</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="learning-error-screen">
                <AlertCircle size={36} className="error-icon" />
                <h2 className="font-display">Unable to Load Lesson</h2>
                <p className="font-sans">{error}</p>
                <div className="error-actions">
                    <button type="button" className="simple-btn primary" onClick={() => handleGenerateContent(true)}>
                        <RotateCcw size={15} />
                        <span>Regenerate Lesson</span>
                    </button>
                    <button type="button" className="simple-btn secondary" onClick={() => navigate("/dashboard")}>
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="learning-page-layout">
            {/* 1. Header Bar */}
            <header className="learning-top-header">
                <div className="learning-header-container">
                    <div className="header-left">
                        <Link to="/dashboard" className="back-btn" title="Back to Dashboard">
                            <ArrowLeft size={16} />
                            <span className="back-text">Dashboard</span>
                        </Link>
                        <span className="header-divider">/</span>
                        <div className="header-milestone-info">
                            <span className="header-phase-tag font-mono">
                                Phase 0{milestoneMeta?.phase_number || 1}
                            </span>
                            <h1 className="header-milestone-title font-display">
                                {milestoneMeta?.milestone_title || learningContent?.title}
                            </h1>
                        </div>
                    </div>

                    <div className="header-right">
                        {/* Progress Indicator */}
                        <div className="header-progress-box">
                            <div className="h-progress-labels font-mono">
                                <span>Progress</span>
                                <span className="h-progress-val">{currentProgressPercent}%</span>
                            </div>
                            <div className="h-progress-track">
                                <div className="h-progress-fill" style={{ width: `${currentProgressPercent}%` }} />
                            </div>
                        </div>

                        {/* Quick Action Buttons */}
                        <button
                            type="button"
                            className={`header-icon-btn ${isBookmarked ? "active" : ""}`}
                            onClick={handleToggleBookmark}
                            title={isBookmarked ? "Bookmarked" : "Bookmark Lesson"}
                        >
                            <Bookmark size={15} fill={isBookmarked ? "currentColor" : "none"} />
                        </button>

                        <button
                            type="button"
                            className={`header-icon-btn notes-toggle-btn ${notes.length > 0 ? "has-notes" : ""}`}
                            onClick={() => setNotesDrawerOpen(!notesDrawerOpen)}
                            title="Notes"
                        >
                            <FileText size={15} />
                            {notes.length > 0 && <span className="notes-badge font-mono">{notes.length}</span>}
                        </button>

                        <ThemeToggle />

                        {/* Mobile Menu Toggle */}
                        <button
                            type="button"
                            className="mobile-menu-btn"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="Toggle Navigation"
                        >
                            <Menu size={18} />
                        </button>
                    </div>
                </div>
            </header>

            {/* 2. Main Workspace Layout */}
            <div className="learning-workspace-container">
                {/* Left Navigation Sidebar / Table of Contents */}
                <aside className={`learning-sidebar ${mobileMenuOpen ? "mobile-open" : ""}`}>
                    <div className="sidebar-header">
                        <span className="sidebar-kicker font-mono">LESSON CURRICULUM</span>
                        <span className="sidebar-meta font-mono">
                            <Clock size={12} /> ~{learningContent?.estimated_minutes || 45}m
                        </span>
                    </div>

                    <nav className="sidebar-toc font-sans">
                        {/* 0. Overview & Objectives */}
                        <button
                            type="button"
                            className={`toc-item ${activeTab === "overview" ? "active" : ""}`}
                            onClick={() => {
                                setActiveTab("overview");
                                setMobileMenuOpen(false);
                            }}
                        >
                            <div className="toc-item-left">
                                <span className="toc-bullet">
                                    {completedSecIndices.length > 0 ? <Check size={12} className="check-svg" /> : <Circle size={10} />}
                                </span>
                                <span className="toc-title">Overview & Objectives</span>
                            </div>
                        </button>

                        {/* Concept Mastery Diagnostics */}
                        <button
                            type="button"
                            className={`toc-item mastery-toc-item ${activeTab === "mastery" ? "active" : ""}`}
                            onClick={() => {
                                setActiveTab("mastery");
                                setMobileMenuOpen(false);
                            }}
                        >
                            <div className="toc-item-left">
                                <span className="toc-bullet font-mono">
                                    <TrendingUp size={12} className="text-indigo-400" />
                                </span>
                                <span className="toc-title">Concept Mastery</span>
                            </div>
                            {conceptMasteryList.length > 0 && (
                                <span className="toc-badge-mastery font-mono">
                                    {avgMasteryScore}%
                                </span>
                            )}
                        </button>

                        {/* 1..N Sections */}
                        {sections.map((sec, idx) => {
                            const isDone = completedSecIndices.includes(sec.order_index);
                            const isActive = activeTab === `section-${idx}`;

                            return (
                                <button
                                    key={sec.id || idx}
                                    type="button"
                                    className={`toc-item ${isActive ? "active" : ""} ${isDone ? "completed" : ""}`}
                                    onClick={() => {
                                        setActiveTab(`section-${idx}`);
                                        setMobileMenuOpen(false);
                                    }}
                                >
                                    <div className="toc-item-left">
                                        <span className="toc-bullet font-mono">
                                            {isDone ? (
                                                <CheckCircle2 size={13} className="check-svg" />
                                            ) : (
                                                `0${idx + 1}`
                                            )}
                                        </span>
                                        <span className="toc-title">{sec.title.replace(/^\d+\.\s*/, "")}</span>
                                    </div>
                                    <span className="toc-time font-mono">~{sec.estimated_minutes}m</span>
                                </button>
                            );
                        })}

                        {/* Practice Activity Item */}
                        {learningContent?.practice_activities && learningContent.practice_activities.length > 0 && (
                            <button
                                type="button"
                                className={`toc-item practice-toc-item ${activeTab === "practice" ? "active" : ""} ${progress?.practice_completed ? "completed" : ""}`}
                                onClick={() => {
                                    setActiveTab("practice");
                                    setMobileMenuOpen(false);
                                }}
                            >
                                <div className="toc-item-left">
                                    <span className="toc-bullet font-mono">
                                        {progress?.practice_completed ? (
                                            <CheckCircle2 size={13} className="check-svg" />
                                        ) : (
                                            <Terminal size={12} />
                                        )}
                                    </span>
                                    <span className="toc-title">Applied Practice</span>
                                </div>
                                <span className="toc-badge-essential font-mono">Hands-on</span>
                            </button>
                        )}

                        {/* Checkpoint Assessment Item */}
                        {learningContent?.checkpoint_questions && learningContent.checkpoint_questions.length > 0 && (
                            <button
                                type="button"
                                className={`toc-item checkpoint-toc-item ${activeTab === "checkpoint" ? "active" : ""} ${progress?.checkpoint_completed ? "completed" : ""}`}
                                onClick={() => {
                                    setActiveTab("checkpoint");
                                    setMobileMenuOpen(false);
                                }}
                            >
                                <div className="toc-item-left">
                                    <span className="toc-bullet font-mono">
                                        {progress?.checkpoint_completed ? (
                                            <CheckCircle2 size={13} className="check-svg" />
                                        ) : (
                                            <HelpCircle size={12} />
                                        )}
                                    </span>
                                    <span className="toc-title">Checkpoint Assessment</span>
                                </div>
                                <span className="toc-badge-checkpoint font-mono">Required</span>
                            </button>
                        )}

                        {/* Supplementary Resources Item */}
                        {learningContent?.recommended_resources && learningContent.recommended_resources.length > 0 && (
                            <button
                                type="button"
                                className={`toc-item resources-toc-item ${activeTab === "resources" ? "active" : ""}`}
                                onClick={() => {
                                    setActiveTab("resources");
                                    setMobileMenuOpen(false);
                                }}
                            >
                                <div className="toc-item-left">
                                    <span className="toc-bullet">
                                        <BookOpen size={12} />
                                    </span>
                                    <span className="toc-title">Supplementary Resources</span>
                                </div>
                            </button>
                        )}
                    </nav>

                    {/* Sidebar Footer */}
                    <div className="sidebar-footer">
                        <button
                            type="button"
                            className="regenerate-lesson-btn"
                            onClick={() => {
                                if (window.confirm("Regenerate this lesson? Your notes will be preserved.")) {
                                    handleGenerateContent(true);
                                }
                            }}
                            title="Regenerate lesson with fresh AI pedagogical structure"
                        >
                            <RotateCcw size={12} />
                            <span>Regenerate Lesson</span>
                        </button>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="learning-main-content">
                    {/* TAB 1: Overview & Learning Objectives */}
                    {activeTab === "overview" && (
                        <div className="lesson-tab-view overview-tab-view">
                            <div className="overview-hero-card">
                                <span className="overview-kicker font-mono">MILESTONE LESSON FOUNDATION</span>
                                <h2 className="overview-title font-display">{learningContent.title}</h2>
                                <p className="overview-desc font-sans">{learningContent.overview}</p>

                                <div className="overview-meta-row font-mono">
                                    <span className="meta-pill">
                                        <Clock size={12} /> Estimated {learningContent.estimated_minutes} min
                                    </span>
                                    <span className="meta-pill difficulty">
                                        <Layers size={12} /> {learningContent.difficulty || "Beginner"}
                                    </span>
                                    <span className="meta-pill structure">
                                        <Target size={12} /> {learningContent.content_structure || "Programming"}
                                    </span>
                                </div>
                            </div>

                            {/* Learning Objectives Checklist */}
                            {learningContent.learning_objectives && learningContent.learning_objectives.length > 0 && (
                                <div className="objectives-card">
                                    <div className="objectives-header">
                                        <Sparkles size={16} className="sparkle-cyan" />
                                        <h3 className="font-display">What You Will Master by the End of this Unit</h3>
                                    </div>
                                    <ul className="objectives-list font-sans">
                                        {learningContent.learning_objectives.map((obj, oIdx) => (
                                            <li key={oIdx} className="objective-item">
                                                <div className="obj-check-circle">
                                                    <Check size={12} className="check-svg" />
                                                </div>
                                                <span>{obj}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Start First Section CTA */}
                            <div className="overview-cta-box">
                                <button
                                    type="button"
                                    className="simple-btn primary start-lesson-btn font-display"
                                    onClick={() => setActiveTab("section-0")}
                                >
                                    <span>Begin Section 01: {sections[0]?.title.replace(/^\d+\.\s*/, "") || "Core Concepts"}</span>
                                    <ChevronRight size={16} />
                                </button>
                                <button
                                    type="button"
                                    className="simple-btn secondary mastery-overview-cta-btn font-display"
                                    onClick={() => setActiveTab("mastery")}
                                >
                                    <TrendingUp size={15} />
                                    <span>View Concept Mastery ({avgMasteryScore}%)</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* TAB 1.5: Concept Mastery Diagnostics */}
                    {activeTab === "mastery" && (
                        <div className="lesson-tab-view mastery-tab-view">
                            <div className="mastery-overview-hero">
                                <div className="mastery-hero-left">
                                    <span className="mastery-kicker font-mono">
                                        <TrendingUp size={13} /> GRANULAR SKILL ASSESSMENT & REMEDIATION
                                    </span>
                                    <h2 className="mastery-hero-title font-display">Concept Mastery Breakdown</h2>
                                    <p className="mastery-hero-desc font-sans">
                                        LearnWise models your mastery across individual core concepts using assessment accuracy (40%), practice quality (30%), consistency (20%), and difficulty scaling (10%).
                                    </p>
                                </div>
                                <div className="mastery-hero-score-box">
                                    <span className="hero-score-num font-mono">{avgMasteryScore}%</span>
                                    <span className="hero-score-label font-sans">Milestone Score</span>
                                </div>
                            </div>

                            {/* Concept Cards List */}
                            <div className="concept-cards-container">
                                {conceptMasteryList && conceptMasteryList.length > 0 ? (
                                    <div className="concept-cards-grid">
                                        {conceptMasteryList.map((concept) => (
                                            <ConceptMasteryCard
                                                key={concept.concept_id || concept.id}
                                                concept={concept}
                                                onStartRemediation={handleStartRemediation}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-mastery-state font-sans">
                                        <Award size={36} className="empty-award-icon" />
                                        <h4>No Concept Telemetry Recorded Yet</h4>
                                        <p>Complete the lesson sections, hands-on practice, and checkpoint assessment to generate personalized concept mastery scores.</p>
                                        <button
                                            type="button"
                                            className="simple-btn primary font-sans"
                                            onClick={() => setActiveTab("section-0")}
                                        >
                                            Start Lesson Sections →
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB 2: Lesson Sections */}
                    {activeTab.startsWith("section-") && (() => {
                        const secIdx = parseInt(activeTab.replace("section-", ""), 10);
                        const currentSec = sections[secIdx];
                        if (!currentSec) return null;

                        const isLastSection = secIdx === sections.length - 1;
                        const isSectionDone = completedSecIndices.includes(currentSec.order_index);
                        const interactive = currentSec.interactive_check;

                        return (
                            <div className="lesson-tab-view section-tab-view">
                                {/* Section Header */}
                                <div className="section-view-header">
                                    <div className="section-view-kicker-row">
                                        <span className="section-view-number font-mono">
                                            SECTION 0{secIdx + 1} OF 0{sections.length}
                                        </span>
                                        <span className="section-view-time font-mono">
                                            <Clock size={11} /> ~{currentSec.estimated_minutes} min
                                        </span>
                                    </div>
                                    <h2 className="section-view-title font-display">{currentSec.title}</h2>
                                </div>

                                {/* Section Markdown Explanation Body */}
                                <div className="section-explanation-content font-sans">
                                    {currentSec.explanation.split("\n\n").map((para, pIdx) => {
                                        if (para.startsWith("### ")) {
                                            return <h3 key={pIdx} className="content-h3 font-display">{para.replace("### ", "")}</h3>;
                                        }
                                        if (para.startsWith("#### ")) {
                                            return <h4 key={pIdx} className="content-h4 font-display">{para.replace("#### ", "")}</h4>;
                                        }
                                        if (para.startsWith("> ")) {
                                            return (
                                                <div key={pIdx} className="content-callout font-sans">
                                                    <Lightbulb size={16} className="callout-icon" />
                                                    <p>{para.replace(/^>\s*/, "")}</p>
                                                </div>
                                            );
                                        }
                                        if (para.startsWith("- ") || para.startsWith("* ")) {
                                            const items = para.split("\n").filter(Boolean);
                                            return (
                                                <ul key={pIdx} className="content-bullet-list">
                                                    {items.map((item, iIdx) => (
                                                        <li key={iIdx}>{item.replace(/^[-*]\s*/, "")}</li>
                                                    ))}
                                                </ul>
                                            );
                                        }
                                        return <p key={pIdx} className="content-paragraph">{para}</p>;
                                    })}
                                </div>

                                {/* Code / Worked Examples */}
                                {currentSec.examples && currentSec.examples.length > 0 && (
                                    <div className="section-examples-wrapper">
                                        <h3 className="examples-header-title font-display">
                                            <Code2 size={16} className="code-icon" />
                                            <span>Practical Code & Architecture Example</span>
                                        </h3>

                                        {currentSec.examples.map((ex, exIdx) => (
                                            <div key={ex.id || exIdx} className="example-card">
                                                <div className="example-card-header">
                                                    <div className="example-title-box">
                                                        <span className="example-badge font-mono">{ex.language.toUpperCase()}</span>
                                                        <span className="example-name font-display">{ex.title}</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="copy-code-btn"
                                                        onClick={() => handleCopyCode(ex.example_content, `${secIdx}-${exIdx}`)}
                                                    >
                                                        {copiedCodeIndex === `${secIdx}-${exIdx}` ? (
                                                            <>
                                                                <Check size={12} className="check-svg" />
                                                                <span>Copied!</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy size={12} />
                                                                <span>Copy</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>

                                                <div className="example-code-block">
                                                    <pre className="font-code">
                                                        <code>{ex.example_content}</code>
                                                    </pre>
                                                </div>

                                                {ex.explanation && (
                                                    <div className="example-explanation font-sans">
                                                        <span className="exp-label font-mono">How it works:</span>
                                                        <p>{ex.explanation}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Key Takeaway */}
                                {currentSec.key_takeaway && (
                                    <div className="key-takeaway-banner font-sans">
                                        <Sparkles size={16} className="sparkle-amber" />
                                        <div>
                                            <span className="takeaway-label font-mono">KEY TAKEAWAY</span>
                                            <p className="takeaway-text">{currentSec.key_takeaway}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Embedded Active Learning Check */}
                                {interactive && (
                                    <div className="interactive-check-card">
                                        <div className="check-card-header font-display">
                                            <HelpCircle size={16} className="check-icon" />
                                            <span>Active Knowledge Check</span>
                                        </div>

                                        <p className="check-prompt font-sans">{interactive.prompt}</p>

                                        {interactive.code_snippet && (
                                            <pre className="check-code-snippet font-code">
                                                <code>{interactive.code_snippet}</code>
                                            </pre>
                                        )}

                                        <div className="check-options-grid font-sans">
                                            {interactive.options.map((opt, oIdx) => {
                                                const isSelected = activeCheckAnswers[secIdx] === opt;
                                                const isSubmitted = activeCheckSubmitted[secIdx];
                                                const isCorrectOption = opt.trim().toLowerCase() === interactive.correct_answer.trim().toLowerCase();

                                                let optClass = "";
                                                if (isSubmitted) {
                                                    if (isCorrectOption) optClass = "correct";
                                                    else if (isSelected) optClass = "incorrect";
                                                } else if (isSelected) {
                                                    optClass = "selected";
                                                }

                                                return (
                                                    <button
                                                        key={oIdx}
                                                        type="button"
                                                        className={`check-option-btn ${optClass}`}
                                                        disabled={isSubmitted}
                                                        onClick={() => {
                                                            setActiveCheckAnswers({
                                                                ...activeCheckAnswers,
                                                                [secIdx]: opt
                                                            });
                                                            triggerHaptic("selection");
                                                        }}
                                                    >
                                                        <span className="option-marker font-mono">
                                                            {String.fromCharCode(65 + oIdx)}
                                                        </span>
                                                        <span className="option-text">{opt}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {!activeCheckSubmitted[secIdx] ? (
                                            <button
                                                type="button"
                                                className="simple-btn secondary check-submit-btn font-mono"
                                                disabled={!activeCheckAnswers[secIdx]}
                                                onClick={() => {
                                                    setActiveCheckSubmitted({
                                                        ...activeCheckSubmitted,
                                                        [secIdx]: true
                                                    });
                                                    triggerHaptic("selection");
                                                }}
                                            >
                                                Check Answer
                                            </button>
                                        ) : (
                                            <div className="check-feedback-box font-sans">
                                                <span className="feedback-status font-mono">
                                                    {activeCheckAnswers[secIdx]?.trim().toLowerCase() === interactive.correct_answer?.trim().toLowerCase()
                                                        ? "✓ Correct Answer!"
                                                        : "✗ Not Quite"}
                                                </span>
                                                <p className="feedback-explanation">{interactive.explanation}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Navigation Footer between sections */}
                                <div className="section-nav-footer">
                                    <button
                                        type="button"
                                        className="simple-btn secondary font-sans"
                                        onClick={() => {
                                            if (secIdx === 0) setActiveTab("overview");
                                            else setActiveTab(`section-${secIdx - 1}`);
                                        }}
                                    >
                                        <ChevronLeft size={16} />
                                        <span>Previous</span>
                                    </button>

                                    <button
                                        type="button"
                                        className="simple-btn primary mark-done-next-btn font-sans"
                                        onClick={() => handleSectionCompleted(currentSec.order_index)}
                                    >
                                        <span>
                                            {isLastSection
                                                ? "Complete Section & Go to Practice →"
                                                : `Mark Complete & Next: ${sections[secIdx + 1]?.title.replace(/^\d+\.\s*/, "")} →`}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        );
                    })()}

                    {/* TAB 3: Applied Practice Activity */}
                    {activeTab === "practice" && (
                        <div className="lesson-tab-view practice-tab-view">
                            {learningContent.practice_activities && learningContent.practice_activities.length > 0 ? (
                                (() => {
                                    const practice = learningContent.practice_activities[0];
                                    return (
                                        <div className="practice-card">
                                            <div className="practice-header">
                                                <div className="practice-header-left">
                                                    <span className="practice-kicker font-mono">HANDS-ON PRACTICE CHALLENGE</span>
                                                    <h2 className="practice-title font-display">{practice.title}</h2>
                                                </div>
                                                <div className="practice-meta font-mono">
                                                    <span className="p-pill">{practice.activity_type.toUpperCase()}</span>
                                                    <span className="p-pill difficulty">{practice.difficulty}</span>
                                                    <span className="p-pill time">⏱ {practice.expected_minutes}m</span>
                                                </div>
                                            </div>

                                            {/* Instructions */}
                                            <div className="practice-instructions font-sans">
                                                <h3 className="font-display">Challenge Instructions:</h3>
                                                <div className="instructions-body">
                                                    {practice.instructions.split("\n\n").map((step, sIdx) => (
                                                        <p key={sIdx}>{step}</p>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Starter Template */}
                                            {practice.starter_code && (
                                                <div className="starter-code-box">
                                                    <div className="starter-header font-mono">
                                                        <span>STARTER CODE TEMPLATE</span>
                                                        <button
                                                            type="button"
                                                            className="copy-starter-btn"
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(practice.starter_code);
                                                                setPracticeCopied(true);
                                                                setTimeout(() => setPracticeCopied(false), 2000);
                                                            }}
                                                        >
                                                            {practiceCopied ? "Copied!" : "Copy Starter Code"}
                                                        </button>
                                                    </div>
                                                    <pre className="font-code">
                                                        <code>{practice.starter_code}</code>
                                                    </pre>
                                                </div>
                                            )}

                                            {/* Collapsible Solution Hint */}
                                            {practice.solution_hint && (
                                                <div className="hint-accordion">
                                                    <button
                                                        type="button"
                                                        className="hint-toggle-btn font-sans"
                                                        onClick={() => {
                                                            setShowHint(prev => {
                                                                if (!prev) setHintsUsedCount(c => c + 1);
                                                                return !prev;
                                                            });
                                                        }}
                                                    >
                                                        <div className="hint-title-left">
                                                            <Lightbulb size={15} className="hint-bulb" />
                                                            <span>Need a hint? {hintsUsedCount > 0 && `(Used ${hintsUsedCount})`}</span>
                                                        </div>
                                                        {showHint ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                                    </button>
                                                    {showHint && (
                                                        <div className="hint-content font-sans">
                                                            <p>{practice.solution_hint}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Collapsible Reference Solution */}
                                            <div className="solution-accordion">
                                                <button
                                                    type="button"
                                                    className="solution-toggle-btn font-sans"
                                                    onClick={() => {
                                                        setShowSolution(prev => {
                                                            if (!prev) setSolutionViewed(true);
                                                            return !prev;
                                                        });
                                                    }}
                                                >
                                                    <div className="solution-title-left">
                                                        <Code2 size={15} className="sol-icon" />
                                                        <span>Reveal Reference Solution {solutionViewed && "(Viewed)"}</span>
                                                    </div>
                                                    {showSolution ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                                </button>
                                                {showSolution && (
                                                    <div className="solution-content">
                                                        <pre className="font-code">
                                                            <code>{practice.sample_solution}</code>
                                                        </pre>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Mark Practice Complete Action */}
                                            <div className="practice-action-box">
                                                <button
                                                    type="button"
                                                    className={`simple-btn ${progress?.practice_completed ? "secondary" : "primary"} mark-practice-btn font-display`}
                                                    onClick={handleMarkPracticeComplete}
                                                >
                                                    {progress?.practice_completed ? (
                                                        <>
                                                            <CheckCircle2 size={16} className="check-svg" />
                                                            <span>Practice Completed! Proceed to Checkpoint →</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckCircle2 size={16} />
                                                            <span>Mark Practice Complete & Continue to Assessment →</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })()
                            ) : (
                                <p>No practice activities specified for this lesson.</p>
                            )}
                        </div>
                    )}

                    {/* TAB 4: Checkpoint Assessment */}
                    {activeTab === "checkpoint" && (
                        <div className="lesson-tab-view checkpoint-tab-view">
                            {checkpointResult ? (
                                <AssessmentResultView
                                    result={checkpointResult}
                                    onRetake={() => {
                                        setCheckpointResult(null);
                                        setCheckpointAnswers({});
                                    }}
                                    onStartRemediation={handleStartRemediation}
                                    onGoToOverview={() => setActiveTab("overview")}
                                    onNextMilestone={() => navigate("/dashboard")}
                                />
                            ) : (
                                <div className="checkpoint-container-card">
                                    <div className="checkpoint-header">
                                        <span className="checkpoint-kicker font-mono">MILESTONE CHECKPOINT ASSESSMENT</span>
                                        <h2 className="checkpoint-title font-display">Verify Your Conceptual Understanding</h2>
                                        <p className="checkpoint-desc font-sans">
                                            Answer the following questions to validate your comprehension of this milestone.
                                            Scoring 60%+ alongside completing all lesson sections and practice will mark this milestone complete.
                                        </p>
                                    </div>

                                    {/* Questions Form */}
                                    <form onSubmit={handleSubmitCheckpoint} className="checkpoint-form">
                                        {(publicQuestions.length > 0 ? publicQuestions : (learningContent.checkpoint_questions || [])).map((q, qIdx) => {
                                            const qKey = String(q.id || qIdx + 1);
                                            const selectedAnswer = checkpointAnswers[qKey] || "";

                                            return (
                                                <div key={q.id || qIdx} className="checkpoint-q-card">
                                                    <div className="q-header-row">
                                                        <span className="q-number font-mono">QUESTION 0{qIdx + 1}</span>
                                                        <span className="q-difficulty font-mono">{q.difficulty || "medium"}</span>
                                                        {q.concept_name && (
                                                            <span className="q-concept-tag font-mono">{q.concept_name}</span>
                                                        )}
                                                    </div>

                                                    <p className="q-text font-sans">{q.question}</p>

                                                    <div className="q-options-list font-sans">
                                                        {(q.options || []).map((opt, oIdx) => {
                                                            const isSelected = selectedAnswer === opt;
                                                            return (
                                                                <label
                                                                    key={oIdx}
                                                                    className={`q-option-label ${isSelected ? "selected" : ""}`}
                                                                >
                                                                    <input
                                                                        type="radio"
                                                                        name={`question_${qKey}`}
                                                                        value={opt}
                                                                        checked={isSelected}
                                                                        disabled={submittingCheckpoint}
                                                                        onChange={() => {
                                                                            setCheckpointAnswers({
                                                                                ...checkpointAnswers,
                                                                                [qKey]: opt
                                                                            });
                                                                            triggerHaptic("selection");
                                                                        }}
                                                                    />
                                                                    <span className="opt-radio-bullet" />
                                                                    <span className="opt-text">{opt}</span>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Submit Action */}
                                        <div className="checkpoint-submit-row">
                                            <button
                                                type="submit"
                                                className="simple-btn primary submit-quiz-btn font-display"
                                                disabled={submittingCheckpoint}
                                            >
                                                {submittingCheckpoint ? "Evaluating Assessment..." : "Submit Checkpoint Assessment"}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 5: Supplementary Resources */}
                    {activeTab === "resources" && (
                        <div className="lesson-tab-view resources-tab-view">
                            <div className="resources-header-card">
                                <span className="res-kicker font-mono">ENRICHMENT & REFERENCES</span>
                                <h2 className="res-title font-display">Supplementary Learning References</h2>
                                <p className="res-desc font-sans">
                                    The following curated references provide authoritative documentation, visual walkthroughs, and practice repositories to supplement your mastery after completing this lesson.
                                </p>
                            </div>

                            <div className="resources-grid font-sans">
                                {learningContent.recommended_resources.map((res, rIdx) => (
                                    <a
                                        key={res.id || rIdx}
                                        href={res.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="resource-card-link"
                                    >
                                        <div className="res-card-top">
                                            <div className="res-type-box font-mono">
                                                {getResourceIcon(res.resource_type)}
                                                <span>{res.provider}</span>
                                            </div>
                                            <span className="res-time font-mono">⏱ ~{res.estimated_minutes}m</span>
                                        </div>

                                        <h3 className="res-card-title font-display">{res.title}</h3>
                                        {res.description && <p className="res-card-desc">{res.description}</p>}

                                        {/* "Why this resource?" Badge */}
                                        <div className="why-resource-box font-sans">
                                            <span className="why-label font-mono">Why this resource?</span>
                                            <p className="why-text">{res.relevance_reason}</p>
                                        </div>

                                        <div className="res-card-footer font-mono">
                                            <span>Open Reference</span>
                                            <ExternalLink size={12} />
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* 3. Slide-Out Notes Drawer */}
            <AnimatePresence>
                {notesDrawerOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="notes-drawer-backdrop"
                        onClick={() => setNotesDrawerOpen(false)}
                    >
                        <motion.aside
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="notes-drawer"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="drawer-header">
                                <div className="drawer-title-box">
                                    <FileText size={16} className="notes-icon" />
                                    <h3 className="font-display">My Learning Notes</h3>
                                </div>
                                <button
                                    type="button"
                                    className="drawer-close-btn"
                                    onClick={() => setNotesDrawerOpen(false)}
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* New Note Form */}
                            <form onSubmit={handleAddNote} className="new-note-form">
                                <textarea
                                    className="note-textarea font-sans"
                                    placeholder="Write a note or key insight from this lesson..."
                                    rows={3}
                                    value={newNoteContent}
                                    onChange={(e) => setNewNoteContent(e.target.value)}
                                />
                                <div className="note-form-footer">
                                    <button
                                        type="submit"
                                        className="simple-btn primary add-note-btn font-mono"
                                        disabled={savingNote || !newNoteContent.trim()}
                                    >
                                        <Plus size={13} />
                                        <span>Save Note</span>
                                    </button>
                                </div>
                            </form>

                            {/* Saved Notes List */}
                            <div className="notes-list-container font-sans">
                                {notes.length === 0 ? (
                                    <div className="empty-notes-box">
                                        <Lightbulb size={24} className="empty-icon" />
                                        <p>No notes saved yet for this lesson. Record key takeaways or syntax reminders here!</p>
                                    </div>
                                ) : (
                                    notes.map((note) => (
                                        <div key={note.id} className="note-card">
                                            {editingNoteId === note.id ? (
                                                <div className="edit-note-box">
                                                    <textarea
                                                        className="note-textarea font-sans"
                                                        value={editingNoteContent}
                                                        onChange={(e) => setEditingNoteContent(e.target.value)}
                                                        rows={3}
                                                    />
                                                    <div className="edit-actions">
                                                        <button
                                                            type="button"
                                                            className="simple-btn primary save-btn font-mono"
                                                            onClick={() => handleUpdateNote(note.id)}
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="simple-btn secondary cancel-btn font-mono"
                                                            onClick={() => setEditingNoteId(null)}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <p className="note-text">{note.content}</p>
                                                    <div className="note-meta-row font-mono">
                                                        <span className="note-date">
                                                            {new Date(note.created_at).toLocaleDateString()}
                                                        </span>
                                                        <div className="note-item-actions">
                                                            <button
                                                                type="button"
                                                                className="note-action-btn"
                                                                onClick={() => {
                                                                    setEditingNoteId(note.id);
                                                                    setEditingNoteContent(note.content);
                                                                }}
                                                                title="Edit Note"
                                                            >
                                                                <Edit2 size={12} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="note-action-btn delete"
                                                                onClick={() => handleDeleteNote(note.id)}
                                                                title="Delete Note"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.aside>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 4. Targeted Remediation Modal */}
            {isRemediationOpen && remediationTargetConcept && learningContent?.id && (
                <RemediationModal
                    contentId={learningContent.id}
                    concept={remediationTargetConcept}
                    onClose={() => {
                        setIsRemediationOpen(false);
                        setRemediationTargetConcept(null);
                    }}
                    onMasteryUpdated={handleRemediationMasteryUpdated}
                />
            )}
        </div>
    );
}

