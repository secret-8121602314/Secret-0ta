import React, { useState, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { useResponsive, mobileFirst, touchTargets } from '../../utils/responsive';

// ===== RESPONSIVE CONTAINER =====

interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  maxWidth = '7xl',
  padding = 'md',
  className
}) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full',
  };

  const paddingClasses = {
    none: '',
    sm: 'px-4 sm:px-6',
    md: 'px-4 sm:px-6 lg:px-8',
    lg: 'px-6 sm:px-8 lg:px-12',
    xl: 'px-8 sm:px-12 lg:px-16',
  };

  return (
    <div
      className={cn(
        'w-full mx-auto',
        maxWidthClasses[maxWidth],
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  );
};

// ===== RESPONSIVE GRID =====

interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  };
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  cols = { xs: 1, sm: 2, md: 3, lg: 4 },
  gap = 'md',
  className
}) => {
  const gapClasses = {
    sm: 'gap-2 sm:gap-3',
    md: 'gap-4 sm:gap-6',
    lg: 'gap-6 sm:gap-8',
    xl: 'gap-8 sm:gap-12',
  };

  const getGridCols = () => {
    const colClasses = [];
    if (cols.xs) colClasses.push(`grid-cols-${cols.xs}`);
    if (cols.sm) colClasses.push(`sm:grid-cols-${cols.sm}`);
    if (cols.md) colClasses.push(`md:grid-cols-${cols.md}`);
    if (cols.lg) colClasses.push(`lg:grid-cols-${cols.lg}`);
    if (cols.xl) colClasses.push(`xl:grid-cols-${cols.xl}`);
    if (cols['2xl']) colClasses.push(`2xl:grid-cols-${cols['2xl']}`);
    return colClasses.join(' ');
  };

  return (
    <div
      className={cn(
        'grid',
        getGridCols(),
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  );
};

// ===== RESPONSIVE FLEX =====

interface ResponsiveFlexProps {
  children: React.ReactNode;
  direction?: {
    xs?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
    sm?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
    md?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
    lg?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
  };
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
  align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch';
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const ResponsiveFlex: React.FC<ResponsiveFlexProps> = ({
  children,
  direction = { xs: 'col', sm: 'row' },
  justify = 'start',
  align = 'start',
  wrap = 'wrap',
  gap = 'md',
  className
}) => {
  const justifyClasses = {
    start: 'justify-start',
    end: 'justify-end',
    center: 'justify-center',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  };

  const alignClasses = {
    start: 'items-start',
    end: 'items-end',
    center: 'items-center',
    baseline: 'items-baseline',
    stretch: 'items-stretch',
  };

  const wrapClasses = {
    nowrap: 'flex-nowrap',
    wrap: 'flex-wrap',
    'wrap-reverse': 'flex-wrap-reverse',
  };

  const gapClasses = {
    sm: 'gap-2 sm:gap-3',
    md: 'gap-4 sm:gap-6',
    lg: 'gap-6 sm:gap-8',
    xl: 'gap-8 sm:gap-12',
  };

  const getDirectionClasses = () => {
    const dirClasses: string[] = [];
    if (direction.xs) dirClasses.push(`flex-${direction.xs}`);
    if (direction.sm) dirClasses.push(`sm:flex-${direction.sm}`);
    if (direction.md) dirClasses.push(`md:flex-${direction.md}`);
    if (direction.lg) dirClasses.push(`lg:flex-${direction.lg}`);
    return dirClasses.join(' ');
  };

  return (
    <div
      className={cn(
        'flex',
        getDirectionClasses(),
        justifyClasses[justify],
        alignClasses[align],
        wrapClasses[wrap],
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  );
};

// ===== RESPONSIVE STACK =====

interface ResponsiveStackProps {
  children: React.ReactNode;
  spacing?: 'sm' | 'md' | 'lg' | 'xl';
  direction?: 'vertical' | 'horizontal';
  className?: string;
}

const ResponsiveStack: React.FC<ResponsiveStackProps> = ({
  children,
  spacing = 'md',
  direction = 'vertical',
  className
}) => {
  const spacingClasses = {
    sm: 'space-y-2 sm:space-y-3',
    md: 'space-y-4 sm:space-y-6',
    lg: 'space-y-6 sm:space-y-8',
    xl: 'space-y-8 sm:space-y-12',
  };

  const horizontalSpacingClasses = {
    sm: 'space-x-2 sm:space-x-3',
    md: 'space-x-4 sm:space-x-6',
    lg: 'space-x-6 sm:space-x-8',
    xl: 'space-x-8 sm:space-x-12',
  };

  return (
    <div
      className={cn(
        direction === 'vertical' ? spacingClasses[spacing] : horizontalSpacingClasses[spacing],
        className
      )}
    >
      {children}
    </div>
  );
};

// ===== RESPONSIVE HIDE/SHOW =====

interface ResponsiveHideProps {
  children: React.ReactNode;
  below?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  above?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const ResponsiveHide: React.FC<ResponsiveHideProps> = ({
  children,
  below,
  above,
  className
}) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const getHideClasses = () => {
    if (below) {
      const breakpointMap = {
        sm: 'sm:hidden',
        md: 'md:hidden',
        lg: 'lg:hidden',
        xl: 'xl:hidden',
        '2xl': '2xl:hidden',
      };
      return breakpointMap[below];
    }
    
    if (above) {
      const breakpointMap = {
        xs: 'hidden xs:block',
        sm: 'hidden sm:block',
        md: 'hidden md:block',
        lg: 'hidden lg:block',
        xl: 'hidden xl:block',
      };
      return breakpointMap[above];
    }
    
    return '';
  };

  return (
    <div className={cn(getHideClasses(), className)}>
      {children}
    </div>
  );
};

// ===== RESPONSIVE TEXT =====

interface ResponsiveTextProps {
  children: React.ReactNode;
  size?: {
    xs?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
    sm?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
    md?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
    lg?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
  };
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
  color?: 'primary' | 'secondary' | 'tertiary' | 'white' | 'black';
  className?: string;
  as?: 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  children,
  size = { xs: 'base', sm: 'lg' },
  weight = 'normal',
  color = 'primary',
  className,
  as: Component = 'p'
}) => {
  const weightClasses = {
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
    extrabold: 'font-extrabold',
  };

  const colorClasses = {
    primary: 'text-[#F5F5F5]',
    secondary: 'text-[#CFCFCF]',
    tertiary: 'text-[#A3A3A3]',
    white: 'text-white',
    black: 'text-black',
  };

  const getSizeClasses = () => {
    const sizeClasses: string[] = [];
    if (size.xs) sizeClasses.push(`text-${size.xs}`);
    if (size.sm) sizeClasses.push(`sm:text-${size.sm}`);
    if (size.md) sizeClasses.push(`md:text-${size.md}`);
    if (size.lg) sizeClasses.push(`lg:text-${size.lg}`);
    return sizeClasses.join(' ');
  };

  return (
    <Component
      className={cn(
        getSizeClasses(),
        weightClasses[weight],
        colorClasses[color],
        className
      )}
    >
      {children}
    </Component>
  );
};

// ===== RESPONSIVE SPACING =====

interface ResponsiveSpacingProps {
  children: React.ReactNode;
  padding?: {
    xs?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    sm?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    md?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    lg?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  };
  margin?: {
    xs?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    sm?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    md?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    lg?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  };
  className?: string;
}

const ResponsiveSpacing: React.FC<ResponsiveSpacingProps> = ({
  children,
  padding,
  margin,
  className
}) => {
  const spacingClasses = {
    none: '',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  };

  const marginClasses = {
    none: '',
    sm: 'm-2',
    md: 'm-4',
    lg: 'm-6',
    xl: 'm-8',
  };

  const getPaddingClasses = () => {
    if (!padding) return '';
    const classes: string[] = [];
    if (padding.xs) classes.push(spacingClasses[padding.xs]);
    if (padding.sm) classes.push(`sm:${spacingClasses[padding.sm]}`);
    if (padding.md) classes.push(`md:${spacingClasses[padding.md]}`);
    if (padding.lg) classes.push(`lg:${spacingClasses[padding.lg]}`);
    return classes.join(' ');
  };

  const getMarginClasses = () => {
    if (!margin) return '';
    const classes: string[] = [];
    if (margin.xs) classes.push(marginClasses[margin.xs]);
    if (margin.sm) classes.push(`sm:${marginClasses[margin.sm]}`);
    if (margin.md) classes.push(`md:${marginClasses[margin.md]}`);
    if (margin.lg) classes.push(`lg:${marginClasses[margin.lg]}`);
    return classes.join(' ');
  };

  return (
    <div
      className={cn(
        getPaddingClasses(),
        getMarginClasses(),
        className
      )}
    >
      {children}
    </div>
  );
};

export {
  ResponsiveContainer,
  ResponsiveGrid,
  ResponsiveFlex,
  ResponsiveStack,
  ResponsiveHide,
  ResponsiveText,
  ResponsiveSpacing
};
