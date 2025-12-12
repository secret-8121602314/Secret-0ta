import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function updateOGImage() {
  try {
    const inputPath = path.join(__dirname, '../public/images/screenshots/screenshot-wide.png');
    const outputPath = path.join(__dirname, '../public/images/screenshots/screenshot-wide.png');

    // Read the image
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    console.log(`Original image size: ${metadata.width}x${metadata.height}`);

    // Create new image with black background and zoom out the original
    const newWidth = 1280;
    const newHeight = 720;
    
    // Calculate dimensions to maintain aspect ratio with padding
    const originalAspect = metadata.width / metadata.height;
    const newAspect = newWidth / newHeight;
    
    let scaledWidth, scaledHeight;
    if (originalAspect > newAspect) {
      // Image is wider, fit to height
      scaledHeight = newHeight * 0.85;
      scaledWidth = scaledHeight * originalAspect;
    } else {
      // Image is taller or square, fit to width
      scaledWidth = newWidth * 0.85;
      scaledHeight = scaledWidth / originalAspect;
    }

    scaledWidth = Math.round(scaledWidth);
    scaledHeight = Math.round(scaledHeight);

    console.log(`Scaled image size: ${scaledWidth}x${scaledHeight}`);

    // Resize the original image
    const resized = await sharp(inputPath)
      .resize(scaledWidth, scaledHeight, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .toBuffer();

    // Create black background and composite
    const composited = await sharp({
      create: {
        width: newWidth,
        height: newHeight,
        channels: 3,
        background: { r: 0, g: 0, b: 0 }
      }
    })
    .composite([{
      input: resized,
      left: Math.round((newWidth - scaledWidth) / 2),
      top: Math.round((newHeight - scaledHeight) / 2)
    }])
    .png()
    .toFile(outputPath);

    console.log(`✅ OG image updated successfully: ${composited.size} bytes`);
  } catch (error) {
    console.error('❌ Error updating OG image:', error);
    process.exit(1);
  }
}

updateOGImage();
