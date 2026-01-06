# Reverb Configuration Fix

## ⚠️ IMPORTANT: Fix Required in .env

Your `.env` file has an incorrect `REVERB_HOST` value. 

### Current (WRONG):
```env
REVERB_HOST=https://nyem.gnosisbrand.com
```

### Should be (CORRECT):
```env
REVERB_HOST=nyem.gnosisbrand.com
```

**The `https://` prefix should NOT be included in `REVERB_HOST`. The scheme is already specified separately in `REVERB_SCHEME=https`.**

## Complete .env Configuration

Update your `.env` file with these values:

```env
BROADCAST_DRIVER=reverb

REVERB_APP_ID=7fe83b2c-d977-4b62-92e3-4bb523fd6fc6
REVERB_APP_KEY=XXtWgUw0t6Lf0kBvOmu0
REVERB_APP_SECRET=E1w8QG1zjDmyqbKiIAsxvAT38HKJ14IEF6P2Dech

# ⚠️ FIX: Remove https:// prefix
REVERB_HOST=nyem.gnosisbrand.com
REVERB_PORT=443
REVERB_SCHEME=https
```

## After Updating

1. Clear config cache:
   ```bash
   php artisan config:clear
   php artisan config:cache
   ```

2. Restart Reverb server if running:
   ```bash
   php artisan reverb:start --host=127.0.0.1 --port=8080
   ```

3. Verify the configuration:
   ```bash
   php artisan config:show broadcasting.connections.reverb
   ```

## Frontend Configuration

Make sure your frontend environment variables are set:

```env
EXPO_PUBLIC_REVERB_APP_KEY=XXtWgUw0t6Lf0kBvOmu0
EXPO_PUBLIC_REVERB_HOST=nyem.gnosisbrand.com
EXPO_PUBLIC_REVERB_PORT=443
EXPO_PUBLIC_REVERB_SCHEME=https
```

Or in `app.json`:
```json
{
  "expo": {
    "extra": {
      "reverbAppKey": "XXtWgUw0t6Lf0kBvOmu0",
      "reverbHost": "nyem.gnosisbrand.com",
      "reverbPort": "443",
      "reverbScheme": "https"
    }
  }
}
```





































