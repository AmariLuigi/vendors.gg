'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface AnimationContextType {
  isTransitionComplete: boolean;
  setTransitionComplete: (complete: boolean) => void;
  onTransitionStart: () => void;
  onTransitionEnd: () => void;
}

const AnimationContext = createContext<AnimationContextType | undefined>(undefined);

export function AnimationProvider({ children }: { children: React.ReactNode }) {
  const [isTransitionComplete, setIsTransitionComplete] = useState(false);

  const onTransitionStart = useCallback(() => {
    setIsTransitionComplete(false);
  }, []);

  const onTransitionEnd = useCallback(() => {
    setIsTransitionComplete(true);
  }, []);

  const setTransitionComplete = useCallback((complete: boolean) => {
    setIsTransitionComplete(complete);
  }, []);

  return (
    <AnimationContext.Provider
      value={{
        isTransitionComplete,
        setTransitionComplete,
        onTransitionStart,
        onTransitionEnd,
      }}
    >
      {children}
    </AnimationContext.Provider>
  );
}

export function useAnimation() {
  const context = useContext(AnimationContext);
  if (context === undefined) {
    throw new Error('useAnimation must be used within an AnimationProvider');
  }
  return context;
}