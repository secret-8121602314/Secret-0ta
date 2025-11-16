<!-- 
  Social Media Image Placeholder Guide
  
  This file documents the required images for optimal SEO and social sharing.
  Create these images before deploying to production.
-->

# Required Social Media Images

## 1. Open Graph Image (Facebook, LinkedIn, Discord)
**Filename:** `public/images/og-image.png`
**Dimensions:** 1200 x 630 pixels
**File Size:** < 300 KB
**Format:** PNG or JPG

**Content Suggestions:**
- Otagon logo prominently displayed
- Tagline: "AI-Powered Gaming Companion"
- Key visual: Gaming controller + AI brain icon
- Gradient background matching brand colors (#E53A3A to #D98C1F)
- Text should be large and readable on mobile

## 2. Twitter Card Image
**Filename:** `public/images/twitter-card.png`
**Dimensions:** 1200 x 628 pixels (or use same as OG image)
**File Size:** < 300 KB
**Format:** PNG or JPG

**Content Suggestions:**
- Similar to OG image but optimized for Twitter's cropping
- Can be same as OG image
- Ensure important content is centered

## 3. App Icon / Favicon
**Current:** `public/images/otagon-logo.png`
**Status:** ✅ Already exists
**Ensure:** High resolution version available

## 4. Screenshots for App Stores & Structured Data

### Wide Screenshot (Desktop/Tablet)
**Filename:** `public/screenshot-wide.png`
**Dimensions:** 1280 x 720 pixels (16:9 ratio)
**Content:** Desktop app view showing chat interface with game

### Narrow Screenshot (Mobile)
**Filename:** `public/screenshot-narrow.png`
**Dimensions:** 750 x 1334 pixels (9:16 ratio)
**Content:** Mobile app view

## 5. PWA Icons (Already configured in manifest.json)
**Status:** ✅ Already exists
- `public/icon-192.png` (192x192)
- `public/icon-512.png` (512x512)

---

## Quick Creation Tips

### Using Figma/Canva:
1. Create 1200x630 canvas
2. Add Otagon brand colors
3. Include logo + tagline + key benefit
4. Export as PNG (optimize with TinyPNG)

### Using Screenshot Tools:
1. Open app in browser
2. Use browser dev tools to set viewport size
3. Take screenshot of best view
4. Crop and optimize

### Online Tools:
- **Canva:** Pre-made social media templates
- **Figma:** Professional design tool
- **TinyPNG:** Image optimization
- **Meta Tags Preview:** Test how images look when shared

---

## Testing Your Images

Before deploying, test social sharing:

1. **Facebook Debugger:** https://developers.facebook.com/tools/debug/
2. **Twitter Card Validator:** https://cards-dev.twitter.com/validator
3. **LinkedIn Post Inspector:** https://www.linkedin.com/post-inspector/

Enter your URL and verify images display correctly.

---

## Current Status

- [ ] og-image.png created
- [ ] twitter-card.png created
- [ ] screenshot-wide.png created
- [ ] screenshot-narrow.png created
- [x] PWA icons exist
- [x] Favicon exists

**Action Required:** Create these images before production deployment for optimal social media sharing.
