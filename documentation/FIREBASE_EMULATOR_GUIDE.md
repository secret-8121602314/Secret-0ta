# 🔥 Firebase Emulator Suite Implementation Guide

## 📋 Overview

This guide provides comprehensive instructions for using Firebase Emulator Suite to test your Otagon AI Gaming Companion app before deploying to Firebase Hosting. The emulator suite allows you to test your app locally with Firebase services without affecting your production environment.

## 🚀 Quick Start

### 1. Prerequisites
- ✅ Firebase CLI installed (`firebase --version`)
- ✅ Node.js and npm installed
- ✅ Your app built (`npm run build`)

### 2. Start Emulators
```bash
# Start all emulators
npm run emulator:start

# Start only hosting emulator
npm run emulator:start:hosting

# Start with UI
npm run emulator:start:ui
```

### 3. Access Your App
- **App**: http://localhost:5000
- **Emulator UI**: http://localhost:4000
- **Auth Emulator**: http://localhost:9099
- **Firestore Emulator**: http://localhost:8080

## 🛠️ Configuration

### Firebase Configuration (`firebase.json`)
```json
{
  "emulators": {
    "auth": {
      "port": 9099,
      "host": "localhost"
    },
    "firestore": {
      "port": 8080,
      "host": "localhost"
    },
    "hosting": {
      "port": 5000,
      "host": "localhost"
    },
    "ui": {
      "enabled": true,
      "port": 4000,
      "host": "localhost"
    },
    "singleProjectMode": true
  }
}
```

### Environment Variables (`env.emulator.template`)
```env
# Firebase Emulator URLs
VITE_FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
VITE_FIREBASE_FIRESTORE_EMULATOR_HOST=localhost:8080
VITE_FIREBASE_HOSTING_EMULATOR_HOST=localhost:5000

# App Environment
VITE_APP_ENV=emulator
VITE_FIREBASE_EMULATOR=true
VITE_EMULATOR_MODE=true
```

## 📜 Available Scripts

### Basic Emulator Commands
```bash
# Start all emulators
npm run emulator:start

# Start specific emulators
npm run emulator:start:hosting    # Hosting only
npm run emulator:start:auth      # Auth only
npm run emulator:start:firestore  # Firestore only
npm run emulator:start:ui        # UI only

# Stop emulators
npm run emulator:stop

# Development with emulator
npm run dev:emulator
```

### Testing Commands
```bash
# Run tests with emulator
npm run test:emulator
npm run emulator:test

# Run tests in watch mode
npm run emulator:test:watch

# Comprehensive emulator testing
npm run emulator:test:all
npm run emulator:test:setup
npm run emulator:test:start
npm run emulator:test:ui
npm run emulator:test:data
npm run emulator:test:integration
```

### Data Management
```bash
# Export emulator data
npm run emulator:export

# Import emulator data
npm run emulator:import
```

## 🧪 Testing Workflow

### 1. Automated Testing
The `scripts/test-emulator.js` script provides comprehensive testing:

```bash
# Run all tests
npm run emulator:test:all

# Run specific test suites
npm run emulator:test:setup        # Test setup
npm run emulator:test:start        # Test startup
npm run emulator:test:ui           # Test UI
npm run emulator:test:data         # Test data persistence
npm run emulator:test:integration  # Test app integration
```

### 2. Manual Testing Checklist

#### Authentication Testing
- [ ] Developer mode login (`zircon123`)
- [ ] Google OAuth flow
- [ ] Discord OAuth flow
- [ ] Email/password authentication
- [ ] Session persistence
- [ ] Sign out functionality

#### App Functionality Testing
- [ ] Landing page navigation
- [ ] Login screen behavior
- [ ] Splash screens (first-time users)
- [ ] Chat interface
- [ ] Settings modal
- [ ] Tier switching (dev mode)
- [ ] Trial system (free users)
- [ ] Waitlist functionality

#### Performance Testing
- [ ] App loading time
- [ ] Authentication response time
- [ ] Database operations
- [ ] Image upload functionality
- [ ] PWA features

### 3. Integration Testing

#### Supabase Integration
Since your app uses Supabase as the primary backend, test the integration:

```bash
# Test with Supabase backend
npm run dev:emulator

# Test authentication flow
# 1. Visit http://localhost:5000
# 2. Test developer mode login
# 3. Test OAuth flows
# 4. Verify session persistence
```

#### Firebase Hosting Integration
Test how your app behaves when served by Firebase Hosting emulator:

```bash
# Start hosting emulator
npm run emulator:start:hosting

# Test app functionality
# 1. Visit http://localhost:5000
# 2. Test all user flows
# 3. Verify PWA features
# 4. Check service worker
```

## 🔧 Troubleshooting

### Common Issues

#### Port Conflicts
```bash
# Check what's using the ports
lsof -ti:3000  # Hosting (updated port)
lsof -ti:9099  # Auth
lsof -ti:8081  # Firestore (updated port)
lsof -ti:4000  # UI

# Kill processes on specific ports
kill -9 $(lsof -ti:3000)
```

#### React createContext Errors
If you encounter `Cannot read properties of undefined (reading 'createContext')` errors:

1. **Check Vite Configuration**: Ensure React and ReactDOM are bundled together
2. **Clear Build Cache**: `rm -rf dist node_modules/.vite`
3. **Rebuild**: `npm run build`
4. **Restart Emulator**: `npm run emulator:start:hosting`

#### Emulator Won't Start
```bash
# Check Firebase CLI version
firebase --version

# Check firebase.json configuration
cat firebase.json

# Check if dist directory exists
ls -la dist/

# Rebuild if necessary
npm run build
```

#### Authentication Issues
```bash
# Check environment variables
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY

# Test Supabase connection
npm run test:run
```

### Debug Mode
Enable debug logging by setting environment variables:

```bash
# Enable debug mode
export VITE_DEBUG_MODE=true
export VITE_LOG_LEVEL=debug

# Start emulator with debug info
npm run emulator:start
```

## 📊 Emulator UI Features

### Authentication Emulator
- **URL**: http://localhost:4000/auth
- **Features**:
  - View authenticated users
  - Test OAuth providers
  - Simulate authentication flows
  - Debug authentication errors

### Firestore Emulator
- **URL**: http://localhost:4000/firestore
- **Features**:
  - View collections and documents
  - Test database operations
  - Debug security rules
  - Export/import data

### Hosting Emulator
- **URL**: http://localhost:5000
- **Features**:
  - Serve your built app
  - Test routing and rewrites
  - Debug hosting configuration
  - Test PWA features

## 🚀 Deployment Workflow

### Pre-Deployment Testing
```bash
# 1. Run comprehensive tests
npm run emulator:test:all

# 2. Test with emulator
npm run dev:emulator

# 3. Manual testing checklist
# - Authentication flows
# - App functionality
# - Performance
# - PWA features

# 4. Build for production
npm run build

# 5. Deploy to Firebase
npm run deploy:production
```

### CI/CD Integration
```bash
# In your CI pipeline
npm run build
npm run emulator:test:all
npm run deploy:production
```

## 📈 Performance Monitoring

### Emulator Performance
Monitor emulator performance during testing:

```bash
# Check emulator resource usage
ps aux | grep firebase

# Monitor network requests
# Use browser dev tools Network tab
# Check for slow requests or errors
```

### App Performance
Test your app's performance in the emulator:

```bash
# Run performance tests
npm run performance:check

# Analyze bundle size
npm run analyze

# Test loading times
# Use browser dev tools Performance tab
```

## 🔒 Security Testing

### Authentication Security
- [ ] Test password validation
- [ ] Test rate limiting
- [ ] Test session management
- [ ] Test OAuth security
- [ ] Test developer mode security

### Data Security
- [ ] Test RLS policies
- [ ] Test data validation
- [ ] Test input sanitization
- [ ] Test error handling

## 📝 Best Practices

### 1. Environment Management
- Use separate environment files for emulator vs production
- Never commit production credentials to version control
- Use environment variables for all configuration

### 2. Testing Strategy
- Test all authentication flows
- Test all user journeys
- Test error scenarios
- Test performance under load

### 3. Data Management
- Export emulator data for consistent testing
- Use test data that mirrors production
- Clean up test data regularly

### 4. Development Workflow
- Always test with emulator before deploying
- Use emulator for feature development
- Test integration points thoroughly

## 🆘 Support

### Getting Help
- **Firebase Documentation**: https://firebase.google.com/docs/emulator-suite
- **Firebase Community**: https://firebase.google.com/community
- **Stack Overflow**: Tag questions with `firebase-emulator`

### Common Commands Reference
```bash
# Start emulators
firebase emulators:start

# Start specific emulators
firebase emulators:start --only hosting,auth

# Export data
firebase emulators:export ./data

# Import data
firebase emulators:start --import ./data

# Stop emulators
firebase emulators:stop

# Get emulator info
firebase emulators:list
```

---

## 🎯 Next Steps

1. **Set up environment variables** using `env.emulator.template`
2. **Run initial tests** with `npm run emulator:test:all`
3. **Test your app** at http://localhost:3000
4. **Use Emulator UI** at http://localhost:4000
5. **Integrate into your workflow** for pre-deployment testing

This implementation provides a complete Firebase Emulator Suite setup for testing your Otagon app before deployment. The emulator suite will help you catch issues early and ensure a smooth deployment process.
