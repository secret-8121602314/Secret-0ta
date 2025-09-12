/**
 * Barrel exports for components
 * 
 * This file provides centralized exports for all components,
 * making imports cleaner and more maintainable.
 */

// App Components
export { default as App } from './App';

// Core Components
export { default as ChatMessage } from './ChatMessage';
export { default as ChatInput } from './ChatInput';
export { default as SuggestedPrompts } from './SuggestedPrompts';
export { default as MainViewContainer } from './MainViewContainer';
export { default as ConversationTabs } from './ConversationTabs';

// Modal Components
export { default as ConnectionModal } from './ConnectionModal';
export { default as HandsFreeModal } from './HandsFreeModal';
export { default as SettingsModal } from './SettingsModal';
export { default as ConfirmationModal } from './ConfirmationModal';
export { default as FeedbackModal } from './FeedbackModal';
export { default as CreditModal } from './CreditModal';
export { default as ContactUsModal } from './ContactUsModal';
export { default as PolicyModal } from './PolicyModal';
export { PlayerProfileSetupModal } from './PlayerProfileSetupModal';
export { default as OtakuDiaryModal } from './OtakuDiaryModal';
export { default as WishlistModal } from './WishlistModal';
export { default as CachePerformanceDashboard } from './CachePerformanceDashboard';

// Splash Screen Components
export { default as LoginSplashScreen } from './LoginSplashScreen';
export { default as InitialSplashScreen } from './InitialSplashScreen';
export { default as HowToUseSplashScreen } from './HowToUseSplashScreen';
export { default as ProFeaturesSplashScreen } from './ProFeaturesSplashScreen';
export { default as UpgradeSplashScreen } from './UpgradeSplashScreen';
export { default as SplashScreen } from './SplashScreen';

// UI Components
export { default as ContextMenu } from './ContextMenu';
export { default as PWAInstallBanner } from './PWAInstallBanner';
export { default as DailyCheckinBanner } from './DailyCheckinBanner';
export { default as AchievementNotification } from './AchievementNotification';
export { default as ErrorBoundary } from './ErrorBoundary';
export { default as Logo } from './Logo';
export { default as Spinner } from './Spinner';
export { default as Skeleton } from './Skeleton';

// Page Components
export { default as AboutPage } from './AboutPage';
export { default as PrivacyPolicyPage } from './PrivacyPolicyPage';
export { default as RefundPolicyPage } from './RefundPolicyPage';

// Icon Components
export { default as SettingsIcon } from './SettingsIcon';
export { default as UserIcon } from './UserIcon';
export { default as LogoutIcon } from './LogoutIcon';
export { default as EditIcon } from './EditIcon';
export { default as TrashIcon } from './TrashIcon';
export { default as PinIcon } from './PinIcon';
export { default as SendIcon } from './SendIcon';
export { default as MicIcon } from './MicIcon';
export { default as MicOffIcon } from './MicOffIcon';
export { default as CameraIcon } from './CameraIcon';
export { default as ImageIcon } from './ImageIcon';
export { default as TextIcon } from './TextIcon';
export { default as KeyboardIcon } from './KeyboardIcon';
export { default as DownloadIcon } from './DownloadIcon';
export { default as CheckIcon } from './CheckIcon';
export { default as CloseIcon } from './CloseIcon';
export { default as StarIcon } from './StarIcon';
export { default as ThumbUpIcon } from './ThumbUpIcon';
export { default as ThumbDownIcon } from './ThumbDownIcon';
export { default as GoogleIcon } from './GoogleIcon';
export { default as DiscordIcon } from './DiscordIcon';
export { default as EmailIcon } from './EmailIcon';
export { default as CreditCardIcon } from './CreditCardIcon';
export { default as BotIcon } from './BotIcon';
export { default as BookmarkIcon } from './BookmarkIcon';
export { default as QuestionMarkCircleIcon } from './QuestionMarkCircleIcon';
export { default as PencilIcon } from './PencilIcon';
export { default as PauseIcon } from './PauseIcon';
export { default as PlayIcon } from './PlayIcon';
export { default as EnterIcon } from './EnterIcon';
export { default as HintIcon } from './HintIcon';
export { default as UserCircleIcon } from './UserCircleIcon';
export { default as ScreenshotIcon } from './ScreenshotIcon';
export { default as DesktopIcon } from './DesktopIcon';

// Utility Components
export { default as ActionButtons } from './ActionButtons';
export { default as CreditIndicator } from './CreditIndicator';
export { default as HandsFreeToggle } from './HandsFreeToggle';
export { default as ScreenshotButton } from './ScreenshotButton';
export { default as TypingIndicator } from './TypingIndicator';
export { default as CircularProgress } from './CircularProgress';
export { default as SimpleLoadingSpinner } from './SimpleLoadingSpinner';
export { default as LottieLoader } from './LottieLoader';

// Tab Components
export { default as SubTabs } from './SubTabs';
// export { default as InsightTabs } from './InsightTabs'; // Component doesn't exist
export { default as OtakuDiaryTab } from './OtakuDiaryTab';
export { default as WishlistTab } from './WishlistTab';
export { default as FavoritesTab } from './FavoritesTab';
export { default as ToDoListTab } from './ToDoListTab';
export { default as HelpGuideTab } from './HelpGuideTab';

// Settings Components
export { default as GeneralSettingsTab } from './GeneralSettingsTab';
export { default as SubscriptionSettingsTab } from './SubscriptionSettingsTab';
export { default as UserPreferencesTab } from './UserPreferencesTab';

// Developer Components
export { default as DevTierSwitcher } from './DevTierSwitcher';
export { default as GuestTierSwitcher } from './GuestTierSwitcher';
export { default as AnalyticsDashboard } from './AnalyticsDashboard';
export { default as PerformanceDashboard } from './PerformanceDashboard';
export { default as PerformanceOptimizations } from './PerformanceOptimizations';
// export { default as AdminCostDashboard } from './AdminCostDashboard'; // Component doesn't exist
// export { default as MigrationManager } from './MigrationManager'; // Component doesn't exist
// export { default as MigrationModal } from './MigrationModal'; // Component doesn't exist
// export { default as MigrationStatus } from './MigrationStatus'; // Component doesn't exist
// export { default as SupabaseMigrationStatus } from './SupabaseMigrationStatus';

// Feature Components
export { ProactiveInsightsPanel } from './ProactiveInsightsPanel';
export { default as InsightActionModal } from './InsightActionModal';
// export { default as InsightModal } from './InsightModal'; // Component doesn't exist
// export { default as GameProgressModal } from './GameProgressModal'; // Component doesn't exist
// export { default as TierSplashScreen } from './TierSplashScreen'; // Component doesn't exist
// export { default as TierUpgradeModal } from './TierUpgradeModal'; // Component doesn't exist
export { default as UITutorial } from './UITutorial';
export { default as AdBanner } from './AdBanner';

// Specialized Components
export { default as CharacterImmersionTest } from './CharacterImmersionTest';
export { default as AIContextDemo } from './AIContextDemo';
export { default as LoadingAnimationDemo } from './LoadingAnimationDemo';
export { default as LoadingUsageExamples } from './LoadingUsageExamples';
export { default as ScreenLockDebug } from './ScreenLockDebug';
// export { default as TestProfileSetup } from './TestProfileSetup'; // Component doesn't exist
export { default as ManualUploadToggle } from './ManualUploadToggle';
// export { default as ModelToggle } from './ModelToggle'; // Component doesn't exist
export { default as MobileNavigation } from './MobileNavigation';
export { default as CommandSuggestions } from './CommandSuggestions';
export { default as FeedbackButtons } from './FeedbackButtons';
export { default as UserAvatar } from './UserAvatar';
export { default as VoiceChatInput } from './VoiceChatInput';
// export { default as UniversalCacheStatus } from './UniversalCacheStatus'; // Component doesn't exist
export { default as DailyCacheStatus } from './DailyCacheStatus';

// Founder Components
export { default as FounderImage } from './FounderImage';
export { default as FounderProfile } from './FounderProfile';

// UI Components
export { default as Button } from './ui/Button';

// Enhanced UI Components
export { default as EnhancedButton } from './ui/EnhancedButton';
export { default as EnhancedInput } from './ui/EnhancedInput';
export { default as EnhancedModal } from './ui/EnhancedModal';
export { 
  EnhancedCard,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from './ui/EnhancedCard';
export {
  LoadingSpinner,
  Skeleton as EnhancedSkeleton,
  SkeletonCard,
  SkeletonText,
  SkeletonButton,
  ProgressBar,
  LoadingOverlay,
  LoadingButton
} from './ui/LoadingStates';
export {
  ToastProvider,
  useToast,
  useToastNotifications,
  ToastComponent
} from './ui/ToastSystem';

// Onboarding Components
export { default as OnboardingFlow } from './onboarding/OnboardingFlow';
export {
  WelcomeStep,
  ProfileSetupStep,
  FeaturesTourStep,
  PlatformSetupStep,
  CompletionStep
} from './onboarding/OnboardingSteps';

// Feedback Components
export {
  FeedbackModal as EnhancedFeedbackModal,
  ContextualHelp,
  FeedbackTrigger
} from './feedback/FeedbackSystem';
export type { FeedbackType, FeedbackData } from './feedback/FeedbackSystem';

// User Guidance Components
export {
  Tooltip,
  InteractiveTutorial,
  GuidanceHighlight,
  HelpPanel
} from './guidance/UserGuidance';

// Responsive Layout Components
export {
  ResponsiveContainer,
  ResponsiveGrid,
  ResponsiveFlex,
  ResponsiveStack,
  ResponsiveHide,
  ResponsiveText,
  ResponsiveSpacing
} from './layout/ResponsiveLayout';

// Mobile-Optimized Components
export {
  MobileDrawer,
  MobileBottomSheet,
  MobileSwipeableCard,
  MobilePullToRefresh,
  MobileFAB
} from './mobile/MobileOptimized';
export {
  SwipeGesture,
  PinchZoom,
  HapticFeedback,
  MobileNavigationGestures,
  MobileScrollIndicators,
  MobileTouchTargets,
  MobileOrientationHandler
} from './mobile/AdvancedMobileInteractions';
export {
  MobileTabBar,
  MobileSearchBar,
  MobileCarousel,
  MobileAccordion,
  MobileFAB as MobileFABPattern,
  MobilePullToRefresh as MobilePullToRefreshPattern
} from './mobile/MobileUIPatterns';

// Accessibility Components
export {
  AccessibleButton,
  AccessibleInput,
  AccessibleModal,
  AccessibleToggle,
  AccessibleListbox,
  AccessibleSkipLink
} from './accessibility/AccessibleComponents';
export {
  AccessibilityAudit,
  ColorContrastTester,
  ScreenReaderTester,
  AccessibilityDashboard
} from './accessibility/AccessibilityTesting';

// Performance Components
export {
  LazyImage,
  ResponsiveImage,
  VirtualizedList,
  PerformanceMonitor,
  DebouncedInput,
  MemoizedComponent,
  PerformanceCard
} from './performance/PerformanceComponents';
