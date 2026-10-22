import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Play, CheckCircle2 } from 'lucide-react';
import './Hero.css';

function Hero() {
    const scrollToSample = () => {
        const element = document.getElementById('how-it-works');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <section className="hero-section">
            <div className="hero-container">
                <motion.div
                    className="hero-content"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                >
                    <div className="hero-badge font-mono">
                        <Sparkles size={14} className="hero-badge-sparkle" />
                        <span>THE COGNITIVE FORGE</span>
                    </div>

                    <h1 className="hero-title font-hero">
                        LEARN ANYTHING.<br />
                        <span className="text-gradient">WITHOUT LOSING THE PATH.</span>
                    </h1>

                    <p className="hero-subtitle font-sans">
                        LearnWise is an intelligent learning environment that constructs your path to mastery — replacing fragmented tutorial hopping with spatial knowledge structures, 3-mode contextual AI, and mistake intelligence.
                    </p>

                    <div className="hero-buttons">
                        <Link to="/register" style={{ textDecoration: 'none' }}>
                            <button className="hero-primary-btn font-interactive">
                                <span>Build My Learning Path</span>
                                <ArrowRight size={17} />
                            </button>
                        </Link>
                        <button className="hero-secondary-btn font-interactive" onClick={scrollToSample}>
                            <Play size={15} />
                            <span>See How It Works</span>
                        </button>
                    </div>

                    <div className="hero-trust-bullets font-mono">
                        <span className="trust-bullet">
                            <CheckCircle2 size={14} className="bullet-icon" /> Spatial Constellation
                        </span>
                        <span className="trust-bullet">
                            <CheckCircle2 size={14} className="bullet-icon" /> 3-Mode Contextual AI
                        </span>
                        <span className="trust-bullet">
                            <CheckCircle2 size={14} className="bullet-icon" /> Mistake Intelligence
                        </span>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

export default Hero;
