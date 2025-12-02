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
    <img
      src={imgSrc}
      alt="AI Avatar"
      className={`${className} rounded-full object-cover`}
      aria-label="AI Avatar"
      onError={handleError}
    />
  );
};

export default AIAvatar;
