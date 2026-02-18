# Required Images for SEO

## Favicons

### favicon.ico
- **Size**: 16x16, 32x32, 48x48 (multi-resolution ICO file)
- **Location**: `/frontend/public/favicon.ico`
- **Usage**: Default favicon for browsers
- **Format**: ICO
- **Create**: Use an online favicon generator or Photoshop

### favicon-16x16.png
- **Size**: 16x16 pixels
- **Location**: `/frontend/public/favicon-16x16.png`
- **Format**: PNG with transparency
- **Usage**: Small browser tabs

### favicon-32x32.png
- **Size**: 32x32 pixels
- **Location**: `/frontend/public/favicon-32x32.png`
- **Format**: PNG with transparency
- **Usage**: Standard browser tabs

### apple-touch-icon.png
- **Size**: 180x180 pixels
- **Location**: `/frontend/public/apple-touch-icon.png`
- **Format**: PNG (no transparency needed)
- **Usage**: iOS home screen icon
- **Note**: Should have rounded corners already

### safari-pinned-tab.svg
- **Size**: Vector (scalable)
- **Location**: `/frontend/public/safari-pinned-tab.svg`
- **Format**: SVG (monochrome)
- **Usage**: Safari pinned tabs
- **Color**: Black/single color

## Social Media Images

### og-image.jpg (Open Graph)
- **Size**: 1200x630 pixels
- **Location**: `/frontend/public/og-image.jpg`
- **Format**: JPG (compressed < 100KB)
- **Usage**: Facebook, LinkedIn, WhatsApp sharing
- **Safe Zone**: Keep important content in center 1200x600px
- **Content**: 
  - QualityPulse logo
  - Tagline: "AI-Powered Call Center Quality Assurance"
  - Key features or dashboard preview
  - Professional, modern design

### twitter-image.jpg
- **Size**: 1200x675 pixels (16:9 aspect ratio)
- **Location**: `/frontend/public/twitter-image.jpg`
- **Format**: JPG (compressed < 100KB)
- **Usage**: Twitter Card large image
- **Content**: Similar to og-image but optimized for Twitter's format

## App Icons

### logo.jpg (Already exists)
- **Current**: Available at `/frontend/public/logo.jpg`
- **Recommendation**: Consider converting to PNG for transparency
- **Sizes needed**: 
  - 192x192 (Android Chrome)
  - 512x512 (Android Chrome, maskable)

## Screenshots (Optional but Recommended)

### screenshot-1.jpg
- **Size**: 1280x720 pixels
- **Location**: `/frontend/public/screenshot-1.jpg`
- **Format**: JPG
- **Usage**: PWA installation, app stores
- **Content**: Dashboard or main interface

### screenshot-2.jpg
- **Size**: 1280x720 pixels
- **Location**: `/frontend/public/screenshot-2.jpg`
- **Format**: JPG
- **Usage**: PWA installation, app stores
- **Content**: Call analysis view

## Image Optimization Tips

### For All Images:
1. **Compression**: Use tools like TinyPNG, ImageOptim, or Squoosh
2. **Format**: 
   - Use WebP for better compression (with JPG/PNG fallback)
   - Use SVG for logos and icons
   - Use PNG for images needing transparency
   - Use JPG for photographs
3. **Responsive**: Consider creating multiple sizes for different devices
4. **Alt Text**: Always include descriptive alt text
5. **Lazy Loading**: Use loading="lazy" for images below the fold

## Quick Creation Tools

### Online Tools:
- **Favicon Generator**: https://realfavicongenerator.net/
- **Image Compression**: https://squoosh.app/ or https://tinypng.com/
- **Image Resizing**: https://imageresizer.com/
- **Social Media Templates**: Canva, Figma

### Design Specifications for Social Media Images:

#### OG Image Template:
```
Background: Gradient (Blue #2563eb to Indigo #4f46e5)
Logo: Top-left or centered
Headline: "QualityPulse"
Subheadline: "AI-Powered Call Center Quality Assurance"
Features or Screenshots: Bottom half
Typography: Sans-serif, bold, high contrast
```

#### Twitter Image Template:
```
Similar to OG image but optimized for 16:9
Ensure text is legible on mobile
Use high contrast colors
Include call-to-action if space permits
```

## Alt Text Best Practices

### Landing Page Images:
- Logo: "QualityPulse - AI-Powered Call Center Quality Assurance Platform"
- Dashboard screenshots: "QualityPulse dashboard showing call analytics and quality scores"
- Feature icons: Descriptive text about the feature (auto-generated from feature titles)
- Testimonial photos: "Photo of [Name], [Title] at [Company]"

### General Rules:
1. Be descriptive but concise (125 characters or less)
2. Don't start with "Image of" or "Picture of"
3. Include keywords naturally
4. Describe what the image shows and its purpose
5. For decorative images, use empty alt=""

## Image Checklist

Before deployment, ensure you have:
- [ ] favicon.ico
- [ ] favicon-16x16.png
- [ ] favicon-32x32.png
- [ ] apple-touch-icon.png
- [ ] safari-pinned-tab.svg
- [ ] og-image.jpg
- [ ] twitter-image.jpg
- [ ] logo.png (with transparency)
- [ ] screenshot-1.jpg (optional)
- [ ] All images are compressed
- [ ] All images have alt text
- [ ] Images are referenced correctly in index.html

## Priority Order

### Critical (Must have before launch):
1. favicon.ico
2. favicon-32x32.png
3. og-image.jpg
4. apple-touch-icon.png

### Important (Should have):
5. favicon-16x16.png
6. twitter-image.jpg
7. safari-pinned-tab.svg

### Nice to have:
8. Screenshots for PWA
9. Multiple logo sizes

---

**Note**: Update all references in `index.html` and `manifest.json` once images are created.

**Creation Date**: February 18, 2026
