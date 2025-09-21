# 🛡️ DEVELOPMENT RULES & CHANGE CONTROL PROTOCOL

## 📋 **CORE RULES FOR SYSTEM_ARCHITECTURE.md**

### **MANDATORY PROCESS**
1. ✅ **Always refer to SYSTEM_ARCHITECTURE.md first** before starting any tasks
2. ✅ **Check for conflicts** and report them before making changes  
3. ✅ **Get explicit approval** before making any modifications
4. ✅ **Warn about behavior changes** and request approval
5. ✅ **Document how features connect** to other aspects of the app
6. ✅ **Push to Git as new branch** when updating SYSTEM_ARCHITECTURE.md

### **CHANGE CONTROL PROTOCOL**
Before making ANY changes to SYSTEM_ARCHITECTURE.md or protected behaviors:

1. **🔍 Identify**: What feature is being changed
2. **📝 Document**: Why the change is needed  
3. **⚡ Impact**: How it affects existing behavior
4. **✅ Approval**: Get explicit user approval before implementation

---

## 🚨 **PROTECTED FEATURES** (Require Approval)

### **High Priority Protected Behaviors**
- **User Flow**: Landing → Login → Chat (returning users) OR Landing → Login → Splash → Chat (first-time users)
- **Navigation**: Back button behaviors, routing patterns
- **Authentication Flows**: Login, dev mode, session management
- **Tier System**: Free → Pro → Vanguard cycling logic
- **Developer Mode**: localStorage-based data handling
- **Supabase Prevention**: Dev mode skips all Supabase calls
- **Chat Interface**: Welcome message + suggested prompts layout
- **14-Day Trial System**: One-time trial eligibility and expiration logic
- **Splash Screens**: Only for first-time users, returning users skip entirely
- **Session Persistence**: Page refresh behavior, conversation restoration, developer mode session management
- **Screenshot Timeline**: AI context awareness with chronological progression
- **Game Pill Logic**: Proper handling of unrelated games and unreleased game detection

### **Medium Priority Protected Behaviors**
- **OAuth Callback Handling**: Single service, no race conditions
- **Error Recovery**: Comprehensive error handling with proper UI state reset
- **Session Refresh**: Automatic session management to prevent unexpected logouts
- **Button State Management**: Proper loading/disabled states during authentication
- **User Experience**: Consistent error messages and recovery options
- **Data Storage**: localStorage keys, Supabase call prevention
- **UI Component Behaviors**: Settings modal, chat interface, trial system
- **Error Handling**: Authentication, network, validation patterns

---

## ⚠️ **CHANGE APPROVAL REQUIRED FOR**

### **System Architecture Changes**
- Modifying user flow sequence
- Changing developer mode behavior
- Altering tier system logic
- Adding/removing Supabase calls in dev mode
- Changing chat interface layout
- Modifying localStorage key names
- Modifying trial eligibility logic or duration
- Changing trial button placement or behavior
- Modifying navigation behavior (back buttons, routing)
- Changing splash screen logic or requirements
- Modifying session persistence behavior
- Changing screenshot timeline system
- Altering game pill creation logic

### **Authentication & Security Changes**
- OAuth callback handling modifications
- Session management changes
- Error handling pattern changes
- User state management modifications
- Authentication flow alterations

### **UI/UX Behavior Changes**
- Component behavior modifications
- User interaction pattern changes
- Error message or recovery changes
- Loading state management changes
- Modal or navigation behavior changes

---

## 🔄 **APPROVAL PROCESS**

### **Step 1: Pre-Change Analysis**
```
1. 🔍 Analyze Impact: Check if the change affects any approved behaviors
2. ⚠️ Identify Conflicts: Detect violations of established patterns
3. 📋 Report Dependencies: List all connected behaviors that might be affected
4. 🛑 Request Approval: Get explicit user approval before implementation
5. 📝 Document Changes: Update SYSTEM_ARCHITECTURE.md with the new behavior patterns
```

### **Step 2: Implementation**
```
1. ✅ Get explicit approval from user
2. 🔧 Implement changes
3. 🧪 Test thoroughly
4. 📝 Update documentation
5. 🚀 Push to Git as new branch
```

### **Step 3: Post-Change Validation**
```
1. ✅ Verify behavior matches intent
2. 📊 Test all affected features
3. 🔍 Check for regressions
4. 📝 Update change log
```

---

## 📊 **BEHAVIOR VALIDATION CHECKLIST**

Before implementing any change, verify:
- [ ] Does this change any navigation patterns?
- [ ] Does this affect authentication flows?
- [ ] Does this modify user state management?
- [ ] Does this change UI component behaviors?
- [ ] Does this affect error handling patterns?
- [ ] Does this modify data storage patterns?
- [ ] Does this change tier system logic?
- [ ] Does this affect developer mode behavior?
- [ ] Does this modify trial system behavior?
- [ ] Does this change session management?
- [ ] Does this affect session persistence?
- [ ] Does this modify screenshot timeline behavior?
- [ ] Does this change game pill creation logic?

**This ensures system consistency and prevents unintended regressions.**

---

## 🚫 **NEVER DO WITHOUT APPROVAL**

### **SYSTEM_ARCHITECTURE.md Changes**
- ❌ Never edit without explicit approval
- ❌ Never add new sections without approval
- ❌ Never modify existing behaviors without approval
- ❌ Never update version numbers without approval
- ❌ Never change behavior descriptions without approval

### **Protected Behavior Changes**
- ❌ Never modify authentication flows without approval
- ❌ Never change navigation patterns without approval
- ❌ Never alter tier system logic without approval
- ❌ Never modify developer mode behavior without approval
- ❌ Never change error handling patterns without approval

---

## 📝 **DOCUMENTATION REQUIREMENTS**

### **When Adding New Features**
- **Connection Details**: How the feature connects to other aspects of the app
- **Functionality**: How it works and what it does
- **Dependencies**: What other features it depends on
- **Impact**: How it affects existing behaviors
- **Testing**: How to verify it works correctly

### **When Modifying Existing Features**
- **Before State**: Document current behavior
- **After State**: Document new behavior
- **Migration Path**: How to transition from old to new
- **Rollback Plan**: How to revert if needed
- **Testing**: How to verify the change works

---

## 🎯 **ENFORCEMENT**

### **Rule Violations**
- **First Offense**: Warning and reminder of rules
- **Second Offense**: Explicit correction and process review
- **Third Offense**: Escalation and process reinforcement

### **Success Metrics**
- ✅ All changes properly approved before implementation
- ✅ SYSTEM_ARCHITECTURE.md remains accurate and up-to-date
- ✅ No unintended behavior changes or regressions
- ✅ Clear documentation of all modifications
- ✅ Proper Git workflow with branch management

---

## 🚀 **PRODUCTION DEPLOYMENT READINESS**

### **MANDATORY PRE-DEPLOYMENT CHECKS**

Before any changes are approved or deployed, the following must be verified:

#### **Code Quality & Stability**
- ✅ **No Circular Dependencies**: All imports must be properly structured
- ✅ **No Reference Errors**: All imports and exports must be correctly defined
- ✅ **No Infinite Loops**: All useEffect hooks and async operations must have proper dependencies
- ✅ **No Memory Leaks**: All subscriptions and timers must be properly cleaned up
- ✅ **No TypeScript Errors**: All type definitions must be correct
- ✅ **No Linting Errors**: Code must pass all linting checks

#### **Firebase Hosting Compatibility**
- ✅ **Build Success**: App must build without errors (`npm run build`)
- ✅ **Static Asset Loading**: All images, icons, and assets must load correctly
- ✅ **Environment Variables**: All required environment variables must be properly configured
- ✅ **Service Worker**: PWA service worker must be properly configured
- ✅ **Manifest**: PWA manifest must be valid and complete

#### **PWA Mobile Compatibility**
- ✅ **Responsive Design**: App must work on all mobile screen sizes
- ✅ **Touch Interactions**: All buttons and interactions must work on mobile
- ✅ **Offline Functionality**: App must handle offline scenarios gracefully
- ✅ **Install Prompts**: PWA installation must work correctly
- ✅ **Performance**: App must load quickly on mobile networks

#### **Database & Service Connectivity**
- ✅ **Supabase Connection**: Database connections must be stable
- ✅ **Error Handling**: All network failures must be handled gracefully
- ✅ **Fallback Mechanisms**: App must work with localStorage when database is unavailable
- ✅ **Authentication Flow**: All auth providers must work correctly
- ✅ **Data Synchronization**: Data sync must work reliably

#### **Production Environment Testing**
- ✅ **Local Build Test**: `npm run build` must complete successfully
- ✅ **Local Preview Test**: `npm run preview` must work without errors
- ✅ **Firebase Emulator Test**: All Firebase functions must work in emulator
- ✅ **Cross-Browser Test**: App must work in Chrome, Firefox, Safari, Edge
- ✅ **Mobile Device Test**: App must work on actual mobile devices

---

## 🔍 **PRE-APPROVAL PRODUCTION CHECKLIST**

Before requesting approval for any changes, verify:

### **Code Stability**
- [ ] No circular dependencies introduced
- [ ] No reference errors in console
- [ ] No infinite loops in useEffect hooks
- [ ] All imports/exports are correct
- [ ] All TypeScript types are valid
- [ ] All linting errors resolved

### **Build Compatibility**
- [ ] `npm run build` completes successfully
- [ ] No build warnings or errors
- [ ] All static assets are properly referenced
- [ ] Bundle size is reasonable (< 2MB)
- [ ] No unused dependencies

### **Firebase Hosting Ready**
- [ ] Environment variables properly configured
- [ ] Service worker configured correctly
- [ ] PWA manifest is valid
- [ ] All routes work correctly
- [ ] No 404 errors for assets

### **Mobile PWA Ready**
- [ ] Responsive design works on mobile
- [ ] Touch interactions work properly
- [ ] PWA installation works
- [ ] Offline functionality works
- [ ] Performance is acceptable on mobile

### **Database & Services**
- [ ] Supabase connection is stable
- [ ] Error handling covers all scenarios
- [ ] Fallback to localStorage works
- [ ] Authentication flows work
- [ ] Data sync is reliable

**This checklist must be completed before requesting approval for any changes.**

---

- **SYSTEM_ARCHITECTURE.md**: Single source of truth for app behavior
- **Change Control Protocol**: Section 303-333 in SYSTEM_ARCHITECTURE.md
- **Protected Features**: Section 305-325 in SYSTEM_ARCHITECTURE.md
- **Behavior Change Log**: Section 415-429 in SYSTEM_ARCHITECTURE.md

---

*Last Updated: January 16, 2025*
*Version: 2.0*
*Purpose: Ensure consistent adherence to development rules and change control protocol with enhanced session persistence and system behavior management*
