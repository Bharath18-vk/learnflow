import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle2, Zap, ArrowRight, BookOpen, Compass, Target, MessageSquare, Play, Terminal } from 'lucide-react';
import './HeroRoadmapPreview.css';

const SHOWCASE_TABS = [
    { id: 'today', label: '01 TODAY', icon: Target },
    { id: 'constellation', label: '02 CONSTELLATION', icon: Compass },
    { id: 'copilot', label: '03 AI COPILOT', icon: Sparkles }
];

const NODES_DATA = [
    { id: 'n1', title: 'Linear Algebra', status: 'completed', x: 70, y: 110 },
    { id: 'n2', title: 'Matrix Calculus', status: 'completed', x: 190, y: 65 },
    { id: 'n3', title: 'NumPy Tensors', status: 'completed', x: 200, y: 155 },
    { id: 'n4', title: 'Backpropagation', status: 'active', x: 330, y: 105 },
    { id: 'n5', title: 'Attention & Transformers', status: 'upcoming', x: 450, y: 70 },
    { id: 'n6', title: 'LLM Fine-Tuning', status: 'upcoming', x: 460, y: 150 }
];

function HeroRoadmapPreview() {
    const [activeTab, setActiveTab] = useState('today');
    const [selectedNode, setSelectedNode] = useState(NODES_DATA[3]); // Backpropagation
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        setMousePos({ x: x * 6, y: -y * 6 });
    };

    const handleMouseLeave = () => {
        setMousePos({ x: 0, y: 0 });
    };

    return (
        <motion.div
            className="hero-showcase-wrapper"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            animate={{ rotateY: mousePos.x, rotateX: mousePos.y }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            style={{ transformStyle: "preserve-3d" }}
        >
            <div className="showcase-ambient-glow" />

            <div className="showcase-studio-frame">
                {/* Window Header */}
                <div className="showcase-window-header">
                    <div className="showcase-dots">
                        <span className="dot red" />
                        <span className="dot yellow" />
                        <span className="dot green" />
                    </div>
                    <div className="showcase-breadcrumbs font-mono">
                        <span className="crumb-app">LEARNWISE STUDIO</span>
                        <span className="crumb-sep">/</span>
                        <span className="crumb-goal">MACHINE LEARNING</span>
                    </div>
                    <div className="showcase-live-pill font-mono">
                        <span className="live-pulsar" />
                        <span>COGNITIVE FORGE</span>
                    </div>
                </div>

                {/* Studio Space Switcher Bar */}
                <div className="showcase-nav-bar">
                    <div className="showcase-space-tabs">
                        {SHOWCASE_TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    className={`showcase-space-tab font-mono ${isActive ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    <Icon size={13} />
                                    <span>{tab.label}</span>
                                    {isActive && <motion.div layoutId="showcaseTabGlow" className="tab-active-indicator" />}
                                </button>
                            );
                        })}
                    </div>
                    <div className="showcase-streak-badge font-mono">
                        <span>🔥 14d Streak</span>
                        <span className="streak-xp">+50 XP Ready</span>
                    </div>
                </div>

                {/* Interactive Studio Canvas Body */}
                <div className="showcase-canvas-body">
                    <AnimatePresence mode="wait">
                        {/* VIEW 1: TODAY'S ACTIVE COCKPIT */}
                        {activeTab === 'today' && (
                            <motion.div
                                key="today"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.25 }}
                                className="showcase-view-today"
                            >
                                <div className="today-header-row">
                                    <div>
                                        <span className="today-kicker font-mono">CURRENT INTENTION • MILESTONE 04</span>
                                        <h3 className="today-step-title font-display">Backpropagation & Gradient Flow</h3>
                                    </div>
                                    <span className="today-duration-tag font-mono">⏱ 30 Mins</span>
                                </div>

                                <p className="today-step-desc font-sans">
                                    Derive the computational graph chain rule, compute partial weight derivatives, and eliminate vanishing gradients.
                                </p>

                                {/* Mastery Progress Track */}
                                <div className="today-progress-section">
                                    <div className="progress-info-row font-mono">
                                        <span>Mastery Calibration</span>
                                        <span className="progress-val">68% Complete</span>
                                    </div>
                                    <div className="today-progress-bar">
                                        <div className="today-progress-fill" style={{ width: '68%' }} />
                                    </div>
                                </div>

                                {/* Curated Resource Bench */}
                                <div className="today-resource-bench">
                                    <div className="bench-item">
                                        <div className="bench-icon video"><Play size={13} /></div>
                                        <div className="bench-text">
                                            <span className="bench-title font-sans">Calculus of Neural Networks</span>
                                            <span className="bench-sub font-mono">3Blue1Brown • 18 mins</span>
                                        </div>
                                    </div>
                                    <div className="bench-item">
                                        <div className="bench-icon docs"><BookOpen size={13} /></div>
                                        <div className="bench-text">
                                            <span className="bench-title font-sans">PyTorch Autograd Engine</span>
                                            <span className="bench-sub font-mono">Official PyTorch Docs</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="today-actions-row">
                                    <button className="showcase-primary-btn font-interactive">
                                        <Zap size={14} />
                                        <span>Start Focus Session</span>
                                    </button>
                                    <button className="showcase-secondary-btn font-interactive" onClick={() => setActiveTab('copilot')}>
                                        <Sparkles size={14} />
                                        <span>Ask AI Copilot</span>
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* VIEW 2: SPATIAL KNOWLEDGE CONSTELLATION */}
                        {activeTab === 'constellation' && (
                            <motion.div
                                key="constellation"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.25 }}
                                className="showcase-view-constellation"
                            >
                                <div className="constellation-svg-wrapper">
                                    <svg viewBox="0 0 530 220" className="showcase-constellation-svg">
                                        {/* Background Grid */}
                                        <defs>
                                            <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                                                <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
                                            </linearGradient>
                                        </defs>

                                        {/* Connection Lines */}
                                        <line x1="70" y1="110" x2="190" y2="65" stroke="#10b981" strokeWidth="2" strokeDasharray="4 2" opacity="0.6" />
                                        <line x1="70" y1="110" x2="200" y2="155" stroke="#10b981" strokeWidth="2" strokeDasharray="4 2" opacity="0.6" />
                                        <line x1="190" y1="65" x2="330" y2="105" stroke="#3b82f6" strokeWidth="2.5" />
                                        <line x1="200" y1="155" x2="330" y2="105" stroke="#3b82f6" strokeWidth="2.5" />
                                        <line x1="330" y1="105" x2="450" y2="70" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeDasharray="4 4" />
                                        <line x1="330" y1="105" x2="460" y2="150" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeDasharray="4 4" />

                                        {/* Concept Nodes */}
                                        {NODES_DATA.map((node) => {
                                            const isSelected = selectedNode.id === node.id;
                                            const isCompleted = node.status === 'completed';
                                            const isActive = node.status === 'active';

                                            return (
                                                <g
                                                    key={node.id}
                                                    className={`constellation-node ${node.status} ${isSelected ? 'selected' : ''}`}
                                                    onClick={() => setSelectedNode(node)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    {isActive && (
                                                        <circle cx={node.x} cy={node.y} r="22" className="node-halo-pulse" />
                                                    )}
                                                    <circle
                                                        cx={node.x}
                                                        cy={node.y}
                                                        r={isSelected ? 16 : 13}
                                                        className={`node-core ${node.status}`}
                                                    />
                                                    <text
                                                        x={node.x}
                                                        y={node.y + (node.y > 110 ? 24 : -18)}
                                                        textAnchor="middle"
                                                        className="node-text font-mono"
                                                    >
                                                        {node.title}
                                                    </text>
                                                </g>
                                            );
                                        })}
                                    </svg>
                                </div>

                                <div className="constellation-mini-inspector">
                                    <div className="inspector-left">
                                        <span className="inspector-status font-mono">
                                            {selectedNode.status === 'completed' ? '✓ Mastered' : selectedNode.status === 'active' ? '⚡ Active Focus' : '🔒 Prerequisite Locked'}
                                        </span>
                                        <span className="inspector-title font-display">{selectedNode.title}</span>
                                    </div>
                                    <button className="inspector-inspect-btn font-interactive" onClick={() => setActiveTab('today')}>
                                        <span>Open Workbench</span>
                                        <ArrowRight size={13} />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* VIEW 3: 3-MODE AI COPILOT */}
                        {activeTab === 'copilot' && (
                            <motion.div
                                key="copilot"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.25 }}
                                className="showcase-view-copilot"
                            >
                                <div className="copilot-mode-pills font-mono">
                                    <span className="copilot-pill">EXPLAIN</span>
                                    <span className="copilot-pill active">GUIDE (SOCRATIC)</span>
                                    <span className="copilot-pill">CHALLENGE</span>
                                </div>

                                <div className="copilot-dialogue">
                                    <div className="dialogue-msg user">
                                        <span className="msg-tag font-mono">Learner</span>
                                        <p className="font-sans">Why do we compute the gradient backwards instead of forwards?</p>
                                    </div>
                                    <div className="dialogue-msg ai">
                                        <div className="ai-tag-row font-mono">
                                            <Sparkles size={12} className="ai-sparkle-icon" />
                                            <span>LearnWise Intelligence</span>
                                        </div>
                                        <p className="font-sans">
                                            Consider a network with 1 loss output and 1,000,000 weights. If you compute forward, you need 1,000,000 passes to get all sensitivities. 
                                            By going <strong>backwards</strong> from the 1 scalar loss, how many passes calculate every weight gradient simultaneously?
                                        </p>
                                        <div className="copilot-code-preview font-mono">
                                            <span># Single reverse traversal computes all dL/dw</span><br/>
                                            <code>loss.backward()  # Exactly 1 pass</code>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
}

export default HeroRoadmapPreview;
