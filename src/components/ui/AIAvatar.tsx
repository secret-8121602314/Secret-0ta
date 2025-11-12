import React from 'react';
import { getPublicPath } from '../../utils/publicPath';

interface AIAvatarProps {
  className?: string;
}

const AIAvatar: React.FC<AIAvatarProps> = ({ className }) => (
  <img
    src={getPublicPath('/images/AvatarAI.png')}
    alt="AI Avatar"
    className={`${className} rounded-full object-cover`}
    aria-label="AI Avatar"
  />
);

export default AIAvatar;
