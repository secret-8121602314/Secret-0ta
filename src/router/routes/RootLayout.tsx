import { Outlet } from 'react-router-dom';
import PWALifecycleProvider from '../../components/PWALifecycleProvider';

/**
 * Root Layout Route
 * Wraps all routes with PWA lifecycle handling
 * This ensures visibility changes and PWA-specific behaviors work correctly
 */
export default function RootLayout() {
  return (
    <PWALifecycleProvider>
      <Outlet />
    </PWALifecycleProvider>
  );
}
