import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 5173,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        },
        dedupe: ['react', 'react-dom'], // Ensure single instance of React
      },
      optimizeDeps: {
        // Pre-bundle React to ensure single instance
        include: ['react', 'react-dom'],
      },
      // Public directory for PWA assets (manifest.json, icons, service worker)
      publicDir: 'public',
      build: {
        // Optimize chunk splitting for better code splitting
        rollupOptions: {
          input: {
            main: path.resolve(__dirname, 'index.html'),
            admin: path.resolve(__dirname, 'admin.html'),
          },
          output: {
            // Manual chunk splitting for better caching
            manualChunks: {
              // Separate vendor chunks
              'react-vendor': ['react', 'react-dom'],
              // UI libraries can be split if they grow large
            },
            // Optimize chunk file names for better caching
            chunkFileNames: 'assets/js/[name]-[hash].js',
            entryFileNames: 'assets/js/[name]-[hash].js',
            assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
          },
        },
        // Increase chunk size warning limit (we're using code splitting)
        chunkSizeWarningLimit: 1000,
        // Enable source maps for production debugging (optional - can disable for smaller builds)
        sourcemap: false,
        // Minify for production using esbuild (faster than terser, built into Vite)
        minify: 'esbuild',
      },
    };
});
