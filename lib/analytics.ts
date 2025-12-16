/**
 * Google Analytics / Google Tag Manager Configuration
 * 
 * This file contains all Google Analytics and tracking-related code.
 * Centralized location for all analytics functionality.
 */

// Google Tag Manager Container ID
export const GTM_CONTAINER_ID = 'GTM-MLXV5Z9X';

/**
 * Initialize Google Tag Manager
 * This should be called once when the app loads
 */
export function initializeGTM(): void {
  if (typeof window === 'undefined') return;
  
  // Check if GTM is already initialized
  if ((window as any).dataLayer) {
    return;
  }

  // Initialize dataLayer
  (window as any).dataLayer = (window as any).dataLayer || [];
  
  // GTM script injection
  (function(w: any, d: Document, s: string, l: string, i: string) {
    w[l] = w[l] || [];
    w[l].push({
      'gtm.start': new Date().getTime(),
      event: 'gtm.js'
    });
    const f = d.getElementsByTagName(s)[0];
    const j = d.createElement(s) as HTMLScriptElement;
    const dl = l !== 'dataLayer' ? '&l=' + l : '';
    j.async = true;
    j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
    if (f && f.parentNode) {
      f.parentNode.insertBefore(j, f);
    }
  })(window, document, 'script', 'dataLayer', GTM_CONTAINER_ID);
}

/**
 * Push an event to Google Tag Manager dataLayer
 * @param eventName - Name of the event
 * @param eventData - Additional event data (optional)
 */
export function trackEvent(eventName: string, eventData?: Record<string, any>): void {
  if (typeof window === 'undefined') return;
  
  if (!(window as any).dataLayer) {
    (window as any).dataLayer = [];
  }
  
  (window as any).dataLayer.push({
    event: eventName,
    ...eventData
  });
}

/**
 * Track page view / scene change
 * @param sceneName - Name of the scene (e.g., 'main-menu', 'gameplay', 'ending')
 */
export function trackPageView(sceneName: string): void {
  trackEvent('page_view', {
    page_title: sceneName,
    page_location: window.location.href,
    page_path: window.location.pathname
  });
}

/**
 * Track game event
 * @param eventType - Type of game event (e.g., 'game_start', 'game_over', 'collectible_collected')
 * @param eventData - Additional event data
 */
export function trackGameEvent(eventType: string, eventData?: Record<string, any>): void {
  trackEvent('game_event', {
    event_type: eventType,
    ...eventData
  });
}

/**
 * Track distance milestone (for analytics tracking via hidden element)
 * This is used by the hidden meter counter in GameUI.tsx
 * The GTM can read the #meter-counter element value for distance tracking
 */
export function updateDistanceTracking(distance: number): void {
  // The distance is tracked via the hidden #meter-counter element in GameUI.tsx
  // GTM can be configured to read this element's value
  // This function can be used for additional programmatic tracking if needed
  trackEvent('distance_update', {
    distance: distance
  });
}

/**
 * Get GTM noscript iframe HTML
 * This should be placed in the <body> tag for users with JavaScript disabled
 */
export function getGTMNoscriptHTML(): string {
  return `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_CONTAINER_ID}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`;
}

