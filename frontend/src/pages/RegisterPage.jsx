import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, AlertCircle, ArrowRight, MailCheck } from "lucide-react";
import { GlassCard, TextInput, PasswordInput, Button } from "../components/ui";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter";
import { registerUser } from "../services/api";
import "./RegisterPage.css";

function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [registeredSuccess, setRegisteredSuccess] = useState(false);

    const navigate = useNavigate();

    const isPasswordValid =
        password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /[0-9]/.test(password) &&
        /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMessage("");

        if (!isPasswordValid) {
            setErrorMessage("Password does not meet security requirements.");
            setIsLoading(false);
            return;
        }

        try {
            await registerUser({
                full_name: name,
                email: email,
                password: password
            });

            setRegisteredSuccess(true);

            setTimeout(() => {
                navigate("/onboarding");
            }, 3500);
        } catch (err) {
            setErrorMessage(err.message || "An unexpected error occurred.");
        } finally {
            setIsLoading(false);
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
                    <h1>Create your account</h1>

                    {/* Subtitle */}
                    <p className="subtitle">
                        Start your personalized AI learning journey today.
                    </p>

                    {/* Error Banner */}
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

                    {registeredSuccess ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{
                                background: "rgba(16, 185, 129, 0.12)",
                                border: "1px solid rgba(16, 185, 129, 0.35)",
                                borderRadius: "18px",
                                padding: "2rem 1.4rem",
                                textAlign: "center"
                            }}
                        >
                            <div style={{ fontSize: "3rem", marginBottom: "0.6rem" }}>📧</div>
                            <h3 style={{ fontSize: "1.3rem", color: "var(--color-emerald-400)", fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: "0.5rem" }}>
                                Account Created!
                            </h3>
                            <p style={{ color: "#cbd5e1", fontSize: "0.9rem", lineHeight: "1.6", marginBottom: "1.4rem" }}>
                                We've sent an activation link to <strong>{email}</strong>. Check your inbox to verify your email address.
                            </p>
                            <Button variant="primary" icon={ArrowRight} iconPosition="right" onClick={() => navigate("/onboarding")} style={{ width: "100%" }}>
                                Continue to Workspace
                            </Button>
                        </motion.div>
                    ) : (
                        /* Form */
                        <form onSubmit={handleSubmit}>
                            {/* Full Name */}
                            <TextInput
                                label="Full Name"
                                id="register-name"
                                type="text"
                                placeholder="Enter your full name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={isLoading}
                                required
                            />

                            {/* Email Address */}
                            <TextInput
                                label="Email Address"
                                id="register-email"
                                type="email"
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                                required
                            />

                            {/* Password */}
                            <PasswordInput
                                label="Password"
                                id="register-password"
                                placeholder="Create a strong password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                                required
                            />

                            {/* Password Strength Checklist */}
                            <PasswordStrengthMeter password={password} />

                            <Button
                                type="submit"
                                variant="primary"
                                isLoading={isLoading}
                                disabled={!isPasswordValid}
                                icon={Sparkles}
                                iconPosition="right"
                                style={{ marginTop: "1rem", width: "100%" }}
                            >
                                Create Account
                            </Button>
                        </form>
                    )}

                    {/* Login Link */}
                    <p className="login-text">
                        Already have an account?{" "}
                        <Link to="/login">Log in</Link>
                    </p>
                </GlassCard>
            </motion.div>
        </div>
    );
}

export default RegisterPage;