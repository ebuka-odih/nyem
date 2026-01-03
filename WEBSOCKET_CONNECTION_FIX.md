# WebSocket Connection Fix

## Issues Identified

1. **Placeholder Image Error**: `via.placeholder.com` URLs in seeder causing `ERR_NAME_NOT_RESOLVED`
2. **WebSocket Connection Failure**: Connection to `wss://nyem.gnosisbrand.com/app/...` failing

## Fixes Applied

### 1. Placeholder Image Fix ✅

**Problem**: Seeder was using `via.placeholder.com` which is not resolving.

**Solution**: Replaced with `ui-avatars.com` which generates avatar images from names.

**Files Changed**:
- `backend/database/seeders/DemoDataSeeder.php`

### 2. WebSocket Connection Path Fix ✅

**Problem**: WebSocket connection failing because:
- API_BASE includes `/backend/public` path
- Auth endpoint path needs to match the actual API structure
- Reverb server may not be running on production

**Solution**: 
- Updated WebSocket context to handle different API base URL structures
- Fixed auth endpoint path construction
- Added better error handling and logging

**Files Changed**:
- `app/src/contexts/WebSocketContext.tsx`

## Required Actions

### 1. Ensure Reverb Server is Running on Production

The WebSocket connection will fail if Reverb server is not running. You need to:

**Option A: Run Reverb directly on port 443** (requires root/sudo):
```bash
php artisan reverb:start --host=0.0.0.0 --port=443
```

**Option B: Use Nginx reverse proxy** (recommended):
1. Run Reverb on port 8080:
   ```bash
   php artisan reverb:start --host=127.0.0.1 --port=8080
   ```

2. Configure Nginx to proxy WebSocket connections:
   ```nginx
   # Add to your existing server block or create new one
   location /app/ {
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

### 2. Verify Backend Configuration

Ensure your `.env` has:
```env
BROADCAST_DRIVER=reverb
REVERB_APP_ID=7fe83b2c-d977-4b62-92e3-4bb523fd6fc6
REVERB_APP_KEY=XXtWgUw0t6Lf0kBvOmu0
REVERB_APP_SECRET=E1w8QG1zjDmyqbKiIAsxvAT38HKJ14IEF6P2Dech
REVERB_HOST=nyem.gnosisbrand.com  # No https:// prefix
REVERB_PORT=443
REVERB_SCHEME=https
```

Then run:
```bash
php artisan config:clear
php artisan config:cache
```

### 3. Check WebSocket Path

The WebSocket connection uses the path `/app/{app_key}`. Make sure:
- Reverb server is accessible at `wss://nyem.gnosisbrand.com:443`
- Or Nginx is proxying `/app/` to the Reverb server

### 4. Test Connection

1. Open browser console
2. Look for `[WebSocket] Connecting to Reverb:` log
3. Check for connection success: `[WebSocket] Connected`
4. If connection fails, check:
   - Is Reverb server running?
   - Is port 443 open in firewall?
   - Is SSL certificate valid?
   - Is the WebSocket path correct?

## Troubleshooting

### WebSocket Connection Fails

1. **Check if Reverb is running**:
   ```bash
   ps aux | grep reverb
   ```

2. **Check Reverb logs**:
   ```bash
   tail -f storage/logs/reverb.log
   ```

3. **Test WebSocket connection manually**:
   ```bash
   wscat -c wss://nyem.gnosisbrand.com/app/XXtWgUw0t6Lf0kBvOmu0?protocol=7&client=js&version=8.4.0
   ```

4. **Check Nginx error logs**:
   ```bash
   tail -f /var/log/nginx/error.log
   ```

### Authentication Fails

1. **Verify auth endpoint is accessible**:
   ```bash
   curl -X POST https://nyem.gnosisbrand.com/api/broadcasting/auth \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"socket_id":"123.456","channel_name":"private-user.123"}'
   ```

2. **Check channel authorization** in `routes/channels.php`

### Messages Not Appearing

1. **Check WebSocket connection status** in browser console
2. **Verify channel subscription** - look for `[WebSocket] Successfully subscribed to:`
3. **Check backend logs** for broadcast errors
4. **Verify BROADCAST_DRIVER=reverb** in `.env`

## Next Steps

1. ✅ Fix placeholder images (done)
2. ✅ Update WebSocket connection path handling (done)
3. ⚠️ **Start Reverb server on production** (required)
4. ⚠️ **Configure Nginx reverse proxy** (if using Option B)
5. ⚠️ **Test real-time messaging** between two users



































