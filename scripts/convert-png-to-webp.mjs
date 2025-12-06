import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IMAGE_DIRS = [
  path.join(__dirname, '../public/images'),
  // Add more asset folders if needed
];

function findPngFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findPngFiles(filePath));
    } else if (file.toLowerCase().endsWith('.png')) {
      results.push(filePath);
    }
  });
  return results;
}

async function convertPngToWebp(pngPath) {
  const webpPath = pngPath.replace(/\.png$/i, '.webp');
  if (fs.existsSync(webpPath)) {
    const pngMtime = fs.statSync(pngPath).mtimeMs;
    const webpMtime = fs.statSync(webpPath).mtimeMs;
    if (webpMtime >= pngMtime) {
      console.log(`[SKIP] ${webpPath} is up to date.`);
      return;
    }
  }
  try {
    // First validate the image can be read
    const metadata = await sharp(pngPath).metadata();
    if (!metadata.width || !metadata.height) {
      console.log(`[SKIP] ${pngPath} - unable to read image metadata, keeping original PNG`);
      return;
    }
    await sharp(pngPath)
      .webp({ quality: 82 })
      .toFile(webpPath);
    console.log(`[OK] Converted: ${pngPath} -> ${webpPath}`);
  } catch (err) {
    // Silently skip files that can't be converted - they'll be served as PNG
    console.log(`[SKIP] ${pngPath} - format not supported by sharp, keeping original PNG`);
  }
}

(async () => {
  for (const dir of IMAGE_DIRS) {
    if (!fs.existsSync(dir)) continue;
    const pngFiles = findPngFiles(dir);
    for (const png of pngFiles) {
      await convertPngToWebp(png);
    }
  }
  console.log('PNG to WebP conversion complete.');
})();
