// Test script for multiple OAuth providers
// Run this in the browser console to test the functionality

console.log('🧪 OAuth Provider Testing Script');
console.log('================================');

// Function to clear all user data for testing
window.clearAllUserData = async () => {
  try {
    // Access the auth service through the global window object
    if (window.authService) {
      await window.authService.clearAllUserData();
      console.log('✅ All user data cleared successfully');
    } else {
      console.log('❌ Auth service not available. Make sure the app is loaded.');
    }
  } catch (error) {
    console.error('❌ Error clearing user data:', error);
  }
};

// Function to check current user data
window.checkCurrentUser = () => {
  try {
    if (window.authService) {
      const authState = window.authService.getAuthState();
      console.log('👤 Current user data:', authState);
      
      if (authState.user) {
        console.log('📧 User email:', authState.user.email);
        console.log('🆔 Auth User ID:', authState.user.authUserId);
        console.log('🎯 Onboarding completed:', authState.user.onboardingCompleted);
      } else {
        console.log('❌ No user logged in');
      }
    } else {
      console.log('❌ Auth service not available');
    }
  } catch (error) {
    console.error('❌ Error checking user data:', error);
  }
};

// Function to test OAuth provider detection
window.testOAuthProvider = async () => {
  try {
    const { data: { user } } = await window.supabase.auth.getUser();
    if (user) {
      console.log('🔐 Auth user data:', user);
      console.log('📧 Email:', user.email);
      
      // Check multiple possible locations for provider information
      let provider = 'email';
      if (user.app_metadata?.provider) {
        provider = user.app_metadata.provider;
      } else if (user.app_metadata?.providers && user.app_metadata.providers.length > 0) {
        provider = user.app_metadata.providers[0];
      } else if (user.identities && user.identities.length > 0) {
        provider = user.identities[0].provider;
      } else if (user.user_metadata?.provider) {
        provider = user.user_metadata.provider;
      }
      
      console.log('🏷️ Detected Provider:', provider);
      console.log('📝 User metadata:', user.user_metadata);
      console.log('⚙️ App metadata:', user.app_metadata);
      console.log('🔗 Identities:', user.identities);
      
      // Test unique email generation
      let uniqueEmail;
      if (provider === 'email') {
        uniqueEmail = user.email;
      } else {
        uniqueEmail = `${provider}_${user.email}`;
      }
      console.log('🔑 Unique Email:', uniqueEmail);
    } else {
      console.log('❌ No auth user found');
    }
  } catch (error) {
    console.error('❌ Error getting auth user:', error);
  }
};

// Function to test Discord OAuth configuration
window.testDiscordConfig = async () => {
  try {
    if (window.authService) {
      const result = await window.authService.testDiscordConfiguration();
      console.log('🔧 Discord Configuration Test:', result);
      
      if (result.isValid) {
        console.log('✅ Discord OAuth is properly configured');
        console.log('📋 Available providers:', result.details.availableProviders);
        console.log('🔗 Redirect URL:', result.details.redirectUrl);
      } else {
        console.log('❌ Discord OAuth configuration issue:', result.message);
        console.log('📋 Details:', result.details);
      }
    } else {
      console.log('❌ Auth service not available');
    }
  } catch (error) {
    console.error('❌ Error testing Discord configuration:', error);
  }
};

// Function to test Discord OAuth directly
window.testDiscordAuth = async () => {
  try {
    if (window.authService) {
      console.log('🚀 Testing Discord OAuth...');
      console.log('📍 Current URL:', window.location.href);
      console.log('📍 Current origin:', window.location.origin);
      console.log('📍 Current port:', window.location.port);
      
      const result = await window.authService.signInWithDiscord();
      console.log('🔐 Discord OAuth result:', result);
    } else {
      console.log('❌ Auth service not available');
    }
  } catch (error) {
    console.error('❌ Error testing Discord auth:', error);
  }
};

// Function to test Discord OAuth URL generation
window.testDiscordUrl = () => {
  try {
    const redirectUrl = `${window.location.origin}/auth/callback`;
    console.log('🔗 Generated redirect URL:', redirectUrl);
    console.log('📍 Current origin:', window.location.origin);
    console.log('📍 Expected Discord redirect:', redirectUrl);
    
    // Test if the URL is accessible
    fetch(redirectUrl)
      .then(response => {
        console.log('✅ Redirect URL is accessible:', response.status);
      })
      .catch(error => {
        console.log('❌ Redirect URL is not accessible:', error);
      });
  } catch (error) {
    console.error('❌ Error testing Discord URL:', error);
  }
};

// Function to test email sign-up
window.testEmailSignup = async (email, password) => {
  try {
    if (window.authService) {
      console.log('📧 Testing email sign-up...');
      console.log('📧 Email:', email);
      console.log('📧 Password length:', password ? password.length : 0);
      
      const result = await window.authService.signUpWithEmail(email, password);
      console.log('📧 Sign-up result:', result);
      
      if (result.requiresConfirmation) {
        console.log('📧 Email confirmation required:', result.message);
      } else if (result.success) {
        console.log('📧 Sign-up successful, user created');
      } else {
        console.log('❌ Sign-up failed:', result.error);
      }
    } else {
      console.log('❌ Auth service not available');
    }
  } catch (error) {
    console.error('❌ Error testing email sign-up:', error);
  }
};

// Function to test email sign-in
window.testEmailSignin = async (email, password) => {
  try {
    if (window.authService) {
      console.log('🔑 Testing email sign-in...');
      console.log('🔑 Email:', email);
      
      const result = await window.authService.signInWithEmail(email, password);
      console.log('🔑 Sign-in result:', result);
      
      if (result.success) {
        console.log('🔑 Sign-in successful');
      } else {
        console.log('❌ Sign-in failed:', result.error);
      }
    } else {
      console.log('❌ Auth service not available');
    }
  } catch (error) {
    console.error('❌ Error testing email sign-in:', error);
  }
};

// Function to test complete email flow
window.testEmailFlow = async () => {
  try {
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    console.log('🧪 Testing complete email authentication flow...');
    console.log('📧 Test email:', testEmail);
    console.log('🔑 Test password:', testPassword);
    
    // Step 1: Test sign-up
    console.log('\n📝 Step 1: Testing email sign-up...');
    await testEmailSignup(testEmail, testPassword);
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 2: Check current user
    console.log('\n👤 Step 2: Checking current user...');
    checkCurrentUser();
    
    // Step 3: Test sign-out
    console.log('\n🚪 Step 3: Testing sign-out...');
    if (window.authService) {
      await window.authService.signOut();
      console.log('✅ Signed out successfully');
    }
    
    // Step 4: Test sign-in
    console.log('\n🔑 Step 4: Testing email sign-in...');
    await testEmailSignin(testEmail, testPassword);
    
    // Step 5: Check final user state
    console.log('\n👤 Step 5: Checking final user state...');
    checkCurrentUser();
    
    console.log('\n✅ Email flow test completed!');
  } catch (error) {
    console.error('❌ Error testing email flow:', error);
  }
};

console.log('Available functions:');
console.log('- clearAllUserData() - Clear all user data for testing');
console.log('- checkCurrentUser() - Check current user data');
console.log('- testOAuthProvider() - Test OAuth provider detection');
console.log('- testDiscordConfig() - Test Discord OAuth configuration');
console.log('- testDiscordAuth() - Test Discord OAuth directly');
console.log('- testDiscordUrl() - Test Discord OAuth URL generation');
console.log('- testEmailSignup(email, password) - Test email sign-up');
console.log('- testEmailSignin(email, password) - Test email sign-in');
console.log('- testEmailFlow() - Test complete email authentication flow');
console.log('');
console.log('Email Authentication Testing:');
console.log('1. Run testEmailFlow() to test complete email flow');
console.log('2. Run testEmailSignup(email, password) to test sign-up');
console.log('3. Run testEmailSignin(email, password) to test sign-in');
console.log('');
console.log('Discord OAuth Testing:');
console.log('1. Run testDiscordConfig() to check configuration');
console.log('2. Run testDiscordAuth() to test Discord OAuth');
console.log('3. Check console logs for detailed debugging info');
console.log('');
console.log('General Testing:');
console.log('1. Run clearAllUserData() to clear all data');
console.log('2. Sign in with Google');
console.log('3. Run checkCurrentUser() to see user data');
console.log('4. Run clearAllUserData() again');
console.log('5. Sign in with Discord (same email)');
console.log('6. Run checkCurrentUser() to see if it created a separate user');
