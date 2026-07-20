import React from 'react';
import './Hero.css';
import heroImg from '../assets/hero.png';

function Hero() {
    return (
        <section className="hero-section">
            <div className="hero-container">
                <div className="hero-content">
                    <div className="hero-badge">
                        <span>✨ AI-Powered Learning Platform</span>
                    </div>
                    <h1 className="hero-title">
                        Learn <span>Smarter</span>,<br />Not Harder.
                    </h1>
                    <p className="hero-subtitle">
                        Stop wasting hours searching for tutorials.
                        Get one AI-powered learning roadmap tailored just for you.
                    </p>
                    <div className="hero-buttons">
                        <button className="btn btn-primary btn-lg">Start Learning</button>
                        <button className="btn btn-outline btn-lg">Watch Demo</button>
                    </div>
                </div>
                <div className="hero-image-container">
                    <div className="hero-image-glow"></div>
                    <img src={heroImg} alt="LearnWise AI Learning Dashboard" className="hero-image" />
                </div>
            </div>
        </section>
    );
}

export default Hero;
