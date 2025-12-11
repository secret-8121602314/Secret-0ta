import { Suspense, useEffect, useState } from 'react';
import App from './App';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { isPWAMode } from './utils/pwaDetection';

// Wrapper to handle router switching since App.tsx won't reload
export default function AppWrapper() {
  const envValue = import.meta.env.VITE_USE_ROUTER;
  const useRouter = envValue === 'true';
  const [isReady, setIsReady] = useState(false);

  // ✅ PWA COLD START FIX: Ensure DOM is ready before rendering
  useEffect(() => {
    if (isPWAMode()) {
      console.log('📱 [AppWrapper] PWA cold start detected');
      
      // Small delay to ensure DOM and styles are fully loaded
      const timer = setTimeout(() => {
        console.log('📱 [AppWrapper] Setting ready state');
        setIsReady(true);
      }, 50);

      return () => clearTimeout(timer);
    } else {
      // Non-PWA can render immediately
      setIsReady(true);
    }
  }, []);

  // ✅ PWA COLD START FIX: Show visible loading screen while waiting
  if (!isReady && isPWAMode()) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#0A0A0A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
        <div style={{ color: '#FFFFFF', fontSize: '20px' }}>Loading...</div>
      </div>
    );
  }

  if (useRouter) {
    return (
      <Suspense fallback={
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: '#0A0A0A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{ color: '#FFFFFF', fontSize: '20px' }}>Loading...</div>
        </div>
      }>
        <RouterProvider router={router} />
      </Suspense>
    );
  }

  return <App />;
}
