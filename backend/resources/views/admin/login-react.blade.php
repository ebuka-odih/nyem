<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Admin Login - Nyem</title>
    
    <meta name="description" content="Admin login for Nyem" />
    <meta name="theme-color" content="#880e4f" />
    
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              brand: {
                50: '#fdf2f7',
                100: '#fce7f0',
                200: '#f9c3d9',
                300: '#f299bc',
                400: '#e8619a',
                500: '#880e4f',
                DEFAULT: '#880e4f',
                600: '#751043',
                700: '#5c0d35',
                800: '#4a0a2a',
                900: '#3d0823',
              }
            },
            fontFamily: {
              sans: ['Inter', 'sans-serif'],
            }
          }
        }
      }
    </script>
    <style>
      * {
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
      }

      html, body {
        margin: 0;
        padding: 0;
        font-family: 'Inter', sans-serif;
        background-color: white;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }

      #root {
        width: 100%;
        height: 100%;
        overflow: hidden;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: white;
      }

      @keyframes slide-in-from-bottom {
        from {
          transform: translateY(100%);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      .animate-in {
        animation: slide-in-from-bottom 0.5s ease-out;
      }
    </style>
  </head>
  <body>
    <div id="root">
      <div style="display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column; padding: 2rem;">
        <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #880e4f; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 1rem;"></div>
        <p style="color: #666; text-align: center;">Loading admin login...</p>
      </div>
    </div>
    <script type="module">
      // Load Vite client first - escape @ symbol to prevent Blade directive parsing
      const viteClientUrl = '{{ $frontendUrl }}/' + '@' + 'vite/client';
      import(viteClientUrl).then(() => {
        // Then load the admin app
        import('{{ $frontendUrl }}/admin.tsx').catch(err => {
          console.error('Failed to load admin app:', err);
          showError();
        });
      }).catch(err => {
        console.error('Failed to load Vite client:', err);
        showError();
      });

      function showError() {
        document.getElementById('root').innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column; padding: 2rem;">
            <h1 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem; color: #880e4f;">Admin Login</h1>
            <p style="color: #666; margin-bottom: 2rem; text-align: center;">Frontend dev server is not running. Please start it with:</p>
            <code style="background: #f5f5f5; padding: 1rem; border-radius: 0.5rem; font-family: monospace; display: block; margin-bottom: 1rem; white-space: pre-wrap;">cd web
npm run dev</code>
            <p style="color: #666; text-align: center; font-size: 0.875rem; margin-bottom: 0.5rem;">Then refresh this page.</p>
            <p style="color: #999; text-align: center; font-size: 0.75rem; margin-top: 0.5rem;">Expected frontend URL: {{ $frontendUrl }}</p>
            <button onclick="window.location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #880e4f; color: white; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: 500;">
              Retry
            </button>
          </div>
        `;
      }
    </script>
    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  </body>
</html>

