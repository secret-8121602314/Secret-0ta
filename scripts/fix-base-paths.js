#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

// Fix base paths for GitHub Pages deployment
const distDir = './dist/assets';
const baseURL = '';

console.log('🔧 Fixing base paths for GitHub Pages...');

const jsFiles = readdirSync(distDir).filter(f => f.endsWith('.js') && !f.endsWith('.js.map'));

jsFiles.forEach(file => {
  const filePath = join(distDir, file);
  let content = readFileSync(filePath, 'utf8');
  
  const originalContent = content;
  
  // Fix /images/ paths ONLY in template literals within src attributes
  // But NOT inside function calls like It() which already handle BASE_URL
  // Match patterns like: src:`/images/... or src:"/images/...
  content = content.replace(/src:`\/images\//g, `src:\`${baseURL}/images/`);
  content = content.replace(/src:"\/images\//g, `src:"${baseURL}/images/`);
  content = content.replace(/src:'\/images\//g, `src:'${baseURL}/images/`);
  
  // Fix /icons/ paths in the same way
  content = content.replace(/src:`\/icons\//g, `src:\`${baseURL}/icons/`);
  content = content.replace(/src:"\/icons\//g, `src:"${baseURL}/icons/`);
  content = content.replace(/src:'\/icons\//g, `src:'${baseURL}/icons/`);
  
  if (content !== originalContent) {
    writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed paths in ${file}`);
  }
});

console.log('✨ Base path fixes complete!');
