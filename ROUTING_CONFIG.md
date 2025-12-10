# Server Routing Configuration

## Problem
When navigating to routes like `/game/Christmas25/landing`, the server returns a 404 because it doesn't know about these client-side routes.

## Solution
The server needs to be configured to serve `index.html` for all routes under `/game/Christmas25/*` so that React Router can handle the routing client-side.

## Configuration Options

### Option 1: If deployed on Vercel (separate project)
The `vercel.json` file in this repo should handle it automatically.

### Option 2: If part of main crackwits.com site
The main site's server configuration needs to include rewrite rules:

**For Vercel (main site):**
Add to the main site's `vercel.json`:
```json
{
  "rewrites": [
    {
      "source": "/game/Christmas25/:path*",
      "destination": "/game/Christmas25/index.html"
    }
  ]
}
```

**For Apache (.htaccess):**
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /game/Christmas25/
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /game/Christmas25/index.html [L]
</IfModule>
```

**For Nginx:**
```nginx
location /game/Christmas25/ {
  try_files $uri $uri/ /game/Christmas25/index.html;
}
```

## Testing
After configuration, these URLs should all serve the game:
- `https://crackwits.com/game/Christmas25`
- `https://crackwits.com/game/Christmas25/landing`
- `https://crackwits.com/game/Christmas25/game`
- `https://crackwits.com/game/Christmas25/ending`

