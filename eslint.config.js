import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  // Ignore patterns
  {
    ignores: [
      'dist/**',
      'build/**',
      'node_modules/**',
      '*.config.js',
      '*.config.ts',
      'public/**',
      'supabase/**',
      'test-*.js',
      'test-suite/**',
      '**/*.test.js',
      'debug-*.js',
      'load-testing/**',
      'src/lib/db.js'
    ],
  },
  
  // JavaScript recommended rules
  js.configs.recommended,
  
  // TypeScript configuration
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        },
        project: './tsconfig.json'
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        Headers: 'readonly',
        NodeJS: 'readonly',
        performance: 'readonly',
        speechSynthesis: 'readonly',
        alert: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        atob: 'readonly',
        btoa: 'readonly',
        Notification: 'readonly',
        SpeechSynthesisUtterance: 'readonly',
        AudioContext: 'readonly',
        Audio: 'readonly',
        MediaSource: 'readonly',
        Blob: 'readonly',
        FileReader: 'readonly',
        Image: 'readonly',
        Event: 'readonly',
        CustomEvent: 'readonly',
        MessageEvent: 'readonly',
        CloseEvent: 'readonly',
        ErrorEvent: 'readonly',
        WebSocket: 'readonly',
        HTMLElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLTextAreaElement: 'readonly',
        HTMLSelectElement: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLAnchorElement: 'readonly',
        HTMLFormElement: 'readonly',
        HTMLCanvasElement: 'readonly',
        HTMLImageElement: 'readonly',
        HTMLVideoElement: 'readonly',
        HTMLAudioElement: 'readonly',
        Element: 'readonly',
        Node: 'readonly',
        NodeList: 'readonly',
        EventTarget: 'readonly',
        KeyboardEvent: 'readonly',
        MouseEvent: 'readonly',
        FocusEvent: 'readonly',
        TouchEvent: 'readonly',
        DragEvent: 'readonly',
        PointerEvent: 'readonly',
        WheelEvent: 'readonly',
        ResizeObserver: 'readonly',
        MutationObserver: 'readonly',
        IntersectionObserver: 'readonly',
        AbortController: 'readonly',
        FormData: 'readonly',
        location: 'readonly',
        history: 'readonly',
        screen: 'readonly',
        indexedDB: 'readonly',
        crypto: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        queueMicrotask: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        requestIdleCallback: 'readonly',
        cancelIdleCallback: 'readonly',
        matchMedia: 'readonly',
        getComputedStyle: 'readonly',
        PerformanceObserver: 'readonly',
        React: 'readonly',
        JSX: 'readonly',
      }
    },
    plugins: {
      '@typescript-eslint': typescript,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh
    },
    rules: {
      // Disable base rule in favor of TypeScript version
      'no-unused-vars': 'off',
      
      // TypeScript rules
      '@typescript-eslint/no-unused-vars': ['error', { 
        args: 'all',
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        ignoreRestSiblings: true
      }],
      '@typescript-eslint/no-explicit-any': 'warn', // Warn on any usage - gradually improve type safety
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      
      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      
      // React Refresh rule
      'react-refresh/only-export-components': ['warn', { 
        allowConstantExport: true 
      }],
      
      // General code quality
      'no-console': 'off', // Allow console.log for debugging - remove in production
      'prefer-const': 'warn',
      'no-var': 'error',
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      'curly': ['error', 'all'],
      'no-throw-literal': 'error',
      'no-empty': 'warn', // Downgrade empty blocks to warning
      
      // Best practices
      'no-unused-expressions': 'error',
      'no-duplicate-imports': 'warn', // Downgrade to warning - some files have intentional split imports
      'no-template-curly-in-string': 'warn',
      'array-callback-return': 'error',
      'no-await-in-loop': 'warn',
      
      // Disabled rules (for now)
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-empty-function': 'off',
    }
  }
];
