#!/usr/bin/env node

/**
 * Safe Image Optimization Script
 * Compresses images without breaking functionality
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Check if ImageMagick is available
const hasImageMagick = () => {
  try {
    execSync('convert --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

// Check if pngquant is available
const hasPngquant = () => {
  try {
    execSync('pngquant --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

// Safe compression for PNG files
const compressPNG = (filePath) => {
  if (!hasPngquant()) {
    console.log('⚠️  pngquant not found, skipping PNG compression');
    return false;
  }
  
  try {
    const backupPath = filePath + '.backup';
    fs.copyFileSync(filePath, backupPath);
    
    execSync(`pngquant --force --ext .png --quality=65-80 "${filePath}"`, { stdio: 'ignore' });
    
    const originalSize = fs.statSync(backupPath).size;
    const compressedSize = fs.statSync(filePath).size;
    const savings = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
    
    if (compressedSize < originalSize) {
      console.log(`✅ Compressed ${path.basename(filePath)}: ${savings}% smaller`);
      fs.unlinkSync(backupPath);
      return true;
    } else {
      console.log(`⚠️  No compression benefit for ${path.basename(filePath)}, keeping original`);
      fs.copyFileSync(backupPath, filePath);
      fs.unlinkSync(backupPath);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error compressing ${filePath}:`, error.message);
    return false;
  }
};

// Safe compression for JPG files
const compressJPG = (filePath) => {
  if (!hasImageMagick()) {
    console.log('⚠️  ImageMagick not found, skipping JPG compression');
    return false;
  }
  
  try {
    const backupPath = filePath + '.backup';
    fs.copyFileSync(filePath, backupPath);
    
    execSync(`convert "${filePath}" -quality 85 "${filePath}"`, { stdio: 'ignore' });
    
    const originalSize = fs.statSync(backupPath).size;
    const compressedSize = fs.statSync(filePath).size;
    const savings = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
    
    if (compressedSize < originalSize) {
      console.log(`✅ Compressed ${path.basename(filePath)}: ${savings}% smaller`);
      fs.unlinkSync(backupPath);
      return true;
    } else {
      console.log(`⚠️  No compression benefit for ${path.basename(filePath)}, keeping original`);
      fs.copyFileSync(backupPath, filePath);
      fs.unlinkSync(backupPath);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error compressing ${filePath}:`, error.message);
    return false;
  }
};

// Process all image files in a directory
const processDirectory = (dirPath) => {
  const files = fs.readdirSync(dirPath);
  let totalSavings = 0;
  let processedFiles = 0;
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      const subSavings = processDirectory(filePath);
      totalSavings += subSavings;
    } else if (stat.isFile()) {
      const ext = path.extname(file).toLowerCase();
      
      if (ext === '.png') {
        if (compressPNG(filePath)) {
          processedFiles++;
        }
      } else if (ext === '.jpg' || ext === '.jpeg') {
        if (compressJPG(filePath)) {
          processedFiles++;
        }
      }
    }
  });
  
  return totalSavings;
};

// Main execution
const main = () => {
  console.log('🖼️  Safe Image Optimization Starting...\n');
  
  const publicDir = path.join(__dirname, '..', 'public');
  const iconDir = path.join(__dirname, '..');
  
  if (!fs.existsSync(publicDir)) {
    console.log('❌ Public directory not found');
    return;
  }
  
  console.log('📁 Processing public directory...');
  processDirectory(publicDir);
  
  console.log('📁 Processing icon files...');
  const iconFiles = ['icon-192.png', 'icon-512.png', 'icon.ico'];
  iconFiles.forEach(iconFile => {
    const iconPath = path.join(iconDir, iconFile);
    if (fs.existsSync(iconPath)) {
      const ext = path.extname(iconFile).toLowerCase();
      if (ext === '.png') {
        compressPNG(iconPath);
      }
    }
  });
  
  console.log('\n✅ Image optimization complete!');
  console.log('💡 Tip: Install ImageMagick and pngquant for better compression');
};

if (require.main === module) {
  main();
}

module.exports = { compressPNG, compressJPG, processDirectory };
