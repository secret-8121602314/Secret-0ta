import React from 'react';

interface FeatureInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  icon: React.ReactNode;
  details: {
    label: string;
    text: string;
  }[];
  tipText?: string;
}

export const FeatureInfoModal: React.FC<FeatureInfoModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  icon,
  details,
  tipText
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[80] animate-fade-in p-4" 
      onClick={onClose}
    >
      <div 
        className="bg-[#1C1C1C]/90 backdrop-blur-md border border-[#424242]/60 rounded-2xl shadow-2xl w-full max-w-md relative animate-scale-in flex flex-col max-h-[90vh]"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed header with close button */}
        <div className="flex-shrink-0 p-6 pb-4 relative">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-[#6E6E6E] hover:text-[#F5F5F5] transition-colors z-10"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
          
          <div className="flex items-start gap-3 pr-8">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              {icon}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-[#F5F5F5] mb-1">
                {title}
              </h3>
              <p className="text-sm text-[#CFCFCF]">
                {description}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 pb-4 custom-scrollbar">
          <div className="space-y-4">
            {/* Feature Details */}
            {details.map((detail, index) => (
              <div key={index} className="bg-[#252525] rounded-xl p-4 border border-[#424242]/40">
                <div className="flex items-start gap-2">
                  <span className="text-blue-400 text-lg flex-shrink-0 mt-0.5">•</span>
                  <div>
                    <p className="text-sm text-[#F5F5F5] font-medium mb-1">{detail.label}</p>
                    <p className="text-sm text-[#CFCFCF]">
                      {detail.text}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Tip */}
            {tipText && (
              <div className="flex items-start gap-2 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                <span className="text-blue-400 text-base flex-shrink-0 mt-0.5">💡</span>
                <p className="text-sm text-[#CFCFCF]">
                  {tipText}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Fixed footer with action button */}
        <div className="flex-shrink-0 px-6 pb-6 pt-4 border-t border-[#424242]/40">
          <button
            onClick={onConfirm}
            className="w-full px-4 py-3 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] hover:from-[#D42A2A] hover:to-[#C87A1A] text-white rounded-xl transition-all font-medium shadow-lg"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};
