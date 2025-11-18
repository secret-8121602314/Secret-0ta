/**
 * PWA Icon Generator
 * Generates all required icon sizes including maskable versions
 * Run: node scripts/generate-icons.js
 */

/* eslint-disable no-console */
/* eslint-disable no-undef */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Required icon sizes for PWA
const ICON_SIZES = [96, 128, 144, 192, 256, 384, 512];
const SOURCE_ICON = join(__dirname, '../public/icon-512.png');
const OUTPUT_DIR = join(__dirname, '../public');

/**
 * Simple PNG resize using Canvas API (Node.js built-in)
 * For production, consider using 'sharp' package for better quality
 */
async function resizeImage(inputPath, outputPath, size, isMaskable = false) {
  try {
    // Check if sharp is available
    let sharp;
    try {
      sharp = (await import('sharp')).default;
    } catch {
      console.warn('⚠️  Sharp not installed. Install with: npm install sharp --save-dev');
      console.log('   Using fallback method (copy only)...');
      
      // Fallback: just copy the source file for now
      if (size === 512) {
        const data = readFileSync(inputPath);
        writeFileSync(outputPath, data);
        return true;
      }
      return false;
    }

    // If maskable, add safe zone padding (40% padding = 60% content)
    if (isMaskable) {
      const iconSize = Math.round(size * 0.6); // 60% of target size
      const padding = Math.round((size - iconSize) / 2);
      
      await sharp(inputPath)
        .resize(iconSize, iconSize, {
          fit: 'contain',
          background: { r: 17, g: 17, b: 17, alpha: 1 } // #111111 background
        })
        .extend({
          top: padding,
          bottom: padding,
          left: padding,
          right: padding,
          background: { r: 17, g: 17, b: 17, alpha: 1 }
        })
        .png()
        .toFile(outputPath);
    } else {
      // Standard icon - zoom out 3x (logo at 33% size) with background
      const iconSize = Math.round(size / 3); // Logo at 1/3 size (zoomed out 3x)
      const padding = Math.round((size - iconSize) / 2);
      
      await sharp(inputPath)
        .resize(iconSize, iconSize, {
          fit: 'contain',
          background: { r: 17, g: 17, b: 17, alpha: 1 } // #111111 background
        })
        .extend({
          top: padding,
          bottom: padding,
          left: padding,
          right: padding,
          background: { r: 17, g: 17, b: 17, alpha: 1 } // #111111 background
        })
        .png()
        .toFile(outputPath);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Error processing ${outputPath}:`, error.message);
    return false;
  }
}

async function generateIcons() {
  console.log('🎨 PWA Icon Generator Starting...\n');

  // Check if source icon exists
  if (!existsSync(SOURCE_ICON)) {
    console.error(`❌ Source icon not found: ${SOURCE_ICON}`);
    console.log('   Please ensure icon-512.png exists in the public folder.');
    process.exit(1);
  }

  console.log(`📁 Source: ${SOURCE_ICON}`);
  console.log(`📁 Output: ${OUTPUT_DIR}\n`);

  let successCount = 0;
  let failCount = 0;

  // Generate standard icons
  console.log('🔧 Generating standard icons...');
  for (const size of ICON_SIZES) {
    const outputPath = join(OUTPUT_DIR, `icon-${size}.png`);
    const success = await resizeImage(SOURCE_ICON, outputPath, size, false);
    
    if (success) {
      console.log(`✅ Created: icon-${size}.png`);
      successCount++;
    } else {
      console.log(`⚠️  Skipped: icon-${size}.png (sharp not available)`);
      failCount++;
    }
  }

  // Generate maskable icons
  console.log('\n🎭 Generating maskable icons (with safe zone)...');
  for (const size of ICON_SIZES) {
    const outputPath = join(OUTPUT_DIR, `icon-${size}-maskable.png`);
    const success = await resizeImage(SOURCE_ICON, outputPath, size, true);
    
    if (success) {
      console.log(`✅ Created: icon-${size}-maskable.png`);
      successCount++;
    } else {
      console.log(`⚠️  Skipped: icon-${size}-maskable.png (sharp not available)`);
      failCount++;
    }
  }

  // Summary
  console.log('\n📊 Generation Summary:');
  console.log(`   ✅ Success: ${successCount} icons`);
  console.log(`   ⚠️  Skipped: ${failCount} icons`);
  
  if (failCount > 0) {
    console.log('\n💡 To generate all icon sizes, install sharp:');
    console.log('   npm install sharp --save-dev');
    console.log('\n   Then run this script again.');
  } else {
    console.log('\n🎉 All icons generated successfully!');
  }
}

// Run the generator
generateIcons().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
