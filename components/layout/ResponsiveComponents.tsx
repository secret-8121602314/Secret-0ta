import React from 'react';
import { useResponsive } from '../../utils/responsive';

// ===== RESPONSIVE WRAPPER COMPONENT =====

interface ResponsiveWrapperProps {
  children: React.ReactNode;
  className?: string;
  mobileClassName?: string;
  tabletClassName?: string;
  laptopClassName?: string;
  desktopClassName?: string;
  ultrawideClassName?: string;
}

const ResponsiveWrapper: React.FC<ResponsiveWrapperProps> = ({
  children,
  className = '',
  mobileClassName = '',
  tabletClassName = '',
  laptopClassName = '',
  desktopClassName = '',
  ultrawideClassName = '',
}) => {
  const { deviceType } = useResponsive();

  const getResponsiveClassName = () => {
    const baseClasses = className;
    
    switch (deviceType) {
      case 'mobile':
        return `${baseClasses} ${mobileClassName}`.trim();
      case 'tablet':
        return `${baseClasses} ${tabletClassName}`.trim();
      case 'laptop':
        return `${baseClasses} ${laptopClassName}`.trim();
      case 'desktop':
        return `${baseClasses} ${desktopClassName}`.trim();
      case 'ultrawide':
        return `${baseClasses} ${ultrawideClassName}`.trim();
      default:
        return baseClasses;
    }
  };

  return (
    <div className={getResponsiveClassName()}>
      {children}
    </div>
  );
};

// ===== RESPONSIVE MODAL WRAPPER =====

interface ResponsiveModalProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

const ResponsiveModal: React.FC<ResponsiveModalProps> = ({
  children,
  isOpen,
  onClose,
  className = '',
}) => {
  const { deviceType, isMobile, isTablet, isLaptop, isDesktop, isUltrawide } = useResponsive();

  if (!isOpen) return null;

  const getModalClasses = () => {
    const baseClasses = 'fixed inset-0 bg-gradient-to-br from-black/80 to-[#0A0A0A]/80 backdrop-blur-xl flex items-center justify-center z-50 animate-fade-in';
    
    switch (deviceType) {
      case 'mobile':
        return `${baseClasses} p-2`;
      case 'tablet':
        return `${baseClasses} p-4`;
      case 'laptop':
        return `${baseClasses} p-6`;
      case 'desktop':
        return `${baseClasses} p-8`;
      case 'ultrawide':
        return `${baseClasses} p-12`;
      default:
        return baseClasses;
    }
  };

  const getContentClasses = () => {
    const baseClasses = 'bg-gradient-to-r from-[#1C1C1C]/95 to-[#0A0A0A]/95 backdrop-blur-xl border-2 border-[#424242]/60 rounded-3xl shadow-2xl relative animate-scale-in flex flex-col hover:border-[#424242]/80 transition-all duration-500';
    
    switch (deviceType) {
      case 'mobile':
        return `${baseClasses} w-full max-w-sm max-h-[95vh] h-auto`;
      case 'tablet':
        return `${baseClasses} w-full max-w-2xl max-h-[90vh] h-auto`;
      case 'laptop':
        return `${baseClasses} w-full max-w-4xl max-h-[85vh] h-auto`;
      case 'desktop':
        return `${baseClasses} w-full max-w-5xl max-h-[80vh] h-auto`;
      case 'ultrawide':
        return `${baseClasses} w-full max-w-7xl max-h-[75vh] h-auto`;
      default:
        return baseClasses;
    }
  };

  return (
    <div className={getModalClasses()} onClick={onClose} role="dialog" aria-modal="true">
      <div
        className={`${getContentClasses()} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

// ===== RESPONSIVE CONTAINER =====

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
}

const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className = '',
  maxWidth = '7xl',
}) => {
  const { deviceType } = useResponsive();

  const getMaxWidthClasses = () => {
    switch (maxWidth) {
      case 'sm':
        return 'max-w-sm';
      case 'md':
        return 'max-w-md';
      case 'lg':
        return 'max-w-lg';
      case 'xl':
        return 'max-w-xl';
      case '2xl':
        return 'max-w-2xl';
      case '3xl':
        return 'max-w-3xl';
      case '4xl':
        return 'max-w-4xl';
      case '5xl':
        return 'max-w-5xl';
      case '6xl':
        return 'max-w-6xl';
      case '7xl':
        return 'max-w-7xl';
      case 'full':
        return 'max-w-full';
      default:
        return 'max-w-7xl';
    }
  };

  const getPaddingClasses = () => {
    switch (deviceType) {
      case 'mobile':
        return 'px-4 py-2';
      case 'tablet':
        return 'px-6 py-4';
      case 'laptop':
        return 'px-8 py-6';
      case 'desktop':
        return 'px-10 py-8';
      case 'ultrawide':
        return 'px-12 py-10';
      default:
        return 'px-8 py-6';
    }
  };

  return (
    <div className={`w-full mx-auto ${getMaxWidthClasses()} ${getPaddingClasses()} ${className}`}>
      {children}
    </div>
  );
};

// ===== RESPONSIVE TEXT =====

interface ResponsiveTextProps {
  children: React.ReactNode;
  className?: string;
  as?: 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | '8xl' | '9xl';
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black';
}

const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  children,
  className = '',
  as: Component = 'p',
  size = 'base',
  weight = 'normal',
}) => {
  const { deviceType } = useResponsive();

  const getSizeClasses = () => {
    const baseSize = size;
    
    switch (deviceType) {
      case 'mobile':
        return `text-${baseSize}`;
      case 'tablet':
        return `text-${baseSize} sm:text-${baseSize}`;
      case 'laptop':
        return `text-${baseSize} sm:text-lg md:text-xl`;
      case 'desktop':
        return `text-${baseSize} sm:text-lg md:text-xl lg:text-2xl`;
      case 'ultrawide':
        return `text-${baseSize} sm:text-lg md:text-xl lg:text-2xl xl:text-3xl`;
      default:
        return `text-${baseSize}`;
    }
  };

  const getWeightClasses = () => {
    switch (weight) {
      case 'light':
        return 'font-light';
      case 'normal':
        return 'font-normal';
      case 'medium':
        return 'font-medium';
      case 'semibold':
        return 'font-semibold';
      case 'bold':
        return 'font-bold';
      case 'extrabold':
        return 'font-extrabold';
      case 'black':
        return 'font-black';
      default:
        return 'font-normal';
    }
  };

  return (
    <Component className={`${getSizeClasses()} ${getWeightClasses()} ${className}`}>
      {children}
    </Component>
  );
};

// ===== RESPONSIVE GRID =====

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    mobile?: number;
    tablet?: number;
    laptop?: number;
    desktop?: number;
    ultrawide?: number;
  };
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  className = '',
  cols = { mobile: 1, tablet: 2, laptop: 3, desktop: 4, ultrawide: 5 },
  gap = 'md',
}) => {
  const { deviceType } = useResponsive();

  const getGridClasses = () => {
    const baseClasses = 'grid';
    
    // Add responsive grid columns
    const colClasses: string[] = [];
    if (cols.mobile) colClasses.push(`grid-cols-${cols.mobile}`);
    if (cols.tablet) colClasses.push(`sm:grid-cols-${cols.tablet}`);
    if (cols.laptop) colClasses.push(`md:grid-cols-${cols.laptop}`);
    if (cols.desktop) colClasses.push(`lg:grid-cols-${cols.desktop}`);
    if (cols.ultrawide) colClasses.push(`xl:grid-cols-${cols.ultrawide}`);
    
    // Add gap classes
    const gapClasses = {
      xs: 'gap-1 sm:gap-2 md:gap-3 lg:gap-4 xl:gap-5',
      sm: 'gap-2 sm:gap-3 md:gap-4 lg:gap-5 xl:gap-6',
      md: 'gap-3 sm:gap-4 md:gap-5 lg:gap-6 xl:gap-7',
      lg: 'gap-4 sm:gap-5 md:gap-6 lg:gap-7 xl:gap-8',
      xl: 'gap-5 sm:gap-6 md:gap-7 lg:gap-8 xl:gap-9',
    };
    
    return `${baseClasses} ${colClasses.join(' ')} ${gapClasses[gap]} ${className}`;
  };

  return (
    <div className={getGridClasses()}>
      {children}
    </div>
  );
};

// ===== RESPONSIVE FLEX =====

interface ResponsiveFlexProps {
  children: React.ReactNode;
  className?: string;
  direction?: {
    mobile?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
    tablet?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
    laptop?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
    desktop?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
    ultrawide?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
  };
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  wrap?: boolean;
}

const ResponsiveFlex: React.FC<ResponsiveFlexProps> = ({
  children,
  className = '',
  direction = { mobile: 'col', tablet: 'row' },
  align = 'start',
  justify = 'start',
  gap = 'md',
  wrap = false,
}) => {
  const { deviceType } = useResponsive();

  const getFlexClasses = () => {
    const baseClasses = 'flex';
    
    // Add responsive direction classes
    const directionClasses: string[] = [];
    if (direction.mobile) directionClasses.push(`flex-${direction.mobile}`);
    if (direction.tablet) directionClasses.push(`sm:flex-${direction.tablet}`);
    if (direction.laptop) directionClasses.push(`md:flex-${direction.laptop}`);
    if (direction.desktop) directionClasses.push(`lg:flex-${direction.desktop}`);
    if (direction.ultrawide) directionClasses.push(`xl:flex-${direction.ultrawide}`);
    
    // Add alignment classes
    const alignClasses = {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
      baseline: 'items-baseline',
    };
    
    // Add justify classes
    const justifyClasses = {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
      around: 'justify-around',
      evenly: 'justify-evenly',
    };
    
    // Add gap classes
    const gapClasses = {
      xs: 'gap-1 sm:gap-2 md:gap-3 lg:gap-4 xl:gap-5',
      sm: 'gap-2 sm:gap-3 md:gap-4 lg:gap-5 xl:gap-6',
      md: 'gap-3 sm:gap-4 md:gap-5 lg:gap-6 xl:gap-7',
      lg: 'gap-4 sm:gap-5 md:gap-6 lg:gap-7 xl:gap-8',
      xl: 'gap-5 sm:gap-6 md:gap-7 lg:gap-8 xl:gap-9',
    };
    
    const wrapClass = wrap ? 'flex-wrap' : '';
    
    return `${baseClasses} ${directionClasses.join(' ')} ${alignClasses[align]} ${justifyClasses[justify]} ${gapClasses[gap]} ${wrapClass} ${className}`;
  };

  return (
    <div className={getFlexClasses()}>
      {children}
    </div>
  );
};

// ===== EXPORTS =====

export {
  ResponsiveWrapper,
  ResponsiveModal,
  ResponsiveContainer,
  ResponsiveText,
  ResponsiveGrid,
  ResponsiveFlex,
};
