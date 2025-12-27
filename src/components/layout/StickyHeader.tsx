import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassNavDropdown } from './GlassNavDropdown';

interface StickyHeaderProps {
  triggerOnScroll?: boolean;
  scrollThreshold?: number;
}

export const StickyHeader = ({ 
  triggerOnScroll = false, 
  scrollThreshold = 100 
}: StickyHeaderProps) => {
  const [isVisible, setIsVisible] = useState(!triggerOnScroll);

  useEffect(() => {
    if (!triggerOnScroll) {return;}

    const handleScroll = () => {
      if (window.scrollY > scrollThreshold) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [triggerOnScroll, scrollThreshold]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/10 shadow-lg"
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link 
                to="/" 
                className="flex items-center gap-3 group"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-3"
                >
                  <img 
                    src="/logo.svg" 
                    alt="Otagon Logo" 
                    className="w-8 h-8 sm:w-10 sm:h-10"
                    onError={(e) => {
                      // Fallback to a gradient circle if logo doesn't exist
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        const fallback = document.createElement('div');
                        fallback.className = 'w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-[#E53A3A] to-[#D98C1F]';
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                  <span className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40]">
                    Otagon
                  </span>
                </motion.div>
              </Link>

              {/* Navigation Dropdown */}
              <GlassNavDropdown />
            </div>
          </div>
        </motion.header>
      )}
    </AnimatePresence>
  );
};
