/**
 * Dynamic PWA Manifest Generator
 * Generates manifest.json that works for both custom domain and GitHub Pages
 * Run: node scripts/generate-manifest.js
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PUBLIC_DIR = join(__dirname, '../public');
const MANIFEST_PATH = join(PUBLIC_DIR, 'manifest.json');
const IMAGES_DIR = join(PUBLIC_DIR, 'images');

// Icon sizes available
const ICON_SIZES = [96, 128, 144, 192, 256, 384, 512];

/**
 * Find screenshot files in public/images directory
 */
function findScreenshots() {
  const screenshots = [];
  
  // Look for screenshots in images folder
  if (existsSync(IMAGES_DIR)) {
    const screenshotsDir = join(IMAGES_DIR, 'screenshots');
    
    if (existsSync(screenshotsDir)) {
      const files = readdirSync(screenshotsDir);
      
      // Look for wide screenshot (desktop/tablet)
      const wideFile = files.find(f => 
        f.includes('wide') || f.includes('desktop') || f.includes('landscape')
      );
      if (wideFile) {
        screenshots.push({
          src: `/images/screenshots/${wideFile}`,
          sizes: '1280x720',
          type: 'image/png',
          form_factor: 'wide'
        });
      }
      
      // Look for narrow screenshot (mobile)
      const narrowFile = files.find(f => 
        f.includes('narrow') || f.includes('mobile') || f.includes('portrait')
      );
      if (narrowFile) {
        screenshots.push({
          src: `/images/screenshots/${narrowFile}`,
          sizes: '750x1334',
          type: 'image/png',
          form_factor: 'narrow'
        });
      }
    }
  }
  
  return screenshots;
}

/**
 * Generate icon entries for manifest
 */
function generateIconEntries() {
  const icons = [];
  
  // Add standard icons with "any" purpose
  for (const size of ICON_SIZES) {
    const iconPath = join(PUBLIC_DIR, `icon-${size}.png`);
    if (existsSync(iconPath)) {
      icons.push({
        src: `/icon-${size}.png`,
        sizes: `${size}x${size}`,
        type: 'image/png',
        purpose: 'any'
      });
    }
  }
  
  // Add maskable icons
  for (const size of ICON_SIZES) {
    const maskablePath = join(PUBLIC_DIR, `icon-${size}-maskable.png`);
    if (existsSync(maskablePath)) {
      icons.push({
        src: `/icon-${size}-maskable.png`,
        sizes: `${size}x${size}`,
        type: 'image/png',
        purpose: 'maskable'
      });
    }
  }
  
  // Ensure we have at least the basic icons
  if (icons.length === 0) {
    console.warn('⚠️  No generated icons found. Using default 192 and 512.');
    icons.push(
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      }
    );
  }
  
  return icons;
}

/**
 * Generate the manifest
 */
function generateManifest() {
  console.log('📱 PWA Manifest Generator Starting...\n');
  
  const icons = generateIconEntries();
  const screenshots = findScreenshots();
  
  console.log(`✅ Found ${icons.length} icon entries`);
  console.log(`✅ Found ${screenshots.length} screenshot entries`);
  
  // Create manifest object
  // Using root paths (/) for both custom domain and GitHub Pages
  // Vite build will handle base path injection
  const manifest = {
    name: 'Otagon AI - Your Gaming Companion',
    short_name: 'Otagon',
    description: 'Get spoiler-free gaming hints and help with AI-powered assistance',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#111111',
    theme_color: '#111111',
    orientation: 'portrait-primary',
    lang: 'en',
    display_override: ['standalone', 'minimal-ui'],
    categories: ['games', 'productivity', 'utilities'],
    icons: icons,
    shortcuts: [
      {
        name: 'New Chat',
        short_name: 'Chat',
        description: 'Start a new conversation',
        url: '/?shortcut=new-chat',
        icons: icons.filter(i => i.sizes === '192x192' && i.purpose === 'any').slice(0, 1)
      },
      {
        name: 'Voice Commands',
        short_name: 'Voice',
        description: 'Use hands-free voice commands',
        url: '/?shortcut=voice',
        icons: icons.filter(i => i.sizes === '192x192' && i.purpose === 'any').slice(0, 1)
      },
      {
        name: 'Settings',
        short_name: 'Settings',
        description: 'Manage your preferences',
        url: '/?shortcut=settings',
        icons: icons.filter(i => i.sizes === '192x192' && i.purpose === 'any').slice(0, 1)
      }
    ],
    permissions: ['audioCapture', 'notifications'],
    edge_side_panel: {
      preferred_width: 400
    }
  };
  
  // Only add screenshots if found
  if (screenshots.length > 0) {
    manifest.screenshots = screenshots;
  }
  
  // Write manifest file
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  
  console.log(`\n✅ Manifest generated: ${MANIFEST_PATH}`);
  console.log('\n📋 Manifest Configuration:');
  console.log(`   Name: ${manifest.name}`);
  console.log(`   Short Name: ${manifest.short_name}`);
  console.log(`   Start URL: ${manifest.start_url}`);
  console.log(`   Scope: ${manifest.scope}`);
  console.log(`   Display: ${manifest.display}`);
  console.log(`   Icons: ${manifest.icons.length} entries`);
  console.log(`   Screenshots: ${manifest.screenshots?.length || 0} entries`);
  console.log(`   Shortcuts: ${manifest.shortcuts.length} entries`);
  
  console.log('\n🎉 Manifest generation complete!');
}

// Run the generator
try {
  generateManifest();
} catch (error) {
  console.error('❌ Fatal error:', error);
  process.exit(1);
}
