import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../theme/ThemeContext';

/**
 * GlassCard - Enterprise frosted glass surface with spring hover lift,
 * specular border reflection, and mouse-tracking cursor spotlight highlight.
 * Spotlight motion tracking is active in Dark Mode and cleanly disabled in Light Mode.
 */
export function GlassCard({
  children,
  className = '',
  hoverEffect = true,
  spotlight = true,
  onClick,
  style = {},
  ...props
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const enableSpotlight = spotlight && isDark;

  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0, opacity: 0 });

  const handleMouseMove = (e) => {
    if (!enableSpotlight) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setCursorPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      opacity: 1
    });
  };

  const handleMouseLeave = () => {
    if (!enableSpotlight) return;
    setCursorPos((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <motion.div
      whileHover={hoverEffect ? { y: -4, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onMouseMove={enableSpotlight ? handleMouseMove : undefined}
      onMouseLeave={enableSpotlight ? handleMouseLeave : undefined}
      onClick={onClick}
      className={`glass-panel ${className}`}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        ...style
      }}
      {...props}
    >
      {/* Cursor Spotlight Glow Overlay (Dark Mode Only) */}
      {enableSpotlight && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            borderRadius: 'inherit',
            background: `radial-gradient(400px circle at ${cursorPos.x}px ${cursorPos.y}px, rgba(168, 85, 247, 0.14), transparent 80%)`,
            opacity: cursorPos.opacity,
            transition: 'opacity 0.3s ease',
            zIndex: 1
          }}
        />
      )}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', width: '100%', gap: 'inherit', alignItems: 'inherit' }}>
        {children}
      </div>
    </motion.div>
  );
}

export function GlassPanel({ children, className = '', style = {}, ...props }) {
  return (
    <div className={`glass-panel ${className}`} style={style} {...props}>
      {children}
    </div>
  );
}
