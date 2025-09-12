import React, { useState, useEffect } from 'react';
import Logo from './Logo';
import GoogleIcon from './GoogleIcon';
import EmailIcon from './EmailIcon';
import DiscordIcon from './DiscordIcon';
import { authService } from '../services/supabase';
import Button from './ui/Button';
import { useAnalytics } from '../hooks/useAnalytics';
import PWAInstallBanner from './PWAInstallBanner';

interface LoginSplashScreenProps {
    onComplete: () => void;
    onOpenPrivacy?: () => void;
    onOpenTerms?: () => void;
    onBackToLanding?: () => void;
}

type EmailMode = 'options' | 'signin' | 'signup' | 'forgot-password';

const LoginSplashScreen: React.FC<LoginSplashScreenProps> = ({ onComplete, onOpenPrivacy, onOpenTerms, onBackToLanding }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [emailMode, setEmailMode] = useState<EmailMode>('options');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showDeveloperPassword, setShowDeveloperPassword] = useState(false);
    const [developerPassword, setDeveloperPassword] = useState('');
    
    // Animation states for buttons
    const [buttonAnimations, setButtonAnimations] = useState({
        google: false,
        discord: false,
        email: false
    });

    // Analytics tracking
    const { startOnboardingStep, completeOnboardingStep, trackOnboardingDropOff, trackButtonClick } = useAnalytics();

    // Monitor authentication errors
    useEffect(() => {
        const unsubscribe = authService.subscribe((authState) => {
            if (authState.error && !authState.loading) {
                console.error('Authentication error detected:', authState.error);
                setErrorMessage(authState.error.message || 'Authentication failed. Please try again.');
                // Reset button animations on error
                setButtonAnimations({ google: false, discord: false, email: false });
            }
        });

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, []);

    // Start tracking onboarding step
    useEffect(() => {
        startOnboardingStep('login', 1, { component: 'LoginSplashScreen' });
        
        // Track page view
        return () => {
            // Component will unmount, analytics hook will handle cleanup
        };
    }, [startOnboardingStep]);

    const handleAuth = async (method: 'google' | 'discord' | 'email') => {
        // Track button click
        trackButtonClick(method, 'LoginSplashScreen', { method });
        
        // Clear any existing error messages
        setErrorMessage('');
        
        // Only animate the specific button that was clicked
        setButtonAnimations(prev => ({ 
            google: false, 
            discord: false, 
            email: false,
            [method]: true 
        }));
        
        if (method === 'email') {
            setEmailMode('signin');
            // Reset animation after a short delay
            setTimeout(() => setButtonAnimations(prev => ({ ...prev, [method]: false })), 300);
            return;
        }
        
        localStorage.setItem('otakonAuthMethod', method);
        
        try {
            if (method === 'google') {
                const result = await authService.signInWithGoogle();
                if (result.success) {
                    console.log('Google OAuth initiated successfully, waiting for authentication to complete...');
                    completeOnboardingStep('login', 1, { method: 'google', success: true });
                    // Don't call onComplete() here - let the authentication success handler in App.tsx handle the next screen
                } else {
                    console.error('Google OAuth failed:', result.error);
                    trackOnboardingDropOff('login', 1, 'google_oauth_failed', { error: result.error });
                    setButtonAnimations(prev => ({ ...prev, [method]: false }));
                }
            } else if (method === 'discord') {
                const result = await authService.signInWithDiscord();
                if (result.success) {
                    console.log('Discord OAuth initiated successfully, waiting for authentication to complete...');
                    completeOnboardingStep('login', 1, { method: 'discord', success: true });
                    // Don't call onComplete() here - let the authentication success handler in App.tsx handle the next screen
                } else {
                    console.error('Discord OAuth failed:', result.error);
                    trackOnboardingDropOff('login', 1, 'discord_oauth_failed', { error: result.error });
                    setButtonAnimations(prev => ({ ...prev, [method]: false }));
                }
            }
        } catch (error) {
            console.error('Auth error:', error);
            trackOnboardingDropOff('login', 1, 'auth_error', { error: error instanceof Error ? error.message : String(error) });
            setButtonAnimations(prev => ({ ...prev, [method]: false }));
        }
    };

    const handleEmailSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;

        setIsLoading(true);
        setErrorMessage('');
        
        try {
            const result = await authService.signIn(email, password);
            if (result.success) {
                localStorage.setItem('otakonAuthMethod', 'email');
                completeOnboardingStep('login', 1, { method: 'email', success: true });
                onComplete();
            } else {
                setErrorMessage(result.error?.message || 'Sign in failed. Please check your credentials.');
                trackOnboardingDropOff('login', 1, 'email_signin_failed', { error: result.error?.message });
            }
        } catch (error) {
            setErrorMessage('An unexpected error occurred. Please try again.');
            trackOnboardingDropOff('login', 1, 'email_signin_error', { error: error instanceof Error ? error.message : String(error) });
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmailSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password || !confirmPassword) return;
        
        if (password !== confirmPassword) {
            setErrorMessage('Passwords do not match.');
            return;
        }

        if (password.length < 6) {
            setErrorMessage('Password must be at least 6 characters long.');
            return;
        }

        setIsLoading(true);
        setErrorMessage('');
        
        try {
            const result = await authService.signUp(email, password);
            if (result.success) {
                setSuccessMessage('Account created successfully! Please check your email to verify your account.');
                setTimeout(() => {
                    setEmailMode('signin');
                    setSuccessMessage('');
                }, 3000);
            } else {
                setErrorMessage(result.error?.message || 'Sign up failed. Please try again.');
            }
        } catch (error) {
            setErrorMessage('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setIsLoading(true);
        setErrorMessage('');
        
        try {
            const result = await authService.resetPassword(email);
            if (result.success) {
                setSuccessMessage('Password reset email sent! Please check your inbox.');
                setTimeout(() => {
                    setEmailMode('signin');
                    setSuccessMessage('');
                }, 3000);
            } else {
                setErrorMessage(result.error?.message || 'Failed to send reset email. Please try again.');
            }
        } catch (error) {
            setErrorMessage('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackToOptions = () => {
        setEmailMode('options');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setErrorMessage('');
        setSuccessMessage('');
        setShowDeveloperPassword(false);
        setDeveloperPassword('');
    };

    const handleSkip = async () => {
        if (developerPassword === 'zircon123') {
            setIsLoading(true);
            setErrorMessage('');
            
            try {
                // Use the developer mode authentication from authService
                const result = await authService.signInWithDeveloperMode(developerPassword);
                
                if (result.success) {
                    // Set developer mode flags
                    localStorage.setItem('otakon_developer_mode', 'true');
                    localStorage.setItem('otakonAuthMethod', 'developer');
                    console.log('🔧 Developer mode activated successfully!');
                    onComplete();
                } else {
                    setErrorMessage(result.error || 'Developer authentication failed.');
                    setDeveloperPassword(''); // Clear password on error
                }
            } catch (error) {
                console.error('Developer mode error:', error);
                setErrorMessage('An unexpected error occurred. Please try again.');
                setDeveloperPassword(''); // Clear password on error
            } finally {
                setIsLoading(false);
            }
        } else {
            setErrorMessage('Incorrect developer password.');
            setDeveloperPassword(''); // Clear password on error
        }
    };

    const renderEmailForm = () => {
        switch (emailMode) {
            case 'signin':
                return (
                    <form onSubmit={handleEmailSignIn} className="w-full space-y-6">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-white mb-3 bg-clip-text text-transparent bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40]">Sign In</h2>
                            <p className="text-[#A3A3A3] text-lg">Welcome back! Sign in to your account</p>
                        </div>
                        
                        {errorMessage && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm backdrop-blur-sm">
                                {errorMessage}
                            </div>
                        )}
                        
                        {successMessage && (
                            <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl text-sm backdrop-blur-sm">
                                {successMessage}
                            </div>
                        )}
                        
                        <div className="space-y-3">
                            <label className="block text-left text-sm font-medium text-[#CFCFCF]">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                required
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-[#2E2E2E] to-[#1A1A1A] border-2 border-[#424242]/60 rounded-xl py-3 px-4 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#FFAB40] focus:border-[#FFAB40]/60 transition-all duration-300 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="block text-left text-sm font-medium text-[#CFCFCF]">Password</label>
                                <button
                                    type="button"
                                    onClick={() => setEmailMode('forgot-password')}
                                    className="text-sm text-[#FFAB40] hover:text-[#FFAB40]/80 transition-colors underline"
                                >
                                    Forgot your password?
                                </button>
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-[#2E2E2E] to-[#1A1A1A] border-2 border-[#424242]/60 rounded-xl py-3 px-4 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#FFAB40] focus:border-[#FFAB40]/60 transition-all duration-300 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>
                        
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={handleBackToOptions}
                                className="flex-1 bg-gradient-to-r from-[#2E2E2E] to-[#1C1C1C] border-2 border-[#424242]/60 text-[#F5F5F5] font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:from-[#424242] hover:to-[#2E2E2E] hover:scale-105 hover:shadow-lg"
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#E53A3A]/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                        Signing In...
                                    </div>
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                        </div>
                        
                        <div className="text-center mt-8">
                            <div className="text-sm text-[#A3A3A3]">
                                Don't have an account?{' '}
                                <button
                                    type="button"
                                    onClick={() => setEmailMode('signup')}
                                    className="text-[#FFAB40] hover:text-[#FFAB40]/80 transition-colors underline"
                                >
                                    Sign up
                                </button>
                            </div>
                        </div>
                    </form>
                );

            case 'signup':
                return (
                    <form onSubmit={handleEmailSignUp} className="w-full space-y-6">
                        <div className="text-left mb-8">
                            <h2 className="text-3xl font-bold text-white mb-3 bg-clip-text text-transparent bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40]">Create Account</h2>
                            <p className="text-[#A3A3A3] text-lg">Join Otagon AI and start your gaming journey</p>
                        </div>
                        
                        {errorMessage && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm backdrop-blur-sm">
                                {errorMessage}
                            </div>
                        )}
                        
                        {successMessage && (
                            <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl text-sm backdrop-blur-sm">
                                {successMessage}
                            </div>
                        )}
                        
                        <div className="space-y-3">
                            <label className="block text-left text-sm font-medium text-[#CFCFCF]">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                required
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-[#2E2E2E] to-[#1A1A1A] border-2 border-[#424242]/60 rounded-xl py-3 px-4 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#FFAB40] focus:border-[#FFAB40]/60 transition-all duration-300 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="block text-left text-sm font-medium text-[#CFCFCF]">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Create a password"
                                required
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-[#2E2E2E] to-[#1A1A1A] border-2 border-[#424242]/60 rounded-xl py-3 px-4 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#FFAB40] focus:border-[#FFAB40]/60 transition-all duration-300 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="block text-left text-sm font-medium text-[#CFCFCF]">Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm your password"
                                required
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-[#2E2E2E] to-[#1A1A1A] border-2 border-[#424242]/60 rounded-xl py-3 px-4 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#FFAB40] focus:border-[#FFAB40]/60 transition-all duration-300 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>
                        
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={handleBackToOptions}
                                className="flex-1 bg-gradient-to-r from-[#2E2E2E] to-[#1C1C1C] border-2 border-[#424242]/60 text-[#F5F5F5] font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:from-[#424242] hover:to-[#2E2E2E] hover:scale-105 hover:shadow-lg"
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#E53A3A]/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                        Creating Account...
                                    </div>
                                ) : (
                                    'Create Account'
                                )}
                            </button>
                        </div>
                        
                        <div className="text-center mt-8 text-sm text-[#A3A3A3]">
                            Already have an account?{' '}
                            <button
                                type="button"
                                onClick={() => setEmailMode('signin')}
                                className="text-[#FFAB40] hover:text-[#FFAB40]/80 transition-colors underline"
                            >
                                Sign in
                            </button>
                        </div>
                    </form>
                );

            case 'forgot-password':
                return (
                    <form onSubmit={handleForgotPassword} className="w-full space-y-6">
                        <div className="text-left mb-8">
                            <h2 className="text-3xl font-bold text-white mb-3 bg-clip-text text-transparent bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40]">Reset Password</h2>
                            <p className="text-[#A3A3A3] text-lg">Enter your email to receive a password reset link</p>
                        </div>
                        
                        {errorMessage && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm backdrop-blur-sm">
                                {errorMessage}
                            </div>
                        )}
                        
                        {successMessage && (
                            <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl text-sm backdrop-blur-sm">
                                {successMessage}
                            </div>
                        )}
                        
                        <div className="space-y-3">
                            <label className="block text-left text-sm font-medium text-[#CFCFCF]">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                required
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-[#2E2E2E] to-[#1A1A1A] border-2 border-[#424242]/60 rounded-xl py-3 px-4 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#FFAB40] focus:border-[#FFAB40]/60 transition-all duration-300 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>
                        
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={handleBackToOptions}
                                className="flex-1 bg-gradient-to-r from-[#2E2E2E] to-[#1C1C1C] border-2 border-[#424242]/60 text-[#F5F5F5] font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:from-[#424242] hover:to-[#2E2E2E] hover:scale-105 hover:shadow-lg"
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#E53A3A]/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                        Sending...
                                    </div>
                                ) : (
                                    'Send Reset Link'
                                )}
                            </button>
                        </div>
                        
                        <div className="text-center text-sm text-[#A3A3A3]">
                            Remember your password?{' '}
                            <button
                                type="button"
                                onClick={() => setEmailMode('signin')}
                                className="text-[#FFAB40] hover:text-[#FFAB40]/80 transition-colors underline"
                            >
                                Sign in
                            </button>
                        </div>
                    </form>
                );

            default:
                return null;
        }
    };

    return (
        <div className="h-screen bg-gradient-to-br from-[#111111] to-[#0A0A0A] text-[#F5F5F5] flex flex-col items-center justify-center font-inter px-4 sm:px-6 md:px-8 text-center overflow-hidden animate-fade-in">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial-at-top from-[#1C1C1C]/30 to-transparent pointer-events-none"></div>
            
            {/* Main Content - Centered */}
            <div className="flex flex-col items-center justify-center w-full max-w-2xl pb-16">
                <div className="animate-fade-slide-up flex-shrink-0 mb-1">
                    <Logo className="w-24 h-24 sm:w-26 sm:h-26 md:w-28 md:h-28" />
                </div>

                <h1 
                    className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40] animate-fade-slide-up leading-normal"
                >
                    Welcome to Otagon
                </h1>

                <p 
                    className="text-base text-[#CFCFCF] leading-relaxed animate-fade-slide-up mt-1"
                >
                    {emailMode === 'signin' ? 'Sign in to continue your gaming journey' : 'Join Otagon AI and start your gaming journey'}
                </p>

                {emailMode === 'options' ? (
                    <div 
                        className="flex flex-col items-center justify-center gap-4 w-full max-w-lg px-4 sm:px-0 animate-fade-slide-up mt-12"
                       
                    >
                        {errorMessage && (
                            <div className="w-full bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm backdrop-blur-sm">
                                {errorMessage}
                            </div>
                        )}
                    <button
                        onClick={() => handleAuth('google')}
                        disabled={isLoading}
                        className={`w-full flex items-center justify-center bg-gradient-to-r from-white to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-800 font-bold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-base ${buttonAnimations.google ? 'animate-pulse-glow' : ''}`}
                    >
                        <span className="inline-flex items-center gap-3">
                            <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                                <GoogleIcon className="w-6 h-6" />
                            </div>
                            <span>Continue with Google</span>
                        </span>
                    </button>
                    
                    <button
                        onClick={() => handleAuth('discord')}
                        disabled={isLoading}
                        className={`w-full flex items-center justify-center bg-gradient-to-r from-[#5865F2] to-[#4752C4] hover:from-[#4752C4] hover:to-[#3C45A5] text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#5865F2]/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-base ${buttonAnimations.discord ? 'animate-pulse-glow' : ''}`}
                    >
                        <span className="inline-flex items-center gap-3">
                            <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                                <DiscordIcon className="w-6 h-6" />
                            </div>
                            <span>Continue with Discord</span>
                        </span>
                    </button>
                    
                    <button
                        onClick={() => handleAuth('email')}
                        disabled={isLoading}
                        className={`w-full flex items-center justify-center bg-gradient-to-r from-neutral-700 to-neutral-600 hover:from-neutral-600 hover:to-neutral-500 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-base ${buttonAnimations.email ? 'animate-pulse-glow' : ''}`}
                    >
                        <span className="inline-flex items-center gap-3">
                            <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                                <EmailIcon className="w-6 h-6" />
                            </div>
                            <span>Continue with Email</span>
                        </span>
                    </button>

                    </div>
                ) : (
                    <div 
                        className="w-full max-w-md px-4 sm:px-0 animate-fade-slide-up mt-12"
                       
                    >
                        {renderEmailForm()}
                    </div>
                )}
            </div>
            
            {/* Footer - Moved to bottom */}
            <div className="flex-shrink-0 px-4 sm:px-6 pt-4 sm:pt-6 pb-4 sm:pb-6 text-center">
                <p className="text-xs text-[#A3A3A3]">
                    By continuing, you agree to our{' '}
                    {onOpenTerms ? (
                        <button
                            onClick={onOpenTerms}
                            className="text-[#FFAB40] hover:text-[#FF4D4D] transition-colors underline"
                        >
                            Terms of Service
                        </button>
                    ) : (
                        <span className="text-[#FFAB40]">Terms of Service</span>
                    )}
                    {' '}and{' '}
                    {onOpenPrivacy ? (
                        <button
                            onClick={onOpenPrivacy}
                            className="text-[#FFAB40] hover:text-[#FF4D4D] transition-colors underline"
                        >
                            Privacy Policy
                        </button>
                    ) : (
                        <span className="text-[#FFAB40]">Privacy Policy</span>
                    )}
                    .
                </p>
            </div>
            
            {/* Developer Mode - In normal document flow */}
            {emailMode === 'options' && (
                <div className="flex-shrink-0 px-4 sm:px-6 pt-4 pb-4 sm:pb-6 text-center">
                {!showDeveloperPassword ? (
                    <button
                        onClick={() => setShowDeveloperPassword(true)}
                        className="text-xs text-[#6E6E6E] hover:text-[#FFAB40] transition-colors duration-200 underline"
                    >
                        Developer Mode
                    </button>
                ) : (
                    <div className="flex items-center gap-2 justify-center">
                        <input
                            type="password"
                            placeholder="Dev password"
                            value={developerPassword}
                            onChange={(e) => setDeveloperPassword(e.target.value)}
                            className="px-2 py-1 bg-[#2E2E2E] border border-[#424242] rounded text-white placeholder-[#6E6E6E] focus:outline-none focus:border-[#FFAB40] transition-colors text-xs w-24"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSkip();
                                }
                            }}
                        />
                        <button
                            onClick={handleSkip}
                            className="px-2 py-1 h-6 bg-transparent text-[#FFAB40] font-bold rounded text-xs hover:bg-[#FFAB40]/10 transition-all duration-200 flex items-center justify-center"
                        >
                            Enter
                        </button>
                        <button
                            onClick={() => setShowDeveloperPassword(false)}
                            className="text-xs text-[#6E6E6E] hover:text-[#FFAB40] transition-colors duration-200"
                        >
                            Cancel
                        </button>
                    </div>
                )}
                
                {/* Back to Landing Page Button */}
                {onBackToLanding && (
                    <div className="mt-4">
                        <button
                            onClick={onBackToLanding}
                            className="text-sm text-[#6E6E6E] hover:text-[#FF4D4D] transition-colors duration-200 underline"
                        >
                            Back
                        </button>
                    </div>
                )}
                </div>
            )}
            
            {/* PWA Install Banner */}
            <PWAInstallBanner />
        </div>
    );
};

export default React.memo(LoginSplashScreen);
