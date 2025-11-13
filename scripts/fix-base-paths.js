#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

// Fix base paths for GitHub Pages deployment
const distDir = './dist/assets';
const baseURL = '/Otagon';

console.log('🔧 Fixing base paths for GitHub Pages...');

const jsFiles = readdirSync(distDir).filter(f => f.endsWith('.js') && !f.endsWith('.js.map'));

jsFiles.forEach(file => {
  const filePath = join(distDir, file);
  let content = readFileSync(filePath, 'utf8');
  
  const originalContent = content;
  
  // Fix /images/ paths
  content = content.replace(/["`']\/images\//g, match => {
    const quote = match[0];
    return `${quote}${baseURL}/images/`;
  });
  
  // Fix /icons/ paths  
  content = content.replace(/["`']\/icons\//g, match => {
    const quote = match[0];
    return `${quote}${baseURL}/icons/`;
  });
  
  if (content !== originalContent) {
    writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed paths in ${file}`);
  }
});

console.log('✨ Base path fixes complete!');
