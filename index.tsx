import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './src/index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <App />
);

// Service Worker Registration for PWA - Only in production
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    // Use relative path for better compatibility across different deployment scenarios
    const swPath = './sw.js';
    navigator.serviceWorker.register(swPath)
      .then((registration) => {
        console.log('✅ Service Worker registered successfully:', registration);
      })
      .catch((error) => {
        console.log('❌ Service Worker registration failed:', error);
      });
  });
} else if ('serviceWorker' in navigator && !import.meta.env.PROD) {
  // Unregister any existing service workers in development mode
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister();
        console.log('🧹 Service Worker unregistered for development mode');
      });
    });
  });
}