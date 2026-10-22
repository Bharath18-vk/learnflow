import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, AlertCircle, Mail, ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { GlassCard, TextInput, Button } from "../components/ui";
import { verifyEmail, resendVerification } from "../services/api";
import "./RegisterPage.css";

function VerifyEmailPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token") || "";

    const [statusState, setStatusState] = useState(token ? "verifying" : "missing");
    const [userEmail, setUserEmail] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const [resendEmail, setResendEmail] = useState("");
    const [resending, setResending] = useState(false);
    const [resendMessage, setResendMessage] = useState("");

    useEffect(() => {
        if (token) {
            handleVerify(token);
        }
    }, [token]);

    const handleVerify = async (tokenToVerify) => {
        setStatusState("verifying");
        setErrorMessage("");
        try {
            const res = await verifyEmail(tokenToVerify);
            setStatusState("success");
            if (res.user && res.user.email) {
                setUserEmail(res.user.email);
            }
            setTimeout(() => {
                navigate("/dashboard");
            }, 3000);
        } catch (err) {
            console.error("Verification error:", err);
            const msg = err.message || "Invalid or expired verification token.";
            setErrorMessage(msg);

            if (msg.toLowerCase().includes("expired")) {
                setStatusState("expired");
            } else {
                setStatusState("error");
            }
        }
    };

    const handleResend = async (e) => {
        e.preventDefault();
        if (!resendEmail) return;
        setResending(true);
        setResendMessage("");
        try {
            const res = await resendVerification(resendEmail);
            setResendMessage(res.message || "A new verification email has been sent!");
        } catch (err) {
            setResendMessage(err.message || "Failed to resend verification link.");
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
                style={{ width: "100%", maxWidth: "500px" }}
            >
                <GlassCard className="register-card" hoverEffect={false}>
                    <Link to="/" className="logo-link">
                        <div className="logo-badge">
                            <ShieldCheck size={16} />
                        </div>
                        <h2 className="logo">
                            Learn<span className="text-gradient">Wise</span>
                        </h2>
                    </Link>

                    {/* VERIFYING STATE */}
                    {statusState === "verifying" && (
                        <div style={{ padding: "2rem 1rem" }}>
                            <div className="spinner-glow" style={{ margin: "0 auto 1.5rem" }} />
                            <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--color-text-primary)", fontFamily: "var(--font-display)", marginBottom: "0.5rem" }}>
                                Verifying your email...
                            </h2>
                            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>
                                Validating your security token against the server.
                            </p>
                        </div>
                    )}

                    {/* SUCCESS STATE */}
                    {statusState === "success" && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{ background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.4)", borderRadius: "20px", padding: "2.5rem 1.5rem" }}
                        >
                            <div style={{ fontSize: "3.5rem", marginBottom: "0.8rem" }}>🎉</div>
                            <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--color-emerald-400)", fontFamily: "var(--font-display)", marginBottom: "0.5rem" }}>
                                Email Verified!
                            </h2>
                            <p style={{ color: "#cbd5e1", fontSize: "0.95rem", marginBottom: "1.5rem", lineHeight: "1.6" }}>
                                Your email address <strong>{userEmail || ""}</strong> has been successfully verified. Your LearnWise account is now active!
                            </p>
                            <div style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", marginBottom: "1.5rem" }}>
                                Redirecting to your dashboard in 3 seconds...
                            </div>
                            <Link to="/dashboard" style={{ textDecoration: "none" }}>
                                <Button variant="primary" icon={ArrowRight} iconPosition="right" style={{ width: "100%" }}>
                                    Go to Workspace Dashboard
                                </Button>
                            </Link>
                        </motion.div>
                    )}

                    {/* EXPIRED TOKEN STATE */}
                    {statusState === "expired" && (
                        <div>
                            <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>⏰</div>
                            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--primitive-rose-400)", fontFamily: "var(--font-display)", marginBottom: "0.5rem" }}>
                                Link Expired
                            </h2>
                            <p style={{ color: "#cbd5e1", fontSize: "0.9rem", marginBottom: "1.8rem" }}>
                                Verification links are valid for 24 hours. Enter your email below to receive a brand-new verification link.
                            </p>

                            {resendMessage && (
                                <div style={{ background: "rgba(99, 102, 241, 0.2)", border: "1px solid #818cf8", padding: "0.9rem", borderRadius: "12px", color: "#a5b4fc", fontSize: "0.88rem", marginBottom: "1.2rem" }}>
                                    {resendMessage}
                                </div>
                            )}

                            <form onSubmit={handleResend} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                <TextInput
                                    label="Your Registered Email"
                                    type="email"
                                    placeholder="name@company.com"
                                    value={resendEmail}
                                    onChange={(e) => setResendEmail(e.target.value)}
                                    required
                                />
                                <Button type="submit" variant="primary" isLoading={resending} icon={Mail} iconPosition="right" style={{ width: "100%" }}>
                                    Resend Verification Email
                                </Button>
                            </form>
                        </div>
                    )}

                    {/* ERROR / INVALID STATE */}
                    {(statusState === "error" || statusState === "missing") && (
                        <div>
                            <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>⚠️</div>
                            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text-primary)", fontFamily: "var(--font-display)", marginBottom: "0.5rem" }}>
                                Invalid Verification Link
                            </h2>
                            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", marginBottom: "1.8rem" }}>
                                {errorMessage || "No valid verification token was provided in the link."}
                            </p>

                            {resendMessage && (
                                <div style={{ background: "rgba(99, 102, 241, 0.2)", border: "1px solid #818cf8", padding: "0.9rem", borderRadius: "12px", color: "#a5b4fc", fontSize: "0.88rem", marginBottom: "1.2rem" }}>
                                    {resendMessage}
                                </div>
                            )}

                            <form onSubmit={handleResend} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                <TextInput
                                    label="Enter your email to resend"
                                    type="email"
                                    placeholder="name@company.com"
                                    value={resendEmail}
                                    onChange={(e) => setResendEmail(e.target.value)}
                                    required
                                />
                                <Button type="submit" variant="primary" isLoading={resending} icon={Mail} iconPosition="right" style={{ width: "100%" }}>
                                    Resend Verification Email
                                </Button>
                            </form>
                        </div>
                    )}
                </GlassCard>
            </motion.div>
        </div>
    );
}

export default VerifyEmailPage;
