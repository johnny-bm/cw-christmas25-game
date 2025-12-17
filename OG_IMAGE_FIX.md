# OG Image Not Displaying - Fixes Applied

## Issues Identified

### 1. ❌ Incorrect Asset Path
**Problem:** Meta tags were using `/game/christmas25/Assets/og-image.jpg` but Vite serves public folder assets from root.

**Root Cause:** Vite's `publicDir: 'public'` serves files from the root URL, not under the game path.

**Fixed:** Changed all asset URLs to use root path:
- **Before:** `https://crackwits.com/game/christmas25/Assets/og-image.jpg`
- **After:** `https://crackwits.com/Assets/og-image.jpg`

### 2. ❌ Case Mismatch in textConfig.ts
**Problem:** `textConfig.ts` had lowercase `/assets/og-image.jpg` but actual folder is `Assets` (capital A).

**Fixed:** Updated to match actual folder structure:
- **Before:** `ogImage: "/assets/og-image.jpg"`
- **After:** `ogImage: "/Assets/og-image.jpg"`

### 3. ⚠️ Image Dimensions Mismatch
**Problem:** Meta tags specified 1200x630px but actual image is 1600x840px.

**Status:** Updated meta tags to reflect actual dimensions (1600x840px). This is acceptable - larger dimensions work fine for social media, though 1200x630px is the recommended minimum.

## Image Verification

✅ **File Type:** JPEG (valid)
✅ **Dimensions:** 1600x840 pixels
✅ **File Size:** 73KB (well under 8MB limit)
✅ **Location:** `public/Assets/og-image.jpg`
✅ **Format:** Progressive JPEG

## Files Modified

1. **`index.html`**
   - Changed all asset URLs from `/game/christmas25/Assets/` to `/Assets/`
   - Updated image dimensions from 1200x630 to 1600x840

2. **`components/SEOHead.tsx`**
   - Fixed asset URL construction to use root path (not baseUrl + path)
   - Updated image dimensions to match actual file

3. **`lib/textConfig.ts`**
   - Fixed case: `/assets/` → `/Assets/`
   - Fixed case: `twitterImage` path

## Correct URLs After Fix

### OG Image
- **URL:** `https://crackwits.com/Assets/og-image.jpg`
- **Dimensions:** 1600x840px
- **Type:** image/jpeg

### Logo
- **URL:** `https://crackwits.com/Assets/CW-Logo.svg`

## Testing After Deployment

### 1. Direct Image Access
Test these URLs directly in browser:
- ✅ `https://crackwits.com/Assets/og-image.jpg` - Should load image
- ✅ `https://crackwits.com/Assets/CW-Logo.svg` - Should load logo

### 2. Social Media Validators

**Facebook Sharing Debugger:**
- URL: https://developers.facebook.com/tools/debug/
- Test: `https://crackwits.com/game/christmas25`
- Should show: Image preview with 1600x840px image

**Twitter Card Validator:**
- URL: https://cards-dev.twitter.com/validator
- Test: `https://crackwits.com/game/christmas25`
- Should show: Large image card with preview

**LinkedIn Post Inspector:**
- URL: https://www.linkedin.com/post-inspector/
- Test: `https://crackwits.com/game/christmas25`
- Should show: Image preview

### 3. Verify Meta Tags
After deployment, check page source for:
```html
<meta property="og:image" content="https://crackwits.com/Assets/og-image.jpg" />
<meta property="og:image:width" content="1600" />
<meta property="og:image:height" content="840" />
```

## Why This Fixes the Issue

1. **Vite Public Folder Behavior:** Files in `public/` are served from root URL (`/Assets/...`), not under the app route (`/game/christmas25/Assets/...`)

2. **Vercel Static File Serving:** Vercel automatically serves static files from the build output before applying rewrites, so `/Assets/og-image.jpg` will be served directly

3. **Case Sensitivity:** Some servers (especially Linux-based) are case-sensitive, so `/Assets/` must match the actual folder name

## Next Steps

1. **Deploy to Vercel**
2. **Test direct image URL:** `https://crackwits.com/Assets/og-image.jpg`
3. **Clear cache in validators** (Facebook/Twitter/LinkedIn cache old metadata)
4. **Re-test in validators** after cache clears

## Optional: Resize Image to Recommended Size

If you want to optimize for social media, consider resizing the image to exactly **1200x630px** (the recommended OG image size). Current 1600x840px works but is larger than necessary.

To resize:
```bash
# Using ImageMagick
convert public/Assets/og-image.jpg -resize 1200x630^ -gravity center -extent 1200x630 public/Assets/og-image.jpg

# Or using sips (macOS)
sips -z 630 1200 public/Assets/og-image.jpg
```

Then update meta tags back to:
```html
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
```

