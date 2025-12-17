# Open Graph Meta Tags - Fixes Applied

## Issues Identified & Fixed

### 1. ✅ Case Mismatch in Twitter Image URL
**Problem:** Twitter meta tag used `Christmas25` (capital C) while OG meta tags used `christmas25` (lowercase)
- **Before:** `https://www.crackwits.com/game/Christmas25/Assets/og-image.jpg`
- **After:** `https://crackwits.com/game/christmas25/Assets/og-image.jpg`

**Fixed in:** `index.html` line 47

### 4. ✅ WWW Subdomain Routing Issue
**Problem:** `www.crackwits.com/game/christmas25` returned 404, but all meta tags used www subdomain
- **Solution:** Updated all meta tags to use canonical URL without www (`https://crackwits.com`)
- **Added:** 301 permanent redirect from www to non-www in `vercel.json`
- **Before:** `https://www.crackwits.com/game/christmas25`
- **After:** `https://crackwits.com/game/christmas25`

**Fixed in:** `index.html`, `components/SEOHead.tsx`, `vercel.json`

### 2. ✅ Missing Image Alt Text
**Problem:** Missing `og:image:alt` and `twitter:image:alt` for accessibility
**Fixed:** Added alt text to both OG and Twitter meta tags

### 3. ✅ Dynamic URL Handling for Multiple Routes
**Problem:** `SEOHead` component hardcoded base URL, not supporting both:
- `fun.crackwits.com` (subdomain)
- `crackwits.com/game/christmas25` (path-based)

**Fixed:** Updated `SEOHead` to dynamically determine base URL based on current hostname and pathname

## Current Meta Tag Setup

### Static HTML (`index.html`)
All meta tags are present in the static HTML for crawler visibility:

```html
<!-- Open Graph / Facebook -->
<meta property="og:type" content="website" />
<meta property="og:url" content="https://crackwits.com/game/christmas25" />
<meta property="og:title" content="Escape the Deadline | CRACKWITS Holiday Challenge" />
<meta property="og:description" content="..." />
<meta property="og:image" content="https://crackwits.com/game/christmas25/Assets/og-image.jpg" />
<meta property="og:image:secure_url" content="https://crackwits.com/game/christmas25/Assets/og-image.jpg" />
<meta property="og:image:type" content="image/jpeg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="Escape the Deadline | CRACKWITS Holiday Challenge" />
<meta property="og:site_name" content="CRACKWITS" />
<meta property="og:locale" content="en_US" />
<meta property="og:logo" content="https://crackwits.com/game/christmas25/Assets/CW-Logo.svg" />

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Escape the Deadline | CRACKWITS Holiday Challenge" />
<meta name="twitter:description" content="..." />
<meta name="twitter:image" content="https://crackwits.com/game/christmas25/Assets/og-image.jpg" />
<meta name="twitter:image:alt" content="Escape the Deadline | CRACKWITS Holiday Challenge" />
```

### Dynamic Updates (`components/SEOHead.tsx`)
The `SEOHead` component updates meta tags client-side to:
- Support both subdomain and path-based routes
- Keep meta tags in sync with `textConfig.ts`
- Add missing tags if not present in static HTML

## Image Requirements ✅

- **Location:** `public/Assets/og-image.jpg`
- **URL:** `https://crackwits.com/game/christmas25/Assets/og-image.jpg`
- **Size:** 1200x630px (specified in meta tags)
- **Format:** JPEG
- **Accessibility:** Alt text included

## Important Notes

### Why Static HTML Matters
Social media crawlers (Facebook, Twitter, LinkedIn) **do not execute JavaScript**. They only read the static HTML from `index.html`. This is why:
- ✅ Meta tags must be correct in `index.html` (primary source for crawlers)
- ✅ `SEOHead` component updates are for client-side rendering only
- ✅ Both must be consistent

### Route Handling
- **Path-based route:** `crackwits.com/game/christmas25` - uses path in base URL
- **Subdomain route:** `fun.crackwits.com` - uses root path
- **WWW redirect:** `www.crackwits.com` → `crackwits.com` (301 permanent redirect via Vercel)
- The `SEOHead` component now dynamically determines the correct base URL and removes www prefix

## Test URLs for Validators

### Facebook Sharing Debugger
**URL:** https://developers.facebook.com/tools/debug/
**Test URLs:**
- `https://crackwits.com/game/christmas25` (canonical URL)
- `https://www.crackwits.com/game/christmas25` (should redirect to non-www)
- `https://fun.crackwits.com` (if applicable)

**What to check:**
- ✅ `og:image` displays correctly
- ✅ All OG meta tags are present
- ✅ Image is accessible (1200x630px)
- ✅ No warnings or errors
- ✅ www version redirects properly

### Twitter Card Validator
**URL:** https://cards-dev.twitter.com/validator
**Test URLs:**
- `https://crackwits.com/game/christmas25` (canonical URL)
- `https://www.crackwits.com/game/christmas25` (should redirect to non-www)
- `https://fun.crackwits.com` (if applicable)

**What to check:**
- ✅ `twitter:image` displays correctly
- ✅ Card type is `summary_large_image`
- ✅ Image dimensions are correct
- ✅ No errors
- ✅ www version redirects properly

### LinkedIn Post Inspector
**URL:** https://www.linkedin.com/post-inspector/
**Test URLs:**
- `https://crackwits.com/game/christmas25` (canonical URL)
- `https://www.crackwits.com/game/christmas25` (should redirect to non-www)
- `https://fun.crackwits.com` (if applicable)

**What to check:**
- ✅ Preview image displays
- ✅ Title and description are correct
- ✅ All meta tags are recognized

## Next Steps

1. **Clear Cache:** After deploying, use the validators to clear cached metadata
2. **Verify Image:** Ensure `og-image.jpg` is accessible at the specified URL
3. **Test Both Routes:** Verify meta tags work on both:
   - `crackwits.com/game/christmas25`
   - `fun.crackwits.com` (if applicable)
4. **Monitor:** Check validator tools after deployment to ensure no errors

## Files Modified

1. `index.html` - Fixed case mismatch, added alt text, updated all URLs to use canonical domain (no www)
2. `components/SEOHead.tsx` - Added dynamic URL detection for multiple routes, removes www prefix for canonical URLs
3. `vercel.json` - Added 301 permanent redirect from www.crackwits.com to crackwits.com

## Vercel Configuration

The `vercel.json` now includes a redirect rule that automatically redirects all `www.crackwits.com` requests to `crackwits.com`:

```json
"redirects": [
  {
    "source": "/:path*",
    "has": [
      {
        "type": "host",
        "value": "www.crackwits.com"
      }
    ],
    "destination": "https://crackwits.com/:path*",
    "permanent": true
  }
]
```

This ensures:
- ✅ All www requests redirect to non-www (301 permanent)
- ✅ Paths are preserved (e.g., `/game/christmas25` stays in redirect)
- ✅ SEO-friendly (301 tells search engines non-www is canonical)

