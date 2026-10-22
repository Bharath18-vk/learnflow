import React from 'react';
import { motion } from 'framer-motion';
import { Sliders, Sparkles, CheckCircle2 } from 'lucide-react';
import { GlassCard } from './ui';
import './HowItWorks.css';

const stepsData = [
    {
        number: '01',
        icon: <Sliders size={24} />,
        title: 'Define Your Goal',
        description: 'Tell us what you want to learn, your starting skill level, and how much time you can dedicate each week.'
    },
    {
        number: '02',
        icon: <Sparkles size={24} />,
        title: 'Get Your Custom Roadmap',
        description: 'LearnWise maps prerequisites, breaks complex topics into bite-sized milestones, and pairs every step with curated resources.'
    },
    {
        number: '03',
        icon: <CheckCircle2 size={24} />,
        title: 'Learn, Test & Master',
        description: 'Follow interactive lessons, verify your skills with active-recall quizzes, track your streak, and build genuine mastery.'
    }
];

function HowItWorks() {
    return (
        <section className="how-it-works-section" id="how-it-works">
            <div className="how-it-works-container">
                <div className="section-header">
                    <div className="section-eyebrow">
                        <Sparkles size={13} />
                        <span>Streamlined 3-Step Process</span>
                    </div>
                    <h2 className="section-title">
                        How <span className="text-gradient">LearnWise</span> Works
                    </h2>
                    <p className="section-subtitle">
                        Turn any learning goal into a clear, personalized step-by-step roadmap in under 30 seconds.
                    </p>
                </div>

                <div className="steps-grid">
                    {stepsData.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.5, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <GlassCard className="step-card">
                                <span className="step-number">{step.number}</span>
                                <div className="step-icon-wrapper">
                                    {step.icon}
                                </div>
                                <h3 className="step-title">{step.title}</h3>
                                <p className="step-description">{step.description}</p>
                            </GlassCard>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default HowItWorks;