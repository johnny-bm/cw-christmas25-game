# Critical Routing & OG Image Fixes

## Issues Fixed

### 1. ✅ Redirect Loop Between Case Variants
**Problem:** 
- `/game/christmas25` → redirects to `/game/Christmas25` (HTTP, not HTTPS)
- Causing HTTPS→HTTP downgrade (security issue)
- Case inconsistency

**Solution:**
- Added 301 permanent redirects from uppercase to lowercase:
  - `/game/Christmas25` → `https://crackwits.com/game/christmas25`
  - `/game/Christmas25/:path*` → `https://crackwits.com/game/christmas25/:path*`
- Removed uppercase rewrite rules (only lowercase remains)
- All redirects explicitly use HTTPS

**Fixed in:** `vercel.json`

### 2. ✅ Static Assets Being Caught by SPA Routing
**Problem:**
- Image URL: `https://crackwits.com/game/christmas25/Assets/og-image.jpg`
- Redirects to: `https://crackwits.com/?404=/game/christmas25/Assets/og-image.jpg`
- Static assets treated as routes, not files

**Solution:**
- **Changed all meta tags to use root path:** `/Assets/og-image.jpg` (not `/game/christmas25/Assets/og-image.jpg`)
- Vite serves `public/` folder from root by default
- Vercel automatically serves static files BEFORE applying rewrites
- Static assets are now accessible at: `https://crackwits.com/Assets/og-image.jpg`

**Fixed in:** `index.html`, `components/SEOHead.tsx`, `lib/textConfig.ts`

### 3. ✅ Meta Tags Explicit in Static HTML
**Status:** ✅ Already explicit
- All OG and Twitter meta tags are in `index.html` (lines 27-48)
- Tags are present in the initial HTML response (not client-side only)
- Crawlers can read them without executing JavaScript

**Verified:** Meta tags are in static HTML:
```html
<meta property="og:type" content="website" />
<meta property="og:url" content="https://crackwits.com/game/christmas25" />
<meta property="og:title" content="Escape the Deadline | CRACKWITS Holiday Challenge" />
<meta property="og:description" content="..." />
<meta property="og:image" content="https://crackwits.com/Assets/og-image.jpg" />
<meta property="og:image:secure_url" content="https://crackwits.com/Assets/og-image.jpg" />
<meta property="og:image:type" content="image/jpeg" />
<meta property="og:image:width" content="1600" />
<meta property="og:image:height" content="840" />
<meta property="og:image:alt" content="Escape the Deadline | CRACKWITS Holiday Challenge" />
<meta property="og:site_name" content="CRACKWITS" />
<meta property="og:locale" content="en_US" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="..." />
<meta name="twitter:description" content="..." />
<meta name="twitter:image" content="https://crackwits.com/Assets/og-image.jpg" />
```

## Current Configuration

### vercel.json
```json
{
  "rewrites": [
    {
      "source": "/game/christmas25",
      "destination": "/index.html"
    },
    {
      "source": "/game/christmas25/:path*",
      "destination": "/index.html"
    }
  ],
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
    },
    {
      "source": "/game/Christmas25",
      "destination": "https://crackwits.com/game/christmas25",
      "permanent": true
    },
    {
      "source": "/game/Christmas25/:path*",
      "destination": "https://crackwits.com/game/christmas25/:path*",
      "permanent": true
    }
  ]
}
```

### Canonical URLs
- **Page URL:** `https://crackwits.com/game/christmas25` (lowercase, HTTPS)
- **OG Image:** `https://crackwits.com/Assets/og-image.jpg` (root path)
- **Logo:** `https://crackwits.com/Assets/CW-Logo.svg` (root path)

## How Static Assets Work

1. **Vite Build:** Files in `public/Assets/` are copied to `dist/Assets/` during build
2. **Vercel Deployment:** Static files in `dist/` are served directly
3. **URL Path:** `public/Assets/og-image.jpg` → `https://crackwits.com/Assets/og-image.jpg`
4. **Routing Priority:** Vercel serves static files BEFORE applying rewrites

## Testing After Deployment

### 1. Test Redirects
```bash
# Should redirect to lowercase (301)
curl -I https://crackwits.com/game/Christmas25
# Expected: Location: https://crackwits.com/game/christmas25

# Should redirect www to non-www (301)
curl -I https://www.crackwits.com/game/christmas25
# Expected: Location: https://crackwits.com/game/christmas25
```

### 2. Test Static Assets
```bash
# Should return 200 with image
curl -I https://crackwits.com/Assets/og-image.jpg
# Expected: HTTP/2 200, Content-Type: image/jpeg

# Should return 200 with SVG
curl -I https://crackwits.com/Assets/CW-Logo.svg
# Expected: HTTP/2 200, Content-Type: image/svg+xml
```

### 3. Test Page Route
```bash
# Should return 200 with HTML (not redirect)
curl -I https://crackwits.com/game/christmas25
# Expected: HTTP/2 200, Content-Type: text/html
```

### 4. Verify Meta Tags
```bash
# Get HTML and check for meta tags
curl https://crackwits.com/game/christmas25 | grep -i "og:image"
# Expected: <meta property="og:image" content="https://crackwits.com/Assets/og-image.jpg" />
```

## Files Modified

1. **`vercel.json`**
   - Removed uppercase rewrite rules
   - Added 301 redirects from uppercase to lowercase
   - All redirects use HTTPS explicitly

2. **`index.html`**
   - Changed asset URLs from `/game/christmas25/Assets/` to `/Assets/`
   - All meta tags use root path for assets

3. **`components/SEOHead.tsx`**
   - Fixed asset URL construction to use root path
   - Assets use canonical hostname (no www)

4. **`lib/textConfig.ts`**
   - Fixed case: `/assets/` → `/Assets/`

## Important Notes

### Why Root Path for Assets?
- Vite's `publicDir: 'public'` serves files from root URL
- `public/Assets/og-image.jpg` → `/Assets/og-image.jpg` (not `/game/christmas25/Assets/og-image.jpg`)
- This is the standard Vite behavior

### Why Redirects Use HTTPS?
- All redirects explicitly specify `https://` in destination
- Prevents HTTP downgrade
- Ensures secure connections

### Why Lowercase Canonical?
- Consistent with meta tags
- Avoids case-sensitivity issues
- Better SEO (single canonical URL)

## Next Steps

1. **Deploy to Vercel**
2. **Test all URLs** (redirects, static assets, page routes)
3. **Clear cache** in social media validators
4. **Re-test** OG image in validators:
   - Facebook: https://developers.facebook.com/tools/debug/
   - Twitter: https://cards-dev.twitter.com/validator
   - LinkedIn: https://www.linkedin.com/post-inspector/

## Troubleshooting

If static assets still don't work:
1. Check Vercel build logs - ensure `public/Assets/` is copied to `dist/Assets/`
2. Verify file exists: `dist/Assets/og-image.jpg` after build
3. Check Vercel project settings - ensure static file serving is enabled
4. Try accessing asset directly: `https://crackwits.com/Assets/og-image.jpg`

If redirects still loop:
1. Clear browser cache
2. Check Vercel deployment logs
3. Verify redirect rules are in correct order (redirects before rewrites)

