import React, { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = "max-w-4xl" }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className={`relative w-full ${maxWidth} bg-gradient-to-br from-[#1C1C1C] to-[#0A0A0A] rounded-2xl border border-[#424242]/40 shadow-2xl overflow-hidden max-h-[90vh]`} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="relative p-6 border-b border-[#424242]/40 sticky top-0 bg-gradient-to-br from-[#1C1C1C] to-[#0A0A0A] z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-[#E53A3A]/10 to-[#D98C1F]/10 rounded-t-2xl"></div>
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-white mb-2">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-3 text-[#A3A3A3] hover:text-white transition-colors rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#E53A3A]/50"
            aria-label="Close modal"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
