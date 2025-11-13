#!/usr/bin/env node
import { cpSync, mkdirSync, existsSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';

console.log('📦 Copying public assets to dist...');

const publicDir = './public';
const distDir = './dist';

// Copy images directory
const imageSrc = join(publicDir, 'images');
const imageDest = join(distDir, 'images');
if (existsSync(imageSrc)) {
  cpSync(imageSrc, imageDest, { recursive: true });
  console.log('✅ Copied /images/ to dist');
}

// Copy icons directory  
const iconsSrc = join(publicDir, 'icons');
const iconsDest = join(distDir, 'icons');
if (existsSync(iconsSrc)) {
  cpSync(iconsSrc, iconsDest, { recursive: true });
  console.log('✅ Copied /icons/ to dist');
}

// Copy PWA icons
const pwaIcons = ['icon-192.png', 'icon-512.png'];
pwaIcons.forEach(icon => {
  const iconSrc = join(publicDir, icon);
  const iconDest = join(distDir, icon);
  if (existsSync(iconSrc)) {
    copyFileSync(iconSrc, iconDest);
    console.log(`✅ Copied ${icon} to dist`);
  } else {
    console.warn(`⚠️ Warning: ${icon} not found in public/`);
  }
});

console.log('✨ Public assets copy complete!');
