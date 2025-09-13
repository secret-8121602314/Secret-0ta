import React, { useState, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { useResponsive } from '../../utils/responsive';

// ===== UNIVERSAL RESPONSIVE CONTAINER =====

interface UniversalResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const UniversalResponsiveContainer: React.FC<UniversalResponsiveContainerProps> = ({
  children,
  maxWidth = '7xl',
  padding = 'md',
  className
}) => {
  const { deviceType, isMobile, isTablet, isLaptop, isDesktop, isUltrawide } = useResponsive();

  const maxWidthClasses = {
    xs: 'max-w-xs',
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
    xs: 'px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 2xl:px-10 3xl:px-12 4xl:px-16 5xl:px-20 6xl:px-24 7xl:px-32',
    sm: 'px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 3xl:px-16 4xl:px-20 5xl:px-24 6xl:px-28 7xl:px-36',
    md: 'px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16 3xl:px-20 4xl:px-24 5xl:px-28 6xl:px-32 7xl:px-40',
    lg: 'px-6 sm:px-8 md:px-10 lg:px-12 xl:px-16 2xl:px-20 3xl:px-24 4xl:px-28 5xl:px-32 6xl:px-36 7xl:px-44',
    xl: 'px-8 sm:px-10 md:px-12 lg:px-16 xl:px-20 2xl:px-24 3xl:px-28 4xl:px-32 5xl:px-36 6xl:px-40 7xl:px-48',
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

// ===== UNIVERSAL RESPONSIVE GRID =====

interface UniversalResponsiveGridProps {
  children: React.ReactNode;
  cols?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
    '3xl'?: number;
    '4xl'?: number;
    '5xl'?: number;
    '6xl'?: number;
    '7xl'?: number;
  };
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const UniversalResponsiveGrid: React.FC<UniversalResponsiveGridProps> = ({
  children,
  cols = { xs: 1, sm: 2, md: 3, lg: 4, xl: 5, '2xl': 6, '3xl': 7, '4xl': 8, '5xl': 9, '6xl': 10, '7xl': 12 },
  gap = 'md',
  className
}) => {
  const gapClasses = {
    xs: 'gap-1 sm:gap-2 md:gap-3 lg:gap-4 xl:gap-5 2xl:gap-6 3xl:gap-7 4xl:gap-8 5xl:gap-9 6xl:gap-10 7xl:gap-12',
    sm: 'gap-2 sm:gap-3 md:gap-4 lg:gap-5 xl:gap-6 2xl:gap-7 3xl:gap-8 4xl:gap-9 5xl:gap-10 6xl:gap-11 7xl:gap-14',
    md: 'gap-3 sm:gap-4 md:gap-5 lg:gap-6 xl:gap-7 2xl:gap-8 3xl:gap-9 4xl:gap-10 5xl:gap-11 6xl:gap-12 7xl:gap-16',
    lg: 'gap-4 sm:gap-5 md:gap-6 lg:gap-7 xl:gap-8 2xl:gap-9 3xl:gap-10 4xl:gap-11 5xl:gap-12 6xl:gap-14 7xl:gap-18',
    xl: 'gap-5 sm:gap-6 md:gap-7 lg:gap-8 xl:gap-9 2xl:gap-10 3xl:gap-11 4xl:gap-12 5xl:gap-14 6xl:gap-16 7xl:gap-20',
  };

  const getGridCols = () => {
    const colClasses: string[] = [];
    if (cols.xs) colClasses.push(`grid-cols-${cols.xs}`);
    if (cols.sm) colClasses.push(`sm:grid-cols-${cols.sm}`);
    if (cols.md) colClasses.push(`md:grid-cols-${cols.md}`);
    if (cols.lg) colClasses.push(`lg:grid-cols-${cols.lg}`);
    if (cols.xl) colClasses.push(`xl:grid-cols-${cols.xl}`);
    if (cols['2xl']) colClasses.push(`2xl:grid-cols-${cols['2xl']}`);
    if (cols['3xl']) colClasses.push(`3xl:grid-cols-${cols['3xl']}`);
    if (cols['4xl']) colClasses.push(`4xl:grid-cols-${cols['4xl']}`);
    if (cols['5xl']) colClasses.push(`5xl:grid-cols-${cols['5xl']}`);
    if (cols['6xl']) colClasses.push(`6xl:grid-cols-${cols['6xl']}`);
    if (cols['7xl']) colClasses.push(`7xl:grid-cols-${cols['7xl']}`);
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

// ===== UNIVERSAL RESPONSIVE FLEX =====

interface UniversalResponsiveFlexProps {
  children: React.ReactNode;
  direction?: {
    xs?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
    sm?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
    md?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
    lg?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
    xl?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
    '2xl'?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
    '3xl'?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
    '4xl'?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
    '5xl'?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
    '6xl'?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
    '7xl'?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
  };
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  wrap?: boolean;
  className?: string;
}

const UniversalResponsiveFlex: React.FC<UniversalResponsiveFlexProps> = ({
  children,
  direction = { xs: 'col', sm: 'row' },
  align = 'start',
  justify = 'start',
  gap = 'md',
  wrap = false,
  className
}) => {
  const gapClasses = {
    xs: 'gap-1 sm:gap-2 md:gap-3 lg:gap-4 xl:gap-5 2xl:gap-6 3xl:gap-7 4xl:gap-8 5xl:gap-9 6xl:gap-10 7xl:gap-12',
    sm: 'gap-2 sm:gap-3 md:gap-4 lg:gap-5 xl:gap-6 2xl:gap-7 3xl:gap-8 4xl:gap-9 5xl:gap-10 6xl:gap-11 7xl:gap-14',
    md: 'gap-3 sm:gap-4 md:gap-5 lg:gap-6 xl:gap-7 2xl:gap-8 3xl:gap-9 4xl:gap-10 5xl:gap-11 6xl:gap-12 7xl:gap-16',
    lg: 'gap-4 sm:gap-5 md:gap-6 lg:gap-7 xl:gap-8 2xl:gap-9 3xl:gap-10 4xl:gap-11 5xl:gap-12 6xl:gap-14 7xl:gap-18',
    xl: 'gap-5 sm:gap-6 md:gap-7 lg:gap-8 xl:gap-9 2xl:gap-10 3xl:gap-11 4xl:gap-12 5xl:gap-14 6xl:gap-16 7xl:gap-20',
  };

  const getDirectionClasses = () => {
    const directionClasses: string[] = [];
    if (direction.xs) directionClasses.push(`flex-${direction.xs}`);
    if (direction.sm) directionClasses.push(`sm:flex-${direction.sm}`);
    if (direction.md) directionClasses.push(`md:flex-${direction.md}`);
    if (direction.lg) directionClasses.push(`lg:flex-${direction.lg}`);
    if (direction.xl) directionClasses.push(`xl:flex-${direction.xl}`);
    if (direction['2xl']) directionClasses.push(`2xl:flex-${direction['2xl']}`);
    if (direction['3xl']) directionClasses.push(`3xl:flex-${direction['3xl']}`);
    if (direction['4xl']) directionClasses.push(`4xl:flex-${direction['4xl']}`);
    if (direction['5xl']) directionClasses.push(`5xl:flex-${direction['5xl']}`);
    if (direction['6xl']) directionClasses.push(`6xl:flex-${direction['6xl']}`);
    if (direction['7xl']) directionClasses.push(`7xl:flex-${direction['7xl']}`);
    return directionClasses.join(' ');
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
    baseline: 'items-baseline',
  };

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  };

  return (
    <div
      className={cn(
        'flex',
        getDirectionClasses(),
        alignClasses[align],
        justifyClasses[justify],
        gapClasses[gap],
        wrap && 'flex-wrap',
        className
      )}
    >
      {children}
    </div>
  );
};

// ===== UNIVERSAL RESPONSIVE TEXT =====

interface UniversalResponsiveTextProps {
  children: React.ReactNode;
  size?: {
    xs?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | '8xl' | '9xl';
    sm?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | '8xl' | '9xl';
    md?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | '8xl' | '9xl';
    lg?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | '8xl' | '9xl';
    xl?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | '8xl' | '9xl';
    '2xl'?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | '8xl' | '9xl';
    '3xl'?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | '8xl' | '9xl';
    '4xl'?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | '8xl' | '9xl';
    '5xl'?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | '8xl' | '9xl';
    '6xl'?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | '8xl' | '9xl';
    '7xl'?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | '8xl' | '9xl';
  };
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black';
  color?: 'primary' | 'secondary' | 'tertiary' | 'white' | 'black' | 'gray' | 'red' | 'green' | 'blue' | 'yellow';
  className?: string;
  as?: 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

const UniversalResponsiveText: React.FC<UniversalResponsiveTextProps> = ({
  children,
  size = { xs: 'base', sm: 'lg', md: 'xl', lg: '2xl', xl: '3xl' },
  weight = 'normal',
  color = 'white',
  className,
  as: Component = 'p'
}) => {
  const getSizeClasses = () => {
    const sizeClasses: string[] = [];
    if (size.xs) sizeClasses.push(`text-${size.xs}`);
    if (size.sm) sizeClasses.push(`sm:text-${size.sm}`);
    if (size.md) sizeClasses.push(`md:text-${size.md}`);
    if (size.lg) sizeClasses.push(`lg:text-${size.lg}`);
    if (size.xl) sizeClasses.push(`xl:text-${size.xl}`);
    if (size['2xl']) sizeClasses.push(`2xl:text-${size['2xl']}`);
    if (size['3xl']) sizeClasses.push(`3xl:text-${size['3xl']}`);
    if (size['4xl']) sizeClasses.push(`4xl:text-${size['4xl']}`);
    if (size['5xl']) sizeClasses.push(`5xl:text-${size['5xl']}`);
    if (size['6xl']) sizeClasses.push(`6xl:text-${size['6xl']}`);
    if (size['7xl']) sizeClasses.push(`7xl:text-${size['7xl']}`);
    return sizeClasses.join(' ');
  };

  const weightClasses = {
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
    extrabold: 'font-extrabold',
    black: 'font-black',
  };

  const colorClasses = {
    primary: 'text-[#FFAB40]',
    secondary: 'text-gray-400',
    tertiary: 'text-gray-500',
    white: 'text-white',
    black: 'text-black',
    gray: 'text-gray-600',
    red: 'text-red-500',
    green: 'text-green-500',
    blue: 'text-blue-500',
    yellow: 'text-yellow-500',
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

// ===== UNIVERSAL RESPONSIVE SPACING =====

interface UniversalResponsiveSpacingProps {
  children: React.ReactNode;
  padding?: {
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
    '2xl'?: string;
    '3xl'?: string;
    '4xl'?: string;
    '5xl'?: string;
    '6xl'?: string;
    '7xl'?: string;
  };
  margin?: {
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
    '2xl'?: string;
    '3xl'?: string;
    '4xl'?: string;
    '5xl'?: string;
    '6xl'?: string;
    '7xl'?: string;
  };
  className?: string;
}

const UniversalResponsiveSpacing: React.FC<UniversalResponsiveSpacingProps> = ({
  children,
  padding,
  margin,
  className
}) => {
  const getSpacingClasses = (spacing: typeof padding, prefix: 'p' | 'm') => {
    if (!spacing) return '';
    
    const classes: string[] = [];
    if (spacing.xs) classes.push(`${prefix}-${spacing.xs}`);
    if (spacing.sm) classes.push(`sm:${prefix}-${spacing.sm}`);
    if (spacing.md) classes.push(`md:${prefix}-${spacing.md}`);
    if (spacing.lg) classes.push(`lg:${prefix}-${spacing.lg}`);
    if (spacing.xl) classes.push(`xl:${prefix}-${spacing.xl}`);
    if (spacing['2xl']) classes.push(`2xl:${prefix}-${spacing['2xl']}`);
    if (spacing['3xl']) classes.push(`3xl:${prefix}-${spacing['3xl']}`);
    if (spacing['4xl']) classes.push(`4xl:${prefix}-${spacing['4xl']}`);
    if (spacing['5xl']) classes.push(`5xl:${prefix}-${spacing['5xl']}`);
    if (spacing['6xl']) classes.push(`6xl:${prefix}-${spacing['6xl']}`);
    if (spacing['7xl']) classes.push(`7xl:${prefix}-${spacing['7xl']}`);
    return classes.join(' ');
  };

  return (
    <div
      className={cn(
        getSpacingClasses(padding, 'p'),
        getSpacingClasses(margin, 'm'),
        className
      )}
    >
      {children}
    </div>
  );
};

// ===== EXPORTS =====

export {
  UniversalResponsiveContainer,
  UniversalResponsiveGrid,
  UniversalResponsiveFlex,
  UniversalResponsiveText,
  UniversalResponsiveSpacing,
};
