# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Full-stack web application for managing Fallout TTRPG characters exported from FoundryVTT. Allows players and game masters to import, view, edit, and track character changes in real-time.

**Tech Stack:**
- Backend: Node.js + Express + TypeScript (Port 3100)
- Frontend: React 18 + TypeScript + Vite
- Database: PostgreSQL
- Real-time: WebSockets
- Styling: Tailwind CSS (Mobile-First)

## Repository Structure

```
fallout_offline_char_mngt/
├── backend/                 # Node.js Backend
│   ├── src/
│   │   ├── config/         # Database & App Configuration
│   │   ├── controllers/    # Route Handlers (Auth, Character, ChangeLog, User)
│   │   ├── middleware/     # Auth (JWT), RBAC (Role-Based Access)
│   │   ├── models/         # Database Models (User, Character, ChangeLog)
│   │   ├── routes/         # API Routes (/auth, /characters, /changelogs, /users)
│   │   ├── services/       # Business Logic (Auth, Character, Diff, WebSocket)
│   │   ├── types/          # TypeScript Type Definitions
│   │   └── server.ts       # Express Server Entry Point
│   ├── package.json
│   ├── tsconfig.json
│   └── .env                # Environment Variables (NOT in Git)
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── components/     # React Components (Layout, etc.)
│   │   ├── pages/          # Pages (Login, Dashboard, Character, Users)
│   │   ├── services/       # API Client, WebSocket, Zustand Store
│   │   ├── styles/         # Tailwind CSS
│   │   └── types/          # TypeScript Types
│   ├── package.json
│   ├── vite.config.ts
│   └── .env                # Vite Environment Variables (NOT in Git)
├── database/
│   └── schema.sql          # PostgreSQL Database Schema
├── nginx/
│   ├── fallout-app.conf    # nginx Config for Production Server
│   └── README.md
├── docs/
│   └── SETUP_GUIDE.md      # Detailed Setup Instructions
├── chars/                  # Example FVTT Character JSON Files
├── docker-compose.dev.yml  # Docker for Local Development (PostgreSQL)
├── docker-compose.prod.yml # Docker for Production Server
├── deploy.sh               # Deployment Script
├── .gitignore
├── README.md
└── CLAUDE.md               # This file
```

## Development Setup

### Local Development Environment

**Requirements:**
- Node.js >= 18.x
- Docker Desktop (for PostgreSQL)
- Git

**Architecture:**
```
Local Machine:
├── PostgreSQL → Docker Container (Port 5432)
├── Backend → npm run dev (Port 3100)
└── Frontend → npm run dev (Port 5173)
   └── Vite Dev Server proxies /api → localhost:3100
```

**No nginx needed locally!** Vite handles API proxying automatically.

### Quick Start

1. **Start PostgreSQL:**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **Backend:**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with DB credentials
   npm run dev
   ```

3. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access:** http://localhost:5173
   - Default login: `admin` / `admin123`

### Database Management

```bash
# Start DB
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f postgres

# Stop DB
docker-compose -f docker-compose.dev.yml stop

# Reset DB (delete all data)
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d
```

## Production Deployment

### Deployment Strategy: Traditional Git-Pull

**Server Architecture:**
```
Production Server:
├── nginx → Reverse Proxy (Native, Ports 80/443)
│   ├── / → Frontend Static Files
│   ├── /api → Backend (localhost:3100)
│   └── /ws → WebSocket (localhost:3100)
├── PostgreSQL → Docker or Native
├── Backend → PM2 Process Manager (Node.js)
└── Frontend → Static Build in /var/www/fallout-char-manager/
```

**Why This Setup:**
- nginx already installed (serves FVTT instances on ports 3000-3005)
- PostgreSQL isolated in Docker (easy backup/restore)
- Backend as PM2 process (auto-restart, logging)
- Frontend as static files (fastest serving)
- Simple manual deployment (git pull + restart)

### Deployment Workflow

**Step 1: On Server - Initial Setup**
```bash
# Clone repository
cd /var/www/
git clone https://github.com/hnsstrk/fallout_offline_char_mngt.git
cd fallout_offline_char_mngt

# Setup PostgreSQL
docker-compose -f docker-compose.prod.yml up -d postgres

# Setup Backend
cd backend
npm install
npm run build
pm2 start dist/server.js --name fallout-backend
pm2 save

# Setup Frontend
cd ../frontend
npm install
npm run build
cp -r dist/* /var/www/fallout-char-manager/

# Configure nginx (see nginx/fallout-app.conf)
sudo cp nginx/fallout-app.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/fallout-app.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**Step 2: Updates (Git-Pull Deployment)**
```bash
# On server
cd /var/www/fallout_offline_char_mngt

# Pull latest code
git pull

# Update Backend
cd backend
npm install
npm run build
pm2 restart fallout-backend

# Update Frontend
cd ../frontend
npm install
npm run build
sudo cp -r dist/* /var/www/fallout-char-manager/

# Reload nginx
sudo systemctl reload nginx
```

**Step 3: Automated with deploy.sh**
```bash
# On server, run deployment script
./deploy.sh
```

### Environment Configuration

**Backend (.env):**
```env
PORT=3100
NODE_ENV=production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fallout_char_manager
DB_USER=fallout_prod
DB_PASSWORD=CHANGE_THIS_SECURE_PASSWORD
JWT_SECRET=CHANGE_THIS_TO_RANDOM_SECRET
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://your-domain.com
```

**Frontend (.env):**
```env
VITE_API_URL=/api
VITE_WS_URL=wss://your-domain.com/ws
```

## Key Architecture Decisions

### Port Allocation
- **3000-3005**: Reserved for FVTT instances (existing)
- **3100**: Fallout Character Manager Backend
- **5432**: PostgreSQL (Docker, not exposed externally)
- **80/443**: nginx (HTTPS recommended)

### Authentication & Authorization
- **JWT Tokens** stored in localStorage
- **3 Roles**: Player (own characters), GM (all characters), Admin (user management)
- **Sessions tracked** in PostgreSQL for token revocation
- **bcrypt** for password hashing (10 rounds)

### Real-time Updates
- **WebSockets** for live character updates
- Clients join character "rooms"
- Updates broadcast to all viewers of a character
- Auto-reconnect on disconnect

### Character Import & Merge
- **FVTT JSON Validation** on import
- **Diff/Merge System** for re-imports
- Conflict resolution: User-editable fields (HP, Conditions) vs System fields (Name, Items)
- **Change Log** auto-clears on merge (assumes FVTT is source of truth)

### Change Tracking
- **Every edit logged**: field path, old value, new value, user, timestamp
- Used to sync changes back to FVTT manually
- Export as CSV for offline tracking

## Common Development Tasks

### Running Tests
```bash
# Backend (when implemented)
cd backend && npm test

# Frontend (when implemented)
cd frontend && npm test
```

### Building for Production
```bash
# Backend
cd backend && npm run build

# Frontend
cd frontend && npm run build
```

### Database Migrations
Currently manual via schema.sql. For schema changes:
1. Update `database/schema.sql`
2. Test locally
3. On production: backup, apply changes, verify

### Adding New API Endpoints
1. Define route in `backend/src/routes/`
2. Create controller in `backend/src/controllers/`
3. Add business logic to `backend/src/services/`
4. Update types in `backend/src/types/`
5. Add frontend API call in `frontend/src/services/api.ts`

### Adding New Frontend Pages
1. Create page in `frontend/src/pages/`
2. Add route in `frontend/src/App.tsx`
3. Update navigation in `frontend/src/components/Layout.tsx`

## Security Considerations

- **JWT_SECRET**: Must be changed in production (random 64+ char string)
- **Default Admin Password**: Change immediately after first login
- **CORS**: Set to specific domain in production
- **HTTPS**: Required for production (Let's Encrypt recommended)
- **Database Password**: Strong password for production
- **Rate Limiting**: Implemented (100 requests per 15 minutes)
- **Helmet.js**: Security headers enabled
- **SQL Injection**: Parameterized queries throughout

## Backup & Recovery

### Database Backup
```bash
# Backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U fallout_prod fallout_char_manager > backup-$(date +%Y%m%d).sql

# Restore
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U fallout_prod fallout_char_manager < backup-20250122.sql
```

### Full Backup
```bash
# Backup uploaded character files (if any)
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz backend/uploads/

# Backup database (see above)
# Code is in Git (just git pull to restore)
```

## Troubleshooting

### Backend won't start
```bash
# Check PostgreSQL
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs postgres

# Check PM2 logs
pm2 logs fallout-backend

# Check .env file
cat backend/.env
```

### Frontend shows 404 on API calls
- Check CORS settings in backend/.env
- Check nginx proxy configuration
- Verify backend is running: `curl http://localhost:3100/api/health`

### WebSocket won't connect
- Check nginx WebSocket proxy config
- Verify backend WebSocket path: `/ws`
- Check browser console for errors

### Database connection errors
```bash
# Test database connection
docker-compose -f docker-compose.prod.yml exec postgres psql -U fallout_prod -d fallout_char_manager -c "SELECT NOW();"
```

## Future Enhancements (Not Yet Implemented)

- [ ] Import Modal with drag & drop
- [ ] Merge Dialog with visual diff
- [ ] Inline character editing
- [ ] Change Log export (CSV/PDF)
- [ ] User Management interface
- [ ] Automated testing (Jest/Vitest)
- [ ] GitHub Actions CI/CD
- [ ] Character sharing between players
- [ ] Backup/restore via UI

## License

MIT License - Copyright (c) 2025 Hans Stark

## Support

- GitHub Issues: https://github.com/hnsstrk/fallout_offline_char_mngt/issues
- Documentation: See README.md and docs/SETUP_GUIDE.md
