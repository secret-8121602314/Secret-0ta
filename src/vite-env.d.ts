/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY: string
  readonly VITE_GOOGLE_API_KEY: string
  readonly VITE_GEMINI_API_KEY: string
  readonly DEV: boolean
  readonly PROD: boolean
  readonly SSR: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (
      command: 'event',
      action: string,
      parameters?: {
        event_category?: string
        event_label?: string
        value?: number
        [key: string]: any
      }
    ) => void
  }
}

export {}
