# Fix WebSocket Connection (WSS Failure)

The error `WebSocket connection to 'wss://nyem.gnosisbrand.com/...' failed` occurs because the WebSocket request is hitting your local Nginx server (managed by Herd) on port 443, but Nginx doesn't know it should forward this traffic to the Reverb server running on port 8080.

## Step 1: Configure Nginx Proxy for Reverb

You need to add a custom Nginx configuration for your site in Herd.

1.  Open **Herd**.
2.  Go to your sites list or open the configuration directory:
    *   `~/Library/Application Support/Herd/config/nginx/` (or similar)
    *   Look for `nyem.gnosisbrand.com.conf` (or the main `valet.conf` if using a driver).
    *   **Easier way:** In the Herd menu bar app, go to "Config" -> "Nginx" or "Edit Configuration" for the specific site if available.

3.  Add the following `location` block inside the `server` block (for port 443/HTTPS):

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

4.  **Restart Nginx/Herd**:
    *   Run `herd restart` in your terminal.

## Step 2: Verify Backend Configuration

I have already corrected your `.env` file to remove the `https://` prefix from `REVERB_HOST`.

**Current Correct .env:**
```env
REVERB_HOST=nyem.gnosisbrand.com
REVERB_PORT=443
REVERB_SCHEME=https
```

## Step 3: Verify Frontend Configuration

Ensure your frontend is using the correct Reverb keys. Your `app/.env` seems to be missing them, but `WebSocketContext.tsx` has defaults.

If you are using `expo-constants`, ensure `app.json` has:

```json
"extra": {
  "reverbHost": "nyem.gnosisbrand.com",
  "reverbPort": "443",
  "reverbScheme": "https"
}
```

## Step 4: Restart Everything

1.  **Backend:** `php artisan reverb:start --host=127.0.0.1 --port=8080` (I have already restarted this for you).
2.  **Frontend:** Restart your Expo server (`npx expo start -c`).

## Troubleshooting

If `wss://` still fails, you can try connecting directly to the Reverb server (bypassing Nginx) for testing, but this requires using `ws://` (insecure) unless you have certificates set up for port 8080.

**To test with WS (Insecure):**
1.  Change Frontend Config:
    *   Host: `127.0.0.1` (or your local IP if testing on device)
    *   Port: `8080`
    *   Scheme: `http` (ws)
2.  Change Backend `.env`:
    *   `REVERB_HOST=127.0.0.1` (or local IP)
    *   `REVERB_PORT=8080`
    *   `REVERB_SCHEME=http`
3.  Restart Reverb.

But the **Nginx Proxy method (Step 1)** is the correct way to support `wss://nyem.gnosisbrand.com`.
