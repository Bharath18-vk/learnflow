import React from 'react';
import { Sparkles } from 'lucide-react';
import './Footer.css';

function Footer() {
    return (
        <footer className="footer-minimal">
            <div className="footer-minimal-container">
                <div className="footer-minimal-brand">
                    <div className="footer-logo-icon">
                        <Sparkles size={15} />
                    </div>
                    <span className="footer-logo-text">Learn<span className="text-gradient">Wise</span> AI</span>
                    <span className="footer-divider">•</span>
                    <span className="footer-copyright">© {new Date().getFullYear()} All rights reserved.</span>
                </div>

                <div className="footer-minimal-links">
                    <a href="#features">Features</a>
                    <a href="#how-it-works">How It Works</a>
                </div>
            </div>
        </footer>
    );
}

export default Footer;