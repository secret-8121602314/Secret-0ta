/**
 * Advertisement Types for Google AdSense Integration
 * 
 * This file defines types for AdSense and advertisement management.
 * Currently prepared for future implementation with Google AdSense.
 */

export type AdFormat = 
  | 'display' // Standard display ads
  | 'in-feed' // Native ads in content feed
  | 'in-article' // Ads within articles
  | 'multiplex' // Grid of related content
  | 'matched-content'; // Related content recommendations

export type AdSize = 
  | 'responsive' // Auto-adjusts to container
  | '300x250' // Medium rectangle
  | '728x90' // Leaderboard
  | '320x50' // Mobile banner
  | '160x600' // Wide skyscraper
  | '300x600' // Half page
  | '970x250'; // Billboard

export type AdPlacement = 
  | 'header'
  | 'sidebar'
  | 'footer'
  | 'in-content'
  | 'chat-interface'
  | 'between-conversations'
  | 'modal';

export interface AdSlot {
  id: string;
  slotId: string; // AdSense ad slot ID
  placement: AdPlacement;
  format: AdFormat;
  size: AdSize;
  isActive: boolean;
  allowedTiers: ('free' | 'pro' | 'vanguard_pro')[]; // Only show to specific tiers
  minTimeBetweenAds?: number; // Minimum time in ms between ad displays
  impressionCap?: number; // Max impressions per session
}

export interface AdConfig {
  publisherId: string; // Google AdSense publisher ID (ca-pub-XXXXXXXXXXXXXXXX)
  isEnabled: boolean;
  isTestMode: boolean;
  slots: AdSlot[];
  globalSettings: {
    autoAds: boolean; // Enable Google Auto Ads
    personalizedAds: boolean; // User consent for personalized ads
    safeMode: boolean; // Family-safe content only
    blockCategories?: string[]; // Ad categories to block
  };
}

export interface AdImpression {
  slotId: string;
  userId?: string;
  timestamp: number;
  wasClicked: boolean;
  revenue?: number; // Estimated revenue from this impression
}

export interface AdPerformance {
  slotId: string;
  placement: AdPlacement;
  impressions: number;
  clicks: number;
  ctr: number; // Click-through rate
  revenue: number;
  period: {
    start: number;
    end: number;
  };
}

/**
 * Ad service interface for future implementation
 */
export interface IAdService {
  // Initialization
  initialize(config: AdConfig): Promise<void>;
  
  // Ad display control
  shouldShowAd(userId: string, tier: 'free' | 'pro' | 'vanguard_pro', placement: AdPlacement): boolean;
  loadAd(slotId: string): Promise<void>;
  refreshAd(slotId: string): Promise<void>;
  
  // User consent (GDPR/CCPA compliance)
  requestConsent(): Promise<boolean>;
  hasConsent(): boolean;
  revokeConsent(): void;
  
  // Performance tracking
  trackImpression(slotId: string, userId?: string): void;
  trackClick(slotId: string, userId?: string): void;
  getPerformance(startDate: number, endDate: number): Promise<AdPerformance[]>;
  
  // Ad blocking detection
  detectAdBlocker(): Promise<boolean>;
}

/**
 * Component props for ad containers
 */
export interface AdContainerProps {
  slotId: string;
  placement: AdPlacement;
  format?: AdFormat;
  size?: AdSize;
  className?: string;
  fallbackContent?: React.ReactNode; // Content to show if ads are blocked
  onAdLoaded?: () => void;
  onAdFailed?: (error: Error) => void;
}
