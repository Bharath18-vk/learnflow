import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

/**
 * Button - Core action component with Framer Motion spring physics,
 * magnetic hover lift, click compression, and ripple micro-interaction.
 */
export function Button({
  children,
  variant = 'primary', // primary | outline | ghost | danger | success
  size = 'md',        // sm | md | lg
  isLoading = false,
  disabled = false,
  icon: Icon = null,
  iconPosition = 'left',
  onClick,
  className = '',
  type = 'button',
  style = {},
  ...props
}) {
  const [ripples, setRipples] = useState([]);

  const handleClick = (e) => {
    if (disabled || isLoading) return;

    // Create ripple micro-interaction
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples((prev) => [...prev, { x, y, id }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);

    if (onClick) onClick(e);
  };

  const getVariantClass = () => {
    switch (variant) {
      case 'primary': return 'btn-primary';
      case 'outline': return 'btn-outline';
      case 'danger': return 'btn-outline';
      case 'success': return 'btn-primary';
      default: return 'btn-primary';
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'btn-sm';
      case 'lg': return 'btn-lg';
      default: return '';
    }
  };

  return (
    <motion.button
      type={type}
      whileHover={!disabled && !isLoading ? { scale: 1.02, y: -2 } : undefined}
      whileTap={!disabled && !isLoading ? { scale: 0.96 } : undefined}
      disabled={disabled || isLoading}
      onClick={handleClick}
      className={`btn ${getVariantClass()} ${getSizeClass()} ${className}`}
      style={{ position: 'relative', overflow: 'hidden', ...style }}
      {...props}
    >
      {/* Ripple Micro-Interaction Effect */}
      {ripples.map((r) => (
        <span
          key={r.id}
          style={{
            position: 'absolute',
            left: r.x,
            top: r.y,
            width: '120px',
            height: '120px',
            marginLeft: '-60px',
            marginTop: '-60px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.35)',
            transform: 'scale(0)',
            animation: 'rippleAnim 0.6s linear',
            pointerEvents: 'none'
          }}
        />
      ))}

      {isLoading ? (
        <>
          <Loader2 size={16} className="spin-icon" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon size={16} />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon size={16} />}
        </>
      )}
    </motion.button>
  );
}

export function IconButton({ icon: Icon, onClick, size = 18, className = '', title, ...props }) {
  return (
    <motion.button
      whileHover={{ scale: 1.1, y: -1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      title={title}
      className={`btn btn-outline ${className}`}
      style={{ padding: '0.5rem', borderRadius: '50%', width: '38px', height: '38px' }}
      {...props}
    >
      <Icon size={size} />
    </motion.button>
  );
}
