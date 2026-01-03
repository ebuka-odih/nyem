# Storage URL Fix

## Problem

Uploaded images are returning 404 errors with URLs like:
```
https://www.nyem.online/backend/public/storage/items/images/xxx.jpeg
```

## Root Cause

The storage URL is being generated based on `APP_URL`, which may not match the actual web server configuration. The URL includes `/backend/public/storage` but the files may not be accessible at that path.

## Solution

A new `STORAGE_URL` environment variable has been added to allow configuring the storage URL independently from `APP_URL`.

### Configuration Options

#### Option 1: Storage URL matches API domain (Recommended)

If your API is at `https://api.nyem.online/backend/public/api`, set:

```env
APP_URL=https://www.nyem.online
STORAGE_URL=https://www.nyem.online/storage
```

This assumes your web server's document root is set to the `public` directory, so files are accessible at `/storage/...`.

#### Option 2: Storage URL includes full path

If your web server document root is above the `public` directory:

```env
APP_URL=https://www.nyem.online/backend/public
STORAGE_URL=https://www.nyem.online/backend/public/storage
```

#### Option 3: Use API domain for storage

If you want to serve storage from the same domain as your API:

```env
APP_URL=https://www.nyem.online
STORAGE_URL=https://api.nyem.online/backend/public/storage
```

### Production Deployment Steps

1. **Set the `STORAGE_URL` environment variable** in your production `.env` file:
   ```env
   STORAGE_URL=https://www.nyem.online/storage
   ```

2. **Ensure the storage symlink exists** on production:
   ```bash
   cd /path/to/backend
   php artisan storage:link
   ```

3. **Verify the symlink**:
   ```bash
   ls -la public/storage
   # Should show: storage -> /path/to/backend/storage/app/public
   ```

4. **Clear and cache configuration**:
   ```bash
   php artisan config:clear
   php artisan config:cache
   ```

5. **Verify file permissions**:
   ```bash
   chmod -R 755 storage/app/public
   chown -R www-data:www-data storage/app/public  # Adjust user/group as needed
   ```

6. **Test the storage URL**:
   - Upload an image via the API
   - Check the returned URL
   - Verify the file is accessible at that URL

### Web Server Configuration

Ensure your web server (Apache/Nginx) is configured to serve static files from the `storage` directory.

#### Apache (.htaccess)

The `.htaccess` file in `public/` should already handle this, but verify it includes rules to serve static files before routing to `index.php`.

#### Nginx

Ensure your Nginx configuration serves static files:

```nginx
location /storage {
    alias /path/to/backend/storage/app/public;
    try_files $uri =404;
}
```

Or if using the symlink:

```nginx
location /storage {
    alias /path/to/backend/public/storage;
    try_files $uri =404;
}
```

### Troubleshooting

1. **404 errors persist**:
   - Verify the symlink exists: `ls -la public/storage`
   - Check file permissions: `ls -la storage/app/public/items/images/`
   - Verify the web server can access the files
   - Check web server error logs

2. **Wrong URL being generated**:
   - Clear config cache: `php artisan config:clear`
   - Verify `STORAGE_URL` is set correctly in `.env`
   - Check the value: `php artisan tinker` then `config('filesystems.disks.public.url')`

3. **Files uploaded but not accessible**:
   - Verify files exist: `ls -la storage/app/public/items/images/`
   - Check symlink target: `readlink public/storage`
   - Verify web server document root points to `public/` directory

### Testing

After configuration, test by:

1. Uploading an image via the API
2. Checking the returned URL format
3. Accessing the URL directly in a browser
4. Verifying the image loads correctly



















