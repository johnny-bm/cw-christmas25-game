import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './globals.css';
import { initializeGTM, initializeUTMTracking, debugUTMParameters } from './lib/analytics';

// Dynamically determine basename based on current pathname
// Only use basename if we're actually on the /game/Christmas25 path
// This prevents router errors when visiting other paths
const getBasename = (): string | undefined => {
  if (import.meta.env.DEV) {
    // In development, never use basename
    return undefined;
  }
  
  // In production, check if we're on the /game/Christmas25 path
  const pathname = window.location.pathname;
  // Normalize pathname (remove trailing slash)
  const normalizedPath = pathname.replace(/\/$/, '') || '/';
  
  // Only use basename if pathname exactly matches or starts with /game/Christmas25
  // This ensures React Router can properly match routes
  if (normalizedPath === '/game/Christmas25' || normalizedPath.startsWith('/game/Christmas25/')) {
    return '/game/Christmas25';
  }
  
  // If not on that path, don't use basename (prevents router mismatch errors)
  return undefined;
};

const basename = getBasename();

// Initialize Google Tag Manager
initializeGTM();

// Initialize UTM parameter tracking (captures marketing attribution)
initializeUTMTracking();

// Make UTM debug function available globally
if (typeof window !== 'undefined') {
  (window as any).checkUTM = debugUTMParameters;
}

// Prevent zoom on mobile devices
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  // Prevent double-tap zoom
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (event) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, { passive: false });

  // Prevent pinch zoom
  document.addEventListener('touchmove', (event) => {
    if (event.touches.length > 1) {
      event.preventDefault();
    }
  }, { passive: false });

  // Prevent gesture zoom (iOS Safari)
  document.addEventListener('gesturestart', (event) => {
    event.preventDefault();
  }, { passive: false });

  document.addEventListener('gesturechange', (event) => {
    event.preventDefault();
  }, { passive: false });

  document.addEventListener('gestureend', (event) => {
    event.preventDefault();
  }, { passive: false });

  // Reset zoom if it somehow gets set
  const resetZoom = () => {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-content');
    }
  };

  // Reset zoom on orientation change
  window.addEventListener('orientationchange', () => {
    setTimeout(resetZoom, 100);
  });

  // Reset zoom periodically to prevent any zoom from being applied
  setInterval(resetZoom, 1000);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter basename={basename}>
    <App />
  </BrowserRouter>
);

