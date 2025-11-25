import React, { useState } from 'react';
import { getPublicPath } from '../../utils/publicPath';

interface AIAvatarProps {
  className?: string;
}

const AIAvatar: React.FC<AIAvatarProps> = ({ className }) => {
  const [imgSrc, setImgSrc] = useState(getPublicPath('/images/mascot/11.png'));

  const handleError = () => {
    // Fallback to original AvatarAI.png if mascot image fails
    setImgSrc(getPublicPath('/images/AvatarAI.png'));
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
