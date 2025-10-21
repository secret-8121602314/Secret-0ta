import React from 'react';

interface FounderImageProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBorder?: boolean;
  showShadow?: boolean;
  showBadge?: boolean;
  showStatus?: boolean;
}

const FounderImage: React.FC<FounderImageProps> = ({ 
  className = "", 
  size = 'md',
  showBorder = true,
  showShadow = true,
  showBadge = true,
  showStatus = true
}) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-40 h-40'
  };

  const borderClasses = showBorder 
    ? 'border-2 border-[#E53A3A]/30 ring-2 ring-[#D98C1F]/20' 
    : '';

  const shadowClasses = showShadow 
    ? 'shadow-lg shadow-[#E53A3A]/20' 
    : '';

  return (
    <div className={`relative ${className}`}>
      {/* Founder Portrait */}
      <div className={`relative overflow-hidden rounded-full ${sizeClasses[size]} ${borderClasses} ${shadowClasses}`}>
        <img
          src="/images/founder-image.jpg"
          alt="Otagon Founder - AI Gaming Visionary"
          className="w-full h-full object-cover object-center"
          style={{
            objectPosition: 'center 30%' // Position to show face clearly
          }}
          onError={(e) => {
            // Fallback if image doesn't load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const fallback = target.parentElement?.querySelector('.fallback') as HTMLElement;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
        
        {/* Fallback Avatar */}
        <div className="fallback hidden absolute inset-0 bg-gradient-to-br from-[#E53A3A] to-[#D98C1F] rounded-full items-center justify-center">
          <div className="text-white font-bold text-center">
            <div className="text-2xl">👨‍💻</div>
            <div className="text-xs mt-1">Founder</div>
          </div>
        </div>
      </div>

      {/* Status Indicator */}
      {showStatus && (
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full">
          <div className="w-full h-full bg-green-400 rounded-full animate-pulse"></div>
        </div>
      )}

      {/* Founder Badge */}
      {showBadge && (
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg">
          FOUNDER
        </div>
      )}
    </div>
  );
};

export default FounderImage;
