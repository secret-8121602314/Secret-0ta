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
      '@typescript-eslint/no-explicit-any': 'warn',
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
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'warn',
      'no-var': 'error',
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      'curly': ['error', 'all'],
      'no-throw-literal': 'error',
      
      // Best practices
      'no-unused-expressions': 'error',
      'no-duplicate-imports': 'error',
      'no-template-curly-in-string': 'warn',
      'array-callback-return': 'error',
      'no-await-in-loop': 'warn',
      
      // Disabled rules (for now)
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-empty-function': 'off',
    }
  }
];
