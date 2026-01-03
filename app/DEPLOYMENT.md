# Web Deployment Guide

This guide explains how to deploy the Nyem web application to a production server.

## Build Output

The production build has been generated in the `dist/` directory and packaged as `web-build.zip`.

## Deployment Steps

### 1. Extract Files

Extract the `web-build.zip` file to your web server's document root (e.g., `public_html`, `www`, or `htdocs`).

```bash
unzip web-build.zip -d /path/to/your/web/root
```

### 2. Configure Environment Variables

The web app requires the following environment variables to be set at build time. Since this is a static build, you'll need to rebuild if you need to change these:

**Required Environment Variables:**
- `EXPO_PUBLIC_API_BASE` - Your API base URL (e.g., `https://nyem.gnosisbrand.com/api`)
- `EXPO_PUBLIC_REVERB_APP_KEY` - Reverb WebSocket app key
- `EXPO_PUBLIC_REVERB_HOST` - Reverb WebSocket host (e.g., `nyem.gnosisbrand.com`)
- `EXPO_PUBLIC_REVERB_PORT` - Reverb WebSocket port (usually `443` for HTTPS)
- `EXPO_PUBLIC_REVERB_SCHEME` - Reverb WebSocket scheme (`https` or `wss`)

**To rebuild with custom environment variables:**

```bash
cd app
export EXPO_PUBLIC_API_BASE="https://your-api-domain.com/api"
export EXPO_PUBLIC_REVERB_APP_KEY="your-reverb-key"
export EXPO_PUBLIC_REVERB_HOST="your-websocket-host"
export EXPO_PUBLIC_REVERB_PORT="443"
export EXPO_PUBLIC_REVERB_SCHEME="https"
npm run build:web
```

### 3. Server Configuration

Since this is a Single Page Application (SPA), you need to configure your web server to redirect all routes to `index.html`.

#### Apache (.htaccess)

Create a `.htaccess` file in your `dist/` directory:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Enable compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType application/json "access plus 0 seconds"
  ExpiresByType text/html "access plus 0 seconds"
</IfModule>
```

#### Nginx

Add this configuration to your Nginx server block:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # SPA routing - redirect all routes to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2|ttf|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### 4. CORS Configuration

Ensure your backend API has CORS configured to allow requests from your web domain:

```php
// In Laravel backend: config/cors.php
'allowed_origins' => [
    'https://your-web-domain.com',
],
```

### 5. WebSocket Configuration

If using Reverb for WebSocket connections, ensure your server is configured to proxy WebSocket connections:

```nginx
location /app {
    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### 6. SSL/HTTPS

For production, ensure you have SSL certificates configured. You can use Let's Encrypt:

```bash
sudo certbot --nginx -d your-domain.com
```

## File Structure

After deployment, your web root should contain:

```
/
├── index.html
├── favicon.ico
├── metadata.json
├── _expo/
│   └── static/
│       └── js/
│           └── web/
│               └── index-*.js
└── assets/
    └── node_modules/
        └── [various asset files]
```

## Testing

After deployment, test the following:

1. **Homepage loads**: Visit your domain and verify the app loads
2. **API connectivity**: Check browser console for API calls
3. **WebSocket connection**: Verify real-time features work
4. **Routing**: Test navigation between different pages
5. **Authentication**: Test login/logout functionality

## Troubleshooting

### 404 Errors on Routes

- Ensure your server is configured to redirect all routes to `index.html` (see Server Configuration above)

### API Connection Issues

- Check CORS settings on your backend
- Verify `EXPO_PUBLIC_API_BASE` is set correctly
- Check browser console for CORS errors

### WebSocket Connection Issues

- Verify Reverb server is running
- Check WebSocket proxy configuration
- Ensure `EXPO_PUBLIC_REVERB_*` environment variables are set correctly

### Build Issues

If you need to rebuild:

```bash
cd app
npm install
npm run build:web
```

## Production Checklist

- [ ] Environment variables configured
- [ ] Server routing configured (SPA support)
- [ ] SSL/HTTPS enabled
- [ ] CORS configured on backend
- [ ] WebSocket proxy configured (if using Reverb)
- [ ] Static asset caching enabled
- [ ] Gzip compression enabled
- [ ] Security headers configured
- [ ] Error logging configured
- [ ] Analytics/monitoring set up (optional)

## Support

For issues or questions, refer to:
- Expo Web documentation: https://docs.expo.dev/workflow/web/
- React Native Web: https://necolas.github.io/react-native-web/































