/**
 * AI Text Loading Animation
 * Displays cycling gaming-themed loading messages with smooth transitions
 * Adapted from kokonutui with gaming customizations and brand colors
 * @version 1.0.1
 */

import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

// Large pool of gaming-themed loading messages to avoid repeats
const DEFAULT_GAMING_TEXTS = [
  "Consulting the strategy guide...",
  "Rolling for initiative...",
  "Checking the wiki...",
  "Crafting a response...",
  "Respawning thoughts...",
  "Loading next checkpoint...",
  "Buffering power-up...",
  "Scanning for loot...",
  "Calculating damage output...",
  "Summoning knowledge...",
  "Queuing ability...",
  "Mining for answers...",
  "Decrypting game files...",
  "Syncing with the server...",
  "Warming up the GPU...",
  "Parsing game data...",
  "Unlocking achievement...",
  "Speedrunning this query...",
  "Frame-perfect analysis...",
  "Optimizing build path...",
];

interface AITextLoadingProps {
  texts?: string[];
  className?: string;
  interval?: number;
}

export function AITextLoading({
  texts = DEFAULT_GAMING_TEXTS,
  className,
  interval = 2500,
}: AITextLoadingProps) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTextIndex((prevIndex) => {
        // If we haven't reached the end, go to next
        if (prevIndex < texts.length - 1) {
          return prevIndex + 1;
        }
        // Stay on last text (don't loop) - rare edge case for very long responses
        return prevIndex;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [interval, texts.length]);

  return (
    <div className={cn("flex items-center justify-start", className)}>
      <motion.div
        className="relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTextIndex}
            initial={{ opacity: 0, y: 12 }}
            animate={{
              opacity: 1,
              y: 0,
              backgroundPosition: ["200% center", "-200% center"],
            }}
            exit={{ opacity: 0, y: -12 }}
            transition={{
              opacity: { duration: 0.25 },
              y: { duration: 0.25 },
              backgroundPosition: {
                duration: 2.5,
                ease: "linear",
                repeat: Infinity,
              },
            }}
            className={cn(
              "text-sm font-medium bg-gradient-to-r from-[#FFAB40] via-[#FF8F00] to-[#FFAB40] bg-[length:200%_100%] bg-clip-text text-transparent whitespace-nowrap",
              className
            )}
          >
            {texts[currentTextIndex]}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
