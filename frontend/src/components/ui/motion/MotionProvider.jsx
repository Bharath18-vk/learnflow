import React, { createContext, useContext } from 'react';
import { MotionConfig, useReducedMotion } from 'framer-motion';

const MotionContext = createContext({ isReducedMotion: false });

export function MotionProvider({ children }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <MotionContext.Provider value={{ isReducedMotion: Boolean(shouldReduceMotion) }}>
      <MotionConfig
        transition={{
          type: 'spring',
          stiffness: 350,
          damping: 30,
          reducedMotion: 'user'
        }}
      >
        {children}
      </MotionConfig>
    </MotionContext.Provider>
  );
}

export function useAppMotion() {
  return useContext(MotionContext);
}
