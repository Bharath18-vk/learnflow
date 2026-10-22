import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, ShieldCheck, Flame, Target, Clock, LogOut } from 'lucide-react';
import { GlassCard, Button, Badge } from './ui';

export function ProfileModal({ isOpen, onClose, userName, userEmail, planTier, securityStatus, activeGoalsCount, onLogout }) {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const storedUser = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, []);

  const effectiveName = userName || storedUser.full_name || storedUser.name || 'Learner';
  const effectiveEmail = userEmail || storedUser.email || 'learner@learnwise.ai';

  const initials = effectiveName
    ? effectiveName.split(' ').map(n => n[0]).filter(Boolean).join('').toUpperCase().slice(0, 2)
    : 'U';

  const formatDate = (isoStr) => {
    if (!isoStr) return "Recently";
    try {
      return new Date(isoStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    } catch {
      return "Recently";
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  };

  const displayTier = planTier || securityStatus?.plan_tier || "Free Plan";
  const goalsCount = activeGoalsCount !== undefined ? activeGoalsCount : 1;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            padding: '1rem',
            boxSizing: 'border-box'
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '480px', margin: 'auto' }}
          >
          <GlassCard
            style={{
              padding: '2rem',
              borderRadius: '28px',
              border: '1px solid var(--border-glass)',
              background: 'var(--color-bg-glass)'
            }}
            hoverEffect={false}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                User Profile
              </h2>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'var(--color-hover)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--color-text-secondary)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Avatar & User Details Hero */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'var(--gradient-accent)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  boxShadow: 'var(--shadow-glow)',
                  flexShrink: 0
                }}
              >
                {initials}
              </div>

              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>
                  {effectiveName}
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', marginTop: '0.15rem' }}>
                  {effectiveEmail}
                </p>
                <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.4rem' }}>
                  <Badge variant={displayTier.toLowerCase().includes("pro") ? "accent" : "neutral"}>
                    {displayTier}
                  </Badge>
                  <Badge variant="success">Active</Badge>
                </div>
              </div>
            </div>

            {/* Account Details & Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'var(--color-hover)', padding: '1rem', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-secondary)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>
                  <Target size={14} className="text-gradient" /> Active Goals
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '0.3rem', fontFamily: 'var(--font-display)' }}>
                  {goalsCount} {goalsCount === 1 ? 'Roadmap' : 'Roadmaps'}
                </div>
              </div>

              <div style={{ background: 'var(--color-hover)', padding: '1rem', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-secondary)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>
                  <ShieldCheck size={14} style={{ color: 'var(--color-success)' }} /> Security Status
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-success)', marginTop: '0.3rem', fontFamily: 'var(--font-display)' }}>
                  Protected
                </div>
              </div>
            </div>

            {/* Security Audit Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.8rem', fontSize: '0.86rem', color: 'var(--color-text-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Account Created:</span>
                <strong style={{ color: 'var(--color-text-primary)' }}>{formatDate(securityStatus?.created_at)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Last Session Login:</span>
                <strong style={{ color: 'var(--color-text-primary)' }}>{formatDate(securityStatus?.last_login_at)}</strong>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <Button variant="outline" icon={X} onClick={onClose} style={{ flex: 1 }}>
                Close
              </Button>
              <Button variant="primary" icon={LogOut} onClick={handleLogout} style={{ flex: 1 }}>
                Logout Account
              </Button>
            </div>
          </GlassCard>
        </motion.div>
      </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
