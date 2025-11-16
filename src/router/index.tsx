import { createBrowserRouter, RouteObject, redirect, LoaderFunctionArgs } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { User, OnboardingStatus, UserTier } from '../types';

// Import route wrapper components directly (not lazy - they're already wrapped in Suspense in App.tsx)
import LandingPageRoute from './routes/LandingPageRoute';
import LoginRoute from './routes/LoginRoute';
import AuthCallbackRoute from './routes/AuthCallbackRoute';
import InitialOnboardingRoute from './routes/InitialOnboardingRoute';
import HowToUseRoute from './routes/HowToUseRoute';
import FeaturesConnectedRoute from './routes/FeaturesConnectedRoute';
import ProFeaturesRoute from './routes/ProFeaturesRoute';
import MainAppRoute from './routes/MainAppRoute';

/**
 * Router loader: Check authentication and onboarding status
 * This runs before each route renders to ensure proper navigation flow
 */
async function authLoader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  console.log('[Router authLoader] 🔐 Checking auth for path:', pathname);

  // Get current auth session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    // Not authenticated - allow access to landing and login pages
    console.log('[Router authLoader] ❌ No session found, user not authenticated');
    if (pathname !== '/' && pathname !== '/login') {
      console.log('[Router authLoader] 📍 Redirecting to landing page');
      return redirect('/');
    }
    return { user: null, onboardingStatus: 'login' as OnboardingStatus };
  }

  console.log('[Router authLoader] ✅ Session found for user:', session.user.email);

  // Fetch user data from database
  const { data: userData, error } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', session.user.id)
    .single();

  if (error || !userData) {
    console.error('[Router authLoader] ❌ Failed to load user data:', error);
    
    // If user has a session but no database record, treat as new user needing onboarding
    // This can happen if the user record was deleted but session still exists
    if (session && error?.code === 'PGRST116') {
      console.log('[Router authLoader] 👤 Session exists but no user record - treating as new user');
      return { user: null, onboardingStatus: 'initial' as OnboardingStatus };
    }
    
    return { user: null, onboardingStatus: 'login' as OnboardingStatus };
  }

  // Parse app_state to get onboarding status
  const appState = (userData.app_state || {}) as import('../types/enhanced').UserAppState;
  const onboardingStatus: OnboardingStatus = (appState.onboardingStatus as OnboardingStatus) || 'initial';

  console.log('[Router authLoader] 👤 Loaded user:', userData.email, '| Onboarding status:', onboardingStatus);

  // Map user data to User type
  const user: Partial<User> = {
    id: userData.id,
    authUserId: userData.auth_user_id,
    email: userData.email,
    tier: userData.tier as UserTier,
    hasProfileSetup: userData.has_profile_setup ?? undefined,
    hasSeenSplashScreens: userData.has_seen_splash_screens ?? undefined,
    hasSeenHowToUse: userData.has_seen_how_to_use ?? undefined,
    hasSeenFeaturesConnected: userData.has_seen_features_connected ?? undefined,
    hasSeenProFeatures: userData.has_seen_pro_features ?? undefined,
    pcConnected: userData.pc_connected ?? undefined,
    pcConnectionSkipped: userData.pc_connection_skipped ?? undefined,
    onboardingCompleted: userData.onboarding_completed ?? undefined,
    hasWelcomeMessage: userData.has_welcome_message ?? undefined,
    isNewUser: userData.is_new_user ?? undefined,
    hasUsedTrial: userData.has_used_trial ?? undefined,
    textCount: userData.text_count || 0,
    imageCount: userData.image_count || 0,
    textLimit: userData.text_limit || 0,
    imageLimit: userData.image_limit || 0,
    totalRequests: userData.total_requests || 0,
    lastReset: userData.last_reset ? new Date(userData.last_reset).getTime() : Date.now(),
    createdAt: userData.created_at ? new Date(userData.created_at).getTime() : Date.now(),
    updatedAt: userData.updated_at ? new Date(userData.updated_at).getTime() : Date.now(),
  };

  return { user, onboardingStatus };
}

/**
 * Onboarding guard: Redirect to appropriate onboarding step
 */
async function onboardingLoader({ request }: LoaderFunctionArgs) {
  const result = await authLoader({ request, params: {}, context: {} });
  const { user, onboardingStatus } = result as { user: Partial<User>; onboardingStatus: string };
  
  if (!user) {
    console.log('[Router onboardingLoader] ❌ No user, redirecting to landing');
    return redirect('/');
  }

  console.log('[Router onboardingLoader] 🎓 Processing onboarding for:', user.email, '| Status:', onboardingStatus);

  const currentPath = new URL(request.url).pathname;

  // If onboarding is complete, redirect to app (unless they're explicitly viewing onboarding screens)
  if (onboardingStatus === 'complete') {
    console.log('[Router onboardingLoader] ✅ Onboarding complete, redirecting to /app');
    return redirect('/app');
  }

  // Define valid onboarding paths
  const validOnboardingPaths = [
    '/onboarding/welcome',
    '/onboarding/how-to-use',
    '/onboarding/features',
    '/onboarding/pro-features',
  ];

  // Allow free navigation through all onboarding screens
  if (validOnboardingPaths.includes(currentPath)) {
    console.log('[Router onboardingLoader] ✅ Valid onboarding screen, allowing access:', currentPath);
    return { user, onboardingStatus };
  }

  // Handle /onboarding root path - redirect to first screen
  if (currentPath === '/onboarding') {
    console.log('[Router onboardingLoader] 📍 Redirecting /onboarding to welcome screen');
    return redirect('/onboarding/welcome');
  }

  // Invalid path - redirect to welcome
  console.log('[Router onboardingLoader] ⚠️ Invalid onboarding path, redirecting to welcome');
  return redirect('/onboarding/welcome');
}

/**
 * App guard: Ensure onboarding is complete before accessing main app
 */
async function appLoader({ request }: LoaderFunctionArgs) {
  const result = await authLoader({ request, params: {}, context: {} });
  const { user, onboardingStatus } = result as { user: Partial<User>; onboardingStatus: string };
  
  if (!user) {
    console.log('[Router appLoader] ❌ No user, redirecting to landing');
    return redirect('/');
  }

  console.log('[Router appLoader] 🚀 Attempting to access /app | User:', user.email, '| Onboarding:', onboardingStatus);

  if (onboardingStatus !== 'complete') {
    console.log('[Router appLoader] ⏸️  Onboarding not complete, redirecting to /onboarding');
    return redirect('/onboarding');
  }

  console.log('[Router appLoader] ✅ Onboarding complete, loading main app');
  return { user, onboardingStatus };
}

/**
 * Route definitions
 */
const routes: RouteObject[] = [
  {
    path: '/',
    loader: authLoader,
    element: <LandingPageRoute />,
  },
  {
    path: '/login',
    loader: authLoader,
    element: <LoginRoute />,
  },
  {
    path: '/auth/callback',
    element: <AuthCallbackRoute />,
  },
  {
    path: '/onboarding',
    loader: onboardingLoader,
    children: [
      {
        index: true,
        loader: onboardingLoader,
        element: <InitialOnboardingRoute />,
      },
      {
        path: 'welcome',
        loader: onboardingLoader,
        element: <InitialOnboardingRoute />,
      },
      {
        path: 'how-to-use',
        loader: onboardingLoader,
        element: <HowToUseRoute />,
      },
      {
        path: 'features',
        loader: onboardingLoader,
        element: <FeaturesConnectedRoute />,
      },
      {
        path: 'pro-features',
        loader: onboardingLoader,
        element: <ProFeaturesRoute />,
      },
    ],
  },
  {
    path: '/app',
    loader: appLoader,
    element: <MainAppRoute />,
  },
  {
    path: '/app/*',
    loader: appLoader,
    element: <MainAppRoute />,
  },
  // Catch-all: redirect to home
  {
    path: '*',
    loader: () => redirect('/'),
  },
];

/**
 * Create router with base path support for GitHub Pages
 */
export const router = createBrowserRouter(routes, {
  basename: '/',
});

/**
 * Helper function to check if router should be used
 */
export function shouldUseRouter(): boolean {
  return import.meta.env.VITE_USE_ROUTER === 'true';
}
