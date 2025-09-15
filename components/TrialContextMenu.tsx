import React, { useState, useRef, useEffect } from 'react';
import { ClockIcon, StarIcon } from '@heroicons/react/24/outline';

interface TrialContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTrial: () => void;
  position: { x: number; y: number };
  isEligibleForTrial: boolean;
  hasUsedTrial: boolean;
}

const TrialContextMenu: React.FC<TrialContextMenuProps> = ({
  isOpen,
  onClose,
  onStartTrial,
  position,
  isEligibleForTrial,
  hasUsedTrial
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-[#1A1A1A] border border-[#424242]/40 rounded-lg shadow-2xl py-2 min-w-[200px]"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%)'
      }}
    >
      {isEligibleForTrial ? (
        <button
          onClick={() => {
            onStartTrial();
            onClose();
          }}
          className="w-full px-4 py-3 text-left hover:bg-[#2E2E2E] transition-colors flex items-center gap-3"
        >
          <div className="w-8 h-8 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] rounded-full flex items-center justify-center flex-shrink-0">
            <ClockIcon className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-medium text-sm">Start 14-Day Free Trial</p>
            <p className="text-neutral-400 text-xs">Experience Pro features</p>
          </div>
        </button>
      ) : hasUsedTrial ? (
        <button
          onClick={() => {
            // This will be handled by the parent to show upgrade modal
            onStartTrial();
            onClose();
          }}
          className="w-full px-4 py-3 text-left hover:bg-[#2E2E2E] transition-colors flex items-center gap-3"
        >
          <div className="w-8 h-8 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] rounded-full flex items-center justify-center flex-shrink-0">
            <StarIcon className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-medium text-sm">Upgrade to Pro</p>
            <p className="text-neutral-400 text-xs">Trial already used</p>
          </div>
        </button>
      ) : (
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-neutral-600 rounded-full flex items-center justify-center flex-shrink-0">
              <StarIcon className="w-4 h-4 text-neutral-400" />
            </div>
            <div>
              <p className="text-neutral-400 font-medium text-sm">Already on Pro</p>
              <p className="text-neutral-500 text-xs">Enjoying premium features</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrialContextMenu;
