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
 * Automatically includes UTM parameters for attribution
 * @param eventName - Name of the event
 * @param eventData - Additional event data (optional)
 * @param includeUTM - Whether to include UTM parameters (default: true)
 */
export function trackEvent(eventName: string, eventData?: Record<string, any>, includeUTM: boolean = true): void {
  if (typeof window === 'undefined') return;
  
  if (!(window as any).dataLayer) {
    (window as any).dataLayer = [];
  }
  
  const utmData = includeUTM ? getUTMForTracking() : {};
  
  (window as any).dataLayer.push({
    event: eventName,
    ...utmData,
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

/**
 * UTM Parameter Tracking
 * Captures and stores UTM parameters from URL for marketing attribution
 * 
 * Campaign Structure:
 * - utm_source: Instagram, Facebook, X, LinkedIn, Website, Email, Newsletter, WhatsApp
 * - utm_campaign: CRWxChristmas25
 * - utm_medium: Instagram, Facebook, X, LinkedIn, Website, Email, Newsletter, WhatsApp, Footer
 * 
 * Example URLs:
 * - Instagram: ?utm_source=Instagram&utm_medium=Instagram&utm_campaign=CRWxChristmas25
 * - Facebook: ?utm_source=Facebook&utm_medium=Facebook&utm_campaign=CRWxChristmas25
 * - X: ?utm_source=X&utm_medium=X&utm_campaign=CRWxChristmas25
 * - LinkedIn: ?utm_source=LinkedIn&utm_medium=LinkedIn&utm_campaign=CRWxChristmas25
 * - Website: ?utm_source=Website&utm_medium=Website&utm_campaign=CRWxChristmas25
 * - Email: ?utm_source=Email&utm_medium=Email&utm_campaign=CRWxChristmas25
 * - Newsletter: ?utm_source=Newsletter&utm_medium=Newsletter&utm_campaign=CRWxChristmas25
 * - WhatsApp: ?utm_source=WhatsApp&utm_medium=WhatsApp&utm_campaign=CRWxChristmas25
 * - Game Footer: ?utm_source=Christmas25&utm_medium=Footer&utm_campaign=Christmas25
 */

// Standard UTM parameters to track
const UTM_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id' // Google Ads campaign ID
] as const;

export interface UTMParameters {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  utm_id?: string;
}

const UTM_STORAGE_KEY = 'escapeTheDeadline_utm_params';
const UTM_SESSION_KEY = 'escapeTheDeadline_utm_session';

/**
 * Extract UTM parameters from current URL
 * @returns Object containing all found UTM parameters
 */
export function extractUTMParameters(): UTMParameters {
  if (typeof window === 'undefined') return {};
  
  const urlParams = new URLSearchParams(window.location.search);
  const utmParams: UTMParameters = {};
  
  UTM_PARAMS.forEach(param => {
    const value = urlParams.get(param);
    if (value) {
      utmParams[param] = value;
    }
  });
  
  return utmParams;
}

/**
 * Store UTM parameters in localStorage (persists across sessions)
 * Also stores in sessionStorage for current session
 */
export function storeUTMParameters(utmParams: UTMParameters): void {
  if (typeof window === 'undefined') return;
  
  // Only store if we have at least one UTM parameter
  if (Object.keys(utmParams).length === 0) return;
  
  try {
    // Store in localStorage (first touch attribution - persists)
    const existingParams = getStoredUTMParameters();
    // Only update if we have new UTM parameters (first touch)
    if (Object.keys(existingParams).length === 0) {
      localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utmParams));
    }
    
    // Store in sessionStorage (last touch attribution - current session)
    sessionStorage.setItem(UTM_SESSION_KEY, JSON.stringify(utmParams));
  } catch (e) {
    // localStorage might be disabled or full
    console.warn('Failed to store UTM parameters:', e);
  }
}

/**
 * Get stored UTM parameters from localStorage (first touch)
 * @returns Stored UTM parameters or empty object
 */
export function getStoredUTMParameters(): UTMParameters {
  if (typeof window === 'undefined') return {};
  
  try {
    const stored = localStorage.getItem(UTM_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as UTMParameters;
    }
  } catch (e) {
    // localStorage might be disabled or corrupted
    console.warn('Failed to read stored UTM parameters:', e);
  }
  
  return {};
}

/**
 * Get current session UTM parameters from sessionStorage (last touch)
 * @returns Current session UTM parameters or empty object
 */
export function getSessionUTMParameters(): UTMParameters {
  if (typeof window === 'undefined') return {};
  
  try {
    const stored = sessionStorage.getItem(UTM_SESSION_KEY);
    if (stored) {
      return JSON.parse(stored) as UTMParameters;
    }
  } catch (e) {
    // sessionStorage might be disabled
    console.warn('Failed to read session UTM parameters:', e);
  }
  
  return {};
}

/**
 * Initialize UTM parameter tracking
 * Should be called once when the app loads
 * Captures UTM params from URL and stores them
 */
export function initializeUTMTracking(): void {
  if (typeof window === 'undefined') return;
  
  // Extract UTM parameters from current URL
  const utmParams = extractUTMParameters();
  
  // Store them if found
  if (Object.keys(utmParams).length > 0) {
    storeUTMParameters(utmParams);
    
    // Push UTM parameters to GTM dataLayer immediately
    pushUTMToDataLayer(utmParams);
  } else {
    // If no UTM params in URL, try to use stored ones
    const storedParams = getStoredUTMParameters();
    if (Object.keys(storedParams).length > 0) {
      pushUTMToDataLayer(storedParams);
    }
  }
}

/**
 * Push UTM parameters to GTM dataLayer
 * This makes them available for all GTM tags and triggers
 */
export function pushUTMToDataLayer(utmParams: UTMParameters): void {
  if (typeof window === 'undefined') return;
  
  if (!(window as any).dataLayer) {
    (window as any).dataLayer = [];
  }
  
  // Push UTM parameters to dataLayer
  (window as any).dataLayer.push({
    event: 'utm_parameters',
    ...utmParams
  });
}

/**
 * Get UTM parameters to include in tracking events
 * Returns both first touch (stored) and last touch (session) for comprehensive tracking
 */
export function getUTMForTracking(): Record<string, any> {
  const stored = getStoredUTMParameters();
  const session = getSessionUTMParameters();
  
  return {
    // First touch attribution (where user first came from)
    utm_source_first: stored.utm_source,
    utm_medium_first: stored.utm_medium,
    utm_campaign_first: stored.utm_campaign,
    utm_term_first: stored.utm_term,
    utm_content_first: stored.utm_content,
    utm_id_first: stored.utm_id,
    
    // Last touch attribution (current session)
    utm_source_last: session.utm_source || stored.utm_source,
    utm_medium_last: session.utm_medium || stored.utm_medium,
    utm_campaign_last: session.utm_campaign || stored.utm_campaign,
    utm_term_last: session.utm_term || stored.utm_term,
    utm_content_last: session.utm_content || stored.utm_content,
    utm_id_last: session.utm_id || stored.utm_id,
  };
}

/**
 * Debug helper: Check UTM parameters in browser console
 * Usage: In browser console, type: window.checkUTM()
 * This will log all UTM data to the console for verification
 */
export function debugUTMParameters(): void {
  if (typeof window === 'undefined') {
    console.log('UTM Debug: Not available in server environment');
    return;
  }
  
  const urlParams = extractUTMParameters();
  const stored = getStoredUTMParameters();
  const session = getSessionUTMParameters();
  const tracking = getUTMForTracking();
  const dataLayer = (window as any).dataLayer || [];
  
  console.group('🔍 UTM Parameter Debug');
  console.log('📋 Current URL Parameters:', urlParams);
  console.log('💾 Stored (First Touch):', stored);
  console.log('📱 Session (Last Touch):', session);
  console.log('📊 Tracking Data (for events):', tracking);
  console.log('📦 GTM dataLayer:', dataLayer);
  console.log('🔗 Current URL:', window.location.href);
  console.groupEnd();
  
  // Check if UTM parameters are in dataLayer
  const utmInDataLayer = dataLayer.some((item: any) => 
    item.utm_source || item.utm_medium || item.utm_campaign
  );
  
  if (utmInDataLayer) {
    console.log('✅ UTM parameters found in dataLayer');
  } else {
    console.warn('⚠️ UTM parameters not found in dataLayer');
  }
}

// Make debug function available globally in development
if (typeof window !== 'undefined') {
  // Always expose debug function (can be removed in production if needed)
  // In production, you can add: && window.location.hostname !== 'crackwits.com'
  (window as any).checkUTM = debugUTMParameters;
}

