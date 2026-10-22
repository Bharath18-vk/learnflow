import React from 'react';
import { motion } from 'framer-motion';
import { Video, BookOpen, Code, GraduationCap, ExternalLink } from 'lucide-react';

export function ProgressRing({ percent = 0, size = 64, strokeWidth = 6 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--border-default)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#gradientRing)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="gradientRing" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="50%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
      </svg>
      <span style={{ position: 'absolute', fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
        {percent}%
      </span>
    </div>
  );
}

export function ProgressBar({ percent = 0, height = 10, className = '' }) {
  return (
    <div className={`progress-track ${className}`} style={{ height, background: 'var(--color-hover)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
      <motion.div
        className="progress-fill"
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          height: '100%',
          background: 'linear-gradient(90deg, #2563eb 0%, #06b6d4 50%, #10b981 100%)',
          borderRadius: 'var(--radius-full)'
        }}
      />
    </div>
  );
}

export function ResourceChip({ title, url, resourceType }) {
  const getTypeStyles = (type) => {
    switch (type?.toLowerCase()) {
      case 'youtube': return { icon: <Video size={14} />, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.25)', label: 'YouTube' };
      case 'docs': return { icon: <BookOpen size={14} />, color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.1)', border: 'rgba(6, 182, 212, 0.25)', label: 'Docs' };
      case 'practice': return { icon: <Code size={14} />, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.25)', label: 'GitHub' };
      case 'course': return { icon: <GraduationCap size={14} />, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)', border: 'rgba(139, 92, 246, 0.25)', label: 'Course' };
      case 'article': return { icon: <ExternalLink size={14} />, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.25)', label: 'Article' };
      default: return { icon: <ExternalLink size={14} />, color: 'var(--color-text-secondary)', bg: 'var(--color-hover)', border: 'var(--border-default)', label: 'Link' };
    }
  };

  const styles = getTypeStyles(resourceType);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={title}
      className="resource-link focus-ring"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.45rem',
        background: styles.bg,
        border: `1px solid ${styles.border}`,
        color: 'var(--color-text-primary)',
        padding: '0.4rem 0.85rem',
        borderRadius: 'var(--radius-sm)',
        fontSize: '0.83rem',
        fontWeight: 600,
        textDecoration: 'none',
        transition: 'all var(--motion-hover)',
        maxWidth: '100%',
        boxSizing: 'border-box'
      }}
    >
      <span style={{ color: styles.color, flexShrink: 0, display: 'flex', alignItems: 'center' }}>{styles.icon}</span>
      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: styles.color, textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>{styles.label}</span>
      <span style={{
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: '100%'
      }}>
        {title}
      </span>
    </a>
  );
}
