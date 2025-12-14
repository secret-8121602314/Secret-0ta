/**
 * Create SEO-optimized images with black background for Google search results
 * Run with: node scripts/create-seo-images.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('✓ Using sharp for high-quality image processing');

const INPUT_LOGO = path.join(__dirname, '../public/images/otagon-logo.png');
const OUTPUT_DIR = path.join(__dirname, '../public/images');
const PADDING_PERCENT = 15; // Percentage of padding around logo

async function createFavicon() {
  console.log('\n📱 Creating favicon (512x512)...');
  
  const size = 512;
  const paddingPx = Math.floor(size * PADDING_PERCENT / 100);
  const logoSize = size - (paddingPx * 2);

  try {
    // Create black background
    const blackBg = await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 1 }
      }
    }).png();

    // Resize logo and composite on black background
    const logo = await sharp(INPUT_LOGO)
      .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    await blackBg
      .composite([{
        input: logo,
        top: paddingPx,
        left: paddingPx
      }])
      .toFile(path.join(OUTPUT_DIR, 'favicon-512x512.png'));

    console.log('✓ Created: favicon-512x512.png');

    // Also create smaller sizes for better browser compatibility
    await sharp(path.join(OUTPUT_DIR, 'favicon-512x512.png'))
      .resize(192, 192)
      .toFile(path.join(OUTPUT_DIR, 'favicon-192x192.png'));
    console.log('✓ Created: favicon-192x192.png');

    await sharp(path.join(OUTPUT_DIR, 'favicon-512x512.png'))
      .resize(180, 180)
      .toFile(path.join(OUTPUT_DIR, 'apple-touch-icon.png'));
    console.log('✓ Created: apple-touch-icon.png');

  } catch (error) {
    console.error('✗ Error creating favicon:', error.message);
  }
}

async function createOGImage() {
  console.log('\n🌐 Creating Open Graph image (1200x630)...');
  
  const width = 1200;
  const height = 630;
  const maxLogoSize = Math.floor(height * 0.65); // 65% of height
  const paddingPx = Math.floor(maxLogoSize * PADDING_PERCENT / 100);
  const logoSize = maxLogoSize - (paddingPx * 2);

  try {
    // Create black background
    const blackBg = await sharp({
      create: {
        width: width,
        height: height,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 1 }
      }
    }).png();

    // Resize logo
    const logo = await sharp(INPUT_LOGO)
      .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    // Center logo on black background
    const left = Math.floor((width - logoSize) / 2);
    const top = Math.floor((height - logoSize) / 2);

    await blackBg
      .composite([{
        input: logo,
        top: top,
        left: left
      }])
      .toFile(path.join(OUTPUT_DIR, 'og-image.png'));

    console.log('✓ Created: og-image.png');

  } catch (error) {
    console.error('✗ Error creating OG image:', error.message);
  }
}

async function createTwitterCard() {
  console.log('\n🐦 Creating Twitter card image (1200x600)...');
  
  const width = 1200;
  const height = 600;
  const maxLogoSize = Math.floor(height * 0.65);
  const paddingPx = Math.floor(maxLogoSize * PADDING_PERCENT / 100);
  const logoSize = maxLogoSize - (paddingPx * 2);

  try {
    const blackBg = await sharp({
      create: {
        width: width,
        height: height,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 1 }
      }
    }).png();

    const logo = await sharp(INPUT_LOGO)
      .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    const left = Math.floor((width - logoSize) / 2);
    const top = Math.floor((height - logoSize) / 2);

    await blackBg
      .composite([{
        input: logo,
        top: top,
        left: left
      }])
      .toFile(path.join(OUTPUT_DIR, 'twitter-card.png'));

    console.log('✓ Created: twitter-card.png');

  } catch (error) {
    console.error('✗ Error creating Twitter card:', error.message);
  }
}

async function main() {
  console.log('🎨 Otagon SEO Images Generator');
  console.log('================================\n');

  // Check if input logo exists
  if (!fs.existsSync(INPUT_LOGO)) {
    console.error(`✗ Logo file not found: ${INPUT_LOGO}`);
    console.log('\n💡 Place your logo at: public/images/otagon-logo.png');
    process.exit(1);
  }

  console.log(`📂 Input logo: ${INPUT_LOGO}`);
  console.log(`📂 Output directory: ${OUTPUT_DIR}`);
  console.log(`⚙️  Padding: ${PADDING_PERCENT}%`);

  await createFavicon();
  await createOGImage();
  await createTwitterCard();

  console.log('\n✅ All images created successfully!');
  console.log('\n📝 Next steps:');
  console.log('1. Update index.html to use the new favicon');
  console.log('2. Update OG and Twitter meta tags to use new images');
  console.log('3. Deploy changes');
  console.log('4. Test with: https://www.opengraph.xyz/');
  console.log('5. Request Google to re-crawl: https://search.google.com/search-console');
}

main().catch(console.error);
