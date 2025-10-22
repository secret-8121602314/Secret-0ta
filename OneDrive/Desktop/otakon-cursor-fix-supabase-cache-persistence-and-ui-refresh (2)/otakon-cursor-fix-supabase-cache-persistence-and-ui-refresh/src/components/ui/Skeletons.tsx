import React from 'react';

/**
 * Loading Skeleton Components
 * Replace spinners with content-aware skeletons for better perceived performance
 */

// ===========================================
// Base Skeleton Component
// ===========================================

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  variant = 'text',
  animation = 'pulse'
}) => {
  const baseClasses = 'bg-surface-light';
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg'
  };
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer bg-gradient-to-r from-surface-light via-surface to-surface-light bg-[length:200%_100%]',
    none: ''
  };

  return (
    <div 
      className={`
        ${baseClasses} 
        ${variantClasses[variant]} 
        ${animationClasses[animation]}
        ${className}
      `}
      aria-label="Loading..."
    />
  );
};

// ===========================================
// Chat Message Skeleton
// ===========================================

export const ChatMessageSkeleton: React.FC = () => {
  return (
    <div className="flex gap-3 p-4">
      {/* Avatar */}
      <Skeleton variant="circular" className="w-8 h-8 flex-shrink-0" />
      
      {/* Message content */}
      <div className="flex-1 space-y-2">
        {/* Name */}
        <Skeleton className="h-3 w-20" />
        
        {/* Message lines */}
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </div>
  );
};

// ===========================================
// Chat Interface Skeleton
// ===========================================

export const ChatInterfaceSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-surface-light p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton variant="circular" className="w-8 h-8" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden p-4 space-y-4">
        <ChatMessageSkeleton />
        <ChatMessageSkeleton />
        <ChatMessageSkeleton />
      </div>

      {/* Input area */}
      <div className="border-t border-surface-light p-4">
        <Skeleton className="h-12 w-full rounded-full" />
      </div>
    </div>
  );
};

// ===========================================
// Conversation List Skeleton
// ===========================================

export const ConversationItemSkeleton: React.FC = () => {
  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" className="w-10 h-10" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  );
};

export const ConversationListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <ConversationItemSkeleton key={i} />
      ))}
    </div>
  );
};

// ===========================================
// Settings Modal Skeleton
// ===========================================

export const SettingsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 p-6">
      {/* Section 1 */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton variant="rectangular" className="h-10 w-full" />
        <Skeleton variant="rectangular" className="h-10 w-full" />
      </div>

      {/* Section 2 */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton variant="rectangular" className="h-20 w-full" />
      </div>

      {/* Section 3 */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-28" />
        <div className="flex gap-3">
          <Skeleton variant="rectangular" className="h-10 flex-1" />
          <Skeleton variant="rectangular" className="h-10 flex-1" />
        </div>
      </div>
    </div>
  );
};

// ===========================================
// Game Hub Skeleton
// ===========================================

export const GameCardSkeleton: React.FC = () => {
  return (
    <div className="border border-surface-light rounded-lg p-4 space-y-3">
      {/* Game image */}
      <Skeleton variant="rectangular" className="h-40 w-full" />
      
      {/* Game title */}
      <Skeleton className="h-5 w-3/4" />
      
      {/* Game description */}
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      
      {/* Action button */}
      <Skeleton variant="rectangular" className="h-9 w-full" />
    </div>
  );
};

export const GameHubSkeleton: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Game grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <GameCardSkeleton />
        <GameCardSkeleton />
        <GameCardSkeleton />
        <GameCardSkeleton />
        <GameCardSkeleton />
        <GameCardSkeleton />
      </div>
    </div>
  );
};

// ===========================================
// Profile Skeleton
// ===========================================

export const ProfileSkeleton: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Avatar and name */}
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" className="w-20 h-20" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center space-y-2">
          <Skeleton className="h-8 w-16 mx-auto" />
          <Skeleton className="h-3 w-20 mx-auto" />
        </div>
        <div className="text-center space-y-2">
          <Skeleton className="h-8 w-16 mx-auto" />
          <Skeleton className="h-3 w-20 mx-auto" />
        </div>
        <div className="text-center space-y-2">
          <Skeleton className="h-8 w-16 mx-auto" />
          <Skeleton className="h-3 w-20 mx-auto" />
        </div>
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </div>
  );
};

// ===========================================
// Generic List Skeleton
// ===========================================

export const ListItemSkeleton: React.FC = () => {
  return (
    <div className="flex items-center gap-3 p-3">
      <Skeleton variant="circular" className="w-10 h-10" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton variant="circular" className="w-6 h-6" />
    </div>
  );
};

export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <div className="divide-y divide-surface-light">
      {Array.from({ length: count }).map((_, i) => (
        <ListItemSkeleton key={i} />
      ))}
    </div>
  );
};

// ===========================================
// Full Page Loading Skeleton
// ===========================================

export const PageSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-96" />
      </div>

      {/* Content */}
      <div className="space-y-4">
        <Skeleton variant="rectangular" className="h-48 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton variant="rectangular" className="h-32 w-full" />
          <Skeleton variant="rectangular" className="h-32 w-full" />
        </div>
        <Skeleton variant="rectangular" className="h-64 w-full" />
      </div>
    </div>
  );
};

// ===========================================
// All skeletons exported individually above
// Import as: import { ChatMessageSkeleton, Skeleton, etc. } from './Skeletons'
// ===========================================
