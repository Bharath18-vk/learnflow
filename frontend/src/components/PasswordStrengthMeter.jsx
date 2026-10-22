import React from 'react';
import './PasswordStrengthMeter.css';

function PasswordStrengthMeter({ password = '' }) {
    const checks = [
        { label: 'Minimum 8 Characters', valid: password.length >= 8 },
        { label: 'Uppercase Letter (A-Z)', valid: /[A-Z]/.test(password) },
        { label: 'Lowercase Letter (a-z)', valid: /[a-z]/.test(password) },
        { label: 'Number (0-9)', valid: /[0-9]/.test(password) },
        { label: 'Special Character (!@#$%^&*)', valid: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password) }
    ];

    const passedCount = checks.filter(c => c.valid).length;
    const strengthPercent = (passedCount / checks.length) * 100;

    let strengthLabel = 'Weak';
    let strengthClass = 'weak';
    if (passedCount >= 5) {
        strengthLabel = 'Excellent';
        strengthClass = 'excellent';
    } else if (passedCount >= 4) {
        strengthLabel = 'Strong';
        strengthClass = 'strong';
    } else if (passedCount >= 2) {
        strengthLabel = 'Fair';
        strengthClass = 'fair';
    }

    return (
        <div className="password-strength-container">
            <div className="strength-bar-header">
                <span className="strength-title">Password Security Policy</span>
                {password && (
                    <span className={`strength-badge ${strengthClass}`}>
                        {strengthLabel}
                    </span>
                )}
            </div>

            <div className="strength-track">
                <div
                    className={`strength-fill ${strengthClass}`}
                    style={{ width: `${strengthPercent}%` }}
                ></div>
            </div>

            <div className="checklist-grid">
                {checks.map((check, idx) => (
                    <div key={idx} className={`check-item ${check.valid ? 'valid' : 'invalid'}`}>
                        <span className="check-icon">{check.valid ? '✓' : '✕'}</span>
                        <span className="check-text">{check.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default PasswordStrengthMeter;
