import React from 'react';
import { User } from '../../types';

interface CreditIndicatorProps {
  user: User;
  onClick: () => void;
}

const CreditIndicator: React.FC<CreditIndicatorProps> = ({ user, onClick }) => {
  const { textCount, textLimit, imageCount, imageLimit } = user.usage;
  
  // Check if user is using custom Gemini API key
  const isUsingCustomKey = user.usesCustomGeminiKey;

  const textPercentRemaining = textLimit > 0 ? Math.max(0, 100 - (textCount / textLimit) * 100) : 0;
  const imagePercentRemaining = imageLimit > 0 ? Math.max(0, 100 - (imageCount / imageLimit) * 100) : 0;

  const radiusOuter = 13;
  const circumferenceOuter = 2 * Math.PI * radiusOuter;
  const offsetOuter = circumferenceOuter - (textPercentRemaining / 100) * circumferenceOuter;

  const radiusInner = 8;
  const circumferenceInner = 2 * Math.PI * radiusInner;
  const offsetInner = circumferenceInner - (imagePercentRemaining / 100) * circumferenceInner;

  const strokeWidth = 3.5;

  return (
    <div 
      className="credit-indicator-wrapper"
      style={{
        display: 'inline-block',
        background: isUsingCustomKey 
          ? 'linear-gradient(135deg, #10b981, #34d399)' // Green gradient for BYOK
          : 'linear-gradient(135deg, #E53A3A, #D98C1F)', // Red-orange gradient for normal
        padding: '1px',
        borderRadius: '8px',
        boxShadow: isUsingCustomKey
          ? '0 4px 16px rgba(16, 185, 129, 0.3), 0 2px 8px rgba(52, 211, 153, 0.2), 0 1px 4px rgba(0, 0, 0, 0.1)'
          : '0 4px 16px rgba(229, 58, 58, 0.2), 0 2px 8px rgba(217, 140, 31, 0.15), 0 1px 4px rgba(0, 0, 0, 0.1)',
        filter: isUsingCustomKey
          ? 'drop-shadow(0 0 12px rgba(16, 185, 129, 0.2))'
          : 'drop-shadow(0 0 10px rgba(229, 58, 58, 0.15))'
      }}
    >
      <button
        type="button"
        onClick={onClick}
        className="credit-indicator-button flex items-center justify-center h-11 w-11 sm:h-12 sm:w-12 lg:h-14 lg:w-14 rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 min-h-[44px] min-w-[44px]"
        style={{
          background: '#0F0F0F',
          border: 'none',
          outline: 'none',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)',
          width: '100%',
          height: '100%'
        }}
        aria-label={isUsingCustomKey ? "Custom API key active - Unlimited queries" : "View query credits"}
      >
        {isUsingCustomKey ? (
          /* Show infinity symbol/checkmark for BYOK */
          <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 xl:w-10 xl:h-10 flex items-center justify-center rounded-full p-0.5" style={{
            background: 'rgba(16, 185, 129, 0.15)'
          }}>
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        ) : (
          /* Show normal circular progress bars */
        <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 xl:w-10 xl:h-10 flex items-center justify-center rounded-full p-0.5" style={{
          background: 'rgba(0, 0, 0, 0.2)'
        }}>
          <svg className="w-full h-full" viewBox="0 0 32 32" fill="none">
            <defs>
              <linearGradient id="sky-gradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0ea5e9" />
              </linearGradient>
              <linearGradient id="emerald-gradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
            {/* Outer circle (text) - only the colored ring */}
            <circle 
              cx="16" cy="16" r={radiusOuter} 
              stroke="url(#sky-gradient)" 
              strokeWidth={strokeWidth} 
              strokeDasharray={circumferenceOuter}
              strokeDashoffset={offsetOuter}
              strokeLinecap="round"
              transform="rotate(-90 16 16)"
            />
            {/* Inner circle (image) - only the colored ring */}
            <circle 
              cx="16" cy="16" r={radiusInner} 
              stroke="url(#emerald-gradient)" 
              strokeWidth={strokeWidth}
              strokeDasharray={circumferenceInner}
              strokeDashoffset={offsetInner}
              strokeLinecap="round"
              transform="rotate(-90 16 16)"
            />
          </svg>
        </div>
        )}
      </button>
    </div>
  );
};

export default CreditIndicator;
