import React, { useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | '7xl';
  showCloseButton?: boolean;
  className?: string;
}

// Framer Motion variants for smooth fade animations
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.95,
    y: -10,
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 300,
    },
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    y: 10,
    transition: {
      duration: 0.15,
    },
  },
};

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'lg',
  showCloseButton = true,
  className,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const originalOverflowRef = useRef<string>('');

  useEffect(() => {
    if (isOpen) {
      // Store original overflow value before modifying
      originalOverflowRef.current = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    } else {
      // Restore to empty string (let CSS handle it) rather than 'unset'
      // This prevents accumulating style issues
      document.body.style.overflow = '';
    }

    return () => {
      // On unmount, always reset to empty string for clean state
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.2 }}
        >
          <motion.div
            ref={modalRef}
            className={clsx(
              'modal-content',
              maxWidthClasses[maxWidth],
              className
            )}
            onClick={(e) => e.stopPropagation()}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {(title || showCloseButton) && (
              <div className="px-4 py-3 sm:px-5 sm:py-4 md:px-6 md:py-5 border-b border-surface-light/40">
                <div className="flex items-center justify-between">
                  {title && (
                    <h2 className="text-xl sm:text-2xl font-bold text-text-primary text-left">
                      {title}
                    </h2>
                  )}
                  {showCloseButton && (
                    <motion.button
                      onClick={onClose}
                      className="p-1.5 sm:p-2 text-text-muted hover:text-text-primary transition-colors rounded-lg hover:bg-surface-light/10"
                      aria-label="Close modal"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </motion.button>
                  )}
                </div>
              </div>
            )}
            
            <div className={clsx("overflow-y-auto max-h-[calc(90vh-120px)]", className || "p-4 sm:p-5 md:p-6")}>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
