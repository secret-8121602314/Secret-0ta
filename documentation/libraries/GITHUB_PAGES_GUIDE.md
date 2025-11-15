# GitHub Pages Complete Implementation Guide

## Table of Contents
1. [Quick Start](#quick-start)
2. [Configuration](#configuration)
3. [Deployment Methods](#deployment-methods)
4. [Custom Domains](#custom-domains)
5. [Jekyll Integration](#jekyll-integration)
6. [Advanced Workflows](#advanced-workflows)
7. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Initialize Jekyll Site Locally

```bash
# Create a new folder for your site
cd PARENT-FOLDER
git init REPOSITORY-NAME
cd REPOSITORY-NAME

# Create initial files
touch README.md _config.yml
git add .
git commit -m 'Initial GitHub pages site with Jekyll'
```

### Basic Configuration

Create `_config.yml`:
```yaml
domain: my-site.github.io
url: https://my-site.github.io
baseurl: /REPOSITORY-NAME/

# Theme configuration
theme: jekyll-theme-minimal
title: My Project
description: Project description here

# Build settings
markdown: kramdown
kramdown:
  math_engine: mathjax
  syntax_highlighter: rouge

lsi: false
safe: true
incremental: false
highlighter: rouge

# Source directory
source: [your repo's top level directory]
```

### Gemfile Setup

```ruby
source `https://rubygems.org`
gem `github-pages`, group: :jekyll_plugins
```

---

## Configuration

### _config.yml Settings

#### Domain and URL Configuration
```yaml
# For project site
domain: my-site.github.io
url: https://my-site.github.io
baseurl: /REPOSITORY-NAME/

# For user/org site (no baseurl needed)
domain: username.github.io
url: https://username.github.io
baseurl: ""
```

#### Jekyll Theme Configuration
```yaml
# Using built-in theme
theme: jekyll-theme-minimal

# Using remote theme (GitHub hosted)
remote_theme: THEME-NAME

# Theme-specific settings
title: Octocat's homepage
description: Bookmark this to keep an eye on my project updates!
```

#### Markdown Processor
```yaml
# Using kramdown (default)
markdown: kramdown
kramdown:
  syntax_highlighter: rouge
  math_engine: mathjax

# Using GitHub Flavored Markdown
markdown: GFM
```

#### Build Configuration
```yaml
lsi: false                  # Disable latent semantic indexing
safe: true                  # Safe mode enabled
incremental: false          # Full rebuild each time
highlighter: rouge          # Syntax highlighter
source: [your repo's top level directory]
```

#### Permalink Settings
```yaml
# Absolute permalinks (required by GitHub Pages)
permalink: /posts/:categories/:title/

# Language support (configure once, not per-post)
# Avoid relative_permalinks: true
```

### Repository Settings

#### Publishing Source
Set in Repository Settings → Pages:
- Deploy from a branch (main, docs folder, or gh-pages)
- GitHub Actions (for custom builds)

#### Branch Protection
1. Navigate to Settings → Branches
2. Add rule for main/master branch
3. Require pull request reviews before merging
4. Enable automatic deployment checks

---

## Deployment Methods

### Method 1: Simple Push Deployment

#### Basic Workflow
```yaml
name: Deploy GitHub Pages

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Build Static Files
        run: |
          echo "Building site..."

      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '_site'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### Method 2: Jekyll Build and Deploy

#### With Setup Pages Action
```yaml
name: Build and Deploy Jekyll

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Pages
        id: pages
        uses: actions/configure-pages@v5
      
      - name: Build with Jekyll
        uses: actions/jekyll-build-pages@v1
        with:
          source: ./.
          destination: ./_site
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v4

  deploy:
    permissions:
      contents: read
      pages: write
      id-token: write
    
    runs-on: ubuntu-latest
    needs: build
    
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### Method 3: Build and Deploy in Single Job

```yaml
jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Pages
        uses: actions/configure-pages@v5
      
      - name: Build Artifact
        uses: actions/upload-pages-artifact@v4
        with:
          path: '.'  # Upload entire directory
      
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### Method 4: Local Testing and Manual Deployment

#### Build Locally
```bash
# Install dependencies
bundle install

# Build the site
bundle exec jekyll build

# Result: _site/ directory contains static files
```

#### Serve Locally
```bash
# Development server with live reload
bundle exec jekyll serve

# Access at http://localhost:4000
# Test with custom baseurl
bundle exec jekyll serve --baseurl=""
```

#### Push Deployment
```bash
# Add and commit built files
git add .
git commit -m "Deploy site"

# Push to GitHub
git push origin main
```

---

## Custom Domains

### DNS Configuration

#### Configure A Records (IPv4)
Add these A records to your domain's DNS provider:
```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

#### Configure AAAA Records (IPv6)
Add these AAAA records to your domain's DNS provider:
```
2606:50c0:8000::153
2606:50c0:8001::153
2606:50c0:8002::153
2606:50c0:8003::153
```

#### Configure CNAME Record
**For Project Sites:**
```
CNAME: <USERNAME>.github.io
```

**Note:** CNAME should point to your GitHub Pages domain without repository name.

### Repository Configuration

#### Add Custom Domain
1. Go to Repository Settings → Pages
2. Under "Custom domain", enter your domain (e.g., `example.com`)
3. GitHub automatically creates CNAME file
4. Check "Enforce HTTPS"

#### Configure _config.yml
```yaml
domain: example.com
url: https://example.com
baseurl: ""  # No baseurl for root custom domain
```

### Troubleshooting DNS

#### Verify DNS Configuration
```bash
# Check A records
dig example.com +nostats +nocmd +nocmd A

# Check AAAA records
dig example.com +nostats +nocmd +nocmd AAAA

# Check CNAME record (for project sites)
dig subdomain.example.com +nostats +nocmd +nocmd CNAME

# Verify GitHub Pages challenge
dig _github-pages-challenge-ORGANIZATION.example.com +nostats +nocmd +nocmd TXT
```

#### Common Issues

**Broken Links After Domain Change:**
- Ensure site rebuilds automatically
- Configure commit author in GitHub settings
- Modify custom domain settings if needed

**404 on Custom Domain:**
- Verify DNS propagation (can take up to 48 hours)
- Check CNAME file exists in repository
- Verify CNAME content matches custom domain

---

## Jekyll Integration

### Directory Structure

```
my-site/
├── _config.yml
├── _includes/
│   └── header.html
├── _layouts/
│   ├── default.html
│   └── page.html
├── _posts/
│   ├── 2024-01-01-first-post.md
│   └── 2024-01-02-second-post.md
├── _data/
│   └── site.yml
├── assets/
│   ├── css/
│   │   └── style.scss
│   └── images/
├── index.md
├── about.md
└── Gemfile
```

### Template Configuration

#### Default Layout (_layouts/default.html)
```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>{{ page.title }}</title>
  </head>
  <body>
    {% include header.html %}
    {{ content }}
  </body>
</html>
```

#### Post Layout (_layouts/post.html)
```html
---
layout: default
---
<article>
  <header>
    <h1>{{ page.title }}</h1>
    <time>{{ page.date | date: "%B %d, %Y" }}</time>
  </header>
  {{ content }}
</article>
```

### Template Tags and Filters

#### Common Variables
```liquid
{{ site.title }}              # From _config.yml
{{ page.title }}              # From front matter
{{ page.date }}               # Post date
{{ page.categories }}         # Post categories
{{ content }}                 # Page content

{{ site.pages }}              # All pages
{{ site.posts }}              # All posts
```

#### Date Filters
```liquid
{{ page.date | date: "%B %d, %Y" }}    # November 21, 2024
{{ page.date | date: "%Y-%m-%d" }}     # 2024-11-21
```

### Front Matter Configuration

#### Post Front Matter
```yaml
---
layout: post
title: My First Post
date: 2024-01-01
categories: [technology, web]
tags: [jekyll, github-pages]
---
```

#### Page Front Matter
```yaml
---
layout: page
title: About Me
permalink: /about/
---
```

### Subdirectory Hosting

#### Configure for Subdirectory
```yaml
baseurl: /repository-name
url: https://username.github.io/repository-name
```

#### Update HTML Links
```html
<!-- Include baseurl in all links -->
<a href="{{ site.baseurl }}/about/">About</a>
<img src="{{ site.baseurl }}/images/logo.png">
```

#### Asset Configuration
```liquid
<!-- CSS -->
<link rel="stylesheet" href="{{ site.baseurl }}/assets/css/style.css">

<!-- JavaScript -->
<script src="{{ site.baseurl }}/assets/js/main.js"></script>

<!-- Images -->
<img src="{{ site.baseurl }}/assets/images/photo.jpg">
```

---

## Advanced Workflows

### GitHub Actions with Service Containers

#### Service Container Example
```yaml
services:
  postgres:
    image: postgres:13
    env:
      POSTGRES_PASSWORD: postgres
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
    ports:
      - 5432:5432
```

### Custom Build Commands

#### Node.js Build
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v3
  with:
    node-version: '18'

- name: Build with npm
  run: |
    npm install
    npm run build
```

#### Python Build
```yaml
- name: Setup Python
  uses: actions/setup-python@v4
  with:
    python-version: '3.11'

- name: Build with Python
  run: |
    pip install -r requirements.txt
    python build.py
```

### Multiple Deployment Environments

#### Production and Staging
```yaml
jobs:
  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    environment:
      name: staging
      url: https://staging.example.com
    steps:
      # Deploy to staging
  
  deploy-production:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://example.com
    steps:
      # Deploy to production
```

---

## Troubleshooting

### Build Errors

#### Jekyll Build Errors
```bash
# Enable verbose output
JEKYLL_LOG_LEVEL=debug jekyll build

# Common issues:
# - Invalid YAML in _config.yml
# - Syntax errors in templates
# - Missing Jekyll plugins
```

#### Fix "Relative permalinks configured"
**Error:** `You appear to have enabled relative permalinks`

**Solution:** Update `_config.yml`
```yaml
# Remove this line:
# relative_permalinks: true

# Ensure permalinks are absolute:
permalink: /posts/:categories/:title/
```

### Deployment Issues

#### Site Not Updating
1. Force rebuild: Enable/disable GitHub Pages in Settings
2. Check branch configuration
3. Verify publish source is correct
4. Check workflow run status in Actions tab

#### HTTPS Certificate Errors
- Wait up to 24 hours for cert generation
- Check "Enforce HTTPS" is enabled
- Verify custom domain DNS records

### Performance Optimization

#### Reduce Build Time
```yaml
# Exclude unnecessary directories
exclude:
  - README.md
  - node_modules/
  - .git/
  - vendor/

# Incremental builds
incremental: true
```

#### Optimize Assets
```bash
# Compress images
imagemin:
  enable: true
  
# Minify CSS/JS
minify_css: true
minify_js: true
```

### Local Development

#### Development vs Production
```bash
# Development (with live reload)
bundle exec jekyll serve --livereload

# Production (exactly as GitHub builds)
bundle exec jekyll serve --profile

# With specific baseurl
bundle exec jekyll serve --baseurl "/repository-name"
```

#### Debug Output
```bash
# Verbose logging
bundle exec jekyll build --verbose

# Trace execution
bundle exec jekyll build --trace
```

---

## Security & Best Practices

### Protect Your Repository
- Enable branch protection rules
- Require status checks before merge
- Enable "Dismiss stale pull request approvals"
- Enable "Require branches to be up to date"

### GitHub Pages Best Practices
- Always test locally before pushing
- Use semantic versioning for releases
- Maintain separate staging/production branches
- Monitor GitHub Pages status page for outages

### Deployment Security
- Never commit sensitive data
- Use GitHub secrets for API keys
- Review dependencies regularly
- Enable Dependabot alerts

