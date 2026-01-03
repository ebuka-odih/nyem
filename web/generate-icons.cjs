/**
 * Icon Generation Script for PWA
 * 
 * This script generates all required PWA icon sizes from the SVG source.
 * Icons are generated with rounded corners for a polished mobile app look.
 * 
 * Requirements:
 * - Install sharp: npm install --save-dev sharp
 * 
 * Usage: node generate-icons.cjs
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

// Use SVG from public directory as source
const sourceIconPath = path.join(__dirname, 'public', 'icon-source.svg');
const publicDir = path.join(__dirname, 'public');

// Icon sizes needed for PWA
const iconSizes = [
  { size: 72, name: 'icon-72x72.png', rounded: true },
  { size: 96, name: 'icon-96x96.png', rounded: true },
  { size: 128, name: 'icon-128x128.png', rounded: true },
  { size: 144, name: 'icon-144x144.png', rounded: true },
  { size: 152, name: 'icon-152x152.png', rounded: true },
  { size: 192, name: 'icon-192x192.png', rounded: true },
  { size: 384, name: 'icon-384x384.png', rounded: true },
  { size: 512, name: 'icon-512x512.png', rounded: true },
  { size: 180, name: 'apple-touch-icon.png', rounded: true } // iOS specific
];

/**
 * Creates a rounded rectangle SVG mask
 * @param {number} size - Icon size
 * @param {number} radiusPercent - Corner radius (percentage of size)
 */
function createRoundedMask(size, radiusPercent = 22) {
  const radius = Math.round(size * (radiusPercent / 100));
  return Buffer.from(`
    <svg width="${size}" height="${size}">
      <rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="white"/>
    </svg>
  `);
}

async function generateIcons() {
  // Check if source icon exists
  if (!fs.existsSync(sourceIconPath)) {
    console.error(`Source icon not found at: ${sourceIconPath}`);
    console.error('Please ensure icon-source.svg exists in public/ directory');
    process.exit(1);
  }

  // Ensure public directory exists
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  console.log('Generating PWA icons from SVG with rounded corners...');
  console.log(`Source: ${sourceIconPath}`);
  console.log(`Output: ${publicDir}\n`);

  try {
    // Generate all icon sizes
    for (const icon of iconSizes) {
      const outputPath = path.join(publicDir, icon.name);
      
      // Convert SVG to PNG and resize
      let image = sharp(sourceIconPath)
        .resize(icon.size, icon.size, {
          fit: 'contain',
          background: { r: 131, g: 14, b: 76, alpha: 1 } // Brand red #830e4c
        })
        .png();

      if (icon.rounded) {
        // Apply rounded mask
        const mask = createRoundedMask(icon.size);
        image = image.composite([{
          input: mask,
          blend: 'dest-in'
        }]);
      }
      
      await image.toFile(outputPath);
      console.log(`✓ Generated ${icon.name} (${icon.size}x${icon.size})`);
    }

    // Also create favicon.ico (32x32 with slight rounding)
    const favicon32 = await sharp(sourceIconPath)
      .resize(32, 32, { 
        fit: 'contain',
        background: { r: 131, g: 14, b: 76, alpha: 1 } // Brand red #830e4c
      })
      .png()
      .toBuffer();
    
    const mask32 = createRoundedMask(32, 18);
    await sharp(favicon32)
      .composite([{
        input: mask32,
        blend: 'dest-in'
      }])
      .toFile(path.join(publicDir, 'favicon.ico'));
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

