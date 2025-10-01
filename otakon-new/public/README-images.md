# 📁 Public Images Setup

## 🖼️ Founder Portrait Image

### **Required Image: `founder-portrait.jpg`**

**Place this file in the `public/` folder** to display the founder's image in the app.

### **Image Requirements:**
- **Format**: JPG/JPEG
- **Size**: At least 400x400 pixels (recommended: 800x800)
- **Aspect Ratio**: Square (1:1) preferred
- **Content**: Portrait photo with face clearly visible
- **Style**: Professional but approachable

### **Current Setup:**
The app is configured to look for `/founder-portrait.jpg` in the public folder.

### **Fallback:**
If the image doesn't load, a styled avatar with "👨‍💻 Founder" will be displayed instead.

### **Usage:**
```tsx
// Basic usage
<FounderImage />

// Different sizes
<FounderImage size="sm" />   // 64x64px
<FounderImage size="md" />   // 96x96px (default)
<FounderImage size="lg" />   // 128x128px
<FounderImage size="xl" />   // 160x160px

// With custom styling
<FounderImage 
  size="lg" 
  showBorder={false} 
  showShadow={true} 
  className="my-custom-class"
/>
```

### **Founder Profile Components:**
- `FounderImage` - Just the image with styling
- `FounderProfile` - Full profile with variants:
  - `variant="card"` - Detailed card layout
  - `variant="inline"` - Compact inline layout  
  - `variant="hero"` - Large hero section layout

### **Image Optimization Tips:**
1. **Face Positioning**: Ensure the face is centered and clearly visible
2. **Lighting**: Good lighting to show facial features
3. **Background**: Simple, non-distracting background
4. **Quality**: High resolution for crisp display on all devices
5. **File Size**: Optimize for web (under 200KB recommended)
