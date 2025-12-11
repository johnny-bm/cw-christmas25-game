import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './globals.css';

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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter basename={basename}>
    <App />
  </BrowserRouter>
);

