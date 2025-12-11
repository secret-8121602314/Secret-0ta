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
import RootLayout from './routes/RootLayout';

/**
 * Router loader: Check authentication and onboarding status
 * This runs before each route renders to ensure proper navigation flow
 */
async function authLoader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const pathname = url.pathname;

    // Get current auth session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    // Not authenticated - allow access to landing and login pages
        if (pathname !== '/' && pathname !== '/earlyaccess') {
            return redirect('/');
    }
    return { user: null, onboardingStatus: 'login' as OnboardingStatus };
  }

    // Use RPC function to get complete user data
  const { data: rpcData, error: rpcError } = await supabase
    .rpc('get_complete_user_data', { p_auth_user_id: session.user.id });

  if (rpcError || !rpcData || rpcData.length === 0) {
    // If user has a session but no database record, redirect to onboarding
    if (session) {
            if (pathname === '/' || pathname === '/login') {
        return redirect('/onboarding');
      }
      return { user: null, onboardingStatus: 'initial' as OnboardingStatus };
    }
    
        return { user: null, onboardingStatus: 'login' as OnboardingStatus };
  }

  const userData = rpcData[0];

  // Parse app_state to get onboarding status
  const appState = (userData.app_state || {}) as import('../types/enhanced').UserAppState;
  const onboardingStatus: OnboardingStatus = (appState.onboardingStatus as OnboardingStatus) || 'initial';

    // Redirect authenticated users away from landing/login pages
  if (pathname === '/' || pathname === '/earlyaccess') {
    if (onboardingStatus === 'complete') {
            return redirect('/app');
    } else if (onboardingStatus !== 'login') {
            return redirect('/onboarding');
    }
  }

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
        return redirect('/');
  }

    const currentPath = new URL(request.url).pathname;

  // If onboarding is complete, redirect to app (unless they're explicitly viewing onboarding screens)
  if (onboardingStatus === 'complete') {
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
        return { user, onboardingStatus };
  }

  // Handle /onboarding root path - redirect to first screen
  if (currentPath === '/onboarding') {
        return redirect('/onboarding/welcome');
  }

  // Invalid path - redirect to welcome
    return redirect('/onboarding/welcome');
}

/**
 * App guard: Ensure onboarding is complete before accessing main app
 */
async function appLoader({ request }: LoaderFunctionArgs) {
  const result = await authLoader({ request, params: {}, context: {} });
  const { user, onboardingStatus } = result as { user: Partial<User>; onboardingStatus: string };
  
  if (!user) {
        return redirect('/');
  }

    if (onboardingStatus !== 'complete') {
        return redirect('/onboarding');
  }

    return { user, onboardingStatus };
}

/**
 * Route definitions
 * All routes are wrapped in RootLayout for PWA lifecycle handling
 */
const routes: RouteObject[] = [
  {
    // Root layout wrapper for PWA lifecycle management
    element: <RootLayout />,
    children: [
      {
        path: '/',
        loader: authLoader,
        element: <LandingPageRoute />,
      },
      {
        path: '/earlyaccess',
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
      // Modal routes - redirect to landing with modal param
      {
        path: '/about',
        loader: () => redirect('/?modal=about'),
      },
      {
        path: '/privacy',
        loader: () => redirect('/?modal=privacy'),
      },
      {
        path: '/terms',
        loader: () => redirect('/?modal=terms'),
      },
      {
        path: '/refund',
        loader: () => redirect('/?modal=refund'),
      },
      {
        path: '/contact',
        loader: () => redirect('/?modal=contact'),
      },
      {
        path: '/blog',
        loader: () => redirect('/?modal=blog'),
      },
      {
        path: '/blog/:slug',
        loader: ({ params }) => redirect(`/?modal=blog&post=${params.slug}`),
      },
      // Catch-all: redirect to home
      {
        path: '*',
        loader: () => redirect('/'),
      },
    ],
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
