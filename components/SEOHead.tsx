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
    // Use the actual deployed path (lowercase) so crawlers see consistent URLs
    const baseUrl = 'https://www.crackwits.com/game/christmas25';
    const imageUrl = `${baseUrl}${seo.ogImage}`;
    const logoUrl = `${baseUrl}/Assets/CW-Logo.svg`;

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
    updateMetaTag('og:image:width', '1200', true);
    updateMetaTag('og:image:height', '630', true);
    updateMetaTag('og:site_name', 'CRACKWITS', true);
    updateMetaTag('og:locale', 'en_US', true);
    updateMetaTag('og:logo', logoUrl, true);

    // Twitter tags
    updateMetaTag('twitter:card', seo.twitterCard);
    updateMetaTag('twitter:title', seo.twitterTitle);
    updateMetaTag('twitter:description', seo.twitterDescription);
    updateMetaTag('twitter:image', imageUrl);
  }, []);

  return null; // This component doesn't render anything
}

