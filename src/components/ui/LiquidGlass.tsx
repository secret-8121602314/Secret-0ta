import React, { useId, memo } from 'react';
import { clsx } from 'clsx';

/**
 * Liquid Glass Effect Component
 * Inspired by Apple's visionOS and modern glass morphism trends
 * 
 * Features:
 * - SVG displacement filter for liquid distortion
 * - Multi-layer inset shadows for depth
 * - Backdrop blur with gradient overlays
 */

// ============================================================================
// Glass Shadow Constants
// ============================================================================

export const GLASS_SHADOW_DARK = `
  shadow-[0_0_8px_rgba(0,0,0,0.15),0_4px_12px_rgba(0,0,0,0.25),inset_2px_2px_4px_-2px_rgba(255,255,255,0.1),inset_-2px_-2px_4px_-2px_rgba(0,0,0,0.3),inset_0_0_8px_4px_rgba(255,255,255,0.05)]
`;

export const GLASS_SHADOW_BUTTON = `
  shadow-[0_2px_8px_rgba(0,0,0,0.2),inset_1px_1px_2px_-1px_rgba(255,255,255,0.15),inset_-1px_-1px_2px_-1px_rgba(0,0,0,0.2)]
`;

export const GLASS_SHADOW_INPUT = `
  shadow-[0_0_10px_rgba(0,0,0,0.2),0_4px_16px_rgba(0,0,0,0.15),inset_2px_2px_6px_-3px_rgba(255,255,255,0.08),inset_-2px_-2px_6px_-3px_rgba(0,0,0,0.25),inset_0_0_12px_6px_rgba(255,255,255,0.03)]
`;

// ============================================================================
// Glass Filter Component (SVG-based distortion)
// ============================================================================

interface GlassFilterProps {
  id: string;
  scale?: number;
  blur?: number;
}

export const GlassFilter = memo(({ 
  id, 
  scale = 20,
  blur = 3 
}: GlassFilterProps) => (
  <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
    <defs>
      <filter
        id={id}
        colorInterpolationFilters="sRGB"
        height="200%"
        width="200%"
        x="-50%"
        y="-50%"
      >
        <feTurbulence
          baseFrequency="0.03 0.03"
          numOctaves="2"
          result="turbulence"
          seed="2"
          type="fractalNoise"
        />
        <feGaussianBlur
          in="turbulence"
          result="blurredNoise"
          stdDeviation="1.5"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="blurredNoise"
          result="displaced"
          scale={scale}
          xChannelSelector="R"
          yChannelSelector="B"
        />
        <feGaussianBlur 
          in="displaced" 
          result="finalBlur" 
          stdDeviation={blur} 
        />
        <feComposite 
          in="finalBlur" 
          in2="finalBlur" 
          operator="over" 
        />
      </filter>
    </defs>
  </svg>
));

GlassFilter.displayName = 'GlassFilter';

// ============================================================================
// Liquid Glass Container
// ============================================================================

interface LiquidGlassContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glassIntensity?: 'subtle' | 'medium' | 'strong';
  enableFilter?: boolean;
  filterScale?: number;
}

export const LiquidGlassContainer: React.FC<LiquidGlassContainerProps> = ({
  children,
  className,
  glassIntensity = 'medium',
  enableFilter = true,
  filterScale = 15,
  ...props
}) => {
  const filterId = useId();

  const intensityClasses = {
    subtle: 'bg-[#1A1A1A]/70 backdrop-blur-sm',
    medium: 'bg-[#1A1A1A]/80 backdrop-blur-md',
    strong: 'bg-[#1A1A1A]/90 backdrop-blur-xl',
  };

  return (
    <>
      {enableFilter && <GlassFilter id={filterId} scale={filterScale} />}
      <div
        className={clsx(
          'relative overflow-hidden transition-all duration-300',
          intensityClasses[glassIntensity],
          className
        )}
        {...props}
      >
        {/* Glass shadow overlay */}
        <div 
          className="pointer-events-none absolute inset-0 rounded-[inherit] transition-all"
          style={{
            boxShadow: `
              0 0 8px rgba(0,0,0,0.15),
              0 4px 12px rgba(0,0,0,0.25),
              inset 2px 2px 4px -2px rgba(255,255,255,0.1),
              inset -2px -2px 4px -2px rgba(0,0,0,0.3),
              inset 0 0 8px 4px rgba(255,255,255,0.05)
            `
          }}
        />
        
        {/* Liquid distortion layer */}
        {enableFilter && (
          <div
            className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[inherit]"
            style={{ 
              backdropFilter: `url("#${filterId}")`,
              WebkitBackdropFilter: `url("#${filterId}")`
            }}
          />
        )}

        {/* Content */}
        <div className="relative z-10">{children}</div>

        {/* Subtle hover shimmer */}
        <div className="pointer-events-none absolute inset-0 z-20 rounded-[inherit] bg-gradient-to-r from-transparent via-white/[0.03] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>
    </>
  );
};

// ============================================================================
// Liquid Glass Button
// ============================================================================

interface LiquidGlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  enableFilter?: boolean;
}

export const LiquidGlassButton: React.FC<LiquidGlassButtonProps> = ({
  children,
  className,
  variant = 'default',
  size = 'md',
  enableFilter = false, // Disabled by default for buttons (performance)
  disabled,
  ...props
}) => {
  const filterId = useId();

  const sizeClasses = {
    sm: 'w-10 h-10 rounded-lg',
    md: 'w-12 h-12 sm:w-14 sm:h-14 rounded-xl',
    lg: 'w-14 h-14 sm:w-16 sm:h-16 rounded-2xl',
  };

  const variantStyles = {
    default: {
      base: 'bg-gradient-to-br from-[#2A2A2A]/90 to-[#1A1A1A]/90 text-[#A3A3A3] hover:text-[#F5F5F5]',
      shadow: `
        0 2px 8px rgba(0,0,0,0.3),
        inset 1px 1px 3px -1px rgba(255,255,255,0.15),
        inset -1px -1px 3px -1px rgba(0,0,0,0.3),
        inset 0 0 6px 2px rgba(255,255,255,0.03)
      `,
      hoverShadow: `
        0 4px 12px rgba(0,0,0,0.4),
        inset 1px 1px 4px -1px rgba(255,255,255,0.2),
        inset -1px -1px 4px -1px rgba(0,0,0,0.3),
        inset 0 0 8px 3px rgba(255,255,255,0.05),
        0 0 20px rgba(255,255,255,0.05)
      `
    },
    primary: {
      base: 'bg-gradient-to-br from-[#FFAB40] to-[#FF8C00] text-[#181818] font-semibold',
      shadow: `
        0 2px 10px rgba(255,171,64,0.3),
        inset 1px 1px 3px -1px rgba(255,255,255,0.4),
        inset -1px -1px 3px -1px rgba(0,0,0,0.15),
        inset 0 0 8px 2px rgba(255,255,255,0.1)
      `,
      hoverShadow: `
        0 4px 20px rgba(255,171,64,0.5),
        inset 1px 1px 4px -1px rgba(255,255,255,0.5),
        inset -1px -1px 4px -1px rgba(0,0,0,0.2),
        inset 0 0 12px 4px rgba(255,255,255,0.15),
        0 0 30px rgba(255,171,64,0.3)
      `
    },
    danger: {
      base: 'bg-gradient-to-br from-[#EF4444] to-[#DC2626] text-white',
      shadow: `
        0 2px 10px rgba(239,68,68,0.3),
        inset 1px 1px 3px -1px rgba(255,255,255,0.3),
        inset -1px -1px 3px -1px rgba(0,0,0,0.2),
        inset 0 0 8px 2px rgba(255,255,255,0.08)
      `,
      hoverShadow: `
        0 4px 20px rgba(239,68,68,0.5),
        inset 1px 1px 4px -1px rgba(255,255,255,0.4),
        inset -1px -1px 4px -1px rgba(0,0,0,0.25),
        inset 0 0 12px 4px rgba(255,255,255,0.1),
        0 0 30px rgba(239,68,68,0.3)
      `
    }
  };

  const style = variantStyles[variant];

  return (
    <>
      {enableFilter && <GlassFilter id={filterId} scale={50} blur={2} />}
      <button
        className={clsx(
          'group relative flex items-center justify-center overflow-hidden transition-all duration-300',
          sizeClasses[size],
          style.base,
          disabled 
            ? 'opacity-40 cursor-not-allowed scale-100' 
            : 'hover:scale-105 active:scale-95',
          className
        )}
        style={{
          boxShadow: style.shadow
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            (e.currentTarget as HTMLButtonElement).style.boxShadow = style.hoverShadow;
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.boxShadow = style.shadow;
        }}
        disabled={disabled}
        {...props}
      >
        {/* Glass overlay */}
        <div 
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)'
          }}
        />
        
        {/* Liquid filter layer */}
        {enableFilter && (
          <div
            className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[inherit]"
            style={{ 
              backdropFilter: `url("#${filterId}")`,
              WebkitBackdropFilter: `url("#${filterId}")`
            }}
          />
        )}

        {/* Content */}
        <span className="relative z-10">{children}</span>

        {/* Hover shimmer effect */}
        <div className="pointer-events-none absolute inset-0 z-20 rounded-[inherit] bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      </button>
    </>
  );
};

// ============================================================================
// Liquid Glass Input Container
// ============================================================================

interface LiquidGlassInputProps extends React.HTMLAttributes<HTMLDivElement> {
  isFocused?: boolean;
  accentColor?: string;
}

export const LiquidGlassInput: React.FC<LiquidGlassInputProps> = ({
  children,
  className,
  isFocused = false,
  accentColor = '#FF4D4D',
  ...props
}) => {
  const filterId = useId();

  return (
    <>
      <GlassFilter id={filterId} scale={12} blur={2} />
      
      {/* Gradient border wrapper */}
      <div 
        className={clsx(
          'rounded-2xl p-px transition-all duration-300',
          className
        )}
        style={{
          background: isFocused 
            ? `linear-gradient(135deg, ${accentColor}, #FFAB40)`
            : 'linear-gradient(135deg, rgba(66,66,66,0.4), rgba(66,66,66,0.2))'
        }}
        {...props}
      >
        {/* Inner container with glass effect */}
        <div
          className="relative overflow-hidden rounded-[15px] bg-gradient-to-br from-[#1A1A1A]/95 to-[#0F0F0F]/95 backdrop-blur-md"
          style={{
            boxShadow: isFocused
              ? `
                0 0 20px rgba(255,77,77,0.2),
                0 0 40px rgba(255,171,64,0.15),
                0 8px 32px rgba(0,0,0,0.4),
                inset 2px 2px 6px -3px rgba(255,255,255,0.1),
                inset -2px -2px 6px -3px rgba(0,0,0,0.3),
                inset 0 0 20px 8px rgba(255,77,77,0.03)
              `
              : `
                0 4px 20px rgba(0,0,0,0.3),
                inset 2px 2px 6px -3px rgba(255,255,255,0.08),
                inset -2px -2px 6px -3px rgba(0,0,0,0.25),
                inset 0 0 12px 6px rgba(255,255,255,0.02)
              `
          }}
        >
          {/* Liquid distortion layer */}
          <div
            className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[inherit]"
            style={{ 
              backdropFilter: `url("#${filterId}")`,
              WebkitBackdropFilter: `url("#${filterId}")`
            }}
          />

          {/* Glass shine overlay */}
          <div 
            className="pointer-events-none absolute inset-0 rounded-[inherit]"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.1) 100%)'
            }}
          />

          {/* Content */}
          <div className="relative z-10">{children}</div>

          {/* Animated glow on focus */}
          {isFocused && (
            <div 
              className="pointer-events-none absolute inset-0 z-20 rounded-[inherit] animate-pulse"
              style={{
                background: 'radial-gradient(ellipse at 50% 0%, rgba(255,77,77,0.1) 0%, transparent 70%)'
              }}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default {
  LiquidGlassContainer,
  LiquidGlassButton,
  LiquidGlassInput,
  GlassFilter,
};
