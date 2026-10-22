import React from 'react';
import { Check, AlertCircle } from 'lucide-react';

export function Badge({ children, variant = 'neutral', icon: Icon = null, className = '', style = {} }) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return { bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.28)', color: '#10b981' };
      case 'warning':
        return { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.28)', color: '#f59e0b' };
      case 'error':
        return { bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.28)', color: '#ef4444' };
      case 'accent':
        return { bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.28)', color: '#3b82f6' };
      default:
        return { bg: 'var(--color-hover)', border: 'var(--border-subtle)', color: 'var(--color-text-secondary)' };
    }
  };

  const v = getVariantStyles();

  return (
    <span
      className={`tag-pill ${className}`}
      style={{
        background: v.bg,
        border: `1px solid ${v.border}`,
        color: v.color,
        padding: '0.3rem 0.75rem',
        borderRadius: 'var(--radius-full)',
        fontSize: '0.8rem',
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        ...style
      }}
    >
      {Icon && <Icon size={13} />}
      <span>{children}</span>
    </span>
  );
}

export function VerificationBadge({ isVerified }) {
  return (
    <Badge
      variant={isVerified ? 'success' : 'warning'}
      icon={isVerified ? Check : AlertCircle}
    >
      {isVerified ? 'Email Verified' : 'Email Unverified'}
    </Badge>
  );
}
