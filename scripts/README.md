# 🛠️ Otakon Scripts Hub

This folder contains all the utility scripts for building, deploying, and maintaining the Otakon application.

## 📁 **Folder Structure**

### **🔨 Build Scripts** (`/build/`)
Scripts for building and compiling the application.

- **generate-icons.js** - Generates app icons in various sizes and formats

### **🚀 Deployment Scripts** (`/deployment/`)
Scripts for deploying and setting up the application.

- **complete-v19-setup.sh** - Complete v19 implementation setup and testing script
  - Fixes schema file issues
  - Installs dependencies
  - Runs comprehensive tests
  - Builds application
  - Deploys database (if environment set)
  - Commits and pushes changes
  - Verifies all features

### **🔧 Utility Scripts** (`/utilities/`)
General utility scripts for development and maintenance.

- **icon-converter.html** - HTML utility for converting icon formats

## 🚀 **Quick Usage**

### **Complete Setup (Recommended):**
```bash
# Make executable
chmod +x scripts/deployment/complete-v19-setup.sh

# Run complete setup
./scripts/deployment/complete-v19-setup.sh
```

### **Generate Icons:**
```bash
# Generate app icons
node scripts/build/generate-icons.js
```

### **Icon Conversion:**
```bash
# Open in browser
open scripts/utilities/icon-converter.html
```

## 📋 **Script Requirements**

### **complete-v19-setup.sh:**
- Node.js and npm
- Git
- PostgreSQL (optional, for database deployment)
- Environment variables (optional):
  - `DB_HOST`
  - `DB_USER`
  - `DB_NAME`

### **generate-icons.js:**
- Node.js
- Image processing libraries

## 🎯 **Script Purposes**

1. **Automation** - Streamline repetitive tasks
2. **Consistency** - Ensure consistent deployment
3. **Testing** - Comprehensive testing automation
4. **Maintenance** - Easy system maintenance
5. **Documentation** - Self-documenting scripts

---

**Use these scripts to maintain and deploy your Otakon v19 system efficiently! 🎮**
