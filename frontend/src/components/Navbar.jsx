import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, LogIn } from 'lucide-react';
import { Button, ThemeToggle } from './ui';
import './Navbar.css';

function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <motion.header
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className={`navbar-wrapper ${scrolled ? 'scrolled' : ''}`}
        >
            <nav className="navbar-container">
                {/* Brand Logo */}
                <Link to="/" className="nav-brand">
                    <div className="logo-icon-wrapper">
                        <Sparkles className="logo-sparkle" size={18} />
                    </div>
                    <span className="brand-text">
                        Learn<span className="brand-highlight">Wise</span>
                    </span>
                    <span className="brand-badge">AI</span>
                </Link>

                {/* Nav Links */}
                <div className="nav-links">
                    <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
                        Home
                    </Link>
                    <a href="#features" className="nav-link">Features</a>
                    <a href="#how-it-works" className="nav-link">How It Works</a>
                    <a href="#stats" className="nav-link">Impact</a>
                </div>

                {/* Nav Actions */}
                <div className="nav-actions">
                    <ThemeToggle />
                    <Link to="/login" className="nav-login-btn">
                        <LogIn size={16} />
                        <span>Log In</span>
                    </Link>
                    <Link to="/register" style={{ textDecoration: 'none' }}>
                        <Button variant="primary" size="sm" icon={ArrowRight} iconPosition="right">
                            Get Started
                        </Button>
                    </Link>
                </div>
            </nav>
        </motion.header>
    );
}

export default Navbar;