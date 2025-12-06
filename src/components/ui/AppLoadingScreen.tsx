/**
 * App Loading Screen Component
 * Provides a consistent, animated loading experience across the app
 * Uses elegant spinning rings with Otagon brand colors (red/orange gradient)
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface AppLoadingScreenProps {
  /** Size of the loader */
  size?: 'sm' | 'md' | 'lg';
  /** Custom class name */
  className?: string;
  /** Whether to show full screen or inline */
  fullScreen?: boolean;
}

export const AppLoadingScreen: React.FC<AppLoadingScreenProps> = ({
  size = 'md',
  className = '',
  fullScreen = true,
}) => {
  const sizeConfig = {
    sm: { container: 'size-10' },
    md: { container: 'size-16' },
    lg: { container: 'size-20' },
  };

  const config = sizeConfig[size];

  const loader = (
    <motion.div
      className={cn('relative', config.container)}
      animate={{
        scale: [1, 1.02, 1],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: [0.4, 0, 0.6, 1],
      }}
    >
      {/* Outer elegant ring with shimmer - Brand red */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(from 0deg, transparent 0deg, rgb(255, 77, 77) 90deg, transparent 180deg)`,
          mask: `radial-gradient(circle at 50% 50%, transparent 35%, black 37%, black 39%, transparent 41%)`,
          WebkitMask: `radial-gradient(circle at 50% 50%, transparent 35%, black 37%, black 39%, transparent 41%)`,
          opacity: 0.8,
        }}
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Primary animated ring with gradient - Red to Orange */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(from 0deg, transparent 0deg, rgb(255, 77, 77) 120deg, rgba(217, 140, 31, 0.7) 240deg, transparent 360deg)`,
          mask: `radial-gradient(circle at 50% 50%, transparent 42%, black 44%, black 48%, transparent 50%)`,
          WebkitMask: `radial-gradient(circle at 50% 50%, transparent 42%, black 44%, black 48%, transparent 50%)`,
          opacity: 0.9,
        }}
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: [0.4, 0, 0.6, 1],
        }}
      />

      {/* Secondary elegant ring - counter rotation - Orange accent */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(from 180deg, transparent 0deg, rgba(217, 140, 31, 0.8) 45deg, transparent 90deg)`,
          mask: `radial-gradient(circle at 50% 50%, transparent 52%, black 54%, black 56%, transparent 58%)`,
          WebkitMask: `radial-gradient(circle at 50% 50%, transparent 52%, black 54%, black 56%, transparent 58%)`,
          opacity: 0.5,
        }}
        animate={{
          rotate: [0, -360],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: [0.4, 0, 0.6, 1],
        }}
      />

      {/* Accent particles - Bright red */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(from 270deg, transparent 0deg, rgba(229, 58, 58, 0.6) 20deg, transparent 40deg)`,
          mask: `radial-gradient(circle at 50% 50%, transparent 61%, black 62%, black 63%, transparent 64%)`,
          WebkitMask: `radial-gradient(circle at 50% 50%, transparent 61%, black 62%, black 63%, transparent 64%)`,
          opacity: 0.6,
        }}
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Inner glow pulse */}
      <motion.div
        className="absolute inset-[30%] rounded-full"
        style={{
          background: `radial-gradient(circle, rgba(255, 77, 77, 0.15) 0%, transparent 70%)`,
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  );

  if (fullScreen) {
    return (
      <div className={cn('h-screen bg-gradient-to-br from-[#111111] to-[#0A0A0A] flex items-center justify-center', className)}>
        {loader}
      </div>
    );
  }

  return (
    <div className={cn('h-full bg-background flex items-center justify-center', className)}>
      {loader}
    </div>
  );
};

export default AppLoadingScreen;
