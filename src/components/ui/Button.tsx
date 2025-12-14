import React from 'react';
import { clsx } from 'clsx';
import { motion, HTMLMotionProps } from 'framer-motion';

// Exclude Framer Motion conflicting props from native button props
type MotionButtonProps = Omit<
  HTMLMotionProps<'button'>,
  'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'
>;

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
  /** Disable Framer Motion animations (useful for simple buttons) */
  disableMotion?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  children,
  disabled,
  disableMotion = false,
  ...props
}) => {
  const baseClasses = 'font-bold rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-primary to-secondary text-white hover:shadow-xl hover:shadow-primary/25',
    secondary: 'bg-gradient-to-r from-surface-light to-surface text-text-primary hover:shadow-lg',
    outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white',
    ghost: 'text-text-primary hover:bg-surface-light/50',
  };

  const sizeClasses = {
    sm: 'py-2 px-4 text-sm',
    md: 'py-3 px-6 text-base',
    lg: 'py-4 px-8 text-lg',
  };

  const buttonContent = isLoading ? (
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2"></div>
      Loading...
    </div>
  ) : (
    children
  );

  // Use regular button for disabled/loading states
  if (disableMotion || disabled || isLoading) {
    return (
      <button
        className={clsx(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {buttonContent}
      </button>
    );
  }

  // Cast props for motion.button compatibility
  const motionProps = props as unknown as MotionButtonProps;

  return (
    <motion.button
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || isLoading}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ 
        type: 'spring', 
        stiffness: 350, 
        damping: 20,
        mass: 0.8,
      }}
      {...motionProps}
    >
      {buttonContent}
    </motion.button>
  );
};

export default Button;
