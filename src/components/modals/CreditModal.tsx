import React from 'react';
import { User } from '../../types';
import StarIcon from '../ui/StarIcon';
import TextIcon from '../ui/TextIcon';
import ImageIcon from '../ui/ImageIcon';

interface CreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  user: User;
}

const CreditModal: React.FC<CreditModalProps> = ({ isOpen, onClose, onUpgrade, user }) => {
  if (!isOpen) return null;

  const { textCount, textLimit, imageCount, imageLimit, tier } = user.usage;
  const textRemaining = Math.max(0, textLimit - textCount);
  const imageRemaining = Math.max(0, imageLimit - imageCount);

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-[#1C1C1C]/90 backdrop-blur-md border border-[#424242]/60 rounded-2xl shadow-2xl p-8 w-full max-w-sm m-4 relative animate-scale-in"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-[#6E6E6E] hover:text-[#F5F5F5] transition-colors"
          aria-label="Close modal"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        
        <h2 className="text-2xl font-bold text-[#F5F5F5] mb-2">Monthly Credits</h2>
        <p className="text-[#A3A3A3] mb-8">Your usage resets at the start of each month.</p>
        
        <div className="space-y-6">
          <div className="flex items-center gap-4 bg-[#2E2E2E]/40 backdrop-blur-sm p-4 rounded-lg border border-[#424242]/30">
            <TextIcon className="w-8 h-8 text-sky-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-[#CFCFCF]">Text Queries</p>
              <p className="text-2xl font-bold text-white">
                {textRemaining.toLocaleString()}
                <span className="text-base font-normal text-[#A3A3A3]"> / {textLimit.toLocaleString()}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-[#2E2E2E]/40 backdrop-blur-sm p-4 rounded-lg border border-[#424242]/30">
            <ImageIcon className="w-8 h-8 text-emerald-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-[#CFCFCF]">Image Queries</p>
              <p className="text-2xl font-bold text-white">
                {imageRemaining.toLocaleString()}
                <span className="text-base font-normal text-[#A3A3A3]"> / {imageLimit.toLocaleString()}</span>
              </p>
            </div>
          </div>
        </div>

        {tier === 'free' && (
          <div className="mt-8 bg-[#2E2E2E]/30 backdrop-blur-sm p-4 rounded-lg border border-[#424242]/30">
            <button
              onClick={() => {
                onUpgrade();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105"
            >
              <StarIcon className="w-5 h-5" />
              Upgrade to Pro for More
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreditModal;
