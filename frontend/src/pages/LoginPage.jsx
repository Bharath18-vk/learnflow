import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, AlertCircle, Mail, ArrowRight, MailCheck } from "lucide-react";
import { GlassCard, TextInput, PasswordInput, Button } from "../components/ui";
import { loginUser, resendVerification } from "../services/api";
import "./RegisterPage.css";

function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    
    // Unverified Email Warning Card State
    const [showUnverifiedWarning, setShowUnverifiedWarning] = useState(false);
    const [resendStatus, setResendStatus] = useState("");
    const [resending, setResending] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMessage("");
        setShowUnverifiedWarning(false);
        setResendStatus("");

        try {
            const data = await loginUser({
                email: email,
                password: password
            });

            localStorage.setItem("token", data.access_token);
            localStorage.setItem("user", JSON.stringify(data.user));

            navigate("/dashboard");
        } catch (err) {
            console.error("Login error status:", err.status, err.message);
            if (err.status === 403 || err.message?.toLowerCase().includes("verify your email")) {
                setShowUnverifiedWarning(true);
            } else {
                setErrorMessage(err.message || "Invalid credentials.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendClick = async () => {
        if (!email) return;
        setResending(true);
        setResendStatus("");
        try {
            const res = await resendVerification(email);
            setResendStatus(res.message || "Verification email sent!");
        } catch (err) {
            setResendStatus(err.message || "Failed to resend verification link.");
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="register-page">
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                style={{ width: "100%", maxWidth: "460px" }}
            >
                <GlassCard className="register-card" hoverEffect={false}>
                    {/* Logo */}
                    <Link to="/" className="logo-link">
                        <div className="logo-badge">
                            <Sparkles size={16} />
                        </div>
                        <h2 className="logo">
                            Learn<span className="text-gradient">Wise</span>
                        </h2>
                    </Link>

                    {/* Heading */}
                    <h1>Welcome back</h1>

                    {/* Subtitle */}
                    <p className="subtitle">
                        Enter your credentials to access your personalized AI learning workspace.
                    </p>

                    {/* Standard Error Banner */}
                    {errorMessage && (
                        <motion.div
                            className="error-banner"
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <AlertCircle size={18} />
                            <span>{errorMessage}</span>
                        </motion.div>
                    )}

                    {/* UNVERIFIED EMAIL WARNING CARD */}
                    {showUnverifiedWarning && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{
                                background: 'rgba(99, 102, 241, 0.12)',
                                border: '1px solid rgba(129, 140, 248, 0.35)',
                                borderRadius: '18px',
                                padding: '1.5rem 1.25rem',
                                marginBottom: '1.5rem',
                                textAlign: 'center'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.6rem', color: '#818cf8' }}>
                                <Mail size={32} />
                            </div>
                            <h3 style={{ fontSize: '1.1rem', color: '#a5b4fc', fontWeight: 700, marginBottom: '0.4rem', fontFamily: 'var(--font-display)' }}>
                                Email Verification Required
                            </h3>
                            <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: '1.5', marginBottom: '1.2rem' }}>
                                Please verify your email address before logging in. Check your inbox for the activation link.
                            </p>

                            {resendStatus && (
                                <div style={{ fontSize: '0.84rem', color: '#34d399', marginBottom: '0.9rem', background: 'rgba(16, 185, 129, 0.12)', padding: '0.6rem 0.9rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                                    <MailCheck size={16} />
                                    <span>{resendStatus}</span>
                                </div>
                            )}

                            <Button
                                variant="primary"
                                isLoading={resending}
                                onClick={handleResendClick}
                                icon={Mail}
                                style={{ width: '100%' }}
                            >
                                Resend Verification Link
                            </Button>
                        </motion.div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        <TextInput
                            label="Email Address"
                            id="login-email"
                            type="email"
                            placeholder="name@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                            required
                        />

                        <PasswordInput
                            label="Password"
                            id="login-password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                            required
                        />

                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={isLoading}
                            icon={ArrowRight}
                            iconPosition="right"
                            style={{ marginTop: '0.75rem', width: '100%' }}
                        >
                            Log In to Workspace
                        </Button>
                    </form>

                    {/* Register Link */}
                    <p className="login-text">
                        Don't have an account?{" "}
                        <Link to="/register">Create free account</Link>
                    </p>
                </GlassCard>
            </motion.div>
        </div>
    );
}

export default LoginPage;
