# WebSocket/Real-time Broadcasting Setup

## Overview

The system uses Laravel Reverb for real-time WebSocket broadcasting. It supports:
- **Match Created**: Notifies users when they match with someone
- **Message Sent**: Notifies users when they receive a new message
- **Conversation Created**: Notifies users when a new conversation is created

## Setup

### 1. Backend Configuration

#### Environment Variables (.env)
```env
BROADCAST_DRIVER=reverb

REVERB_APP_ID=your-generated-app-id
REVERB_APP_KEY=your-generated-app-key
REVERB_APP_SECRET=your-generated-app-secret
REVERB_HOST=yourdomain.com  # ⚠️ No https:// prefix
REVERB_PORT=443
REVERB_SCHEME=https
```

**Generate Credentials:**
```bash
php artisan tinker --execute="echo 'REVERB_APP_ID=' . \Illuminate\Support\Str::uuid() . PHP_EOL; echo 'REVERB_APP_KEY=' . \Illuminate\Support\Str::random(20) . PHP_EOL; echo 'REVERB_APP_SECRET=' . \Illuminate\Support\Str::random(40) . PHP_EOL;"
```

**Important:**
- ⚠️ Remove `https://` prefix from `REVERB_HOST`
- ⚠️ Never commit `.env` files to version control
- After updating, run: `php artisan config:clear && php artisan config:cache`

#### Start Reverb Server

**Development (Local):**
```bash
php artisan reverb:start --host=127.0.0.1 --port=8080
```

**Production:**
Option A: Run directly on port 443 (requires root/sudo):
```bash
php artisan reverb:start --host=0.0.0.0 --port=443
```

Option B: Use Nginx reverse proxy (recommended):
1. Run Reverb on port 8080:
   ```bash
   php artisan reverb:start --host=127.0.0.1 --port=8080
   ```

2. Configure Nginx to proxy WebSocket connections:
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

3. Restart Nginx:
   ```bash
   sudo nginx -s reload
   # or
   herd restart
   ```

### 2. Frontend Configuration

#### Mobile (React Native/Expo)
Add to `app.json`:
```json
{
  "expo": {
    "extra": {
      "reverbAppKey": "your-reverb-app-key",
      "reverbHost": "yourdomain.com",
      "reverbPort": "443",
      "reverbScheme": "https"
    }
  }
}
```

Or set environment variables:
```env
EXPO_PUBLIC_REVERB_APP_KEY=your-reverb-app-key
EXPO_PUBLIC_REVERB_HOST=yourdomain.com
EXPO_PUBLIC_REVERB_PORT=443
EXPO_PUBLIC_REVERB_SCHEME=https
```

#### Web
The frontend WebSocket context automatically uses the configured Reverb credentials from environment variables.

## How It Works

### Real-time Message Flow
1. **User A sends a message**:
   - Message is saved to database
   - `MessageSent` event is broadcast to:
     - `private-conversation.{conversation_id}` (both users subscribed)
     - `private-user.{receiver_id}` (receiver's personal channel)

2. **User B receives message**:
   - WebSocket connection receives `message.sent` event
   - ChatScreen automatically adds message to the chat
   - Message appears in real-time without page refresh

3. **Connection Management**:
   - WebSocket connects when user logs in
   - Automatically subscribes to conversation channel when ChatScreen opens
   - Unsubscribes when leaving ChatScreen
   - Handles reconnection automatically

## Testing

### Test WebSocket Connection

1. **Start Reverb server**:
   ```bash
   php artisan reverb:start --host=127.0.0.1 --port=8080
   ```

2. **Check connection in browser console**:
   - Look for `[WebSocket] Connecting to Reverb:` log
   - Check for connection success: `[WebSocket] Connected`
   - Check for channel subscription: `[WebSocket] Successfully subscribed to:`

3. **Test real-time messaging**:
   - Open chat between User A and User B
   - User A sends a message
   - User B should see the message appear immediately
   - Check browser console for WebSocket connection logs

### Test Connection Manually
```bash
wscat -c wss://yourdomain.com/app/YOUR_APP_KEY?protocol=7&client=js&version=8.4.0
```

## Troubleshooting

### WebSocket Connection Fails

**Check if Reverb is running**:
```bash
ps aux | grep reverb
```

**Check Reverb logs**:
```bash
tail -f storage/logs/reverb.log
```

**Common Issues:**
1. **"Connection refused"**: Reverb server not running or wrong host/port
2. **"WSS failure"**: Nginx not configured to proxy WebSocket connections
3. **"Authentication failed"**: Check token and `/api/broadcasting/auth` endpoint

**Solutions:**
- Verify `REVERB_HOST` has no `https://` prefix
- Check Nginx configuration for `/app` location block
- Ensure Reverb server is running
- Check firewall/network access
- Verify SSL certificate is valid

### Messages Not Appearing in Real-time

1. **Check WebSocket connection**:
   - Look for `[WebSocket] Connected` in console
   - Verify `isConnected` is `true` in ChatScreen

2. **Check channel subscription**:
   - Look for `[WebSocket] Successfully subscribed to: private-conversation.{id}`
   - Verify conversation ID matches

3. **Check backend broadcasting**:
   - Verify `BROADCAST_DRIVER=reverb` in `.env`
   - Check Laravel logs for broadcast errors
   - Ensure Reverb server is running

4. **Check authentication**:
   - Verify `/api/broadcasting/auth` endpoint is accessible
   - Check that Bearer token is being sent
   - Verify channel authorization in `routes/channels.php`

### Nginx Configuration Issues

If WebSocket connection fails with `wss://yourdomain.com`, ensure Nginx is configured:

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

After adding, restart Nginx:
```bash
sudo nginx -s reload
# or if using Herd
herd restart
```

### Mobile Device Connection

If testing on a physical device, update WebSocket URL to use your computer's LAN IP instead of `127.0.0.1`:

```typescript
// In WebSocketContext.tsx
const getWebSocketUrl = () => {
  const host = Constants.expoConfig?.extra?.reverbHost || '192.168.1.XXX'; // Your LAN IP
  const port = Constants.expoConfig?.extra?.reverbPort || '8080';
  // ...
};
```

## Backend Broadcasting Events

### MessageSent Event
- Broadcasts to: `private-conversation.{conversation_id}` and `private-user.{receiver_id}`
- Payload includes: message data, sender information, conversation details

### MatchCreated Event
- Broadcasts to: `private-user.{user1_id}` and `private-user.{user2_id}`
- Payload includes: match data, user information

### ConversationCreated Event
- Broadcasts to: `private-user.{user_id}`
- Payload includes: conversation data

## Security

- All channels are private and require authentication
- Channel authorization is handled in `routes/channels.php`
- WebSocket authentication uses Laravel Sanctum tokens
- CSRF protection via state parameters (where applicable)

## Production Considerations

1. **Run Reverb as a service**: Use systemd, supervisor, or PM2 to keep Reverb running
2. **Use Nginx reverse proxy**: Recommended for production deployments
3. **Monitor Reverb logs**: Set up log rotation and monitoring
4. **Scale Reverb**: Consider using multiple Reverb instances with Redis for scaling
5. **SSL/TLS**: Always use `wss://` (secure WebSocket) in production

## Files Modified

### Backend
- `app/Events/MessageSent.php` - Broadcasting event
- `routes/channels.php` - Channel authorization
- `.env` - Reverb configuration

### Frontend
- `app/src/contexts/WebSocketContext.tsx` - WebSocket connection management
- `app/src/screens/ChatScreen.tsx` - Real-time message listener


