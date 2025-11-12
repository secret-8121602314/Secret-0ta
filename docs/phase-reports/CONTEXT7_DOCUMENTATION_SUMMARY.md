# Context7 MCP Server Documentation Summary

## Overview
This document contains comprehensive documentation for all the key technologies used in your Otakon application, retrieved via the Context7 MCP Server integration. This documentation provides up-to-date references, code examples, and best practices for development.

---

## Libraries Documented

### 1. **React** (`/facebook/react`)
- **Version**: v18.3.1
- **Trust Score**: 9.2/10
- **Code Snippets**: 3137+
- **Key Features**:
  - Component-based architecture with hooks
  - State management with useState, useReducer
  - Side effects with useEffect, useLayoutEffect
  - Performance optimization with useMemo, useCallback, memo
  - Server-side rendering with renderToPipeableStream
  - Error boundaries and Suspense for code splitting
  - Concurrent features: useTransition, useDeferredValue
  - Context API and Custom Hooks patterns

**Core Hooks Used in Your App**:
- `useState`: Managing component state
- `useEffect`: Data fetching and side effects
- `useRef`: References to DOM elements and mutable values
- `useContext`: Accessing context values
- `useMemo`: Optimizing expensive computations
- `useCallback`: Memoizing callback functions

---

### 2. **React Router** (`/websites/reactrouter`)
- **Version**: 6.x / 7.x
- **Trust Score**: 7.5/10
- **Code Snippets**: 4940+
- **Key Features**:
  - Declarative routing with `<Route>` and `<Routes>`
  - Data loaders for pre-fetching data
  - Nested routing and layouts
  - Type-safe routing
  - Server-side rendering support
  - File-based routing conventions
  - Link prefetching
  - Error boundaries for routes

**Implementation Pattern for Your App**:
```typescript
// app/root.jsx - Root layout
import { Outlet, Scripts } from "react-router";

export default function App() {
  return (
    <html>
      <body>
        <h1>Hello world!</h1>
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}
```

---

### 3. **Supabase** (`/supabase/supabase`)
- **Version**: Latest
- **Trust Score**: 10/10
- **Code Snippets**: 4580+
- **Key Features**:
  - PostgreSQL database hosting
  - Real-time subscriptions via WebSockets
  - Authentication (Email, OAuth, JWT)
  - File storage (S3-compatible)
  - Edge Functions (Deno-based serverless)
  - Row Level Security (RLS)
  - Vector/embeddings support
  - Realtime presence tracking
  - Broadcast channels

**Your App's Integration Pattern**:
```typescript
// Browser client
import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}

// Authentication flow
async function signIn(email: string, password: string) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return data
}

// Database operations
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .eq('published', true)
  .order('created_at', { ascending: false })
  .limit(10)
```

**Key Supabase Features for Your App**:
- **Authentication**: Email/password, OAuth providers
- **Database**: Real-time queries with RLS policies
- **Storage**: File uploads with CDN
- **Realtime**: Subscribe to database changes
- **Edge Functions**: Custom backend logic

---

### 4. **Tailwind CSS** (`/websites/tailwindcss`)
- **Version**: 4.x
- **Trust Score**: 9.5/10
- **Code Snippets**: 1604+
- **Key Features**:
  - Utility-first CSS framework
  - Responsive breakpoints (mobile-first)
  - Dark mode support
  - State variants (hover, focus, active, etc.)
  - Custom theme configuration via `@theme`
  - Component layer organization
  - Arbitrary values with square brackets
  - CSS-first configuration (v4)

**Your App's Styling Pattern**:
```html
<!-- Responsive Grid -->
<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
  <!-- Content -->
</div>

<!-- Dark Mode -->
<div class="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  <!-- Content adapts to color scheme -->
</div>

<!-- Interactive States -->
<button class="bg-blue-500 hover:bg-blue-600 focus:ring-2 disabled:opacity-50">
  Submit
</button>
```

**Tailwind Configuration for Your App**:
- Custom color palette
- Responsive spacing
- Typography scales
- Custom breakpoints
- Dark mode toggle

---

### 5. **Vite** (`/vitejs/vite`)
- **Version**: 6.x
- **Trust Score**: 8.3/10
- **Code Snippets**: 480+
- **Key Features**:
  - Lightning-fast dev server (sub-second HMR)
  - Native ES module support
  - Optimized production builds via Rollup
  - TypeScript support out-of-the-box
  - CSS preprocessing (SCSS, Less, PostCSS)
  - Asset optimization
  - Environment variable handling
  - Plugin system (Rollup-compatible)

**Your App's Vite Configuration**:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    hmr: {
      overlay: true
    }
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    minify: 'esbuild'
  }
})
```

---

### 6. **TypeScript** (`/microsoft/typescript`)
- **Version**: 5.6.2
- **Trust Score**: 9.9/10
- **Code Snippets**: 15930+
- **Key Features**:
  - Static type checking
  - Type inference
  - Generics and advanced types
  - Decorators and metadata
  - Module system (ESM, CommonJS)
  - Compiler API for tooling
  - Type declaration files (.d.ts)

**TypeScript Setup for Your App**:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "moduleResolution": "bundler",
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

---

### 7. **Firebase** (`/firebase/firebase-js-sdk`)
- **Version**: Latest
- **Trust Score**: 8.2/10
- **Code Snippets**: 4278+
- **Key Features**:
  - Realtime Database
  - Firestore Cloud Database
  - Authentication
  - Cloud Storage
  - Cloud Functions
  - Cloud Messaging
  - Analytics
  - Performance Monitoring
  - Installations tracking

**Your App's Firebase Implementation Pattern**:
```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  // Your Firebase config
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Query data
const querySnapshot = await getDocs(collection(db, "users"));
querySnapshot.forEach((doc) => {
  console.log(doc.id, " => ", doc.data());
});
```

---

### 8. **Google Generative AI (Gemini API)** (`/websites/ai_google_dev_gemini-api`)
- **Version**: Latest
- **Trust Score**: 7.5/10
- **Code Snippets**: 1841+
- **Key Features**:
  - Multimodal content generation (text, image, audio, video)
  - Function calling for tool integration
  - Streaming responses
  - Context caching for cost optimization
  - Structured output with JSON schema validation
  - Embeddings for semantic search
  - Batch processing API
  - Code execution in model context
  - Multi-turn conversations

**Your App's Gemini Integration**:
```typescript
import { GoogleGenAI } from '@google/generative-ai';

const genAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY
});

// Generate content
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
const result = await model.generateContent("Explain quantum computing");
const text = result.response.text();

// With streaming
const stream = await model.generateContentStream("Write a story...");
for await (const chunk of stream) {
  console.log(chunk.text());
}
```

---

## Technology Stack Summary

### Frontend Framework
- **React 18.3.1**: Component library with hooks
- **React Router 6.x**: Client-side routing
- **Tailwind CSS 3.4.17**: Utility-first styling
- **Vite 6.x**: Development server and build tool
- **TypeScript 5.6.2**: Static type checking

### Backend/Services
- **Supabase**: PostgreSQL database, auth, realtime, storage
- **Firebase**: Hosting, functions, analytics
- **Google Gemini API**: AI/ML capabilities

### Development Tools
- **npm/yarn**: Package management
- **ESLint**: Code linting
- **PostCSS**: CSS transformations
- **Tailwind**: CSS framework

---

## Key Integration Patterns

### 1. **Authentication Flow**
Use Supabase for primary auth with OAuth fallback to Firebase:
```typescript
// Supabase auth
const { data, error } = await supabase.auth.signInWithPassword(...)

// Firebase fallback
const { user, error } = await signInWithEmailAndPassword(auth, email, password)
```

### 2. **Data Fetching**
Supabase for real-time data:
```typescript
// Subscribe to changes
const channel = supabase
  .channel('posts-channel')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, ...)
  .subscribe()
```

### 3. **AI Integration**
Google Gemini for content generation:
```typescript
const response = await genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
  .generateContent(userPrompt)
```

### 4. **Styling**
Tailwind CSS with dark mode:
```html
<div class="dark:bg-gray-900 transition-colors">
  Content responds to dark mode
</div>
```

---

## Performance Considerations

1. **Code Splitting**: React Router with lazy loading via Suspense
2. **Caching**: Supabase RLS policies + Firebase caching strategies
3. **Bundle Size**: Vite tree-shaking and code splitting
4. **Real-time**: Use Supabase Realtime for efficient updates
5. **AI Costs**: Use context caching with Gemini API for repeated queries

---

## Environment Variables Required

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key

# Firebase
VITE_FIREBASE_API_KEY=your-firebase-key
VITE_FIREBASE_PROJECT_ID=your-project-id

# Google Gemini
VITE_GOOGLE_API_KEY=your-gemini-api-key
```

---

## Documentation References

All documentation in this file was retrieved from Context7 MCP Server, which provides up-to-date, authoritative documentation for all major libraries and frameworks. For the latest information:

1. **React**: https://react.dev
2. **React Router**: https://reactrouter.com
3. **Supabase**: https://supabase.com/docs
4. **Tailwind CSS**: https://tailwindcss.com
5. **Vite**: https://vitejs.dev
6. **TypeScript**: https://www.typescriptlang.org
7. **Firebase**: https://firebase.google.com/docs
8. **Gemini API**: https://ai.google.dev

---

## Next Steps

1. Review the documentation for each technology
2. Refer to code examples when implementing features
3. Use Context7 MCP to get specific guidance on any library
4. Follow the integration patterns outlined above
5. Keep dependencies updated using npm/yarn

---

**Documentation Last Updated**: October 22, 2025
**Context7 Integration**: Enabled and Ready for Use
