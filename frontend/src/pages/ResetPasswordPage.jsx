import React, { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, AlertCircle, ArrowRight, ShieldCheck, KeyRound } from "lucide-react";
import { GlassCard, PasswordInput, TextInput, Button } from "../components/ui";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter";
import { resetPassword } from "../services/api";
import "./RegisterPage.css";

function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const tokenFromUrl = searchParams.get("token") || "";

    const [token, setToken] = useState(tokenFromUrl);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const isPasswordValid =
        newPassword.length >= 8 &&
        /[A-Z]/.test(newPassword) &&
        /[a-z]/.test(newPassword) &&
        /[0-9]/.test(newPassword) &&
        /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(newPassword);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessMessage("");

        if (!token) {
            setError("Missing password reset token.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (!isPasswordValid) {
            setError("Password does not meet security requirements.");
            return;
        }

        setLoading(true);

        try {
            const data = await resetPassword({ token, new_password: newPassword });
            setSuccessMessage(data.message || "Password successfully updated!");

            localStorage.removeItem("token");
            localStorage.removeItem("access_token");
            localStorage.removeItem("user");

            setTimeout(() => {
                navigate("/login");
            }, 2500);
        } catch (err) {
            console.error("Reset password error:", err);
            setError(err.message || "Failed to reset password. Link may be invalid or expired.");
        } finally {
            setLoading(false);
        }
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

                    <h1>Set New Password</h1>
                    <p className="subtitle">
                        Enter your new password below. It must satisfy all security requirements.
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

                    {successMessage ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{
                                background: "rgba(16, 185, 129, 0.15)",
                                border: "1px solid rgba(16, 185, 129, 0.4)",
                                borderRadius: "18px",
                                padding: "2rem 1.4rem",
                                textAlign: "center"
                            }}
                        >
                            <div style={{ fontSize: "3rem", marginBottom: "0.8rem" }}>🔒</div>
                            <h3 style={{ fontSize: "1.4rem", color: "var(--color-emerald-400)", fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: "0.5rem" }}>
                                Password Reset Complete!
                            </h3>
                            <p style={{ color: "#cbd5e1", fontSize: "0.9rem", marginBottom: "1.2rem" }}>
                                Your password has been updated. Redirecting you to sign in...
                            </p>
                            <Link to="/login" style={{ textDecoration: "none" }}>
                                <Button variant="primary" icon={ArrowRight} iconPosition="right" style={{ width: "100%" }}>
                                    Sign In with New Password
                                </Button>
                            </Link>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            {!tokenFromUrl && (
                                <TextInput
                                    label="Reset Token"
                                    id="token-input"
                                    placeholder="Enter token from reset link"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    required
                                />
                            )}

                            <PasswordInput
                                label="New Password"
                                id="new-password"
                                placeholder="Enter strong new password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />

                            <PasswordStrengthMeter password={newPassword} />

                            <PasswordInput
                                label="Confirm New Password"
                                id="confirm-password"
                                placeholder="Re-enter new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />

                            <Button
                                type="submit"
                                variant="primary"
                                isLoading={loading}
                                disabled={!isPasswordValid || newPassword !== confirmPassword}
                                icon={ShieldCheck}
                                iconPosition="right"
                                style={{ marginTop: "1.2rem", width: "100%" }}
                            >
                                Save New Password
                            </Button>
                        </form>
                    )}
                </GlassCard>
            </motion.div>
        </div>
    );
}

export default ResetPasswordPage;
