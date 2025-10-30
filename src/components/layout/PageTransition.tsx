'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { useAnimation } from '@/components/providers/AnimationProvider';

interface PageTransitionProps {
  children: ReactNode;
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 30,
    scale: 0.95,
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  out: {
    opacity: 0,
    y: -30,
    scale: 1.05,
  },
};

const pageTransition = {
  type: 'tween' as const,
  ease: [0.25, 0.1, 0.25, 1] as const,
  duration: 0.3,
};

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const { onTransitionStart, onTransitionEnd } = useAnimation();

  useEffect(() => {
    // Start transition when pathname changes
    onTransitionStart();
  }, [pathname, onTransitionStart]);

  return (
    <div 
      className="min-h-screen bg-background" 
      style={{ 
        backgroundColor: 'oklch(0.145 0 0)',
        position: 'relative',
        zIndex: 1
      }}
    >
      <AnimatePresence mode="wait" initial={true} onExitComplete={() => {
        // Ensure background stays consistent during transitions
        document.body.style.backgroundColor = 'oklch(0.145 0 0)';
        document.documentElement.style.backgroundColor = 'oklch(0.145 0 0)';
      }}>
        <motion.div
          key={pathname}
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={pageTransition}
          className="w-full min-h-screen bg-background relative z-10"
          style={{ 
            backgroundColor: 'oklch(0.145 0 0)',
            minHeight: '100vh',
            width: '100%'
          }}
          onAnimationComplete={(definition) => {
            // Only call onTransitionEnd when the "in" animation completes
            if (definition === 'in') {
              onTransitionEnd();
            }
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}