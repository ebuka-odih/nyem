/**
 * Icon Generation Script for PWA
 * 
 * This script generates all required PWA icon sizes from a source icon.
 * 
 * Requirements:
 * - Install sharp: npm install --save-dev sharp
 * - Place your source icon (icon.png) in the app/assets/ directory
 * 
 * Usage: node generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('Error: sharp is not installed.');
  console.error('Please install it by running: npm install --save-dev sharp');
  process.exit(1);
}

const sourceIconPath = path.join(__dirname, '../app/assets/icon.png');
const publicDir = path.join(__dirname, 'public');

// Icon sizes needed for PWA
const iconSizes = [
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' },
  { size: 180, name: 'apple-touch-icon.png' } // iOS specific
];

async function generateIcons() {
  // Check if source icon exists
  if (!fs.existsSync(sourceIconPath)) {
    console.error(`Source icon not found at: ${sourceIconPath}`);
    console.error('Please ensure icon.png exists in app/assets/ directory');
    process.exit(1);
  }

  // Ensure public directory exists
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  console.log('Generating PWA icons...');
  console.log(`Source: ${sourceIconPath}`);
  console.log(`Output: ${publicDir}\n`);

  try {
    // Generate all icon sizes
    for (const icon of iconSizes) {
      const outputPath = path.join(publicDir, icon.name);
      await sharp(sourceIconPath)
        .resize(icon.size, icon.size, {
          fit: 'cover',
          background: { r: 26, g: 26, b: 26, alpha: 1 } // #1a1a1a background
        })
        .toFile(outputPath);
      console.log(`✓ Generated ${icon.name} (${icon.size}x${icon.size})`);
    }

    // Also create favicon.ico (16x16 and 32x32)
    const favicon16 = await sharp(sourceIconPath)
      .resize(16, 16, { fit: 'cover' })
      .toBuffer();
    const favicon32 = await sharp(sourceIconPath)
      .resize(32, 32, { fit: 'cover' })
      .toBuffer();
    
    // Note: Creating a simple PNG as favicon.ico
    // For a proper .ico file, you might need a different library
    await sharp(favicon32).toFile(path.join(publicDir, 'favicon.ico'));
    console.log('✓ Generated favicon.ico');

    console.log('\n✅ All icons generated successfully!');
    console.log('\nNext steps:');
    console.log('1. Build your app: npm run build');
    console.log('2. Test PWA installation on Android/iOS');
    console.log('3. Deploy to a server with HTTPS (required for PWA)');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();

