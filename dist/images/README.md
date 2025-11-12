# Otagon Landing Page Image Assets

This directory contains all the image assets used throughout the Otagon landing page and application.

## 📁 Directory Structure

```
public/images/
├── landing/          # Landing page specific images
├── icons/            # Icon assets
├── screenshots/      # App screenshots for PWA
└── founders/         # Founder and team images
```

## 🖼️ Landing Page Images (`/landing/`)

### **Hero Section**
- `hero-bg.jpg` - Background image for the main hero section
- `hero-mockup.png` - App mockup showing the chat interface
- `hero-screenshot.png` - Screenshot of the app in action

### **Feature Section**
- `feature-1.png` - Screenshot capture feature illustration
- `feature-2.png` - AI analysis feature illustration
- `feature-3.png` - Progress tracking feature illustration
- `feature-4.png` - PC connection feature illustration

### **App Mockup**
- `app-mockup.png` - Main app interface mockup
- `chat-example.png` - Example chat conversation
- `screenshot-upload.png` - Screenshot upload interface

### **Social Proof**
- `testimonial-1.jpg` - User testimonial avatar
- `testimonial-2.jpg` - User testimonial avatar
- `testimonial-3.jpg` - User testimonial avatar

### **Pricing Section**
- `pro-badge.png` - Pro tier badge/icon
- `vanguard-badge.png` - Vanguard tier badge/icon
- `feature-check.png` - Feature checkmark icon

## 🎨 Icons (`/icons/`)

### **Feature Icons**
- `screenshot-icon.svg` - Screenshot capture icon
- `hint-icon.svg` - Hint/help icon
- `bookmark-icon.svg` - Progress tracking icon
- `desktop-icon.svg` - PC connection icon
- `ai-icon.svg` - AI model icon
- `voice-icon.svg` - Voice response icon

### **UI Icons**
- `check-icon.svg` - Checkmark for features
- `star-icon.svg` - Star for premium features
- `arrow-icon.svg` - Arrow/direction icon
- `download-icon.svg` - Download icon

## 📱 Screenshots (`/screenshots/`)

### **PWA Screenshots**
- `screenshot-wide.png` - Wide screenshot (1280x720) for desktop
- `screenshot-narrow.png` - Narrow screenshot (750x1334) for mobile

### **App Screenshots**
- `app-home.png` - App home screen
- `app-chat.png` - Chat interface
- `app-insights.png` - Insights tabs
- `app-settings.png` - Settings screen

## 👥 Founders (`/founders/`)

### **Team Images**
- `founder-portrait.jpg` - Main founder portrait (currently used in app)
- `founder-bio.jpg` - Founder bio image
- `team-photo.jpg` - Team group photo

## 🔧 Technical Requirements

### **Image Formats**
- **PNG**: For screenshots, mockups, and images with transparency
- **JPG**: For photographs and images without transparency
- **SVG**: For icons and scalable graphics
- **WebP**: For optimized web images (optional)

### **Image Sizes**
- **Hero images**: 1920x1080px (16:9 ratio)
- **Feature images**: 800x600px (4:3 ratio)
- **Mockups**: 1200x800px (3:2 ratio)
- **Icons**: 64x64px to 256x256px
- **Avatars**: 200x200px (square)

### **Optimization**
- **File size**: Keep under 500KB for hero images, 200KB for features
- **Compression**: Use WebP when possible, fallback to PNG/JPG
- **Responsive**: Provide multiple sizes for different screen densities

## 📝 Usage in Code

### **Importing Images**
```tsx
// In React components
import heroImage from '/images/landing/hero-bg.jpg';
import featureIcon from '/images/icons/screenshot-icon.svg';

// Or use directly in src
<img src="/images/landing/hero-mockup.png" alt="App Mockup" />
```

### **Background Images**
```tsx
// CSS background
<div style={{ backgroundImage: 'url(/images/landing/hero-bg.jpg)' }}>
  Hero content
</div>

// Tailwind CSS
<div className="bg-[url('/images/landing/hero-bg.jpg')]">
  Hero content
</div>
```

## 🚀 Adding New Images

1. **Place in appropriate directory** based on usage
2. **Optimize file size** and dimensions
3. **Use descriptive names** with hyphens (e.g., `hero-background.jpg`)
4. **Update this README** with new image details
5. **Test responsiveness** across different devices

## 📱 Current Status

- ✅ **Founder portrait** - `founder-portrait.jpg` (currently used)
- ✅ **App icons** - `icon-192.png`, `icon-512.png` (PWA icons)
- ✅ **Logo** - `icon.svg` (app logo)
- 🔄 **Landing page images** - Need to be added
- 🔄 **Feature icons** - Need to be created/added
- 🔄 **Screenshots** - Need to be captured/added

## 🎯 Next Steps

1. **Create feature icons** for the landing page sections
2. **Capture app screenshots** for the PWA manifest
3. **Design hero images** for the main landing sections
4. **Add testimonial avatars** for social proof
5. **Optimize all images** for web performance
