import React from 'react';
import { motion } from 'framer-motion';
import { Layers, CheckCircle2, Users } from 'lucide-react';
import { GlassCard } from './ui';
import './TrustStats.css';

function TrustStats() {
    return (
        <section className="trust-section" id="stats">
            <div className="trust-container">
                <div className="trust-grid">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <GlassCard className="trust-stat-card">
                            <div className="stat-icon-badge">
                                <Layers size={20} />
                            </div>
                            <span className="stat-number text-gradient">10,000+</span>
                            <span className="stat-label">AI Roadmap steps generated</span>
                        </GlassCard>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <GlassCard className="trust-stat-card">
                            <div className="stat-icon-badge">
                                <CheckCircle2 size={20} />
                            </div>
                            <span className="stat-number text-gradient">500+</span>
                            <span className="stat-label">Curated learning resources matched</span>
                        </GlassCard>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <GlassCard className="trust-stat-card">
                            <div className="stat-icon-badge">
                                <Users size={20} />
                            </div>
                            <span className="stat-highlight">Empowering</span>
                            <span className="stat-label">Developers, Students & Self-Learners</span>
                        </GlassCard>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

export default TrustStats;
