import React from 'react';
import { motion } from 'framer-motion';
import { Compass, Sparkles, Activity, Layers, Target, ArrowRight } from 'lucide-react';
import './Features.css';

const featuresData = [
    {
        icon: <Compass size={24} />,
        tag: "SPATIAL COGNITION",
        title: 'Knowledge Constellations',
        description: 'Explore learning pathways as connected spatial graphs. Concepts become nodes, prerequisites become conduits, and mastery radiates visual stability.'
    },
    {
        icon: <Sparkles size={24} />,
        tag: "3-MODE COPILOT",
        title: 'LearnWise Intelligence',
        description: 'Switch effortlessly between EXPLAIN (simple clarity), GUIDE (Socratic hints), and CHALLENGE (harder drills) without repeating your context.'
    },
    {
        icon: <Activity size={24} />,
        tag: "DIAGNOSTIC PRACTICE",
        title: 'Mistake Intelligence',
        description: 'Diagnoses recurring conceptual pitfalls from micro-quizzes and synthesizes targeted practice drills to turn weak points into strengths.'
    },
    {
        icon: <Target size={24} />,
        tag: "INTENTION FIRST",
        title: 'The Mastery Studio',
        description: 'Replaces noisy analytics dashboards with a single focused intention: "What should I do right now?" to keep your cognitive momentum unbroken.'
    }
];

function Features() {
    return (
        <section className="features-section" id="features">
            <div className="features-container">
                <div className="section-header">
                    <div className="section-eyebrow font-mono">
                        <Sparkles size={13} />
                        <span>THE COGNITIVE ARCHITECTURE</span>
                    </div>
                    <h2 className="section-title font-hero">
                        Engineered for <span className="text-gradient">True Mastery</span>
                    </h2>
                    <p className="section-subtitle font-sans">
                        LearnWise replaces passive video-watching and disconnected tutorials with an intelligent learning instrument.
                    </p>
                </div>

                <div className="features-grid">
                    {featuresData.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-40px" }}
                            transition={{ duration: 0.4, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
                            className="feature-card-clean"
                        >
                            <div className="feature-card-top">
                                <div className="feature-icon-box">
                                    {feature.icon}
                                </div>
                                <span className="feature-tag font-mono">{feature.tag}</span>
                            </div>
                            <h3 className="feature-card-title font-display">{feature.title}</h3>
                            <p className="feature-card-description font-sans">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default Features;