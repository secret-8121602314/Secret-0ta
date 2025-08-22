import { createClient } from "@supabase/supabase-js";

// Environment variables for Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl || "", supabaseKey || "", {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Simplified auth service for landing page
export class AuthService {
  private static instance: AuthService;
  private authState = { user: null, session: null, loading: false, error: null };

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  getAuthState() {
    return this.authState;
  }

  async signOut() {
    try {
      await supabase.auth.signOut();
      this.authState = { user: null, session: null, loading: false, error: null };
    } catch (error) {
      console.error("Sign out error:", error);
    }
  }
}

export const authService = AuthService.getInstance();


