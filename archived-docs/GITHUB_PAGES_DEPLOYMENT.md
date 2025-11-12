# GitHub Pages Deployment Guide with Custom Domain

This guide will help you deploy your Otagon app to GitHub Pages with your custom domain `otagon.app`.

## ✅ What's Been Set Up

1. **Vite Configuration**: Updated with `base: '/'` for custom domain
2. **GitHub Actions Workflow**: Automated deployment on push to main branch
3. **CNAME File**: Created in `public/CNAME` with your domain
4. **Deploy Script**: Added `deploy:gh-pages` script to package.json

---

## 📋 Step-by-Step Deployment Instructions

### Step 1: Add Environment Secrets to GitHub

1. Go to your GitHub repository: `https://github.com/readmet3xt/otakon-cursor`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add these secrets:
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
   - `VITE_GEMINI_API_KEY` - Your Gemini API key

### Step 2: Enable GitHub Pages

1. In your repository, go to **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions**
3. Save the settings

### Step 3: Configure Your Custom Domain

#### A. In GitHub Repository Settings:

1. Still in **Settings** → **Pages**
2. Under **Custom domain**, enter: `otagon.app`
3. Check **Enforce HTTPS** (after DNS propagates)
4. Click **Save**

#### B. In Your Domain Registrar (DNS Settings):

You have two options for DNS configuration:

**Option 1: Using Apex Domain (otagon.app)**
Add these **A records**:
```
Type: A
Name: @
Value: 185.199.108.153

Type: A
Name: @
Value: 185.199.109.153

Type: A
Name: @
Value: 185.199.110.153

Type: A
Name: @
Value: 185.199.111.153
```

**Option 2: Using www Subdomain (www.otagon.app)**
Update the CNAME file to `www.otagon.app` and add:
```
Type: CNAME
Name: www
Value: readmet3xt.github.io
```

**Recommended: Support Both**
```
# A records for apex domain
Type: A, Name: @, Value: 185.199.108.153
Type: A, Name: @, Value: 185.199.109.153
Type: A, Name: @, Value: 185.199.110.153
Type: A, Name: @, Value: 185.199.111.153

# CNAME for www subdomain
Type: CNAME, Name: www, Value: readmet3xt.github.io
```

### Step 4: Deploy Your App

#### Option A: Automatic Deployment (Recommended)

1. Commit and push your changes:
```bash
git add .
git commit -m "Configure GitHub Pages deployment with custom domain"
git push origin main
```

2. The GitHub Action will automatically build and deploy
3. Check the **Actions** tab in your repository to monitor progress

#### Option B: Manual Deployment (if needed)

If you prefer manual control or for testing:
```bash
npm install -g gh-pages
npm run deploy:gh-pages
```

---

## 🔍 Verification Steps

### 1. Check GitHub Actions
- Go to **Actions** tab in your repository
- Verify the "Deploy to GitHub Pages" workflow completes successfully
- If it fails, check the logs for errors

### 2. Verify DNS Propagation
Wait 5-60 minutes for DNS to propagate, then check:
```bash
# Check if DNS is configured correctly
nslookup otagon.app

# Or use online tools
# https://www.whatsmydns.net/#A/otagon.app
```

### 3. Test Your Deployment
- Visit `https://otagon.app` 
- Verify your app loads correctly
- Test all routes and features
- Check browser console for any errors

---

## 🚨 Troubleshooting

### Issue: 404 Page Not Found
**Solution**: Make sure:
- GitHub Pages is enabled with "GitHub Actions" as source
- The workflow completed successfully
- CNAME file exists in `public/` folder
- DNS records are correctly configured

### Issue: CSS/JS Not Loading
**Solution**: Check that `base: '/'` is set in `vite.config.ts`

### Issue: API Keys Not Working
**Solution**: Verify all secrets are added to GitHub repository settings

### Issue: Routing Issues (404 on refresh)
**Solution**: This is already handled by the workflow. The built-in GitHub Pages configuration redirects all routes to `index.html`.

### Issue: DNS Not Resolving
**Solution**:
- Wait 24-48 hours for full DNS propagation
- Use `dig otagon.app` or online DNS checkers
- Verify A records point to GitHub's IPs
- Contact your domain registrar if issues persist

---

## 🔄 Update Workflow

To update your deployed app:

1. Make your changes locally
2. Test with `npm run dev`
3. Build and test: `npm run build && npm run preview`
4. Commit and push to main branch
5. GitHub Actions will automatically deploy

---

## 📊 Monitoring Your Deployment

### GitHub Actions Dashboard
- View build logs: Repository → Actions
- Check deployment status
- Review any errors or warnings

### GitHub Pages Status
- Settings → Pages shows:
  - Your custom domain status
  - HTTPS certificate status
  - Last deployment time

---

## 🎯 Next Steps After Deployment

1. **Test thoroughly** - Check all features and routes
2. **Set up monitoring** - Consider adding analytics
3. **Enable HTTPS** - Should auto-enable after DNS propagates
4. **Update links** - Change any hardcoded URLs to use your domain
5. **SEO optimization** - Update meta tags with your domain

---

## 📝 Important Notes

- **First deployment** may take 10-15 minutes
- **DNS propagation** can take up to 48 hours (usually faster)
- **HTTPS certificate** is automatically provided by GitHub
- **Builds** happen automatically on every push to main
- **Environment variables** are securely stored in GitHub Secrets

---

## 🆘 Need Help?

If you encounter issues:
1. Check the GitHub Actions logs
2. Verify DNS configuration with online tools
3. Review GitHub Pages documentation: https://docs.github.com/pages
4. Check your domain registrar's DNS documentation

---

## ✨ Your Deployment URLs

- **Production**: https://otagon.app
- **GitHub Pages**: https://readmet3xt.github.io/otakon-cursor (backup URL)
- **Repository**: https://github.com/readmet3xt/otakon-cursor

---

Good luck with your deployment! 🚀
