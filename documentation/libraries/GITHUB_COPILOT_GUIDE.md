# GitHub Copilot Complete Developer Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Core Features](#core-features)
3. [Chat & Commands](#chat--commands)
4. [Code Review & Analysis](#code-review--analysis)
5. [Advanced Usage](#advanced-usage)
6. [Integration & Customization](#integration--customization)
7. [Best Practices](#best-practices)

---

## Getting Started

### Installation

#### VS Code
1. Open Extensions (Ctrl+Shift+X)
2. Search for "GitHub Copilot"
3. Install extension
4. Sign in with GitHub account
5. Authorize permissions

#### VS Code Quick Setup
```bash
# VS Code command palette
Cmd/Ctrl+Shift+P → "GitHub Copilot: Sign In"
```

#### JetBrains IDEs
1. Navigate to Plugins → Marketplace
2. Search "GitHub Copilot"
3. Install and restart
4. Authenticate with GitHub

#### Visual Studio
1. Tools → Manage GitHub Copilot
2. Sign in with GitHub
3. Enable Copilot features

#### Eclipse
Install from marketplace or manually

### Subscription Plans

#### Free Plan
- Limited suggestions per month
- Basic code completion
- Limited chat requests

#### Pro Plan
- Unlimited code suggestions
- 1,000 premium chat requests/month
- Priority support

#### Business Plan
- Team management
- Policy enforcement
- Advanced security features

---

## Core Features

### Code Completion

#### How It Works
1. Type function signature
2. Copilot suggests implementation
3. Press Tab to accept
4. Press Esc to reject

#### Example: JavaScript Function
```javascript
// Type this:
function calculateDaysBetweenDates(start, end) {

// Copilot suggests:
    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    const utc1 = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
    const utc2 = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
    return Math.floor((utc2 - utc1) / MS_PER_DAY);
}
```

#### Example: Python Function
```python
# Type this:
def find_all_images_without_alt_text():

# Copilot suggests complete implementation
```

#### Accepting Suggestions
- **Tab:** Accept entire suggestion
- **Cmd+→ / Ctrl+→:** Accept word
- **Cmd+↓ / Ctrl+↓:** Accept line
- **Esc:** Reject suggestion

#### Multiple Suggestions
- **Alt+] / Alt+[:** Navigate suggestions
- **Cmd+Shift+A / Ctrl+Enter:** Show all suggestions in new tab

### Comment-to-Code Generation

#### Natural Language Comments
```java
// Return the difference between two different integers.
public int getDiff(int a, int b) {
    // Copilot generates: return a - b;
}
```

#### Complex Queries
```javascript
// find all images without alternate text
// and give them a red border
function process() {
    // Copilot generates complete implementation
}
```

#### SQL Generation
```sql
SELECT TokenColor, COUNT(UserID) AS UserCount
FROM Tag.Users
GROUP BY TokenColor

-- pivot that query on tokencolor for Purple, Blue, Green, Yellow, Orange, Red
-- Copilot generates: SELECT [Purple], [Blue], [Green], [Yellow], [Orange], [Red] ...
```

---

## Chat & Commands

### Copilot Chat

#### Open Chat

**VS Code:**
- Cmd+I / Ctrl+I - Inline chat
- Click Copilot icon in title bar - Chat panel
- Shift+Cmd+L / Shift+Alt+L - Quick chat

**JetBrains:**
- Right-click code → "Ask Copilot"
- Alt+C - Open chat

#### Chat Interface

**Chat Variables:**
- `#file` - Reference specific file
- `#selection` - Reference selected text
- `#function` - Reference current function
- `#class` - Reference current class
- `#symbol` - Reference symbol at cursor

**Chat Participants:**
- `@workspace` - Query entire workspace
- `@terminal` - Terminal command help
- `@vscode` - VS Code-specific help
- `@github` - GitHub operations
- `@azure` - Azure services

### Slash Commands

#### Common Commands
| Command | Purpose |
|---------|---------|
| `/explain` | Explain how code works |
| `/fix` | Propose fix for problems |
| `/tests` | Generate unit tests |
| `/doc` | Add documentation |
| `/optimize` | Suggest improvements |
| `/new` | Create new project |
| `/help` | Get Copilot help |

#### Example Usage
```
/explain What does this function do?
/fix Find and fix bugs in this code
/tests Generate comprehensive tests
```

### Chat Examples

#### Understand Code Changes
```
@workspace Describe this project in detail, explaining what the various 
components do and how they interact.
```

#### Generate Tests
```
/tests Generate comprehensive unit tests for this function, 
including edge cases and error scenarios.
```

#### Refactor Code
```
#selection /optimize Refactor this code to improve readability 
and performance.
```

#### Code Review
```
@workspace Perform a comprehensive code review focusing on security, 
performance, and code quality.
```

#### API Documentation
```
Generate comprehensive API documentation for this module 
with examples.
```

---

## Code Review & Analysis

### Copilot Code Review

#### Enable Code Review

**VS Code:**
1. Source Control view
2. Click "Copilot Code Review" button
3. Wait for review (typically < 30 seconds)

**Visual Studio:**
1. Git Changes window
2. Click "Review changes with Copilot"

#### Code Review Features
- Identifies security vulnerabilities
- Checks performance issues
- Validates code quality
- Suggests architectural improvements
- Flags potential bugs

#### Review Output
```
🔴 Critical Issues - Must fix before merge
🟡 Suggestions - Improvements to consider
✅ Good Practices - What's done well

For each issue:
- Specific line references
- Clear explanation of problem
- Suggested solution with code
- Rationale for change
```

### Security Analysis

#### Repository Security Configuration
```
Provide step-by-step instructions on how to enable:
- Secret scanning
- Push protection
- Dependabot alerts
- Dependabot security updates
- Branch protection rules

Explain why each feature is important.
```

#### Vulnerability Detection

Copilot identifies:
- Input validation issues
- SQL injection risks
- Authentication problems
- Data exposure risks
- Encryption vulnerabilities

---

## Advanced Usage

### Custom Instructions

#### Repository-Level Instructions

Create `.github/copilot-instructions.md`:
```markdown
# Copilot Instructions

When reviewing code:
- Focus on security best practices
- Validate input handling
- Check for memory leaks
- Ensure thread safety

Use Bazel for Java dependencies (not Maven)
JavaScript code: use double quotes and tabs
Team uses Jira for tracking work
```

#### Agent Instructions

Create `AGENTS.md` in repository root:
```markdown
# Agent Instructions

## Role: Code Reviewer
- Analyze code for potential bugs
- Check security vulnerabilities
- Ensure style guide adherence
- Suggest performance improvements

## Role: Documentation Assistant
- Generate docstrings
- Create comprehensive comments
- Explain complex logic
```

#### IDE-Specific Instructions

**VS Code (`AGENTS.md`):**
- Place in workspace root
- Auto-applied to all AI agents

**Repository-Level:**
- `CLAUDE.md` - Claude AI agent
- `GEMINI.md` - Gemini AI agent

### Prompt Files

#### Create Prompt File

**Location:** `.github/prompts/` or `.copilot-prompts/`

```yaml
---
mode: 'agent'
description: 'Generate unit tests for selected functions'
---

## Task
Analyze the selected function and generate focused unit tests.

## Test Generation Strategy
1. **Core Functionality Tests** - Main behavior
2. **Input Validation Tests** - Edge cases
3. **Error Handling Tests** - Exception cases
4. **Side Effects Tests** - State changes

Target function: ${input:function_name}
Testing framework: ${input:framework}

## Guidelines
- Generate 5-8 focused test cases
- Use AAA pattern: Arrange, Act, Assert
- Mock external dependencies
- Test behavior, not implementation
```

#### Use Prompt File
1. Open Copilot Chat
2. Select prompt file from dropdown
3. Fill in variables
4. Get generated tests

### Model Selection

#### Available Models

**Free Models (included):**
- GPT-4.1 - Balanced, versatile
- Grok Code Fast 1 - Fast, lightweight

**Premium Models:**
- Claude Sonnet 4.5 - Excellent for code
- Gemini 2.5 Pro - Strong reasoning
- Claude Opus 4.1 - Complex tasks (10x cost)

#### Model Pricing

```
Free Plan: 2,000 completions + 50 chat requests/month
Pro Plan: Unlimited 0x models, 1,000 premium requests/month
Pro+: Unlimited 0x models, 5,000 premium requests/month

Model Cost Multipliers:
- GPT-4.1: 0x (free)
- Claude Sonnet: 1x
- Grok Fast: 0.25x
- Claude Opus: 10x
```

#### Select Model in Chat
1. Click model dropdown in chat
2. Choose desired model
3. Premium models use your monthly quota

---

## Integration & Customization

### GitHub MCP Server

#### Setup in VS Code

**Repository-level (`.vscode/mcp.json`):**
```json
{
  "inputs": [
    {
      "type": "promptString",
      "id": "github_token",
      "description": "GitHub Personal Access Token",
      "password": true
    }
  ],
  "servers": {
    "github": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "GITHUB_PERSONAL_ACCESS_TOKEN",
        "ghcr.io/github/github-mcp-server"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${input:github_token}"
      }
    }
  }
}
```

**Personal VS Code (`settings.json`):**
```json
{
  "mcp": {
    "inputs": [...],
    "servers": {
      "github": {...}
    }
  }
}
```

### Available Skills

| Skill | Purpose |
|-------|---------|
| `create_branch` | Create new branch |
| `create_or_update_file` | Add/update files |
| `push_files` | Push multiple files |
| `update_pull_request_branch` | Update PR branch |
| `merge_pull_request` | Merge PR |
| `get_me` | User information |
| `search_users` | Find users |

### Enterprise Configuration

#### GitHub Enterprise Server
```bash
# Authenticate for GHES
gh auth logout
gh auth login --hostname SUBDOMAIN.ghe.com
export GH_HOST="https://SUBDOMAIN.ghe.com"
gh copilot --hostname SUBDOMAIN.ghe.com
```

#### Network Configuration

**HTTP Proxy:**
1. VS Code Settings → Application → Proxy
2. Enter proxy server address (e.g., `http://localhost:3128`)
3. Optional: Manage SSL certificate verification

**Firewall:**
- GitHub Copilot API: `api.githubcopilot.com`
- Model API: `api.openai.com`, `api.anthropic.com`
- GitHub API: `api.github.com`

---

## Best Practices

### Effective Prompting

#### Be Specific
```
❌ "Fix this code"
✅ "Fix the SQL injection vulnerability in the database query 
   on line 42 and add input validation"
```

#### Provide Context
```
❌ "/fix"
✅ "#file:database.ts #selection /fix Improve error handling 
   for connection failures"
```

#### Use Variables
```
❌ "Generate tests for calculateTotal function"
✅ "#function /tests Generate comprehensive tests with edge cases"
```

### Code Review Workflow

1. **Understand Changes**
   - Ask Copilot to summarize file changes
   - Highlight specific lines for explanation

2. **Collaborate on Review**
   - `@workspace Provide your judgment on these changes`
   - Request feedback on your own review comments

3. **Draft Comments**
   - `Make a list of review comments to add`
   - `Help me draft review comments`

4. **Refine Comments**
   - `Refine this to be clear, concise, and actionable`

### Security Considerations

#### Never Share Sensitive Data
- Don't paste credentials or API keys
- Don't share personal information
- Don't upload proprietary algorithms

#### Use Secrets
```json
{
  "env": {
    "API_KEY": "${secrets.MY_API_KEY}"
  }
}
```

#### Code Privacy
- Use private chat for sensitive code
- Review Copilot suggestions for security issues
- Keep enterprise code in private repositories

### Performance Optimization

#### Reduce Processing Time
- Use specific file references with `#file:`
- Narrow down selection with `#selection`
- Ask for partial solutions first

#### Token Efficiency
- Be concise in prompts
- Use model switching for complex tasks
- Batch related questions

---

## Advanced Workflows

### PR Review Assistant

#### Workflow Steps
1. Push branch with changes
2. Create pull request
3. In Copilot Chat:
   ```
   @workspace Summarize the changes in this PR
   Provide your judgment on these changes for:
   - Security
   - Performance
   - Code quality
   - Testing
   ```

### Project Migration

#### Step 1: Understand Current State
```
@workspace Describe this project in detail, explaining what the 
various components do and how they interact.
```

#### Step 2: Plan Migration
```
@workspace I want to migrate this project from PHP to Python. 
Give me a high-level overview of the steps I need to take.
```

#### Step 3: Execute Migration
```
@workspace Provide detailed step-by-step instructions for migrating 
each component from PHP to Python, including code examples.
```

#### Step 4: Validate
```
@workspace Review the migrated Python code for correctness and 
identify any potential issues.
```

### Accessibility Improvements

#### Plan Accessibility Fixes
```
Based on accessibility analysis of our Figma designs and GitHub issues:
1. Create implementation plan for immediate fixes
2. Don't make changes yet
3. Suggest follow-up issues for remaining specs
```

#### Implement Fixes
```
Create a new branch and implement critical accessibility fixes:
- Focus on highest priority categories
- Create a PR with proper issue references
```

#### Verify Implementation
```
Update GitHub issues with summaries of implemented changes
Create follow-up issues for remaining work
```

---

## Keyboard Shortcuts

### VS Code Shortcuts

| Action | Shortcut |
|--------|----------|
| Accept suggestion | Tab |
| Next suggestion | Alt+] |
| Previous suggestion | Alt+[ |
| Accept word | Cmd+→ |
| Accept line | Cmd+↓ |
| Open Copilot Chat | Click icon |
| Inline chat | Cmd+I |
| Quick chat | Shift+Cmd+L |

### Common Workflows

#### Code Explanation Workflow
1. Select code
2. Cmd+I → Open inline chat
3. Type: `/explain`
4. Read explanation in hover

#### Quick Fix Workflow
1. Select problem code
2. Cmd+I → Open inline chat
3. Type: `/fix`
4. Accept suggestion with Tab

#### Generate Tests Workflow
1. Select function
2. Cmd+I → Open inline chat
3. Type: `/tests`
4. Modify as needed

---

## Troubleshooting

### Common Issues

#### Copilot Not Suggesting Code
- Check extension is enabled
- Verify GitHub authentication
- Restart VS Code
- Check subscription is active

#### Low Quality Suggestions
- Add more context through comments
- Use specific file references (`#file:`)
- Try different models
- Add more examples

#### Connection Issues
- Check internet connection
- Verify firewall rules
- Check proxy settings
- Update VS Code and extension

#### Billing Issues
- Review subscription plan
- Check usage on GitHub Copilot settings
- Verify payment method
- Contact GitHub Support

### Performance Tips

#### Speed Up Suggestions
- Disable unnecessary extensions
- Use workspace-specific settings
- Increase focus in prompts
- Use simpler models for quick tasks

#### Reduce Token Usage
- Be more specific in requests
- Use smaller code selections
- Batch similar requests
- Use free/cheaper models when possible

