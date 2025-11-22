# nginx Configuration for Production

## Installation

### 1. Copy Configuration
```bash
sudo cp fallout-app.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/fallout-app.conf /etc/nginx/sites-enabled/
```

### 2. Edit Configuration
Edit `/etc/nginx/sites-available/fallout-app.conf`:
- Replace `your-domain.com` with your actual domain
- Adjust paths if needed (default: `/var/www/fallout-char-manager/`)

### 3. Test & Reload
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## SSL/HTTPS Setup (Recommended)

### Using Let's Encrypt (Free)
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate (interactive)
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
# Test renewal:
sudo certbot renew --dry-run
```

The `fallout-app.conf` has commented-out HTTPS configuration. Certbot will enable it automatically.

## Troubleshooting

### Check nginx Status
```bash
sudo systemctl status nginx
```

### Check nginx Error Logs
```bash
sudo tail -f /var/log/nginx/fallout-app-error.log
```

### Test Backend Connection
```bash
curl http://localhost:3100/api/health
```

### WebSocket Issues
If WebSocket doesn't work:
1. Check backend is running: `pm2 status fallout-backend`
2. Check backend WebSocket: `wscat -c ws://localhost:3100/ws?token=TEST`
3. Check nginx WebSocket proxy config (should have `Upgrade` headers)
4. Check browser DevTools → Network → WS

### 502 Bad Gateway
- Backend not running: `pm2 start backend/dist/server.js --name fallout-backend`
- Backend crashed: `pm2 logs fallout-backend`
- Port 3100 already in use: `netstat -tlnp | grep 3100`

### 404 on Frontend Routes
- Missing `try_files` directive in nginx config
- Should have: `try_files $uri $uri/ /index.html;`

## Port Configuration

- **3100**: Backend API + WebSocket (proxied by nginx)
- **80**: HTTP (nginx)
- **443**: HTTPS (nginx, after SSL setup)
- **5432**: PostgreSQL (localhost only, not exposed)

## Firewall

Only these ports should be open to the internet:
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

Port 3100 should NOT be accessible from outside (nginx proxies to it).

## Multiple Domains

If running multiple apps on the same server:

```nginx
# /etc/nginx/sites-available/fallout-app.conf
server {
    server_name fallout.your-domain.com;
    # ... fallout app config
}

# /etc/nginx/sites-available/other-app.conf
server {
    server_name other.your-domain.com;
    # ... other app config
}
```

## Performance Tuning

### Enable Gzip Compression
Add to `fallout-app.conf`:
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
gzip_min_length 1000;
```

### Cache Static Files
Already configured in `fallout-app.conf`:
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## Monitoring

### Check Access Logs
```bash
sudo tail -f /var/log/nginx/fallout-app-access.log
```

### Check Error Logs
```bash
sudo tail -f /var/log/nginx/fallout-app-error.log
```

### Monitor Backend
```bash
pm2 monit
```

## Backup nginx Config

```bash
sudo cp /etc/nginx/sites-available/fallout-app.conf ~/fallout-app.conf.backup
```

## Related Files

- Backend: `/var/www/fallout_offline_char_mngt/backend/`
- Frontend: `/var/www/fallout-char-manager/`
- PM2 Config: `pm2 list`
- PostgreSQL: `docker-compose -f docker-compose.prod.yml ps`
