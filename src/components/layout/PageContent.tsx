'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { useAnimation } from '@/components/providers/AnimationProvider';

interface PageContentProps {
  children: ReactNode;
  className?: string;
}

export default function PageContent({ children, className = '' }: PageContentProps) {
  const { isTransitionComplete } = useAnimation();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isTransitionComplete ? 1 : 0 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}