import React, { useState } from 'react';
import { getPublicPath } from '../../utils/publicPath';

interface AIAvatarProps {
  className?: string;
}

const AIAvatar: React.FC<AIAvatarProps> = ({ className }) => {
  const [imgSrc, setImgSrc] = useState(getPublicPath('/images/otagon-logo.png'));

  const handleError = () => {
    // Fallback to mascot if otagon-logo.png fails
    setImgSrc(getPublicPath('/images/mascot/11.png'));
  };

  return (
    <div 
      className={`${className} rounded-full bg-[#1C1C1C] border border-[#333] flex items-center justify-center`}
      aria-label="AI Avatar"
    >
      <img
        src={imgSrc}
        alt="AI Avatar"
        className="w-[70%] h-[70%] object-contain"
        onError={handleError}
      />
    </div>
  );
};

export default AIAvatar;
