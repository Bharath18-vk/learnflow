import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles,
    Zap,
    CheckCircle2,
    Lock,
    ArrowRight,
    ExternalLink,
    HelpCircle,
    Maximize2,
    RotateCcw,
    Layers,
    Activity,
    BookOpen
} from "lucide-react";
import "./KnowledgeConstellation.css";

export function KnowledgeConstellation({
    steps = [],
    onToggleStep,
    onStartQuiz,
    onOpenAiTutor
}) {
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [zoom, setZoom] = useState(1);

    // Compute spatial layout for steps in a flowing constellation formation
    const layoutNodes = useMemo(() => {
        if (!steps || steps.length === 0) return [];

        const count = steps.length;
        const width = 800;
        const height = 460;
        const padding = 70;

        return steps.map((step, idx) => {
            // S-curve constellation distribution
            const t = idx / Math.max(count - 1, 1);
            const x = padding + t * (width - 2 * padding) + (Math.sin(idx * 1.8) * 35);
            const y = height / 2 + (Math.sin(t * Math.PI * 2) * 110) + ((idx % 2 === 0 ? -1 : 1) * 20);

            // Determine status
            let status = "upcoming";
            if (step.is_completed) {
                status = "completed";
            } else {
                // First non-completed is active
                const firstIncompleteIdx = steps.findIndex(s => !s.is_completed);
                if (idx === (firstIncompleteIdx === -1 ? 0 : firstIncompleteIdx)) {
                    status = "active";
                }
            }

            return {
                ...step,
                idx,
                x,
                y,
                status
            };
        });
    }, [steps]);

    // Active selected step object
    const selectedStep = useMemo(() => {
        if (!selectedNodeId) {
            // Default to the first active/incomplete step
            return layoutNodes.find(n => n.status === "active") || layoutNodes[0] || null;
        }
        return layoutNodes.find(n => n.id === selectedNodeId) || null;
    }, [selectedNodeId, layoutNodes]);

    if (steps.length === 0) {
        return (
            <div className="constellation-empty font-sans">
                <Layers size={36} className="constellation-empty-icon" />
                <h4 className="font-display">Knowledge Constellation Offline</h4>
                <p>Complete onboarding or activate a roadmap to generate your spatial knowledge graph.</p>
            </div>
        );
    }

    return (
        <div className="constellation-container">
            {/* Header Telemetry Bar */}
            <div className="constellation-header">
                <div className="constellation-title-group">
                    <span className="telemetry-label">Spatial Intelligence</span>
                    <h3 className="constellation-title font-display">Knowledge Constellation</h3>
                </div>
                <div className="constellation-controls font-mono">
                    <button
                        className="constellation-btn"
                        onClick={() => setZoom(prev => Math.min(prev + 0.15, 1.4))}
                        title="Zoom In"
                    >
                        +
                    </button>
                    <button
                        className="constellation-btn"
                        onClick={() => setZoom(prev => Math.max(prev - 0.15, 0.7))}
                        title="Zoom Out"
                    >
                        -
                    </button>
                    <button
                        className="constellation-btn"
                        onClick={() => setZoom(1)}
                        title="Reset View"
                    >
                        <RotateCcw size={14} />
                    </button>
                </div>
            </div>

            {/* Main Spatial Map Area */}
            <div className="constellation-workspace">
                <div
                    className="constellation-canvas-wrapper"
                    style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
                >
                    <svg className="constellation-svg" viewBox="0 0 800 460">
                        <defs>
                            {/* Linear gradients for connection lines */}
                            <linearGradient id="lineCompleted" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8" />
                            </linearGradient>
                            <linearGradient id="lineActive" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.9" />
                                <stop offset="100%" stopColor="#818cf8" stopOpacity="0.9" />
                            </linearGradient>
                            {/* Glow filters */}
                            <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="8" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>

                        {/* Conduit lines between sequential nodes */}
                        {layoutNodes.map((node, i) => {
                            if (i === layoutNodes.length - 1) return null;
                            const nextNode = layoutNodes[i + 1];
                            const isCompletedLine = node.status === "completed" && nextNode.status === "completed";
                            const isActiveLine = node.status === "completed" || node.status === "active";

                            return (
                                <g key={`line-${node.id}-${nextNode.id}`}>
                                    {/* Ambient glow line */}
                                    <line
                                        x1={node.x}
                                        y1={node.y}
                                        x2={nextNode.x}
                                        y2={nextNode.y}
                                        stroke={isCompletedLine ? "#10b981" : isActiveLine ? "#6366f1" : "rgba(255,255,255,0.08)"}
                                        strokeWidth={isCompletedLine || isActiveLine ? "3" : "1.5"}
                                        strokeDasharray={isCompletedLine ? "none" : isActiveLine ? "6, 4" : "4, 6"}
                                        opacity={isCompletedLine ? 0.85 : isActiveLine ? 0.65 : 0.3}
                                    />
                                </g>
                            );
                        })}

                        {/* Spatial Concept Nodes */}
                        {layoutNodes.map(node => {
                            const isSelected = selectedStep?.id === node.id;
                            const isCompleted = node.status === "completed";
                            const isActive = node.status === "active";

                            return (
                                <g
                                    key={`node-${node.id}`}
                                    className={`constellation-node-group ${isSelected ? "selected" : ""} ${node.status}`}
                                    onClick={() => setSelectedNodeId(node.id)}
                                    tabIndex={0}
                                    onKeyDown={e => {
                                        if (e.key === "Enter") setSelectedNodeId(node.id);
                                    }}
                                >
                                    {/* Focus outer orbit ring for active/selected */}
                                    {(isActive || isSelected) && (
                                        <circle
                                            cx={node.x}
                                            y={node.y}
                                            r="24"
                                            className="orbit-ring"
                                        />
                                    )}

                                    {/* Main node circle */}
                                    <circle
                                        cx={node.x}
                                        y={node.y}
                                        r="14"
                                        className="node-core"
                                        filter={isCompleted || isActive ? "url(#nodeGlow)" : "none"}
                                    />

                                    {/* Inner icon / step index */}
                                    <text
                                        x={node.x}
                                        y={node.y + 4}
                                        textAnchor="middle"
                                        className="node-text font-mono"
                                    >
                                        {isCompleted ? "✓" : node.idx + 1}
                                    </text>

                                    {/* Step Label below node */}
                                    <text
                                        x={node.x}
                                        y={node.y + 32}
                                        textAnchor="middle"
                                        className={`node-label font-display ${isSelected ? "selected-text" : ""}`}
                                    >
                                        {node.title.length > 22 ? node.title.slice(0, 20) + "…" : node.title}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                </div>

                {/* Spatial Node Inspector Panel */}
                {selectedStep && (
                    <motion.div
                        className="node-inspector"
                        key={selectedStep.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <div className="inspector-header">
                            <div className="inspector-badge-row">
                                <span className={`state-badge state-${selectedStep.status}`}>
                                    {selectedStep.status}
                                </span>
                                <span className="telemetry-label">{selectedStep.category || "Core Concept"}</span>
                            </div>
                            <h4 className="inspector-title font-display">{selectedStep.title}</h4>
                            {selectedStep.description && (
                                <p className="inspector-desc font-sans">{selectedStep.description}</p>
                            )}
                        </div>

                        {/* Prerequisites & Telemetry */}
                        <div className="inspector-telemetry-grid">
                            <div className="telemetry-box">
                                <span className="telemetry-label">Status</span>
                                <span className="telemetry-metric font-mono">
                                    {selectedStep.is_completed ? "Mastered" : selectedStep.status === "active" ? "In Progress" : "Queued"}
                                </span>
                            </div>
                            <div className="telemetry-box">
                                <span className="telemetry-label">Estimated Pace</span>
                                <span className="telemetry-metric font-mono">~15–30 Mins</span>
                            </div>
                        </div>

                        {/* Curated Resources */}
                        {selectedStep.resources && selectedStep.resources.length > 0 && (
                            <div className="inspector-resources">
                                <span className="telemetry-label">Curated Resources</span>
                                <div className="inspector-resource-list">
                                    {selectedStep.resources.map(res => (
                                        <a
                                            key={res.id}
                                            href={res.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inspector-resource-link font-interactive"
                                        >
                                            <BookOpen size={14} className="res-icon" />
                                            <span className="res-title">{res.title}</span>
                                            <ExternalLink size={12} className="ext-icon" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Direct Actions */}
                        <div className="inspector-actions">
                            <button
                                className="inspector-action-btn primary font-interactive"
                                onClick={() => onStartQuiz?.(selectedStep)}
                            >
                                <Zap size={15} />
                                <span>Take Focus Quiz (+50 XP)</span>
                            </button>

                            <button
                                className="inspector-action-btn secondary font-interactive"
                                onClick={() => onOpenAiTutor?.(selectedStep, "explain_simple")}
                            >
                                <Sparkles size={15} />
                                <span>Ask AI Intelligence</span>
                            </button>

                            <button
                                className={`inspector-action-btn toggle-btn font-interactive ${selectedStep.is_completed ? "completed" : ""}`}
                                onClick={() => onToggleStep?.(selectedStep.id)}
                            >
                                <CheckCircle2 size={15} />
                                <span>{selectedStep.is_completed ? "Mark Incomplete" : "Mark as Mastered"}</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
