import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { swVersionPlugin } from './vite-plugin-sw-version';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 5173,
        host: '0.0.0.0',
        strictPort: false,
      },
      plugins: [
        react(),
        swVersionPlugin(), // Inject build timestamp into service worker for versioning
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        },
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
        dedupe: ['react', 'react-dom'], // Ensure single instance of React
      },
      optimizeDeps: {
        // Explicitly include React to ensure single instance
        include: ['react', 'react-dom', 'react/jsx-dev-runtime', 'framer-motion'],
        // ESBuild options for better compatibility
        esbuildOptions: {
          target: 'esnext',
        },
      },
      // Public directory for PWA assets (manifest.json, icons, service worker)
      publicDir: 'public',
      build: {
        // Ensure service worker and manifest are included in build
        rollupOptions: {
          output: {
            // Optimize chunk file names for better caching
            chunkFileNames: 'assets/js/[name]-[hash].js',
            entryFileNames: 'assets/js/[name]-[hash].js',
            assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
          },
        },
      },
    };
});
