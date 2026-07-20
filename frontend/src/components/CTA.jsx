import React from 'react';
import './CTA.css';

function CTA() {
    return (
        <section className="cta-section">
            <div className="cta-container">
                <div className="cta-card">
                    <div className="cta-glow"></div>
                    <h2 className="cta-title">Ready to Accelerate Your Learning?</h2>
                    <p className="cta-description">
                        Join thousands of learners who are skipping the tutorial loop and building real skills with personalized, AI-powered roadmaps.
                    </p>
                    <div className="cta-actions">
                        <button className="btn btn-primary btn-lg">Get Started for Free</button>
                        <button className="btn btn-outline btn-lg">Talk to an Expert</button>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default CTA;
