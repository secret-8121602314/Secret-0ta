/**
 * Motion Components - Reusable Framer Motion animation wrappers
 * These components provide consistent animations across the app.
 */
/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
  exit: { 
    opacity: 0, 
    y: -10,
    transition: { duration: 0.2 },
  },
};

export const fadeScaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { 
      type: 'spring',
      damping: 25,
      stiffness: 300,
    },
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: { duration: 0.15 },
  },
};

export const slideInVariants: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  exit: { 
    opacity: 0, 
    x: -20,
    transition: { duration: 0.2 },
  },
};

export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4 },
  },
};

// ============================================================================
// PAGE TRANSITION WRAPPER
// ============================================================================

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ 
  children, 
  className = '' 
}) => (
  <motion.div
    className={className}
    initial="hidden"
    animate="visible"
    exit="exit"
    variants={fadeUpVariants}
  >
    {children}
  </motion.div>
);

// ============================================================================
// FADE IN WRAPPER
// ============================================================================

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export const FadeIn: React.FC<FadeInProps> = ({ 
  children, 
  delay = 0, 
  duration = 0.4,
  className = '' 
}) => (
  <motion.div
    className={className}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay, duration, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);

// ============================================================================
// FADE UP WRAPPER
// ============================================================================

interface FadeUpProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export const FadeUp: React.FC<FadeUpProps> = ({ 
  children, 
  delay = 0,
  className = '' 
}) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);

// ============================================================================
// STAGGERED LIST
// ============================================================================

interface StaggeredListProps {
  children: React.ReactNode;
  className?: string;
}

export const StaggeredList: React.FC<StaggeredListProps> = ({ 
  children, 
  className = '' 
}) => (
  <motion.div
    className={className}
    initial="hidden"
    animate="visible"
    variants={staggerContainerVariants}
  >
    {children}
  </motion.div>
);

export const StaggeredItem: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children,
  className = '' 
}) => (
  <motion.div className={className} variants={staggerItemVariants}>
    {children}
  </motion.div>
);

// ============================================================================
// SCALE ON HOVER
// ============================================================================

interface ScaleOnHoverProps {
  children: React.ReactNode;
  scale?: number;
  className?: string;
}

export const ScaleOnHover: React.FC<ScaleOnHoverProps> = ({ 
  children, 
  scale = 1.02,
  className = '' 
}) => (
  <motion.div
    className={className}
    whileHover={{ scale }}
    whileTap={{ scale: 0.98 }}
    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
  >
    {children}
  </motion.div>
);

// ============================================================================
// ANIMATE PRESENCE WRAPPER
// ============================================================================

interface AnimatePresenceWrapperProps {
  children: React.ReactNode;
  mode?: 'wait' | 'sync' | 'popLayout';
}

export const AnimatePresenceWrapper: React.FC<AnimatePresenceWrapperProps> = ({ 
  children,
  mode = 'wait' 
}) => (
  <AnimatePresence mode={mode}>
    {children}
  </AnimatePresence>
);

// ============================================================================
// SCROLL REVEAL
// ============================================================================

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({ 
  children,
  className = '' 
}) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-100px' }}
    transition={{ duration: 0.6, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);

// ============================================================================
// PULSE ANIMATION
// ============================================================================

interface PulseProps {
  children: React.ReactNode;
  className?: string;
}

export const Pulse: React.FC<PulseProps> = ({ 
  children,
  className = '' 
}) => (
  <motion.div
    className={className}
    animate={{ 
      scale: [1, 1.02, 1],
    }}
    transition={{ 
      duration: 2, 
      repeat: Infinity,
      ease: 'easeInOut' 
    }}
  >
    {children}
  </motion.div>
);
