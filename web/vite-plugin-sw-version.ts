import { Plugin } from 'vite';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Vite plugin to inject build timestamp into service worker for versioning
 * This ensures the service worker version changes on each build, forcing cache updates
 */
export function swVersionPlugin(): Plugin {
  return {
    name: 'sw-version',
    buildStart() {
      const swPath = join(__dirname, 'public', 'sw.js');
      try {
        let swContent = readFileSync(swPath, 'utf-8');
        
        // Generate build timestamp
        const buildTimestamp = Date.now();
        
        // Replace the version line with current build timestamp
        // Look for the pattern: const SW_VERSION = 'v3-' + Date.now();
        const versionRegex = /const SW_VERSION = ['"]v\d+-['"]\s*\+\s*Date\.now\(\);/;
        const newVersion = `const SW_VERSION = 'v3-${buildTimestamp}';`;
        
        if (versionRegex.test(swContent)) {
          swContent = swContent.replace(versionRegex, newVersion);
          writeFileSync(swPath, swContent, 'utf-8');
          console.log(`[sw-version] Updated service worker version to: v3-${buildTimestamp}`);
        } else {
          // If pattern doesn't exist, try to find and replace any SW_VERSION line
          const altRegex = /const SW_VERSION = .+;/;
          if (altRegex.test(swContent)) {
            swContent = swContent.replace(altRegex, newVersion);
            writeFileSync(swPath, swContent, 'utf-8');
            console.log(`[sw-version] Updated service worker version to: v3-${buildTimestamp}`);
          } else {
            console.warn('[sw-version] Could not find SW_VERSION in service worker');
          }
        }
      } catch (error) {
        console.error('[sw-version] Error updating service worker version:', error);
      }
    },
  };
}


