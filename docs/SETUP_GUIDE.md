# Setup Guide - Fallout Character Manager

## Aktueller Implementierungsstand

### ✅ Komplett implementiert

**Backend (100%)**:
- ✅ PostgreSQL-Schema mit allen Tabellen
- ✅ Authentication (JWT + bcrypt)
- ✅ RBAC Middleware (Player/GM/Admin)
- ✅ Character Import & Validation
- ✅ Diff/Merge System für Re-Imports
- ✅ Change Log System
- ✅ WebSocket für Echtzeit-Updates
- ✅ Alle API-Endpunkte (Auth, Characters, ChangeLogs, Users)
- ✅ Express Server (Port 3100)

**Frontend Grundgerüst (60%)**:
- ✅ Projekt-Setup (React + TypeScript + Vite)
- ✅ Tailwind CSS (Mobile-First)
- ✅ API-Service-Client
- ✅ WebSocket-Service
- ✅ Zustand Store (State Management)
- ✅ App-Routing
- ✅ Layout-Komponente

### 🚧 Noch zu implementieren

**Frontend - Fehlende Komponenten**:
- ⏳ LoginPage
- ⏳ DashboardPage (Character-Liste)
- ⏳ CharacterPage (Detail-Ansicht & Editor)
- ⏳ ImportModal (File-Upload & Merge-Dialog)
- ⏳ UsersPage (Admin-Bereich)

**Deployment**:
- ⏳ nginx-Konfiguration
- ⏳ PM2/systemd Service-Dateien

## Schnellstart

### 1. Datenbank einrichten

```bash
# PostgreSQL-Datenbank erstellen
createdb fallout_char_manager

# Schema importieren
psql -d fallout_char_manager -f database/schema.sql
```

**Standard Admin-Zugang**:
- Username: `admin`
- Password: `admin123` (SOFORT ÄNDERN!)

### 2. Backend starten

```bash
cd backend
npm install
cp .env.example .env

# .env bearbeiten und DB-Credentials eintragen
nano .env

# Development
npm run dev

# Production
npm run build
npm start
```

Backend läuft auf: `http://localhost:3100`

### 3. Frontend starten

```bash
cd frontend
npm install
cp .env.example .env

# Development (mit Vite Dev Server)
npm run dev

# Production Build
npm run build
```

Frontend Dev-Server: `http://localhost:5173`

## Nächste Schritte für die Fertigstellung

### Phase 1: Frontend Pages erstellen

**Dateien zu erstellen**:

```
frontend/src/pages/
├── LoginPage.tsx         # Login-Formular
├── DashboardPage.tsx     # Character-Liste + Import-Button
├── CharacterPage.tsx     # Character-Detail mit Tabs
└── UsersPage.tsx         # User-Management (Admin)
```

**Empfohlene Komponenten**:

```
frontend/src/components/
├── CharacterCard.tsx           # Character-Karte für Liste
├── CharacterViewer.tsx         # Character-Anzeige
├── CharacterEditor.tsx         # Inline-Editor für Werte
├── ImportModal.tsx             # Import & Merge-Dialog
├── ChangeLogViewer.tsx         # Change-Log-Anzeige
├── SPECIALAttributes.tsx       # S.P.E.C.I.A.L.-Editor
├── HealthStatus.tsx            # Health & Conditions
├── BodyParts.tsx               # Injury Tracking
└── InventoryViewer.tsx         # Items & Equipment
```

### Phase 2: LoginPage Beispiel-Implementierung

```tsx
// frontend/src/pages/LoginPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../services/store';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-wasteland-100 px-4">
      <div className="card w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-vault-600">Vault-Tec</h1>
          <p className="text-wasteland-600 mt-2">Character Manager</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Username</label>
            <input
              type="text"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

### Phase 3: DashboardPage Beispiel

```tsx
// frontend/src/pages/DashboardPage.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../services/store';
import { Upload, Plus } from 'lucide-react';

export default function DashboardPage() {
  const { characters, isLoadingCharacters, loadCharacters } = useStore();
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    loadCharacters();
  }, [loadCharacters]);

  if (isLoadingCharacters) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">My Characters</h1>
        <button
          onClick={() => setShowImport(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Upload size={18} />
          <span className="hidden sm:inline">Import Character</span>
          <span className="sm:hidden">Import</span>
        </button>
      </div>

      {characters.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-wasteland-600 mb-4">No characters yet</p>
          <button onClick={() => setShowImport(true)} className="btn-primary">
            Import your first character
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {characters.map((character) => (
            <Link
              key={character.id}
              to={`/characters/${character.id}`}
              className="card hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start space-x-4">
                {character.json_data.img && (
                  <img
                    src={character.json_data.img}
                    alt={character.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{character.name}</h3>
                  <p className="text-sm text-wasteland-600">
                    Level {character.json_data.system.level.value}
                  </p>
                  <p className="text-xs text-wasteland-500 mt-1">
                    {new Date(character.last_modified).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Import Modal würde hier gerendert werden */}
    </div>
  );
}
```

## nginx-Konfiguration

Erstelle `/etc/nginx/sites-available/fallout-app.conf`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend (React Build)
    location / {
        root /var/www/fallout-char-manager;
        try_files $uri $uri/ /index.html;
    }

    # API Backend
    location /api {
        proxy_pass http://localhost:3100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket
    location /ws {
        proxy_pass http://localhost:3100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Production Deployment

### Backend mit PM2

```bash
# PM2 global installieren
npm install -g pm2

# Backend starten
cd backend
npm run build
pm2 start dist/server.js --name fallout-backend

# PM2 beim Systemstart
pm2 startup
pm2 save
```

### Frontend Build

```bash
cd frontend
npm run build

# Build nach nginx-Verzeichnis kopieren
sudo mkdir -p /var/www/fallout-char-manager
sudo cp -r dist/* /var/www/fallout-char-manager/
```

## Sicherheits-Checkliste

- [ ] Standard-Admin-Passwort ändern
- [ ] JWT_SECRET in `.env` ändern
- [ ] PostgreSQL-Passwort sichern
- [ ] nginx mit HTTPS/SSL konfigurieren (Let's Encrypt)
- [ ] Firewall-Regeln setzen (nur 80/443 öffnen)
- [ ] CORS_ORIGIN auf Production-Domain setzen

## Troubleshooting

### Backend startet nicht
- Prüfe PostgreSQL-Verbindung: `psql -d fallout_char_manager`
- Prüfe `.env`-Datei
- Logs: `npm run dev` oder `pm2 logs fallout-backend`

### WebSocket verbindet nicht
- Prüfe nginx WebSocket-Konfiguration
- Teste direkt: `wscat -c ws://localhost:3100/ws?token=YOUR_TOKEN`

### Frontend kann nicht auf API zugreifen
- Prüfe CORS-Einstellungen in Backend
- Prüfe nginx Proxy-Konfiguration
- Browser DevTools → Network Tab

## Support

Bei Problemen siehe:
- [README.md](../README.md) - Hauptdokumentation
- [CLAUDE.md](../CLAUDE.md) - Technische Details
- GitHub Issues
