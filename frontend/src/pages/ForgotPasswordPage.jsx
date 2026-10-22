import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, AlertCircle, Mail, ArrowRight, KeyRound } from "lucide-react";
import { GlassCard, TextInput, Button } from "../components/ui";
import { forgotPassword } from "../services/api";
import "./RegisterPage.css";

function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [devResetLink, setDevResetLink] = useState(null);
    const [deliveryMode, setDeliveryMode] = useState("dev_mock");
    const [smtpError, setSmtpError] = useState(null);
    const [resendCooldown, setResendCooldown] = useState(0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await forgotPassword(email);
            setSubmitted(true);
            if (res) {
                if (res.dev_reset_link) setDevResetLink(res.dev_reset_link);
                if (res.delivery_mode) setDeliveryMode(res.delivery_mode);
                if (res.smtp_error) setSmtpError(res.smtp_error);
            }
            startCooldown(15);
        } catch (err) {
            console.error("Forgot password error:", err);
            if (err.status === 429) {
                setError(err.message || "A reset link was sent recently. Please check your inbox or wait a moment.");
            } else {
                setSubmitted(true);
            }
        } finally {
            setLoading(false);
        }
    };

    const startCooldown = (seconds) => {
        setResendCooldown(seconds);
        const interval = setInterval(() => {
            setResendCooldown((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    return (
        <div className="register-page">
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                style={{ width: "100%", maxWidth: "480px" }}
            >
                <GlassCard className="register-card" hoverEffect={false}>
                    <Link to="/" className="logo-link">
                        <div className="logo-badge">
                            <KeyRound size={16} />
                        </div>
                        <h2 className="logo">
                            Learn<span className="text-gradient">Wise</span>
                        </h2>
                    </Link>

                    <h1>Reset Password</h1>
                    <p className="subtitle">
                        Enter your email address and we'll send you instructions to reset your password.
                    </p>

                    {error && (
                        <motion.div
                            className="error-banner"
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </motion.div>
                    )}

                    {submitted ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{
                                background: "rgba(15, 23, 42, 0.7)",
                                border: "1px solid rgba(168, 85, 247, 0.3)",
                                borderRadius: "18px",
                                padding: "2rem 1.4rem",
                                textAlign: "center"
                            }}
                        >
                            <div style={{ fontSize: "3rem", marginBottom: "0.8rem" }}>📧</div>
                            <h3 style={{ fontSize: "1.25rem", color: "var(--color-text-primary)", fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: "0.6rem" }}>
                                Reset Request Dispatched!
                            </h3>
                            <p style={{ color: "#cbd5e1", fontSize: "0.9rem", lineHeight: "1.6", marginBottom: "1.2rem" }}>
                                If an account exists for <strong>{email}</strong>, password reset instructions have been created.
                            </p>

                            {/* DELIVERY STATUS BADGES */}
                            {deliveryMode === "smtp" && (
                                <div style={{ background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "12px", padding: "1rem", marginBottom: "1.5rem", textAlign: "left" }}>
                                    <p style={{ color: "var(--color-emerald-400)", fontSize: "0.88rem", margin: 0, fontWeight: 600 }}>
                                        ✅ Real Email Delivered via SMTP!
                                    </p>
                                    <p style={{ color: "#cbd5e1", fontSize: "0.82rem", marginTop: "0.3rem", margin: 0 }}>
                                        Please check your email inbox (and spam folder) for the password reset message.
                                    </p>
                                </div>
                            )}

                            {deliveryMode === "dev_mock" && (
                                <div style={{ background: "rgba(99, 102, 241, 0.12)", border: "1px solid rgba(99, 102, 241, 0.3)", borderRadius: "12px", padding: "1rem", marginBottom: "1.5rem", textAlign: "left" }}>
                                    <p style={{ color: "#a5b4fc", fontSize: "0.88rem", margin: 0, fontWeight: 600 }}>
                                        ℹ️ Local Dev Notice
                                    </p>
                                    <p style={{ color: "#cbd5e1", fontSize: "0.82rem", marginTop: "0.3rem", margin: 0, lineHeight: 1.5 }}>
                                        SMTP is unconfigured or in mock mode. The secure password reset link has been printed to your <strong>backend console</strong> logs.
                                    </p>
                                </div>
                            )}

                            <div style={{ fontSize: "0.82rem", color: "#94a3b8", marginBottom: "1.5rem", background: "rgba(99, 102, 241, 0.1)", padding: "0.8rem", borderRadius: "10px" }}>
                                🔒 Reset links expire after 30 minutes for security.
                            </div>

                            <Button
                                variant="outline"
                                isLoading={loading}
                                disabled={resendCooldown > 0}
                                onClick={handleSubmit}
                                icon={Mail}
                                style={{ width: "100%" }}
                            >
                                {resendCooldown > 0 ? `Resend Email in ${resendCooldown}s` : "Resend Reset Email"}
                            </Button>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <TextInput
                                label="Email Address"
                                id="forgot-email"
                                type="email"
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                                required
                            />

                            <Button
                                type="submit"
                                variant="primary"
                                isLoading={loading}
                                icon={Sparkles}
                                iconPosition="right"
                                style={{ marginTop: "1rem", width: "100%" }}
                            >
                                Send Reset Instructions
                            </Button>
                        </form>
                    )}

                    <p className="login-text" style={{ marginTop: "1.8rem" }}>
                        Remembered your password? <Link to="/login">Back to Sign In</Link>
                    </p>
                </GlassCard>
            </motion.div>
        </div>
    );
}

export default ForgotPasswordPage;
