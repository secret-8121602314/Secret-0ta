# Visual Studio Code Complete Developer Guide

## Table of Contents
1. [Setup & Installation](#setup--installation)
2. [Extensions & Marketplace](#extensions--marketplace)
3. [Configuration](#configuration)
4. [Development Environment](#development-environment)
5. [Extension Development](#extension-development)
6. [Debugging & Testing](#debugging--testing)
7. [Advanced Features](#advanced-features)

---

## Setup & Installation

### Initial Setup

#### First Launch
```bash
# Open VS Code from terminal
code

# Open specific folder
code /path/to/folder

# Open file
code filename.txt

# Create and open new file
code --new-window
```

#### Command Line Tools

```bash
# List installed extensions
code --list-extensions

# Show extension versions
code --show-versions

# Install extension from command line
code --install-extension ms-python.python

# Uninstall extension
code --uninstall-extension extension-id

# Install from VSIX file
code --install-extension path/to/extension.vsix

# Update all extensions
code --update-extensions
```

### Installation Locations

#### Windows Portable Mode
```tree
VSCode-win32-x64-1.84.2/
├── Code.exe
├── data/
│   ├── user-data/
│   │   ├── User/
│   │   └── History/
│   └── extensions/
```

#### macOS Portable Mode
```tree
Visual Studio Code.app/
├── code-portable-data/
│   ├── user-data/
│   └── extensions/
```

#### Linux Portable Mode
```tree
VSCode-linux-x64/
├── code
├── data/
│   ├── user-data/
│   └── extensions/
```

### Set as Default Editor

#### macOS
```bash
# Set as default for opening files
ditto /Applications/Visual\ Studio\ Code.app ~/Applications/
```

#### Linux - Debian
```bash
# Set as default editor
sudo update-alternatives --install /usr/bin/editor editor $(which code) 10

# Unset as default
sudo update-alternatives --set editor /usr/bin/vi
```

#### Linux - For MIME Type
```bash
# Set as default for text files
xdg-mime default code.desktop text/plain
```

#### Windows
- Settings → Default Apps → File associations
- Or use command line (requires Admin):
```powershell
Reg add HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.txt\UserChoice /f
```

---

## Extensions & Marketplace

### Finding Extensions

#### Search in VS Code
```
Ctrl+Shift+X (Windows/Linux)
Cmd+Shift+X (macOS)
```

#### Command Line Search
```bash
# List all installed extensions
code --list-extensions

# List with versions
code --list-extensions --show-versions
```

### Popular Extensions

#### Language Support
- ms-python.python - Python
- ms-vscode.cpptools - C/C++
- golang.go - Go
- rust-lang.rust - Rust
- ms-vscode-remote.remote-ssh - SSH

#### Productivity
- ms-vscode.vim - Vim emulation
- eamodio.gitlens - Git integration
- dbaeumer.vscode-eslint - ESLint
- esbenp.prettier-vscode - Code formatter

#### Debugging & Testing
- ms-vscode.node-debug2 - Node.js debugging
- ms-python.debugpy - Python debugger
- hbenl.vscode-test-explorer - Test explorer

### Installing Extensions

#### From Marketplace
1. Open Extensions (Ctrl+Shift+X)
2. Search for extension
3. Click Install

#### From Command Line
```bash
code --install-extension ms-python.python

# Multiple extensions
code --install-extension ms-python.python \
     --install-extension ms-vscode.cpptools
```

#### From VSIX File
```bash
code --install-extension ./my-extension.vsix
```

#### Pre-installation (Automated Setup)

**Windows Enterprise Setup:**
```bash
mkdir bootstrap\extensions
# Place .vsix files in bootstrap\extensions/
# Extensions auto-install on first launch
```

### Extension Configuration

#### Recommended Extensions (extensions.json)
```json
{
    "recommendations": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "ms-python.python"
    ]
}
```

File location: `.vscode/extensions.json`

#### Disabling Extensions
- Click extension → "Disable" or "Disable (Workspace)"
- Disable all: `code --disable-extensions`
- Disable specific: `code --disable-extension-ids extension1,extension2`

### Extension Development

#### Create Extension Project
```bash
# Install generator
npm install -g yo generator-code

# Create new extension
yo code

# For web extensions
yo code --web
```

#### Package Extension
```bash
# Install vsce
npm install -g @vscode/vsce

# Package into VSIX
vsce package

# Publish to marketplace
vsce publish
```

---

## Configuration

### Settings

#### User Settings
- **Location:** `~/.config/Code/User/settings.json` (Linux)
- **macOS:** `~/Library/Application Support/Code/User/settings.json`
- **Windows:** `%APPDATA%\Code\User\settings.json`

#### Workspace Settings
- **Location:** `.vscode/settings.json`

### Essential Settings

#### Editor Configuration
```json
{
    "editor.fontSize": 14,
    "editor.fontFamily": "'Fira Code', Consolas, 'Courier New'",
    "editor.wordWrap": "on",
    "editor.formatOnSave": true,
    "editor.formatOnPaste": true,
    "editor.renderWhitespace": "all",
    "editor.dragAndDrop": true,
    "editor.insertSpaces": true,
    "editor.tabSize": 2,
    "editor.trimAutoWhitespace": true,
    "editor.maxTokenizationLineLength": 2500
}
```

#### Files Configuration
```json
{
    "files.autoSave": "onFocusChange",
    "files.exclude": {
        "**/.git": true,
        "**/.svn": true,
        "**/node_modules": true
    },
    "files.watcherExclude": {
        "**/.git": true,
        "**/node_modules": true
    }
}
```

#### Workbench Configuration
```json
{
    "workbench.editor.showTabs": "single",
    "workbench.startupEditor": "newUntitledFile",
    "workbench.editor.splitInGroupLayout": "vertical",
    "workbench.colorTheme": "One Dark Pro",
    "workbench.iconTheme": "material-icon-theme",
    "workbench.editor.experimentalAutoLockGroups": {
        "terminal": true,
        "mainThreadWebview": true
    }
}
```

### Language-Specific Settings

#### TypeScript/JavaScript
```json
{
    "[typescript]": {
        "editor.formatOnSave": true,
        "editor.formatOnPaste": true,
        "editor.defaultFormatter": "esbenp.prettier-vscode"
    },
    "[javascript]": {
        "editor.formatOnSave": true,
        "editor.defaultFormatter": "esbenp.prettier-vscode"
    }
}
```

#### Python
```json
{
    "[python]": {
        "editor.formatOnSave": true,
        "editor.defaultFormatter": "ms-python.python",
        "editor.codeActionsOnSave": {
            "source.organizeImports": true
        }
    }
}
```

#### Markdown
```json
{
    "[markdown]": {
        "editor.formatOnSave": true,
        "editor.wordWrap": "on",
        "editor.renderWhitespace": "all",
        "editor.acceptSuggestionOnEnter": "off"
    }
}
```

### Color Customization

#### Editor Colors
```json
{
    "workbench.colorCustomizations": {
        "editor.background": "#1e1e1e",
        "editor.foreground": "#d4d4d4",
        "editor.lineNumberForeground": "#858585",
        "editorError.foreground": "#ffef0f",
        "editorWarning.foreground": "#3777ff",
        "editor.selectionBackground": "#264f78"
    }
}
```

#### Token Color Customization
```json
{
    "editor.tokenColorCustomizations": {
        "[One Dark Pro]": {
            "comments": "#229977",
            "strings": "#98c379",
            "numbers": "#d19a66",
            "keywords": "#c678dd"
        }
    }
}
```

### Theme Configuration

#### Built-in Themes
- One Dark Pro
- Dracula
- GitHub Dark
- High Contrast

```json
{
    "workbench.colorTheme": "One Dark Pro",
    "workbench.iconTheme": "material-icon-theme"
}
```

---

## Development Environment

### Integrated Terminal

#### Configure Terminal
```json
{
    "terminal.integrated.defaultProfile.linux": "bash",
    "terminal.integrated.defaultProfile.osx": "zsh",
    "terminal.integrated.defaultProfile.windows": "PowerShell",
    "terminal.integrated.fontSize": 12,
    "terminal.integrated.fontFamily": "Fira Code"
}
```

#### Terminal Shortcuts
- Open terminal: ``Ctrl+` ``
- New terminal: `Ctrl+Shift+` ` ``
- Split terminal: `Ctrl+Shift+5`

### Git Integration

#### Configure Git
```json
{
    "git.path": "C:\\Program Files\\Git\\bin\\git.exe",
    "git.autorefresh": true,
    "git.autofetch": true,
    "git.ignoreLimitWarning": true
}
```

#### Keyboard Shortcuts
```json
{
    "key": "ctrl+shift+g",
    "command": "workbench.view.scm"
},
{
    "key": "ctrl+shift+g",
    "command": "workbench.view.scm.git"
}
```

### Launch Configurations

#### Node.js Debugging
```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "node",
            "request": "launch",
            "name": "Launch Program",
            "program": "${workspaceFolder}/app.js",
            "restart": true,
            "runtimeExecutable": "npm",
            "runtimeArgs": ["run", "dev"],
            "console": "integratedTerminal"
        }
    ]
}
```

#### Python Debugging
```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Python: Current File",
            "type": "python",
            "request": "launch",
            "program": "${file}",
            "console": "integratedTerminal",
            "justMyCode": true
        }
    ]
}
```

#### Chrome/Edge Debugging
```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "chrome",
            "request": "launch",
            "name": "Launch Chrome",
            "url": "http://localhost:3000",
            "webRoot": "${workspaceFolder}"
        }
    ]
}
```

---

## Extension Development

### Creating an Extension

#### Project Structure
```
my-extension/
├── src/
│   └── extension.ts
├── package.json
├── tsconfig.json
├── .vscodeignore
└── README.md
```

#### Extension Entry Point
```typescript
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('Extension activated');
    
    let disposable = vscode.commands.registerCommand('extension.hello', () => {
        vscode.window.showInformationMessage('Hello World!');
    });
    
    context.subscriptions.push(disposable);
}

export function deactivate() {}
```

#### Package.json Configuration
```json
{
    "name": "my-extension",
    "displayName": "My Extension",
    "description": "Extension description",
    "version": "0.0.1",
    "engines": {
        "vscode": "^1.84.0"
    },
    "categories": ["Other"],
    "activationEvents": ["onCommand:extension.hello"],
    "main": "./out/extension.js",
    "contributes": {
        "commands": [
            {
                "command": "extension.hello",
                "title": "Hello World"
            }
        ]
    },
    "scripts": {
        "vscode:prepublish": "npm run compile",
        "compile": "tsc -p ./",
        "watch": "tsc -watch -p ./",
        "test": "npm run compile && node ./out/test/runTest.js"
    },
    "devDependencies": {
        "@types/vscode": "^1.84.0",
        "@types/node": "^18.0.0",
        "typescript": "^5.0.0"
    }
}
```

### Extension APIs

#### Register Command
```typescript
const disposable = vscode.commands.registerCommand('extension.doSomething', () => {
    vscode.window.showInformationMessage('Command executed!');
});

context.subscriptions.push(disposable);
```

#### Create Quick Pick
```typescript
const items = ['Option 1', 'Option 2', 'Option 3'];
const selected = await vscode.window.showQuickPick(items);
```

#### Create Input Box
```typescript
const userInput = await vscode.window.showInputBox({
    placeHolder: 'Enter your name',
    prompt: 'What is your name?'
});
```

#### Create Custom Editor
```json
{
    "contributes": {
        "customEditors": [
            {
                "viewType": "myEditor.custom",
                "displayName": "My Custom Editor",
                "selector": [
                    {
                        "filenamePattern": "*.custom"
                    }
                ]
            }
        ]
    }
}
```

#### Tree View Provider
```typescript
class MyTreeProvider implements vscode.TreeDataProvider<MyNode> {
    getTreeItem(element: MyNode): vscode.TreeItem {
        return element;
    }
    
    getChildren(element?: MyNode): Thenable<MyNode[]> {
        // Return children
    }
}

vscode.window.registerTreeDataProvider('myView', new MyTreeProvider());
```

---

## Debugging & Testing

### Debugging

#### Set Breakpoints
1. Click line number to set breakpoint
2. F9 to toggle breakpoint
3. F5 to start debugging
4. F10 for step over
5. F11 for step into
6. Shift+F11 for step out

#### Debug Console
```javascript
// In Debug Console
> variable_name
> array.map(x => x * 2)
> document.querySelectorAll('.class')
```

### Unit Testing

#### Test Framework Setup (Jest)
```json
{
    "devDependencies": {
        "jest": "^29.0.0",
        "@types/jest": "^29.0.0"
    },
    "scripts": {
        "test": "jest",
        "test:watch": "jest --watch"
    }
}
```

#### Test File Example
```typescript
describe('Calculator', () => {
    test('should add two numbers', () => {
        expect(add(2, 3)).toBe(5);
    });
    
    test('should subtract two numbers', () => {
        expect(subtract(5, 3)).toBe(2);
    });
});
```

#### Extension Testing
```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Extension Tests",
            "type": "extensionHost",
            "request": "launch",
            "runtimeExecutable": "${execPath}",
            "args": [
                "--extensionDevelopmentPath=${workspaceFolder}",
                "--extensionTestsPath=${workspaceFolder}/out/test"
            ],
            "outFiles": ["${workspaceFolder}/out/test/**/*.js"],
            "preLaunchTask": "npm: compile-tests"
        }
    ]
}
```

---

## Advanced Features

### Multi-Folder Workspaces

#### Create Workspace File
```json
{
    "folders": [
        {
            "path": "project1"
        },
        {
            "path": "project2"
        },
        {
            "path": "project3"
        }
    ],
    "settings": {
        "editor.fontSize": 14
    }
}
```

Save as `my-workspace.code-workspace`

Open with:
```bash
code my-workspace.code-workspace
```

### Remote Development

#### SSH Configuration
```bash
ssh user@remote-server
```

Use Remote-SSH extension to:
- Edit files over SSH
- Run commands on remote
- Debug remote applications

#### Dev Containers
```json
{
    "name": "Python Development",
    "image": "mcr.microsoft.com/devcontainers/python:3.11",
    "features": {
        "ghcr.io/devcontainers/features/github-cli:1": {}
    },
    "postCreateCommand": "pip install -r requirements.txt"
}
```

### Copilot Integration

#### Enable Copilot
1. Install GitHub Copilot extension
2. Sign in with GitHub account
3. Accept permissions

#### Using Copilot
- Start typing → Copilot suggests code
- Alt+[ / Alt+] → Navigate suggestions
- Tab → Accept suggestion
- Esc → Reject suggestion

#### Copilot Chat
- Ctrl+Shift+I → Open inline chat
- Ask questions about code
- `/explain` → Explain code
- `/fix` → Fix problems

### Profiles

#### Create Profile
1. Settings icon → Profiles → Create Profile
2. Configure extensions and settings
3. Activate when needed

#### Export/Import Settings
```bash
# Export current settings
Settings → Profiles → Export → Save to file

# Import settings
Settings → Profiles → Import → Select file
```

---

## Keyboard Shortcuts

### Essential Shortcuts

#### File Operations
| Shortcut | Action |
|----------|--------|
| Ctrl+N | New file |
| Ctrl+O | Open file |
| Ctrl+S | Save |
| Ctrl+Shift+S | Save as |
| Ctrl+K Ctrl+W | Close editor |

#### Editing
| Shortcut | Action |
|----------|--------|
| Ctrl+X | Cut line |
| Ctrl+C | Copy line |
| Ctrl+V | Paste |
| Ctrl+Z | Undo |
| Ctrl+Shift+Z | Redo |
| Ctrl+H | Replace |
| Ctrl+D | Select word |
| Ctrl+Shift+L | Select all occurrences |

#### Navigation
| Shortcut | Action |
|----------|--------|
| Ctrl+P | Go to file |
| Ctrl+G | Go to line |
| Ctrl+Shift+O | Go to symbol |
| Ctrl+/ | Toggle comment |
| Ctrl+] | Indent line |
| Ctrl+[ | Outdent line |

---

## Best Practices

### Workspace Structure
```
my-project/
├── .vscode/
│   ├── settings.json
│   ├── launch.json
│   ├── tasks.json
│   └── extensions.json
├── src/
├── tests/
├── .gitignore
├── README.md
└── package.json
```

### Performance Optimization
- Exclude large folders in Files exclude
- Limit extensions to essentials
- Use workspace-specific settings
- Enable/disable extensions by workspace

### Team Collaboration
- Share `.vscode/settings.json` in git
- Recommend essential extensions
- Document keyboard shortcuts
- Use consistent code formatting

