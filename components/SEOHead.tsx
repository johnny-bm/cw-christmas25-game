import { useEffect } from 'react';
import { textConfig } from '../lib/textConfig';

/**
 * SEO Head Component
 * Dynamically updates meta tags in the document head
 * This ensures SEO metadata stays in sync with textConfig
 */
export function SEOHead() {
  useEffect(() => {
    const seo = textConfig.seo;
    
    // Dynamically determine base URL based on current hostname
    // Supports both fun.crackwits.com (subdomain) and crackwits.com/game/christmas25 (path-based)
    // Always use canonical URL without www (www redirects to non-www)
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const pathname = window.location.pathname;
    
    // Determine the base URL for the page
    let baseUrl: string;
    if (hostname === 'fun.crackwits.com' || hostname.includes('fun.')) {
      // Subdomain route - use root path
      baseUrl = `${protocol}//${hostname}`;
    } else {
      // Path-based route - use canonical domain (remove www if present)
      const canonicalHostname = hostname.replace(/^www\./, ''); // Remove www prefix
      const normalizedPath = pathname.toLowerCase().replace(/\/$/, '') || '/game/christmas25';
      baseUrl = `${protocol}//${canonicalHostname}${normalizedPath}`;
    }
    
    // Static assets are served from the game path
    const canonicalHostname = hostname.replace(/^www\./, '');
    // Determine the game path for assets
    let gamePath = '';
    if (hostname !== 'fun.crackwits.com' && !hostname.includes('fun.')) {
      // Path-based route - assets are under /game/Christmas25
      gamePath = '/game/Christmas25';
    }
    const imageUrl = `${protocol}//${canonicalHostname}${gamePath}${seo.ogImage}`;
    const logoUrl = `${protocol}//${canonicalHostname}${gamePath}/Assets/CW-Logo.svg`;

    // Update title
    document.title = seo.title;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Standard meta tags
    updateMetaTag('description', seo.description);
    updateMetaTag('keywords', seo.keywords);

    // Open Graph tags
    updateMetaTag('og:type', seo.ogType, true);
    updateMetaTag('og:url', baseUrl, true);
    updateMetaTag('og:title', seo.ogTitle, true);
    updateMetaTag('og:description', seo.ogDescription, true);
    updateMetaTag('og:image', imageUrl, true);
    updateMetaTag('og:image:secure_url', imageUrl, true);
    updateMetaTag('og:image:type', 'image/jpeg', true);
    updateMetaTag('og:image:width', '1600', true);
    updateMetaTag('og:image:height', '840', true);
    updateMetaTag('og:image:alt', seo.ogTitle, true);
    updateMetaTag('og:site_name', 'CRACKWITS', true);
    updateMetaTag('og:locale', 'en_US', true);
    updateMetaTag('og:logo', logoUrl, true);

    // Twitter tags
    updateMetaTag('twitter:card', seo.twitterCard);
    updateMetaTag('twitter:title', seo.twitterTitle);
    updateMetaTag('twitter:text:title', seo.twitterTitle);
    updateMetaTag('twitter:description', seo.twitterDescription);
    updateMetaTag('twitter:image', imageUrl);
    updateMetaTag('twitter:image:alt', seo.twitterTitle);
  }, []);

  return null; // This component doesn't render anything
}

