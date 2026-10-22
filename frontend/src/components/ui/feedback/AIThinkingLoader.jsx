import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Brain, Code, Target, Layers } from 'lucide-react';

const LOADING_STAGES = [
  { icon: Brain, label: 'Analyzing learning goal & target skill level...' },
  { icon: Target, label: 'Structuring optimal prerequisite milestones...' },
  { icon: Code, label: 'Matching top-rated GitHub repos & curated docs...' },
  { icon: Layers, label: 'Ranking topic dependencies for maximum retention...' },
  { icon: Sparkles, label: 'Synthesizing personalized AI roadmap...' }
];

export function AIThinkingLoader({ goalTitle = 'your goal' }) {
  const [currentStage, setCurrentStage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStage((prev) => (prev + 1) % LOADING_STAGES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  const StageIcon = LOADING_STAGES[currentStage].icon;

  return (
    <div className="loading-box" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '3.5rem 1rem' }}>
      <div className="spinner-glow" style={{ marginBottom: '1.8rem' }} />
      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '0.8rem', fontFamily: 'var(--font-display)' }}>
        Generating Custom AI Roadmap for "{goalTitle}"
      </h2>
      <div style={{ height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStage}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}
          >
            <StageIcon size={16} style={{ color: 'var(--color-accent-cyan)' }} />
            <span>{LOADING_STAGES[currentStage].label}</span>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export function Skeleton({ width = '100%', height = '20px', borderRadius = '8px', className = '' }) {
  return (
    <div
      className={`shimmer ${className}`}
      style={{
        width,
        height,
        borderRadius,
        background: 'rgba(30, 41, 59, 0.5)'
      }}
    />
  );
}

export function EmptyState({ title = 'No Active Data', description, actionLabel, onAction, icon: Icon = Sparkles }) {
  return (
    <div className="empty-state glass-panel" style={{ textAlign: 'center', padding: '4.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.2rem' }}>
      <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent-cyan)' }}>
        <Icon size={26} />
      </div>
      <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--color-text-primary)' }}>
        {title}
      </h2>
      {description && (
        <p style={{ color: 'var(--color-text-secondary)', maxWidth: '460px', fontSize: '0.98rem', lineHeight: '1.6' }}>
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button className="btn btn-primary" onClick={onAction}>
          <span>{actionLabel}</span>
          <Sparkles size={16} />
        </button>
      )}
    </div>
  );
}
