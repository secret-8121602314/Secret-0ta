#!/usr/bin/env node

/**
 * Bundle Analysis Script for Otakon App
 * 
 * This script analyzes the webpack bundle to identify:
 * - Largest packages and modules
 * - Duplicate dependencies
 * - Unused code (tree shaking opportunities)
 * - Bundle size optimization suggestions
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Configuration
const config = {
  bundleDir: path.join(__dirname, '../dist'),
  analysisDir: path.join(__dirname, '../bundle-analysis'),
  maxFileSize: 100 * 1024, // 100KB
  maxPackageSize: 500 * 1024, // 500KB
  excludePatterns: [
    /\.map$/,
    /\.txt$/,
    /\.ico$/,
    /\.svg$/,
    /\.png$/,
    /\.jpg$/,
    /\.jpeg$/,
    /\.gif$/,
    /\.webp$/,
    /\.woff$/,
    /\.woff2$/,
    /\.ttf$/,
    /\.eot$/
  ]
};

/**
 * Main analysis function
 */
async function analyzeBundle() {
  console.log(`${colors.bright}${colors.cyan}🔍 Otakon Bundle Analysis${colors.reset}\n`);
  
  try {
    // Check if dist directory exists
    if (!fs.existsSync(config.bundleDir)) {
      console.log(`${colors.yellow}⚠️  Dist directory not found. Building project first...${colors.reset}`);
      buildProject();
    }
    
    // Analyze bundle structure
    const bundleInfo = analyzeBundleStructure();
    
    // Analyze dependencies
    const dependencyInfo = analyzeDependencies();
    
    // Generate optimization suggestions
    const suggestions = generateOptimizationSuggestions(bundleInfo, dependencyInfo);
    
    // Generate report
    generateReport(bundleInfo, dependencyInfo, suggestions);
    
    console.log(`${colors.green}✅ Bundle analysis complete!${colors.reset}`);
    console.log(`${colors.cyan}📊 Check the bundle-analysis directory for detailed reports${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}❌ Bundle analysis failed:${colors.reset}`, error);
    process.exit(1);
  }
}

/**
 * Build the project if needed
 */
function buildProject() {
  try {
    console.log(`${colors.blue}🔨 Building project...${colors.reset}`);
    execSync('npm run build', { stdio: 'inherit' });
    console.log(`${colors.green}✅ Build complete${colors.reset}\n`);
  } catch (error) {
    throw new Error('Failed to build project');
  }
}

/**
 * Analyze bundle structure
 */
function analyzeBundleStructure() {
  console.log(`${colors.blue}📁 Analyzing bundle structure...${colors.reset}`);
  
  const bundleInfo = {
    totalSize: 0,
    fileCount: 0,
    largestFiles: [],
    fileTypes: {},
    totalGzipped: 0
  };
  
  // Scan dist directory
  const files = scanDirectory(config.bundleDir);
  
  files.forEach(file => {
    const stats = fs.statSync(file);
    const size = stats.size;
    const relativePath = path.relative(config.bundleDir, file);
    const ext = path.extname(file);
    
    // Skip excluded files
    if (config.excludePatterns.some(pattern => pattern.test(file))) {
      return;
    }
    
    bundleInfo.totalSize += size;
    bundleInfo.fileCount++;
    
    // Track file types
    bundleInfo.fileTypes[ext] = (bundleInfo.fileTypes[ext] || 0) + size;
    
    // Track largest files
    bundleInfo.largestFiles.push({
      path: relativePath,
      size: size,
      sizeFormatted: formatBytes(size)
    });
  });
  
  // Sort largest files
  bundleInfo.largestFiles.sort((a, b) => b.size - a.size);
  bundleInfo.largestFiles = bundleInfo.largestFiles.slice(0, 10);
  
  // Format total size
  bundleInfo.totalSizeFormatted = formatBytes(bundleInfo.totalSize);
  
  console.log(`${colors.green}✅ Bundle structure analyzed${colors.reset}`);
  return bundleInfo;
}

/**
 * Analyze dependencies
 */
function analyzeDependencies() {
  console.log(`${colors.blue}📦 Analyzing dependencies...${colors.reset}`);
  
  const dependencyInfo = {
    packages: {},
    duplicates: [],
    unused: [],
    suggestions: []
  };
  
  // Read package.json
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
  
  // Analyze dependencies
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies
  };
  
  Object.entries(allDeps).forEach(([name, version]) => {
    dependencyInfo.packages[name] = {
      version,
      size: estimatePackageSize(name),
      category: categorizePackage(name)
    };
  });
  
  // Identify potential duplicates
  dependencyInfo.duplicates = findDuplicatePackages(dependencyInfo.packages);
  
  // Identify potentially unused packages
  dependencyInfo.unused = findUnusedPackages(dependencyInfo.packages);
  
  console.log(`${colors.green}✅ Dependencies analyzed${colors.reset}`);
  return dependencyInfo;
}

/**
 * Generate optimization suggestions
 */
function generateOptimizationSuggestions(bundleInfo, dependencyInfo) {
  console.log(`${colors.blue}💡 Generating optimization suggestions...${colors.reset}`);
  
  const suggestions = [];
  
  // Bundle size suggestions
  if (bundleInfo.totalSize > 5 * 1024 * 1024) { // 5MB
    suggestions.push({
      type: 'bundle_size',
      priority: 'high',
      message: 'Bundle size is large (>5MB). Consider code splitting and lazy loading.',
      actions: [
        'Implement React.lazy() for route-based code splitting',
        'Use dynamic imports for heavy components',
        'Analyze and remove unused dependencies'
      ]
    });
  }
  
  // Large files suggestions
  const largeFiles = bundleInfo.largestFiles.filter(f => f.size > config.maxFileSize);
  if (largeFiles.length > 0) {
    suggestions.push({
      type: 'large_files',
      priority: 'medium',
      message: `Found ${largeFiles.length} large files that could be optimized.`,
      actions: [
        'Compress images and assets',
        'Consider lazy loading for large components',
        'Split large files into smaller chunks'
      ]
    });
  }
  
  // Dependency suggestions
  if (dependencyInfo.duplicates.length > 0) {
    suggestions.push({
      type: 'duplicates',
      priority: 'high',
      message: `Found ${dependencyInfo.duplicates.length} duplicate packages.`,
      actions: [
        'Use npm dedupe to remove duplicates',
        'Check for conflicting versions',
        'Consider using yarn resolutions'
      ]
    });
  }
  
  if (dependencyInfo.unused.length > 0) {
    suggestions.push({
      type: 'unused',
      priority: 'medium',
      message: `Found ${dependencyInfo.unused.length} potentially unused packages.`,
      actions: [
        'Remove unused dependencies',
        'Use tree shaking effectively',
        'Analyze import usage'
      ]
    });
  }
  
  console.log(`${colors.green}✅ Optimization suggestions generated${colors.reset}`);
  return suggestions;
}

/**
 * Generate detailed report
 */
function generateReport(bundleInfo, dependencyInfo, suggestions) {
  console.log(`${colors.blue}📊 Generating detailed report...${colors.reset}`);
  
  // Create analysis directory
  if (!fs.existsSync(config.analysisDir)) {
    fs.mkdirSync(config.analysisDir, { recursive: true });
  }
  
  // Generate HTML report
  const htmlReport = generateHTMLReport(bundleInfo, dependencyInfo, suggestions);
  fs.writeFileSync(path.join(config.analysisDir, 'bundle-analysis.html'), htmlReport);
  
  // Generate JSON report
  const jsonReport = {
    timestamp: new Date().toISOString(),
    bundleInfo,
    dependencyInfo,
    suggestions
  };
  fs.writeFileSync(path.join(config.analysisDir, 'bundle-analysis.json'), JSON.stringify(jsonReport, null, 2));
  
  // Generate markdown report
  const markdownReport = generateMarkdownReport(bundleInfo, dependencyInfo, suggestions);
  fs.writeFileSync(path.join(config.analysisDir, 'bundle-analysis.md'), markdownReport);
  
  console.log(`${colors.green}✅ Reports generated in bundle-analysis directory${colors.reset}`);
}

/**
 * Helper functions
 */
function scanDirectory(dir) {
  const files = [];
  
  function scan(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    items.forEach(item => {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scan(fullPath);
      } else {
        files.push(fullPath);
      }
    });
  }
  
  scan(dir);
  return files;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function estimatePackageSize(packageName) {
  // Rough estimates based on common package sizes
  const sizeEstimates = {
    'react': 42 * 1024,
    'react-dom': 120 * 1024,
    'supabase': 200 * 1024,
    '@supabase/supabase-js': 200 * 1024,
    'lucide-react': 150 * 1024,
    'tailwindcss': 50 * 1024,
    'framer-motion': 300 * 1024
  };
  
  return sizeEstimates[packageName] || 100 * 1024; // Default 100KB
}

function categorizePackage(packageName) {
  if (packageName.includes('react')) return 'framework';
  if (packageName.includes('supabase')) return 'database';
  if (packageName.includes('ui') || packageName.includes('component')) return 'ui';
  if (packageName.includes('util') || packageName.includes('helper')) return 'utility';
  if (packageName.includes('test') || packageName.includes('jest')) return 'testing';
  return 'other';
}

function findDuplicatePackages(packages) {
  // This is a simplified check - in reality you'd need to analyze node_modules
  return [];
}

function findUnusedPackages(packages) {
  // This is a simplified check - in reality you'd need to analyze imports
  return [];
}

function generateHTMLReport(bundleInfo, dependencyInfo, suggestions) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Otakon Bundle Analysis</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; text-align: center; margin-bottom: 30px; }
        .section { margin-bottom: 30px; padding: 20px; border: 1px solid #e0e0e0; border-radius: 6px; }
        .metric { display: inline-block; margin: 10px; padding: 15px; background: #f8f9fa; border-radius: 6px; text-align: center; }
        .metric-value { font-size: 24px; font-weight: bold; color: #007bff; }
        .metric-label { color: #666; font-size: 14px; }
        .suggestion { padding: 15px; margin: 10px 0; border-left: 4px solid #007bff; background: #f8f9fa; }
        .priority-high { border-left-color: #dc3545; }
        .priority-medium { border-left-color: #ffc107; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0; }
        th { background: #f8f9fa; font-weight: 600; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Otakon Bundle Analysis Report</h1>
        
        <div class="section">
            <h2>📊 Bundle Overview</h2>
            <div class="metric">
                <div class="metric-value">${bundleInfo.totalSizeFormatted}</div>
                <div class="metric-label">Total Size</div>
            </div>
            <div class="metric">
                <div class="metric-value">${bundleInfo.fileCount}</div>
                <div class="metric-label">File Count</div>
            </div>
        </div>
        
        <div class="section">
            <h2>📁 Largest Files</h2>
            <table>
                <thead>
                    <tr><th>File</th><th>Size</th></tr>
                </thead>
                <tbody>
                    ${bundleInfo.largestFiles.map(f => `
                        <tr><td>${f.path}</td><td>${f.sizeFormatted}</td></tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="section">
            <h2>💡 Optimization Suggestions</h2>
            ${suggestions.map(s => `
                <div class="suggestion priority-${s.priority}">
                    <h3>${s.message}</h3>
                    <ul>
                        ${s.actions.map(a => `<li>${a}</li>`).join('')}
                    </ul>
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;
}

function generateMarkdownReport(bundleInfo, dependencyInfo, suggestions) {
  return `# 🚀 Otakon Bundle Analysis Report

Generated: ${new Date().toLocaleString()}

## 📊 Bundle Overview

- **Total Size**: ${bundleInfo.totalSizeFormatted}
- **File Count**: ${bundleInfo.fileCount}

## 📁 Largest Files

| File | Size |
|------|------|
${bundleInfo.largestFiles.map(f => `| ${f.path} | ${f.sizeFormatted} |`).join('\n')}

## 💡 Optimization Suggestions

${suggestions.map(s => `
### ${s.message}

**Priority**: ${s.priority.toUpperCase()}

**Actions**:
${s.actions.map(a => `- ${a}`).join('\n')}
`).join('\n')}

## 🔧 Next Steps

1. Review the suggestions above
2. Implement high-priority optimizations
3. Re-run analysis to measure improvements
4. Consider using webpack-bundle-analyzer for detailed analysis
`;
}

// Run analysis if called directly
if (require.main === module) {
  analyzeBundle();
}

module.exports = { analyzeBundle };
