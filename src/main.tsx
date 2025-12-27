import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import AppWrapper from './AppWrapper.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './styles/globals.css';

// Start preloading images immediately on app startup
import './utils/imagePreloader';

// Application entry point
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find root element');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <HelmetProvider>
      <ErrorBoundary>
        <AppWrapper />
      </ErrorBoundary>
    </HelmetProvider>
  </React.StrictMode>,
)