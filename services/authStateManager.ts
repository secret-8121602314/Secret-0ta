import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';

/**
 * 🔐 AUTHENTICATION STATE MANAGER
 * 
 * This service provides centralized authentication state management
 * with proper cleanup, state transitions, and data persistence handling.
 * 
 * Features:
 * 1. Centralized auth state management
 * 2. Proper cleanup on state changes
 * 3. Data migration between auth states
 * 4. Developer mode integration
 * 5. Event-driven architecture
 */

export interface AuthState {
    user: User | null;
    session: any | null;
    loading: boolean;
    error: string | null;
    isDeveloperMode: boolean;
    lastStateChange: number;
}

export interface AuthStateChangeEvent {
    type: 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'USER_UPDATED' | 'ERROR';
    previousState: AuthState;
    newState: AuthState;
    timestamp: number;
}

export type AuthStateListener = (event: AuthStateChangeEvent) => void;

class AuthStateManager {
    private static instance: AuthStateManager;
    private currentState: AuthState;
    private listeners: Set<AuthStateListener> = new Set();
    private isInitialized = false;
    private cleanupFunctions: (() => void)[] = [];

    constructor() {
        this.currentState = {
            user: null,
            session: null,
            loading: true,
            error: null,
            isDeveloperMode: false,
            lastStateChange: Date.now()
        };
    }

    static getInstance(): AuthStateManager {
        if (!AuthStateManager.instance) {
            AuthStateManager.instance = new AuthStateManager();
        }
        return AuthStateManager.instance;
    }

    /**
     * Initialize the auth state manager
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            // Check for developer mode
            const isDeveloperMode = this.checkDeveloperMode();
            this.currentState.isDeveloperMode = isDeveloperMode;

            // Set up auth state listener
            const { data: { subscription } } = supabase.auth.onAuthStateChange(
                async (event, session) => {
                    await this.handleAuthStateChange(event, session);
                }
            );

            // Store cleanup function
            this.cleanupFunctions.push(() => subscription.unsubscribe());

            // Get initial session
            const { data: { session: initialSession }, error } = await supabase.auth.getSession();
            
            if (error) {
                this.updateState({
                    loading: false,
                    error: error.message
                });
            } else {
                await this.handleAuthStateChange('SIGNED_IN', initialSession);
            }

            this.isInitialized = true;
            console.log('🔐 Auth state manager initialized');

        } catch (error) {
            console.error('Failed to initialize auth state manager:', error);
            this.updateState({
                loading: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * Get current auth state
     */
    getState(): AuthState {
        return { ...this.currentState };
    }

    /**
     * Subscribe to auth state changes
     */
    subscribe(listener: AuthStateListener): () => void {
        this.listeners.add(listener);
        
        // Return unsubscribe function
        return () => {
            this.listeners.delete(listener);
        };
    }

    /**
     * Handle auth state changes
     */
    private async handleAuthStateChange(event: string, session: any): Promise<void> {
        const previousState = { ...this.currentState };
        
        try {
            switch (event) {
                case 'SIGNED_IN':
                    await this.handleSignIn(session);
                    break;
                case 'SIGNED_OUT':
                    await this.handleSignOut();
                    break;
                case 'TOKEN_REFRESHED':
                    await this.handleTokenRefresh(session);
                    break;
                case 'USER_UPDATED':
                    await this.handleUserUpdate(session);
                    break;
                default:
                    console.warn('Unknown auth event:', event);
            }

            this.updateState({
                lastStateChange: Date.now()
            });

        } catch (error) {
            console.error('Error handling auth state change:', error);
            this.updateState({
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }

        // Notify listeners
        this.notifyListeners({
            type: event as any,
            previousState,
            newState: { ...this.currentState },
            timestamp: Date.now()
        });
    }

    /**
     * Handle user sign in
     */
    private async handleSignIn(session: any): Promise<void> {
        if (!session?.user) {
            this.updateState({
                user: null,
                session: null,
                loading: false,
                error: 'Invalid session'
            });
            return;
        }

        try {
            // Validate session
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error || !user) {
                throw new Error('Session validation failed');
            }

            // Update state
            this.updateState({
                user,
                session,
                loading: false,
                error: null
            });

            // Handle data migration if needed
            await this.handleDataMigrationOnSignIn(user);

            console.log('🔐 User signed in successfully:', user.id);

        } catch (error) {
            console.error('Sign in failed:', error);
            this.updateState({
                user: null,
                session: null,
                loading: false,
                error: error instanceof Error ? error.message : 'Sign in failed'
            });
        }
    }

    /**
     * Handle user sign out
     */
    private async handleSignOut(): Promise<void> {
        try {
            // Clean up user-specific data
            await this.cleanupUserData();

            // Update state
            this.updateState({
                user: null,
                session: null,
                loading: false,
                error: null
            });

            console.log('🔐 User signed out successfully');

        } catch (error) {
            console.error('Sign out cleanup failed:', error);
            // Still update state even if cleanup fails
            this.updateState({
                user: null,
                session: null,
                loading: false,
                error: null
            });
        }
    }

    /**
     * Handle token refresh
     */
    private async handleTokenRefresh(session: any): Promise<void> {
        if (!session?.user) {
            this.updateState({
                user: null,
                session: null,
                loading: false,
                error: 'Invalid refreshed session'
            });
            return;
        }

        this.updateState({
            user: session.user,
            session,
            loading: false,
            error: null
        });

        console.log('🔐 Token refreshed successfully');
    }

    /**
     * Handle user update
     */
    private async handleUserUpdate(session: any): Promise<void> {
        if (!session?.user) {
            this.updateState({
                user: null,
                session: null,
                loading: false,
                error: 'Invalid updated session'
            });
            return;
        }

        this.updateState({
            user: session.user,
            session,
            loading: false,
            error: null
        });

        console.log('🔐 User updated successfully');
    }

    /**
     * Handle data migration on sign in
     */
    private async handleDataMigrationOnSignIn(user: User): Promise<void> {
        try {
            // Check if user has existing data in localStorage that needs migration
            const hasLocalData = this.checkForLocalData();
            
            if (hasLocalData) {
                console.log('🔄 Migrating local data to user account...');
                await this.migrateLocalDataToUser(user);
            }

            // Initialize user-specific services
            await this.initializeUserServices(user);

        } catch (error) {
            console.error('Data migration failed:', error);
            // Don't fail sign in if migration fails
        }
    }


    /**
     * Clean up user-specific data on sign out
     */
    private async cleanupUserData(): Promise<void> {
        try {
            // Clear user-specific localStorage data
            const userSpecificKeys = [
                'otakon_conversations_v2',
                'otakon_conversations_order_v2',
                'otakon_active_conversation_v2',
                'otakon_conversations_version',
                'otakon_pending_transactions'
            ];

            userSpecificKeys.forEach(key => {
                localStorage.removeItem(key);
            });

            // Clear session storage
            sessionStorage.clear();

            // Clean up services
            await this.cleanupUserServices();

            console.log('🧹 User data cleaned up successfully');

        } catch (error) {
            console.error('Failed to cleanup user data:', error);
        }
    }

    /**
     * Check for developer mode
     */
    private checkDeveloperMode(): boolean {
        return localStorage.getItem('otakon_developer_mode') === 'true';
    }

    /**
     * Check if there's local data that needs migration
     */
    private checkForLocalData(): boolean {
        const keys = [
            'otakon_conversations',
            'otakon_conversations_order',
            'otakon_active_conversation'
        ];

        return keys.some(key => localStorage.getItem(key) !== null);
    }

    /**
     * Migrate local data to user account
     */
    private async migrateLocalDataToUser(user: User): Promise<void> {
        try {
            // Import atomic conversation service
            const { secureConversationService } = await import('./atomicConversationService');
            
            // Load local conversations
            const localResult = await secureConversationService.loadConversations();
            
            if (localResult.conversations && Object.keys(localResult.conversations).length > 1) {
                // Save to user account
                // Save each conversation individually since saveConversations doesn't exist
                for (const [conversationId, conversation] of Object.entries(localResult.conversations)) {
                    await secureConversationService.saveConversation(conversationId, conversation.title, conversation.messages, conversation.insights, conversation.context, conversation.game_id, conversation.is_pinned, false);
                }
                
                console.log('✅ Local conversations migrated to user account');
            }

        } catch (error) {
            console.error('Failed to migrate local data:', error);
        }
    }

    /**
     * Initialize user-specific services
     */
    private async initializeUserServices(user: User): Promise<void> {
        try {
            // Initialize services that require user context
            const services = [
                'unifiedUsageService',
                'playerProfileService',
                'databaseService'
            ];

            for (const serviceName of services) {
                try {
                    const service = await import(`./${serviceName}`);
                    if (service.default?.initialize) {
                        await service.default.initialize();
                    }
                } catch (error) {
                    console.warn(`Failed to initialize ${serviceName}:`, error);
                }
            }

        } catch (error) {
            console.error('Failed to initialize user services:', error);
        }
    }

    /**
     * Clean up user-specific services
     */
    private async cleanupUserServices(): Promise<void> {
        try {
            // Clean up services that have user-specific state
            const services = [
                'secureConversationService',
                'unifiedUsageService',
                'playerProfileService'
            ];

            for (const serviceName of services) {
                try {
                    const service = await import(`./${serviceName}`);
                    if (service.default?.cleanup) {
                        await service.default.cleanup();
                    }
                } catch (error) {
                    console.warn(`Failed to cleanup ${serviceName}:`, error);
                }
            }

        } catch (error) {
            console.error('Failed to cleanup user services:', error);
        }
    }

    /**
     * Update auth state
     */
    private updateState(updates: Partial<AuthState>): void {
        this.currentState = {
            ...this.currentState,
            ...updates
        };
    }

    /**
     * Notify listeners of state changes
     */
    private notifyListeners(event: AuthStateChangeEvent): void {
        this.listeners.forEach(listener => {
            try {
                listener(event);
            } catch (error) {
                console.error('Error in auth state listener:', error);
            }
        });
    }

    /**
     * Sign out user
     */
    async signOut(): Promise<void> {
        try {
            await supabase.auth.signOut({ scope: 'local' });
        } catch (error) {
            console.error('Sign out failed:', error);
            throw error;
        }
    }

    /**
     * Clear error state
     */
    clearError(): void {
        this.updateState({ error: null });
    }

    /**
     * Get auth statistics
     */
    getStats(): {
        isInitialized: boolean;
        listenerCount: number;
        isDeveloperMode: boolean;
        lastStateChange: number;
    } {
        return {
            isInitialized: this.isInitialized,
            listenerCount: this.listeners.size,
            isDeveloperMode: this.currentState.isDeveloperMode,
            lastStateChange: this.currentState.lastStateChange
        };
    }

    /**
     * Clean up resources
     */
    cleanup(): void {
        this.cleanupFunctions.forEach(cleanup => {
            try {
                cleanup();
            } catch (error) {
                console.error('Error during cleanup:', error);
            }
        });
        
        this.cleanupFunctions = [];
        this.listeners.clear();
        this.isInitialized = false;
    }
}

export const authStateManager = AuthStateManager.getInstance();

