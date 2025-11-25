import { Suspense } from 'react';
import App from './App';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';

// Wrapper to handle router switching since App.tsx won't reload
export default function AppWrapper() {
  const envValue = import.meta.env.VITE_USE_ROUTER;
  const useRouter = envValue === 'true';

  if (useRouter) {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
          <div className="text-white text-xl">Loading...</div>
        </div>
      }>
        <RouterProvider router={router} />
      </Suspense>
    );
  }

  return <App />;
}
