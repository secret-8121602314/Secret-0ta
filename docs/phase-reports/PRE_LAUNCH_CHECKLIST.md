# Pre-Launch Checklist - OTAKON

**Target Launch:** 2 weeks from today  
**Current Status:** ⚠️ Soft launch ready pending critical fixes

---

## ✅ WEEK 1: Critical Fixes (P0 Issues)

### Day 1-2: Error Tracking & Offline Detection

- [ ] **Install Sentry** (2 hours)
  - [ ] `npm install @sentry/react @sentry/vite-plugin`
  - [ ] Add VITE_SENTRY_DSN to .env
  - [ ] Configure Sentry.init() in main.tsx
  - [ ] Wrap App in Sentry.ErrorBoundary
  - [ ] Test error capture works
  - [ ] Set up Sentry project dashboard

- [ ] **Add Offline Detection** (4 hours)
  - [ ] Add online/offline event listeners in MainApp.tsx
  - [ ] Create connection status indicator component
  - [ ] Show toast on connection loss/restore
  - [ ] Disable send button when offline
  - [ ] Test offline behavior (disable network)
  - [ ] Add retry queue for failed requests (optional)

### Day 3-4: AI Reliability & Input Validation

- [ ] **AI Retry Logic** (3 hours)
  - [ ] Add retry wrapper to aiService.ts
  - [ ] Implement exponential backoff (1s, 2s, 4s)
  - [ ] Max 3 retry attempts
  - [ ] Show user-friendly error after exhausting retries
  - [ ] Test with network throttling
  - [ ] Log retry attempts for monitoring

- [ ] **Input Length Limits** (2 hours)
  - [ ] Add MAX_GAME_TITLE_LENGTH = 100 constant
  - [ ] Add MAX_MESSAGE_LENGTH = 5000 constant
  - [ ] Enforce in AddGameModal.tsx (game title)
  - [ ] Add maxLength to message textarea
  - [ ] Show character counter UI
  - [ ] Test edge cases (paste 10,000 chars)

### Day 5-7: Server-Side Security

- [ ] **Server-Side Rate Limiting** (8 hours)
  - [ ] Create check_rate_limit() RPC function in Supabase
  - [ ] Implement tier-based limits (Free, Pro, Vanguard)
  - [ ] Update all AI query endpoints to call RPC first
  - [ ] Return 429 status code when limit exceeded
  - [ ] Update client to handle 429 gracefully
  - [ ] Add rate limit headers to responses
  - [ ] Test with multiple accounts
  - [ ] Document rate limit logic

**Total Week 1:** 19 hours

---

## ✅ WEEK 2: Beta Preparation

### Deployment Setup

- [ ] **Firebase Hosting Configuration**
  - [ ] Verify firebase.json configuration
  - [ ] Set up custom domain (if ready)
  - [ ] Configure SSL certificate
  - [ ] Set up environment variables in Firebase
  - [ ] Test build command: `npm run build`
  - [ ] Deploy to staging: `firebase deploy --only hosting`

- [ ] **Database Preparation**
  - [ ] Run final schema migration
  - [ ] Create test user accounts (5-10)
  - [ ] Verify all RLS policies active
  - [ ] Set up database backups
  - [ ] Document restore procedure

- [ ] **Monitoring Setup**
  - [ ] Verify Sentry capturing errors
  - [ ] Set up Sentry alerts (email/Slack)
  - [ ] Configure Firebase Analytics (optional)
  - [ ] Set up uptime monitoring (UptimeRobot)
  - [ ] Create status page (optional)

### Beta Launch Preparation

- [ ] **User Communication**
  - [ ] Draft beta invitation email
  - [ ] Create beta feedback form (Google Forms/Typeform)
  - [ ] Set up Discord/Slack for beta testers
  - [ ] Prepare FAQ document
  - [ ] Create bug report template

- [ ] **Beta Testing Plan**
  - [ ] Recruit 50-100 beta testers
  - [ ] Define success criteria (error rate, satisfaction)
  - [ ] Set 2-week beta timeline
  - [ ] Plan daily check-ins on Sentry
  - [ ] Schedule weekly feedback review

---

## ✅ WEEK 3-4: Beta Testing & Iteration

### During Beta

- [ ] **Daily Monitoring**
  - [ ] Check Sentry for new errors (morning/evening)
  - [ ] Review user feedback from form
  - [ ] Monitor Supabase usage/costs
  - [ ] Track performance metrics
  - [ ] Respond to beta tester questions

- [ ] **P1 Fixes (As Time Allows)**
  - [ ] Component error boundaries (6h)
  - [ ] WebSocket max retries (1h)
  - [ ] Memory leak audit (8h)
  - [ ] AI streaming implementation (6h)

### Week 4: Pre-Launch

- [ ] **Final Checks**
  - [ ] No critical errors in Sentry (last 48 hours)
  - [ ] User satisfaction >8/10
  - [ ] All P0 issues resolved
  - [ ] Database performance acceptable
  - [ ] Costs within budget

- [ ] **Launch Preparation**
  - [ ] Draft launch announcement
  - [ ] Prepare marketing materials
  - [ ] Set up customer support email
  - [ ] Create onboarding tutorial (optional)
  - [ ] Plan launch day monitoring

---

## ⚠️ Launch Day Checklist

### Morning (Before Launch)

- [ ] Final smoke test all critical flows
- [ ] Verify environment variables
- [ ] Check Sentry is capturing
- [ ] Backup database
- [ ] Deploy to production
- [ ] Verify deployment successful
- [ ] Test production URL

### Launch

- [ ] Send announcement email
- [ ] Post on social media
- [ ] Enable public access
- [ ] Monitor Sentry actively
- [ ] Watch for traffic spikes
- [ ] Be ready to rollback if needed

### Evening (Post-Launch)

- [ ] Review error logs
- [ ] Check user feedback
- [ ] Verify database performance
- [ ] Monitor costs
- [ ] Celebrate! 🎉

---

## 🔧 Post-Launch (Month 1)

### P1 Issues (If Not Done in Beta)

- [ ] Memory leak audit and fixes (8h)
- [ ] AI streaming implementation (6h)
- [ ] Additional component boundaries (6h)

### Monitoring & Iteration

- [ ] Weekly error review
- [ ] Monthly performance audit
- [ ] User feedback analysis
- [ ] Feature usage analytics
- [ ] Cost optimization

---

## 📊 Success Metrics

Track these KPIs post-launch:

- [ ] Error rate: <1% (target)
- [ ] User satisfaction: >8/10 (target)
- [ ] Daily active users: Track growth
- [ ] Conversion to Pro: Track %
- [ ] Support tickets: <10/week initially
- [ ] Sentry errors: <50/day
- [ ] Page load time: <3s (P95)
- [ ] AI response time: <5s (P95)

---

## 🆘 Rollback Plan

If critical issues arise post-launch:

1. **Immediate**: Revert to previous deployment (`firebase hosting:clone`)
2. **Communicate**: Email users about temporary maintenance
3. **Fix**: Address critical bug in staging
4. **Test**: Verify fix thoroughly
5. **Redeploy**: Push fixed version
6. **Monitor**: Watch Sentry for 24 hours

---

## 📝 Notes & Decisions

**Date: [Add date]**
- Decision: 
- Reason:
- Impact:

---

## ✅ Sign-Off

- [ ] **Engineering Lead**: All P0 fixes complete and tested
- [ ] **Product**: Features meet requirements
- [ ] **QA**: Critical flows tested, no blocking bugs
- [ ] **DevOps**: Infrastructure ready, monitoring active
- [ ] **Support**: Ready to handle user inquiries

**Launch Approved By:** ________________  
**Date:** ________________

---

**Good luck with the launch! 🚀**
