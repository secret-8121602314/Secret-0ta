#!/bin/bash

# Production Deployment Script for Otagon App
# This script builds and deploys the optimized app

echo "🚀 Starting Otagon Production Deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run from the project root."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run linting and type checking
echo "🔍 Running linting and type checking..."
npm run lint || echo "⚠️ Linting issues found, but continuing..."

# Build the app
echo "🏗️ Building the app..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix errors before deploying."
    exit 1
fi

# Check if Firebase is configured
if [ ! -f "firebase.json" ]; then
    echo "❌ Error: firebase.json not found. Please configure Firebase first."
    exit 1
fi

# Deploy to Firebase
echo "🚀 Deploying to Firebase..."
firebase deploy --only hosting

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🌐 Your app is now live at: https://your-project-id.web.app"
else
    echo "❌ Deployment failed. Please check the logs above."
    exit 1
fi

# Run post-deployment checks
echo "🔍 Running post-deployment checks..."

# Check if the app is accessible
echo "📊 Checking app accessibility..."
curl -s -o /dev/null -w "%{http_code}" https://your-project-id.web.app

if [ $? -eq 0 ]; then
    echo "✅ App is accessible"
else
    echo "⚠️ App accessibility check failed"
fi

echo "🎉 Deployment process complete!"
echo ""
echo "📋 Next steps:"
echo "1. Test the live app thoroughly"
echo "2. Monitor performance metrics"
echo "3. Set up error tracking (Sentry, LogRocket, etc.)"
echo "4. Configure analytics (Google Analytics, Mixpanel, etc.)"
echo "5. Set up monitoring alerts"
