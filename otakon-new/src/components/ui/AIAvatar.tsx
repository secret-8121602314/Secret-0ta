import React from 'react';

interface AIAvatarProps {
  className?: string;
}

const AIAvatar: React.FC<AIAvatarProps> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="AI Avatar"
  >
    <defs>
      <linearGradient id="ai-avatar-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#5B99E3" />
        <stop offset="100%" stopColor="#4CAF50" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="12" fill="url(#ai-avatar-gradient)" />
    <path
      d="M8 12h8M12 8v8"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export default AIAvatar;
