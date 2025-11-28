import React from 'react';
import ReactDOM from 'react-dom/client';
import AppWrapper from './AppWrapper.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './styles/globals.css';

// Start preloading images immediately on app startup
import './utils/imagePreloader';

// Application entry point
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppWrapper />
    </ErrorBoundary>
  </React.StrictMode>,
)