import React from 'react';

interface SendIconProps {
  className?: string;
}

const SendIcon: React.FC<SendIconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 4L4 12h5v8h6v-8h5L12 4z" />
  </svg>
);

export default SendIcon;
