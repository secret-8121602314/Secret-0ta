# GitHub Complete Developer Guide

## Table of Contents
1. [Repository Management](#repository-management)
2. [GitHub Pages & Deployment](#github-pages--deployment)
3. [GitHub Actions & CI/CD](#github-actions--cicd)
4. [API Reference](#api-reference)
5. [Advanced Features](#advanced-features)

---

## Repository Management

### Setting Up a Repository

#### Initialize Local Repository
```bash
git init <REPOSITORY-NAME>
cd <REPOSITORY-NAME>
```

#### Configure Git User Information
```bash
git config --global user.name "NAME"
git config --global user.email EMAIL
```

#### Add Remote Repository
```bash
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY-NAME.git
git remote -v  # Verify the remote configuration
```

### Adding and Committing Files

#### Create and Commit a README
```bash
echo "info about this project" >> README.md
git status
git add README.md && git commit -m "Add README"
git push --set-upstream origin HEAD
```

#### Stage and Commit All Changes
```bash
git add .
git commit -m 'Initial GitHub pages site with Jekyll'
```

### Pushing Code to GitHub

#### Basic Push
```bash
git push -u origin main
```

#### Mirror Repository (Full History)
```bash
git push --mirror origin
```

#### Large Files with Git LFS
```bash
git lfs import  # If large files are present
git push --mirror origin
```

### Cloning and Updating Repositories

#### Clone a Repository
```bash
git clone https://github.com/OWNER/REPO.git
```

#### Clone with SSH (Using Deploy Keys)
```bash
git clone git@github.com-repo-1:OWNER/repo-1.git
```

#### SSH Configuration for Multiple Repositories
```bash
Host github.com-repo-0
    Hostname github.com
    IdentityFile=/home/user/.ssh/repo-0_deploy_key

Host github.com-repo-1
    Hostname github.com
    IdentityFile=/home/user/.ssh/repo-1_deploy_key
```

#### Fetch Changes from Upstream
```bash
git fetch upstream
git pull origin <branch-name>
```

### Advanced Git Operations

#### Split Subfolder into New Repository
```bash
git filter-branch --subdirectory-filter <folder-name> --prune-empty --tag-name-filter cat -- --all
```

#### Clone with Git LFS for Large Repositories
```bash
git clone --mirror URL
```

---

## GitHub Pages & Deployment

### Basic Setup

#### Create GitHub Pages Site
```bash
# Initialize Jekyll-based site
cd PARENT-FOLDER
git init REPOSITORY-NAME
cd REPOSITORY-NAME
```

#### Configure _config.yml
```yaml
domain: my-site.github.io
url: https://my-site.github.io
baseurl: /REPOSITORY-NAME/  # For subdirectory hosting
theme: jekyll-theme-minimal
title: Octocat's homepage
description: Bookmark this to keep an eye on my project updates!
```

#### Local Testing
```bash
bundle update github-pages
bundle exec jekyll serve
bundle exec jekyll serve --baseurl=""
```

### Custom Domains

#### Configure CNAME Record
The CNAME record should always point to:
- `<USER>.github.io` or `<ORGANIZATION>.github.io`
- Exclude the repository name

#### DNS Setup for Custom Domain
**IPv4 A Records:**
```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

**IPv6 AAAA Records:**
```
2606:50c0:8000::153
2606:50c0:8001::153
2606:50c0:8002::153
2606:50c0:8003::153
```

#### Verify Domain Configuration
```bash
dig _github-pages-challenge-ORGANIZATION.example.com +nostats +nocmd +nocmd TXT
```

### GitHub Pages GitHub Actions Workflow

#### Basic Workflow
```yaml
name: Deploy GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
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
        if: github.ref == 'refs/heads/main'
        uses: actions/deploy-pages@v4
```

#### Build and Deploy with Jekyll
```yaml
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
    environment:
      name: github-pages
      url: ${{steps.deployment.outputs.page_url}}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

## GitHub Actions & CI/CD

### Workflow Basics

#### Trigger Workflow on Events
```yaml
on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main
  workflow_dispatch:
```

#### Deployment Events
```yaml
on:
  deployment
  deployment_status
```

### GITHUB_TOKEN Permissions

```yaml
permissions:
  actions: write        # Controls GitHub Actions
  attestations: write   # Artifact attestations
  checks: write         # Check runs
  contents: read        # Repository contents
  deployments: write    # Deployments
  discussions: write    # GitHub Discussions
  id-token: write       # OIDC tokens
  issues: write         # Issues
  packages: write       # GitHub Packages
  pages: write          # GitHub Pages
  pull-requests: write  # Pull requests
  security-events: write # Code scanning
  statuses: read        # Commit statuses
```

### Repository Variables

#### Create Variables
```bash
POST /repos/{owner}/{repo}/actions/variables

Request Body:
{
  "name": "VAR_NAME",
  "value": "var_value"
}
```

#### Manage Variables
```bash
# Get variable
GET /repos/{owner}/{repo}/actions/variables/{name}

# Update variable
PATCH /repos/{owner}/{repo}/actions/variables/{name}

# Delete variable
DELETE /repos/{owner}/{repo}/actions/variables/{name}
```

### Repository Secrets

#### Create Secret
```bash
POST /repositories/{owner}/{repo}/actions/secrets

Request Body:
{
  "key": "MY_SECRET_KEY",
  "value": "mysecretvalue123"
}
```

### Job Dependencies

#### GitLab CI to GitHub Actions Migration
```yaml
jobs:
  build_a:
    runs-on: ubuntu-latest
    steps:
      - run: echo 'Building A'

  build_b:
    runs-on: ubuntu-latest
    steps:
      - run: echo 'Building B'

  test_ab:
    runs-on: ubuntu-latest
    needs: [build_a, build_b]
    steps:
      - run: echo 'Testing A and B'
```

---

## API Reference

### Repository Endpoints

#### Get Repository Information
```bash
GET /repos/{owner}/{repo}

Response:
{
  "id": 123456,
  "name": "my-repo",
  "full_name": "owner/my-repo",
  "private": false
}
```

#### Create Repository
```bash
POST /repos/{owner}/{repo}

Request Body:
{
  "description": "This is a test repository"
}
```

#### Delete Repository
```bash
DELETE /repos/{owner}/{repo}

Response: 204 No Content
```

### Pages Management

#### Get Pages Information
```bash
GET /repos/{owner}/{repo}/pages

Response:
{
  "status": "built",
  "cname": "example.com"
}
```

#### Create/Update GitHub Pages
```bash
POST /repos/{owner}/{repo}/pages
PUT /repos/{owner}/{repo}/pages
DELETE /repos/{owner}/{repo}/pages
```

#### Trigger Pages Build
```bash
POST /repos/{owner}/{repo}/pages/builds

Response:
{
  "url": "https://api.github.com/repos/owner/repo/pages/builds/123",
  "status": "queued"
}
```

### Collaborator Management

#### List Repository Collaborators
```bash
GET /repos/{owner}/{repo}/collaborators

Response:
[
  {
    "login": "octocat",
    "id": 1,
    "permissions": {
      "pull": true,
      "push": false,
      "admin": false
    }
  }
]
```

#### Add Collaborator
```bash
PUT /repos/{owner}/{repo}/collaborators/{username}

Request Body:
{
  "permission": "pull|triage|push|maintain|admin"
}
```

#### Remove Collaborator
```bash
DELETE /repos/{owner}/{repo}/collaborators/{username}

Response: 204 No Content
```

### Projects Management

#### List Organization Projects
```bash
GET /orgs/{org}/projects

Response:
[
  {
    "id": 1,
    "name": "Project Name",
    "body": "Project description"
  }
]
```

#### Create Project
```bash
POST /orgs/{org}/projects

Request Body:
{
  "name": "New Project",
  "body": "Project description"
}
```

#### Update Project
```bash
PATCH /projects/{project_id}

Request Body:
{
  "name": "Updated Name",
  "body": "Updated description"
}
```

---

## Advanced Features

### GitHub Connect Configuration

#### Enable GitHub Connect
```bash
ghe-config-apply
```

Ensure your GHE Server can reach your GitHub.com subdomain with proper authentication.

### Interaction Limits

#### Manage Organization Interaction Limits
```bash
GET /orgs/{org}/interaction-limits
PUT /orgs/{org}/interaction-limits
DELETE /orgs/{org}/interaction-limits

GET /repos/{owner}/{repo}/interaction-limits
PUT /repos/{owner}/{repo}/interaction-limits
DELETE /repos/{owner}/{repo}/interaction-limits
```

### Actions Runners

#### Manage Runner Groups
```bash
GET /orgs/{org}/actions/runner-groups
POST /orgs/{org}/actions/runner-groups
PUT /orgs/{org}/actions/runner-groups/{runner_group_id}
DELETE /orgs/{org}/actions/runner-groups/{runner_group_id}
```

#### List Runner Repositories
```bash
GET /orgs/{org}/actions/runner-groups/{runner_group_id}/repositories
PUT /orgs/{org}/actions/runner-groups/{runner_group_id}/repositories
DELETE /orgs/{org}/actions/runner-groups/{runner_group_id}/repositories/{repository_id}
```

### Codespaces Management

#### List Organization Codespaces
```bash
GET /orgs/{org}/codespaces

Response:
[
  {
    "name": "my-codespace",
    "owner": "octocat",
    "repository": {
      "name": "Hello-World"
    }
  }
]
```

#### Create Codespaces Secret
```bash
POST /orgs/{org}/codespaces/secrets

Request Body:
{
  "key": "CODESPACES_API_KEY",
  "value": "apikey456",
  "visibility": "private"
}
```

### Git LFS Configuration

#### Configure Git LFS with Third-Party Server
```bash
git lfs env
git config -f .lfsconfig remote.origin.lfsurl https://THIRD-PARTY-LFS-SERVER/path/to/repo
git add .lfsconfig
git commit -m "Adding LFS config file"
```

### SCIM Provisioning

#### SCIM Configuration
For **GitHub Enterprise Server:**
```
https://HOSTNAME/api/v3/scim/v2
```

For **GitHub Enterprise Cloud:**
```
https://api.github.com/scim/v2/enterprises/{enterprise}/
https://api.SUBDOMAIN.ghe.com/scim/v2/enterprises/SUBDOMAIN
```

---

## Best Practices

### Repository Management
- Always initialize with a clear `.gitignore`
- Use meaningful commit messages
- Regularly push changes to avoid data loss
- Use branch protection rules for main branch

### GitHub Pages
- Test locally before deploying
- Keep `_config.yml` updated with correct baseurl
- Use custom domains for professional appearance
- Enable HTTPS for all custom domains

### GitHub Actions
- Use secrets for sensitive data, never hardcode credentials
- Set appropriate job permissions
- Use `needs:` for job dependencies
- Implement proper error handling and logging

### API Usage
- Always validate response status codes
- Use pagination for large result sets
- Implement rate limiting in your integrations
- Cache API responses when possible

