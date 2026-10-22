import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Play } from 'lucide-react';
import { GlassCard, Button } from './ui';
import './CTA.css';

function CTA() {
    const scrollToDemo = () => {
        const element = document.getElementById('how-it-works');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <section className="cta-section">
            <div className="cta-container">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                >
                    <GlassCard className="cta-card" hoverEffect={false}>
                        <div className="cta-glow" />
                        <div className="cta-badge">
                            <Sparkles size={14} />
                            <span>Start Learning Today</span>
                        </div>

                        <h2 className="cta-title heading-display">
                            Get a roadmap engineered for <span className="text-gradient">the way you learn</span>
                        </h2>

                        <p className="cta-subtitle">
                            Tell us your goal, current skill level, and daily commitment. LearnWise synthesizes an actionable plan so you can stop guessing and start building momentum.
                        </p>

                        <div className="cta-buttons">
                            <Link to="/register" style={{ textDecoration: 'none' }}>
                                <Button variant="primary" size="lg" icon={ArrowRight} iconPosition="right">
                                    Create My Roadmap
                                </Button>
                            </Link>
                            <Button variant="outline" size="lg" icon={Play} iconPosition="left" onClick={scrollToDemo}>
                                View Demo Plan
                            </Button>
                        </div>
                    </GlassCard>
                </motion.div>
            </div>
        </section>
    );
}

export default CTA;
