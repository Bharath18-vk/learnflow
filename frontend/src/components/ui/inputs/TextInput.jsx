import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

export function TextInput({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  className = '',
  ...props
}) {
  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={id} className="text-label" style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
          {label} {required && <span style={{ color: 'var(--color-error)' }}>*</span>}
        </label>
      )}
      <input
        type={type}
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className="focus-ring"
        style={{
          width: '100%',
          padding: '0.88rem 1.1rem',
          background: 'var(--color-bg-surface)',
          border: error ? '1px solid var(--color-error)' : '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--color-text-primary)',
          fontFamily: 'var(--font-sans)',
          fontSize: '0.95rem',
          outline: 'none',
          transition: 'border-color var(--motion-hover), box-shadow var(--motion-hover)'
        }}
        {...props}
      />
      {error && (
        <span style={{ fontSize: '0.8rem', color: 'var(--color-error)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.3rem' }}>
          <AlertCircle size={13} /> {error}
        </span>
      )}
    </div>
  );
}

export function PasswordInput({
  label = 'Password',
  id = 'password',
  placeholder = 'Enter password',
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  className = '',
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={id} style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
          {label} {required && <span style={{ color: 'var(--color-error)' }}>*</span>}
        </label>
      )}
      <div className="password-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
        <input
          type={showPassword ? 'text' : 'password'}
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className="focus-ring"
          style={{
            width: '100%',
            padding: '0.88rem 2.8rem 0.88rem 1.1rem',
            background: 'var(--color-bg-surface)',
            border: error ? '1px solid var(--color-error)' : '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-text-primary)',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.95rem',
            outline: 'none'
          }}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          style={{
            position: 'absolute',
            right: '12px',
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error && (
        <span style={{ fontSize: '0.8rem', color: 'var(--color-error)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.3rem' }}>
          <AlertCircle size={13} /> {error}
        </span>
      )}
    </div>
  );
}
