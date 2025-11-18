/**
 * One-time script to zoom out the logo 3x with background padding
 * Run: node scripts/zoom-out-logo.js
 */

/* eslint-disable no-console, no-undef */

import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PUBLIC_DIR = join(__dirname, '../public');
const SOURCE_LOGO_PATH = join(PUBLIC_DIR, 'images/otagon-logo.png');
const PWA_ICON_PATH = join(PUBLIC_DIR, 'images/pwa-icon.png');

async function zoomOutLogo() {
  try {
    console.log('🔍 Reading logo from:', SOURCE_LOGO_PATH);
    console.log('📝 Creating PWA icon at:', PWA_ICON_PATH);
    
    // Read the original logo
    const logoBuffer = readFileSync(SOURCE_LOGO_PATH);
    const metadata = await sharp(logoBuffer).metadata();
    
    console.log(`📏 Original size: ${metadata.width}x${metadata.height}`);
    
    // Calculate new size (logo at 33% = zoomed out 3x)
    const logoSize = Math.round(metadata.width * 0.33);
    const canvasSize = metadata.width; // Keep same canvas size
    const padding = Math.round((canvasSize - logoSize) / 2);
    
    console.log(`📐 New logo size: ${logoSize}x${logoSize}`);
    console.log(`📦 Canvas size: ${canvasSize}x${canvasSize}`);
    console.log(`📏 Padding: ${padding}px on each side`);
    
    // Create zoomed out version
    const zoomedOutBuffer = await sharp(logoBuffer)
      .resize(logoSize, logoSize, {
        fit: 'contain',
        background: { r: 17, g: 17, b: 17, alpha: 1 } // #111111
      })
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: { r: 17, g: 17, b: 17, alpha: 1 }
      })
      .png()
      .toBuffer();
    
    // Save to PWA icon file (not the original)
    await sharp(zoomedOutBuffer)
      .toFile(PWA_ICON_PATH);
    
    console.log('✅ PWA icon created at:', PWA_ICON_PATH);
    console.log('✅ Original logo unchanged at:', SOURCE_LOGO_PATH);
    console.log('🎉 Done! PWA icon has 3x zoom out with #111111 background');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

zoomOutLogo();
