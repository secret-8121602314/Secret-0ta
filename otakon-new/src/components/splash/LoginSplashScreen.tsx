import React, { useState, useEffect } from 'react';
import Logo from '../ui/Logo';
import Button from '../ui/Button';
import { authService } from '../../services/authService';
import TermsModal from '../modals/TermsModal';
import PrivacyModal from '../modals/PrivacyModal';

interface LoginSplashScreenProps {
  onComplete: () => void;
  onBackToLanding: () => void;
  onSetAppState: (updater: (prev: any) => any) => void;
}

const LoginSplashScreen: React.FC<LoginSplashScreenProps> = ({
  onComplete,
  onBackToLanding,
  onSetAppState,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailMode, setEmailMode] = useState<'options' | 'signin' | 'signup' | 'forgot-password'>('options');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeveloperPassword, setShowDeveloperPassword] = useState(false);
  const [developerPassword, setDeveloperPassword] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showSignupSuccess, setShowSignupSuccess] = useState(false);

  // Validate password meets Supabase requirements
  const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Email validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };


  // Clear errors when user starts typing
  useEffect(() => {
    if (emailError && email) {
      setEmailError('');
    }
  }, [email, emailError]);

  useEffect(() => {
    if (passwordError && password) {
      setPasswordError('');
    }
  }, [password, passwordError]);

  // Real-time password validation for signup
  useEffect(() => {
    if (emailMode === 'signup' && password) {
      const validation = validatePassword(password);
      if (!validation.isValid) {
        // Don't show error immediately, just clear any existing error
        // The validation will be shown in the UI requirements list
        setPasswordError('');
      }
    }
  }, [password, emailMode]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && emailMode !== 'options') {
        setEmailMode('options');
        setEmail('');
        setPassword('');
        setEmailError('');
        setPasswordError('');
        setErrorMessage('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [emailMode]);

  const handleAuth = async (method: 'google' | 'discord' | 'email' | 'dev') => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      if (method === 'dev') {
        const result = await authService.signInWithDeveloper(developerPassword);
        if (result.success) {
          onComplete();
        } else {
          setErrorMessage(result.error || 'Invalid developer password');
        }
        return;
      }

      if (method === 'email') {
        setEmailMode('signin');
        setIsLoading(false);
        return;
      }

      // OAuth methods
      const result = await authService[method === 'google' ? 'signInWithGoogle' : 'signInWithDiscord']();
      if (result.success) {
        // OAuth will redirect, so we don't need to call onComplete here
        return;
      } else {
        setErrorMessage(result.error || 'Authentication failed. Please try again.');
      }
    } catch (error) {
      setErrorMessage('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setEmailError('');
    setPasswordError('');
    setErrorMessage('');

    // Validate email
    if (!email) {
      setEmailError('Email is required');
      return;
    }
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    // Validate password for sign in
    if (emailMode === 'signin' && !password) {
      setPasswordError('Password is required');
      return;
    }
    if (emailMode === 'signin' && password.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }

    // Check if email is already registered with a different provider
    if (emailMode === 'signin') {
      const providerCheck = await authService.checkEmailProvider(email);
      if (providerCheck.provider && providerCheck.provider !== 'email') {
        setErrorMessage(providerCheck.message);
        return;
      }
    }

    setIsLoading(true);
    setIsAnimating(true);

    try {
      let result;
      if (emailMode === 'signin') {
        // Set view to app immediately to prevent flash
        onComplete();
        // Show loading state during sign-in
        setIsLoading(true);
        result = await authService.signInWithEmail(email, password);
      } else {
        // For signup, validate the password
        if (!password) {
          setPasswordError('Password is required');
          return;
        }
        
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
          setPasswordError(passwordValidation.errors[0]);
          return;
        }
        
        result = await authService.signUpWithEmail(email, password);
      }
      
      if (result.success) {
        if (emailMode === 'signup') {
          // Check if email confirmation is required
          if (result.requiresConfirmation) {
            setShowSignupSuccess(true);
            setSuccessMessage(result.message || 'Please check your email and click the confirmation link to complete your account setup.');
          } else {
            // Account created and user is signed in
            setShowSignupSuccess(true);
            setSuccessMessage('Account created successfully! You are now signed in.');
          }
        } else {
          // Store remember me preference for sign-in
          if (rememberMe) {
            localStorage.setItem('otakon_remember_me', 'true');
            localStorage.setItem('otakon_remembered_email', email);
          }
          // onComplete() was already called above for sign-in
        }
      } else {
        // If sign-in failed, we need to go back to login screen
        if (emailMode === 'signin') {
          // Reset the view back to login
          onSetAppState(prev => ({ ...prev, view: 'landing', onboardingStatus: 'login' }));
        }
        setErrorMessage(result.error || 'Authentication failed. Please try again.');
      }
    } catch (error) {
      setErrorMessage('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
      setIsAnimating(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setEmailError('Please enter your email address first');
      return;
    }
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const result = await authService.resetPassword(email);
      if (result.success) {
        setSuccessMessage('Password reset email sent! Check your inbox.');
        setErrorMessage('');
        setTimeout(() => {
          setEmailMode('signin');
          setSuccessMessage('');
        }, 3000);
      } else {
        setErrorMessage(result.error || 'Failed to send reset email. Please try again.');
      }
    } catch (error) {
      setErrorMessage('Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#0F0F0F] to-background text-text-primary flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse hidden md:block"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/5 rounded-full blur-3xl animate-pulse delay-1000 hidden md:block"></div>
        {/* Mobile background elements */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/5 rounded-full blur-2xl animate-pulse md:hidden"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-secondary/5 rounded-full blur-2xl animate-pulse delay-1000 md:hidden"></div>
      </div>
      
      <div className={`w-full max-w-md relative z-10 transition-all duration-500 ${isAnimating ? 'scale-105' : 'scale-100'} mx-auto`}>
        {/* Logo and Title */}
        <div className="text-center mb-6 md:mb-8">
          <Logo size="xl" className="mx-auto mb-4 md:mb-6 animate-bounce-slow" />
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            Welcome to Otagon
          </h1>
          <p className="text-sm md:text-base text-text-secondary px-4">
            {emailMode === 'options' 
              ? 'Sign in to start your gaming adventure' 
              : emailMode === 'signin' 
                ? 'Welcome back! Sign in to continue'
                : emailMode === 'signup'
                  ? 'Create your account to get started'
                  : 'Reset your password'
            }
          </p>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-4 md:mb-6 p-3 md:p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-center text-sm md:text-base">
            {errorMessage}
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 md:mb-6 p-3 md:p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-center text-sm md:text-base">
            {successMessage}
          </div>
        )}

        {/* Email Form */}
        {(emailMode === 'signin' || emailMode === 'signup') && (
          <form onSubmit={handleEmailAuth} className="space-y-4 mb-6" role="form" aria-label={`${emailMode === 'signin' ? 'Sign in' : 'Sign up'} form`}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email-input" className="sr-only">
                  Email address
                </label>
                <input
                  id="email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  autoComplete="email"
                  aria-describedby={emailError ? "email-error" : undefined}
                  className={`w-full bg-surface border rounded-xl py-2.5 md:py-3 px-3 md:px-4 text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300 text-sm md:text-base ${
                    emailError 
                      ? 'border-red-500/50 focus:border-red-500/60' 
                      : 'border-surface-light/60 focus:border-primary/60'
                  }`}
                />
                {emailError && (
                  <p id="email-error" className="mt-2 text-sm text-red-400" role="alert">{emailError}</p>
                )}
              </div>

              {(emailMode === 'signin' || emailMode === 'signup') && (
                <div>
                  <label htmlFor="password-input" className="sr-only">
                    Password
                  </label>
                  <input
                    id="password-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={emailMode === 'signin' ? "Enter your password" : "Create a password"}
                    required
                    autoComplete={emailMode === 'signin' ? "current-password" : "new-password"}
                    aria-describedby={passwordError ? "password-error" : undefined}
                    className={`w-full bg-surface border rounded-xl py-2.5 md:py-3 px-3 md:px-4 text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300 text-sm md:text-base ${
                      passwordError 
                        ? 'border-red-500/50 focus:border-red-500/60' 
                        : 'border-surface-light/60 focus:border-primary/60'
                    }`}
                  />
                  {passwordError && (
                    <p id="password-error" className="mt-2 text-sm text-red-400" role="alert">{passwordError}</p>
                  )}
                  {emailMode === 'signup' && (
                    <div className="mt-2 text-xs text-text-muted">
                      <p>Password must contain:</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li className={password.match(/[a-z]/) ? 'text-green-400' : 'text-text-muted'}>
                          At least one lowercase letter
                        </li>
                        <li className={password.match(/[A-Z]/) ? 'text-green-400' : 'text-text-muted'}>
                          At least one uppercase letter
                        </li>
                        <li className={password.match(/[0-9]/) ? 'text-green-400' : 'text-text-muted'}>
                          At least one number
                        </li>
                        <li className={password.match(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/) ? 'text-green-400' : 'text-text-muted'}>
                          At least one special character
                        </li>
                        <li className={password.length >= 8 ? 'text-green-400' : 'text-text-muted'}>
                          At least 8 characters long
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {emailMode === 'signin' && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 text-sm text-text-secondary">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-primary bg-surface border-surface-light/60 rounded focus:ring-primary focus:ring-2"
                    />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setEmailMode('forgot-password')}
                    className="text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              isLoading={isLoading}
              variant="primary"
              className="w-full"
            >
              {isLoading ? (emailMode === 'signin' ? 'Signing in...' : 'Creating account...') : (emailMode === 'signin' ? 'Sign In' : 'Create Account')}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setEmailMode('options')}
                className="text-text-muted hover:text-text-primary transition-colors text-sm"
              >
                ← Back to options
              </button>
            </div>
          </form>
        )}

        {/* Forgot Password Form */}
        {emailMode === 'forgot-password' && (
          <form onSubmit={(e) => { e.preventDefault(); handleForgotPassword(); }} className="space-y-4 mb-6">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className={`w-full bg-surface border rounded-xl py-3 px-4 text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300 ${
                  emailError 
                    ? 'border-red-500/50 focus:border-red-500/60' 
                    : 'border-surface-light/60 focus:border-primary/60'
                }`}
              />
              {emailError && (
                <p className="mt-2 text-sm text-red-400">{emailError}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              isLoading={isLoading}
              variant="primary"
              className="w-full"
            >
              {isLoading ? 'Sending...' : 'Send Reset Email'}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setEmailMode('signin')}
                className="text-text-muted hover:text-text-primary transition-colors text-sm"
              >
                ← Back to sign in
              </button>
            </div>
          </form>
        )}

        {/* Sign-up Success Message */}
        {showSignupSuccess && (
          <div className="text-center space-y-4">
            <div className="text-green-500 text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-[#F5F5F5] mb-2">Account Created!</h2>
            <p className="text-[#CFCFCF] mb-6">{successMessage}</p>
            <div className="space-y-3">
              <Button
                onClick={() => {
                  setShowSignupSuccess(false);
                  setEmailMode('signin');
                  setPassword('');
                  setEmailError('');
                  setPasswordError('');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                variant="primary"
                className="w-full hover:scale-105 transition-all duration-300 py-2.5 md:py-3"
              >
                Sign In Now
              </Button>
              <button
                onClick={() => {
                  setShowSignupSuccess(false);
                  setEmailMode('options');
                  setEmail('');
                  setPassword('');
                  setEmailError('');
                  setPasswordError('');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className="text-text-muted hover:text-text-primary transition-colors text-sm"
              >
                ← Back to options
              </button>
            </div>
          </div>
        )}

        {/* Auth Options */}
        {emailMode === 'options' && (
          <div className="space-y-3 md:space-y-4">
            <button
              onClick={() => handleAuth('google')}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 md:space-x-3 hover:scale-105 transition-all duration-300 py-2.5 md:py-3 font-bold rounded-xl bg-white text-gray-700 hover:shadow-lg hover:shadow-blue-500/25 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 border border-gray-200"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            <button
              onClick={() => handleAuth('discord')}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 md:space-x-3 hover:scale-105 transition-all duration-300 py-2.5 md:py-3 font-bold rounded-xl bg-[#5865F2] text-white hover:bg-[#4752C4] hover:shadow-lg hover:shadow-indigo-500/25 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              <span>Continue with Discord</span>
            </button>

            <div className="space-y-2 md:space-y-3">
              <button
                onClick={() => setEmailMode('signin')}
                disabled={isLoading}
                className="w-full hover:scale-105 transition-all duration-300 py-2.5 md:py-3 font-bold rounded-xl bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white hover:shadow-xl hover:shadow-[#E53A3A]/25 focus:outline-none focus:ring-2 focus:ring-[#E53A3A] focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                Sign In with Email
              </button>
              <Button
                onClick={() => setEmailMode('signup')}
                disabled={isLoading}
                variant="ghost"
                className="w-full hover:scale-105 transition-all duration-300 py-2.5 md:py-3"
              >
                Create New Account
              </Button>
            </div>

            {/* Developer Mode */}
            <div className="pt-4 border-t border-surface-light/20 text-center">
              {!showDeveloperPassword ? (
                <button
                  onClick={() => setShowDeveloperPassword(true)}
                  className="text-xs text-text-muted hover:text-primary transition-colors duration-200 underline"
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
                    className="px-2 py-1 bg-surface border border-surface-light/60 rounded text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors text-xs w-24"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAuth('dev');
                      }
                    }}
                  />
                  <button
                    onClick={() => handleAuth('dev')}
                    className="px-2 py-1 h-6 bg-transparent text-primary font-bold rounded text-xs hover:bg-primary/10 transition-all duration-200 flex items-center justify-center"
                  >
                    Enter
                  </button>
                  <button
                    onClick={() => setShowDeveloperPassword(false)}
                    className="text-xs text-text-muted hover:text-primary transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-6 md:mt-8">
          <p className="text-xs text-text-muted mb-4">
            By continuing, you agree to our{' '}
            <button
              onClick={() => setShowTermsModal(true)}
              className="text-primary hover:text-secondary transition-colors underline"
            >
              Terms of Service
            </button>
            {' '}and{' '}
            <button
              onClick={() => setShowPrivacyModal(true)}
              className="text-primary hover:text-secondary transition-colors underline"
            >
              Privacy Policy
            </button>
            .
          </p>

          {/* Back to Landing */}
          <button
            onClick={onBackToLanding}
            className="text-text-muted hover:text-text-primary transition-colors text-xs md:text-sm flex items-center justify-center space-x-1 md:space-x-2 mx-auto hover:scale-105 transition-all duration-300"
            aria-label="Return to landing page"
          >
            <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Landing Page</span>
          </button>
        </div>
      </div>

      {/* Modals */}
      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
      />
      <PrivacyModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />
    </div>
  );
};

export default LoginSplashScreen;
