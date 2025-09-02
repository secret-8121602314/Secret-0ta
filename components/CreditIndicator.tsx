

import React from 'react';
import { Usage } from '../services/types';
import TextIcon from './TextIcon';
import ImageIcon from './ImageIcon';

interface CreditIndicatorProps {
  usage: Usage;
  onClick: () => void;
}

const CreditBar: React.FC<{
  current: number;
  limit: number;
  colorClass: string;
  children: React.ReactNode;
}> = ({ current, limit, colorClass, children }) => {
  const percent = limit > 0 ? Math.max(0, 100 - (current / limit) * 100) : 0;
  
  return (
    <div className="flex items-center gap-2 w-20 lg:w-24 xl:w-28">
      {children}
      <div className="w-full h-2.5 lg:h-3 bg-neutral-800/60 rounded-sm overflow-hidden border border-neutral-600/40">
        <div 
          className={`h-full ${colorClass} transition-all duration-500 rounded-sm`}
          style={{ width: `${percent}%` }}
        ></div>
      </div>
    </div>
  );
};


const CreditIndicator: React.FC<CreditIndicatorProps> = ({ usage, onClick }) => {
    const { textCount, textLimit, imageCount, imageLimit } = usage;
  
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
        <button
          type="button"
          onClick={onClick}
          className="credit-indicator-button flex items-center justify-center h-10 sm:h-12 px-2 sm:px-3 rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #E53A3A, #D98C1F, #E53A3A)',
            padding: '2px',
            borderRadius: '8px'
          }}
          aria-label="View query credits"
        >
          <div className="w-full h-full flex items-center justify-center p-1.5 sm:p-2" style={{
            background: '#111111',
            borderRadius: '10px'
          }}>
            {/* Mobile & Tablet View: Circular Bars */}
            <div className="lg:hidden w-8 h-8 flex items-center justify-center bg-neutral-900/50 rounded-full p-0.5">
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
                {/* Outer circle (text) */}
                <circle cx="16" cy="16" r={radiusOuter} stroke="#424242" strokeWidth={strokeWidth} />
                <circle 
                  cx="16" cy="16" r={radiusOuter} 
                  stroke="url(#sky-gradient)" 
                  strokeWidth={strokeWidth} 
                  strokeDasharray={circumferenceOuter}
                  strokeDashoffset={offsetOuter}
                  strokeLinecap="round"
                  transform="rotate(-90 16 16)"
                />
                {/* Inner circle (image) */}
                <circle cx="16" cy="16" r={radiusInner} stroke="#424242" strokeWidth={strokeWidth} />
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

            {/* Desktop View: Horizontal Bars */}
            <div className="hidden lg:flex flex-col gap-1.5">
              <CreditBar current={usage.textCount} limit={usage.textLimit} colorClass="bg-gradient-to-r from-sky-400 to-sky-500">
                <TextIcon className="w-3 h-3 lg:w-3 lg:h-3 xl:w-4 xl:h-4 text-sky-400 flex-shrink-0" />
              </CreditBar>
              <CreditBar current={usage.imageCount} limit={usage.imageLimit} colorClass="bg-gradient-to-r from-emerald-400 to-emerald-500">
                <ImageIcon className="w-3 h-3 lg:w-3 lg:h-3 xl:w-4 xl:h-4 text-emerald-400 flex-shrink-0" />
              </CreditBar>
            </div>
      </div>
    </button>
  );
};

export default CreditIndicator;