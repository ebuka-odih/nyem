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
      // Increase chunk size warning limit to 600KB (our main bundle is 633KB)
      chunkSizeWarningLimit: 600,
      // Ensure service worker and manifest are included in build
      rollupOptions: {
        output: {
          // Optimize chunk file names for better caching
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
          // Manual chunk splitting for better code splitting
          manualChunks: {
            // Vendor chunks
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-framer': ['framer-motion'],
            'vendor-query': ['@tanstack/react-query'],
            'vendor-icons': ['lucide-react'],
            // Split pages into separate chunks for lazy loading
            'pages': [
              './pages/DiscoverPage.tsx',
              './pages/MatchesPage.tsx',
              './pages/ProfilePage.tsx',
              './pages/UploadPage.tsx',
            ],
            'pages-auth': [
              './pages/WelcomePage.tsx',
              './pages/LoginPage.tsx',
              './pages/RegisterPage.tsx',
              './pages/OtpVerificationPage.tsx',
              './pages/ForgotPasswordPage.tsx',
            ],
          },
        },
      },
    },
  };
});
