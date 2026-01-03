# Reverb Production Credentials

## Production WebSocket Credentials

These credentials are configured for production use with HTTPS.

### Application Credentials

```
REVERB_APP_ID=7fe83b2c-d977-4b62-92e3-4bb523fd6fc6
REVERB_APP_KEY=XXtWgUw0t6Lf0kBvOmu0
REVERB_APP_SECRET=N3QnZyLECjNNKvFSSCcqZji2nU1hBxHUcgkVYkXK
```

### Connection Settings

```
REVERB_HOST=yourdomain.com  (⚠️ UPDATE THIS with your actual production domain)
REVERB_PORT=443
REVERB_SCHEME=https
```

## Setup Instructions

### 1. Update Production Domain

Replace `yourdomain.com` in your `.env` file with your actual production domain:

```env
REVERB_HOST=api.yourdomain.com
# or
REVERB_HOST=ws.yourdomain.com
# or
REVERB_HOST=yourdomain.com
```

### 2. Server Configuration

For production, you have two options:

#### Option A: Run Reverb on Port 443 (Requires Root/Sudo)

```bash
php artisan reverb:start --host=0.0.0.0 --port=443
```

**Note:** Running on port 443 requires root privileges. Use a process manager like Supervisor.

#### Option B: Use Reverse Proxy (Recommended)

Run Reverb on a non-privileged port (e.g., 8080) and use Nginx as a reverse proxy:

**Nginx Configuration:**
```nginx
upstream reverb {
    server 127.0.0.1:8080;
}

server {
    listen 443 ssl http2;
    server_name ws.yourdomain.com;  # or yourdomain.com

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    location / {
        proxy_pass http://reverb;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;

        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Then update `.env`:
```env
REVERB_HOST=ws.yourdomain.com
REVERB_PORT=443
REVERB_SCHEME=https
```

And run Reverb on port 8080:
```bash
php artisan reverb:start --host=127.0.0.1 --port=8080
```

### 3. Process Manager Setup (Supervisor)

Create `/etc/supervisor/conf.d/reverb.conf`:

```ini
[program:reverb]
process_name=%(program_name)s_%(process_num)02d
command=php /path/to/your/project/artisan reverb:start --host=127.0.0.1 --port=8080
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=1
redirect_stderr=true
stdout_logfile=/path/to/your/project/storage/logs/reverb.log
stopwaitsecs=3600
```

Then:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start reverb:*
```

### 4. Frontend Configuration

Use these credentials in your React Native app:

```javascript
import Pusher from 'pusher-js/react-native';

const pusher = new Pusher('XXtWgUw0t6Lf0kBvOmu0', {
  wsHost: 'yourdomain.com',  // Update with your domain
  wsPort: 443,
  wssPort: 443,
  forceTLS: true,
  enabledTransports: ['ws', 'wss'],
  authEndpoint: 'https://yourdomain.com/api/broadcasting/auth',
  auth: {
    headers: {
      Authorization: `Bearer ${userToken}`,
    },
  },
});
```

### 5. Environment Variables for Frontend

Make sure your frontend has access to these environment variables:

```env
VITE_REVERB_APP_KEY=XXtWgUw0t6Lf0kBvOmu0
VITE_REVERB_HOST=yourdomain.com
VITE_REVERB_PORT=443
VITE_REVERB_SCHEME=https
```

## Security Notes

1. **Keep credentials secret**: Never commit these credentials to version control
2. **Use HTTPS**: Always use HTTPS in production for secure WebSocket connections
3. **Restrict origins**: Update `allowed_origins` in `config/reverb.php` to restrict which domains can connect
4. **Firewall**: Only allow connections from your frontend domain
5. **Rate limiting**: Consider implementing rate limiting for WebSocket connections

## Testing Production Setup

1. **Test WebSocket connection:**
   ```bash
   wscat -c wss://yourdomain.com/app/XXtWgUw0t6Lf0kBvOmu0?protocol=7&client=js&version=8.4.0&flash=false
   ```

2. **Check server logs:**
   ```bash
   tail -f storage/logs/reverb.log
   ```

3. **Monitor connections:**
   Check your server's connection count and ensure Reverb is handling connections properly.

## Troubleshooting

- **Connection refused**: Check firewall rules and ensure port 443 (or your configured port) is open
- **SSL errors**: Verify SSL certificates are valid and properly configured
- **Authentication fails**: Ensure `/api/broadcasting/auth` endpoint is accessible and returns proper auth tokens
- **CORS issues**: Update `allowed_origins` in Reverb config to include your frontend domain

## Current Configuration

✅ **Broadcasting Driver**: `reverb`  
✅ **App ID**: `7fe83b2c-d977-4b62-92e3-4bb523fd6fc6`  
✅ **App Key**: `XXtWgUw0t6Lf0kBvOmu0`  
✅ **App Secret**: `N3QnZyLECjNNKvFSSCcqZji2nU1hBxHUcgkVYkXK`  
⚠️ **Host**: Update `yourdomain.com` with your actual domain  
✅ **Port**: `443` (HTTPS)  
✅ **Scheme**: `https`