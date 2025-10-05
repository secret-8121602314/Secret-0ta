# 🚀 Production Deployment Guide

## Overview
This guide walks you through deploying your optimized Otagon app to production.

## Prerequisites

### 1. Firebase Setup
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init hosting
```

### 2. Environment Configuration
Create a `.env.production` file:
```env
VITE_SUPABASE_URL=your-production-supabase-url
VITE_SUPABASE_ANON_KEY=your-production-supabase-anon-key
VITE_WEBSOCKET_URL=wss://your-production-websocket-url
```

## Deployment Steps

### 1. Pre-Deployment Checklist
- [ ] All tests passing
- [ ] Linting issues resolved
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Performance optimizations verified

### 2. Build and Deploy
```bash
# Make deployment script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

### 3. Manual Deployment (Alternative)
```bash
# Install dependencies
npm install

# Build the app
npm run build

# Deploy to Firebase
firebase deploy --only hosting
```

## Post-Deployment

### 1. Verify Deployment
- [ ] App loads correctly
- [ ] Authentication works
- [ ] Database connections work
- [ ] WebSocket connections work
- [ ] Cache service functions

### 2. Performance Monitoring
- [ ] Set up performance monitoring
- [ ] Configure error tracking
- [ ] Set up analytics
- [ ] Monitor database performance

### 3. Load Testing
```bash
# Run load tests
cd load-testing
npm install
npm run test:medium
```

## Monitoring Setup

### 1. Performance Monitoring
The app includes built-in performance monitoring. Check the console for metrics:
- Page load times
- API response times
- Cache hit rates
- Memory usage
- Error rates

### 2. External Monitoring (Recommended)
Consider setting up:
- **Sentry** for error tracking
- **LogRocket** for session replay
- **Google Analytics** for user analytics
- **New Relic** for performance monitoring

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check for TypeScript errors
   - Verify all imports are correct
   - Ensure environment variables are set

2. **Deployment Failures**
   - Check Firebase configuration
   - Verify Firebase CLI is logged in
   - Check Firebase project permissions

3. **Runtime Errors**
   - Check browser console for errors
   - Verify Supabase configuration
   - Check network connectivity

### Performance Issues

1. **Slow Loading**
   - Check cache configuration
   - Verify database indexes
   - Monitor API response times

2. **High Memory Usage**
   - Check for memory leaks
   - Verify cleanup functions
   - Monitor WebSocket connections

## Security Checklist

- [ ] Environment variables secured
- [ ] API keys not exposed
- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] Database RLS policies active
- [ ] Rate limiting enabled

## Rollback Plan

If issues occur after deployment:

1. **Quick Rollback**
   ```bash
   # Deploy previous version
   firebase deploy --only hosting
   ```

2. **Database Rollback**
   - Restore from backup
   - Apply previous migrations
   - Verify data integrity

## Maintenance

### Regular Tasks
- [ ] Monitor performance metrics
- [ ] Check error logs
- [ ] Update dependencies
- [ ] Backup database
- [ ] Review security logs

### Weekly Tasks
- [ ] Run load tests
- [ ] Review performance reports
- [ ] Check for security updates
- [ ] Monitor user feedback

## Support

If you encounter issues:
1. Check the troubleshooting section
2. Review error logs
3. Test in development environment
4. Contact support team

---

**Remember**: Always test thoroughly in a staging environment before deploying to production!
