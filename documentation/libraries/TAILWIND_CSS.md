# Tailwind CSS Documentation

Tailwind CSS is a utility-first CSS framework that enables rapid UI development through low-level utility classes that combine to form any design.

## Version: 3.4.17

## Configuration

### tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#8B5CF6',
      },
      spacing: {
        '128': '32rem',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```

## Utility Classes

### Layout
```html
<!-- Display -->
<div class="block">Block element</div>
<div class="inline-block">Inline-block</div>
<div class="flex">Flex container</div>
<div class="grid">Grid container</div>

<!-- Flexbox -->
<div class="flex flex-row justify-center items-center">
  Centered content
</div>

<!-- Grid -->
<div class="grid grid-cols-3 gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

### Sizing
```html
<div class="w-full h-64">Full width, 256px height</div>
<div class="w-1/2 h-auto">50% width, auto height</div>
<div class="max-w-lg min-h-screen">Max-width, min-height</div>
```

### Spacing
```html
<!-- Margin -->
<div class="m-4 mt-8">All sides margin, top override</div>

<!-- Padding -->
<div class="p-4 px-8">All sides padding, horizontal override</div>

<!-- Gap -->
<div class="flex gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

### Colors
```html
<div class="bg-blue-500 text-white">Blue background, white text</div>
<div class="border-2 border-red-400">Red border</div>
<div class="text-gray-600">Gray text</div>
```

### Typography
```html
<h1 class="text-4xl font-bold">Large heading</h1>
<p class="text-base font-normal">Normal paragraph</p>
<span class="text-sm text-gray-500">Small gray text</span>
<div class="line-clamp-3">Text truncated to 3 lines</div>
```

### Shadows & Effects
```html
<div class="shadow-lg rounded-lg">Large shadow, rounded corners</div>
<div class="shadow-md hover:shadow-xl">Interactive shadow</div>
<div class="opacity-50">50% opacity</div>
<div class="blur-sm">Slight blur effect</div>
```

## Responsive Design

### Breakpoints
```html
<!-- Mobile first: default, then override at breakpoints -->
<div class="text-base md:text-lg lg:text-2xl xl:text-3xl">
  Responsive text
</div>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
  <div>Item 4</div>
</div>
```

Available breakpoints:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### Container Queries
```html
<div class="@container">
  <div class="@sm:text-sm @md:text-base @lg:text-lg">
    Text size based on container width
  </div>
</div>
```

## Dark Mode

### Configuration
```javascript
export default {
  darkMode: 'class',
  // Use class strategy: <html class="dark">
}
```

### Usage
```html
<!-- Automatically applies dark mode styles -->
<div class="bg-white dark:bg-gray-900 text-black dark:text-white">
  Content adapts to dark mode
</div>
```

### Toggle Implementation
```tsx
import { useEffect, useState } from 'react';

export function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <button onClick={() => setIsDark(!isDark)}>
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}
```

## Custom Utilities

### Extend Configuration
```javascript
export default {
  theme: {
    extend: {
      colors: {
        brand: '#FF6B35',
      },
      spacing: {
        '72': '18rem',
        '96': '24rem',
      },
      borderRadius: {
        'extra-large': '2rem',
      },
    },
  },
}
```

### Custom Components
```css
@layer components {
  @apply px-4 py-2 font-semibold rounded-lg;
  
  .btn-primary {
    @apply bg-blue-500 text-white hover:bg-blue-600;
  }
  
  .btn-secondary {
    @apply bg-gray-200 text-gray-800 hover:bg-gray-300;
  }
  
  .card {
    @apply bg-white rounded-lg shadow-md p-6;
  }
}
```

## Common Patterns

### Button Styles
```html
<!-- Primary Button -->
<button class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
  Primary
</button>

<!-- Secondary Button -->
<button class="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
  Secondary
</button>

<!-- Disabled Button -->
<button class="px-6 py-2 bg-gray-300 text-gray-500 cursor-not-allowed opacity-50">
  Disabled
</button>
```

### Card Component
```html
<div class="bg-white rounded-lg shadow-md overflow-hidden">
  <img src="..." class="w-full h-48 object-cover" />
  <div class="p-6">
    <h3 class="text-xl font-bold mb-2">Card Title</h3>
    <p class="text-gray-600 mb-4">Card description</p>
    <button class="text-blue-500 hover:text-blue-700">Learn More</button>
  </div>
</div>
```

### Modal/Overlay
```html
<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <div class="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 p-8">
    <h2 class="text-2xl font-bold mb-4">Modal Title</h2>
    <p class="text-gray-600 mb-6">Modal content goes here</p>
    <div class="flex gap-4">
      <button class="flex-1 px-4 py-2 bg-gray-200 rounded">Cancel</button>
      <button class="flex-1 px-4 py-2 bg-blue-500 text-white rounded">Confirm</button>
    </div>
  </div>
</div>
```

### Form Input
```html
<div class="mb-4">
  <label class="block text-sm font-medium text-gray-700 mb-2">
    Email
  </label>
  <input 
    type="email"
    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    placeholder="Enter email"
  />
</div>
```

## Hover, Focus, and State Variants

```html
<!-- Hover States -->
<button class="bg-blue-500 hover:bg-blue-600 active:bg-blue-700">
  Button
</button>

<!-- Focus States -->
<input class="focus:outline-none focus:ring-2 focus:ring-blue-500" />

<!-- Group Hover -->
<div class="group">
  <div class="bg-blue-500 group-hover:bg-blue-600">
    Hover parent to change
  </div>
</div>

<!-- Disabled State -->
<input class="disabled:opacity-50 disabled:cursor-not-allowed" />
```

## Otagon Project Styling

The Otagon project uses Tailwind CSS for:
- Responsive chat interface
- User profile cards
- Modal dialogs
- Dark mode support
- Form inputs with validation states

```tsx
// Example from Otagon
function ChatMessage({ message, isOwn }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-xs px-4 py-2 rounded-lg ${
        isOwn 
          ? 'bg-blue-500 text-white rounded-br-none' 
          : 'bg-gray-200 text-gray-800 rounded-bl-none'
      }`}>
        <p className="text-sm">{message.text}</p>
        <p className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}
```

## Performance Tips

1. **Use PurgeCSS** - Production builds remove unused styles
2. **Minimize custom CSS** - Prefer utilities over custom classes
3. **Avoid inline styles** - Use Tailwind utilities instead
4. **Group similar elements** - Extract repeating patterns
5. **Use CSS layers** - Organize specificity with @layer

## Best Practices

1. **Mobile-first approach** - Default to mobile, expand to larger screens
2. **Consistent spacing** - Use the spacing scale consistently
3. **Color consistency** - Define brand colors in theme
4. **Readable selectors** - Prefer descriptive class names
5. **Component extraction** - Create reusable component classes

## Resources

- [Tailwind CSS Docs](https://tailwindcss.com)
- [Tailwind UI Components](https://tailwindui.com)

## Related Documentation

- [React](./REACT.md) - Component integration
- [Vite](./VITE.md) - Build process
