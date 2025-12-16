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
import PaymentSuccess from '../components/PaymentSuccess';

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
    // New user: DB record doesn't exist yet
    // Create the user record in the database
    if (session) {
      console.log('[authLoader] New user detected - creating user record in database');
      
      // Get user metadata for name and avatar
      const authUser = session.user;
      const fullName = (authUser.user_metadata?.full_name || authUser.user_metadata?.name || 'User') as string;
      const avatarUrl = authUser.user_metadata?.avatar_url as string | undefined;
      
      // Create user record via RPC
      const { error: createError } = await supabase.rpc('create_user_record', {
        p_auth_user_id: authUser.id,
        p_email: authUser.email || '',
        p_full_name: fullName,
        p_avatar_url: avatarUrl,
        p_is_developer: false,
        p_tier: 'free'
      });
      
      if (createError) {
        // Check if it's a duplicate key error (user already exists)
        if (createError.code !== '23505' && !createError.message?.includes('duplicate key')) {
          console.error('[authLoader] Error creating user record:', createError);
        } else {
          console.log('[authLoader] User record already exists (duplicate key)');
        }
      } else {
        console.log('[authLoader] User record created successfully');
      }
      
      // Return minimal user object so onboarding can start
      const minimalUser: Partial<User> = {
        authUserId: session.user.id,
        email: session.user.email || '',
        tier: 'free' as UserTier,
        onboardingCompleted: false,
      };
      return { user: minimalUser, onboardingStatus: 'initial' as OnboardingStatus };
    }
    
    return { user: null, onboardingStatus: 'login' as OnboardingStatus };
  }

  const userData = rpcData[0];

  // Parse app_state to get onboarding status
  const appState = (userData.app_state || {}) as import('../types/enhanced').UserAppState;
  const onboardingStatus: OnboardingStatus = (appState.onboardingStatus as OnboardingStatus) || 'initial';

  console.log('🔍 [DEBUG authLoader] Current state:', {
    pathname,
    onboardingStatus,
    hasProfileSetup: userData.has_profile_setup,
    onboardingCompleted: userData.onboarding_completed,
    timestamp: new Date().toISOString()
  });

    // Redirect authenticated users away from landing/login pages
  if (pathname === '/' || pathname === '/earlyaccess') {
    console.log('🔍 [DEBUG authLoader] On landing/login page, checking redirect logic');
    if (onboardingStatus === 'complete') {
      console.log('🔍 [DEBUG authLoader] Onboarding complete - redirecting to /app');
            return redirect('/app');
    } else if (onboardingStatus !== 'login') {
      console.log('🔍 [DEBUG authLoader] Onboarding incomplete - redirecting to /onboarding');
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
  
  // If no user AND no session, redirect to login
  if (!user) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log('[onboardingLoader] No session found - redirecting to login');
      return redirect('/');
    }
    // If there's a session but no user, create minimal user for onboarding
    console.log('[onboardingLoader] Session exists but no user - creating minimal user');
    const minimalUser: Partial<User> = {
      authUserId: session.user.id,
      email: session.user.email || '',
      tier: 'free' as UserTier,
      onboardingCompleted: false,
    };
    return { user: minimalUser, onboardingStatus: 'initial' as OnboardingStatus };
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

  // Check if onboarding was just marked complete (bypass DB check)
  const onboardingJustCompleted = sessionStorage.getItem('otagon_onboarding_complete');
  if (onboardingJustCompleted === 'true') {
    console.log('[appLoader] Onboarding bypass flag detected - allowing access to app');
    sessionStorage.removeItem('otagon_onboarding_complete');
    return { user, onboardingStatus: 'complete' };
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
        path: '/payment-success',
        element: <PaymentSuccess />,
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
  future: {
    v7_startTransition: true,
  },
});

/**
 * Helper function to check if router should be used
 */
export function shouldUseRouter(): boolean {
  return import.meta.env.VITE_USE_ROUTER === 'true';
}
