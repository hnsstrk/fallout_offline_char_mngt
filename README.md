# Fallout TTRPG Character Manager

Eine moderne Webanwendung zur Verwaltung von Fallout TTRPG Charakteren aus FoundryVTT. Die Anwendung ermöglicht es Spielern und Spielleitern, ihre Charaktere zu importieren, anzuzeigen, zu bearbeiten und in Echtzeit zu synchronisieren.

## Features

### Kern-Funktionalität
- **Character Import**: Importiere FVTT-Charaktere als JSON mit Validierung
- **Diff & Merge**: Bei erneutem Import werden Änderungen erkannt und gemergt
- **Live Updates**: Echtzeit-Synchronisation via WebSockets
- **Change Log**: Vollständiges Protokoll aller Charakteränderungen
- **Mobile-First**: Optimiert für Tablets und Smartphones

### Benutzer-Rollen
- **Spieler**: Zugriff auf eigene Charaktere
- **Spielleiter (GM)**: Zugriff auf alle Charaktere der Kampagne
- **Administrator**: Benutzerverwaltung und voller Systemzugriff

### Charakter-Verwaltung
- **S.P.E.C.I.A.L.** Attribute bearbeiten
- **Health & Combat** Stats anpassen
- **Conditions** verfolgen (Hunger, Durst, Schlaf, Radiation)
- **Body Parts** Verletzungen dokumentieren
- **Inventory** & Equipment verwalten
- **Currency** & Materials tracken
- **Skills** & Perks anzeigen

## Technologie-Stack

### Backend
- Node.js + Express + TypeScript
- PostgreSQL (JSONB für Character-Daten)
- JWT Authentication + bcrypt
- WebSockets (ws) für Echtzeit-Updates
- Multer für File-Uploads

### Frontend
- React 18 + TypeScript
- Vite (Build-Tool)
- Tailwind CSS (Mobile-First Design)
- Socket.io-Client
- Zustand (State Management)
- Axios (HTTP Client)

## Installation

### Voraussetzungen
- Node.js >= 18.x
- PostgreSQL >= 13.x
- nginx (für Production)

### 1. Repository klonen
```bash
git clone <repository-url>
cd fallout_offline_char_mngt
```

### 2. Datenbank einrichten
```bash
# PostgreSQL-Datenbank erstellen
createdb fallout_char_manager

# Schema importieren
psql -d fallout_char_manager -f database/schema.sql
```

### 3. Backend einrichten
```bash
cd backend
npm install

# .env Datei erstellen
cp .env.example .env
# Bearbeite .env und füge deine DB-Credentials ein

# Entwicklung
npm run dev

# Production Build
npm run build
npm start
```

### 4. Frontend einrichten
```bash
cd frontend
npm install

# Entwicklung
npm run dev

# Production Build
npm run build
```

## Konfiguration

### Backend (.env)
```env
PORT=3100                    # Port für Backend (3000-3005 für FVTT reserviert)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fallout_char_manager
DB_USER=your_db_user
DB_PASSWORD=your_db_password
JWT_SECRET=your-secret-key   # ÄNDERN in Production!
CORS_ORIGIN=http://localhost:5173
```

### Standard-Benutzer
- **Username**: admin
- **Password**: admin123 (SOFORT ÄNDERN nach Installation!)

## Entwicklung

### Backend starten
```bash
cd backend
npm run dev  # Läuft auf Port 3100
```

### Frontend starten
```bash
cd frontend
npm run dev  # Läuft auf Port 5173
```

Die Frontend-Dev-Server proxied API-Requests automatisch an `http://localhost:3100`.

## Deployment mit nginx

Siehe [nginx/fallout-app.conf](nginx/fallout-app.conf) für eine Beispiel-Konfiguration.

### Reverse Proxy Setup
```nginx
# Backend (API + WebSockets)
location /api {
    proxy_pass http://localhost:3100;
}

location /socket.io {
    proxy_pass http://localhost:3100;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}

# Frontend (Static Files)
location / {
    root /var/www/fallout-char-manager;
    try_files $uri $uri/ /index.html;
}
```

## Projekt-Struktur

```
fallout_offline_char_mngt/
├── backend/                 # Node.js Backend
│   ├── src/
│   │   ├── config/         # Konfiguration & DB-Connection
│   │   ├── controllers/    # Route-Handler
│   │   ├── middleware/     # Auth, RBAC, etc.
│   │   ├── models/         # Datenbank-Models
│   │   ├── routes/         # API-Routes
│   │   ├── services/       # Business-Logic
│   │   ├── types/          # TypeScript-Typen
│   │   └── server.ts       # Express-Server
│   └── package.json
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── components/    # React-Komponenten
│   │   ├── pages/         # Seiten
│   │   ├── services/      # API-Clients
│   │   ├── hooks/         # Custom Hooks
│   │   └── types/         # TypeScript-Typen
│   └── package.json
├── database/              # DB-Schema & Migrationen
│   └── schema.sql
├── nginx/                 # nginx-Konfiguration
│   └── fallout-app.conf
├── chars/                 # Beispiel-Charaktere (JSON)
└── docs/                  # Dokumentation
```

## Nutzung

### 1. Charakter importieren
1. Exportiere deinen Charakter aus FVTT als JSON
2. Login in die Webapp
3. Navigiere zu "Import Character"
4. Wähle die JSON-Datei aus oder ziehe sie per Drag & Drop

### 2. Charakter bearbeiten
1. Öffne den Charakter in der Übersicht
2. Klicke auf die Werte, die du ändern möchtest
3. Änderungen werden automatisch gespeichert
4. Alle Änderungen erscheinen im Change-Log

### 3. Re-Import & Merge
1. Wenn du den Charakter in FVTT weiter bearbeitest
2. Exportiere ihn erneut und importiere ihn in die Webapp
3. Die App zeigt dir einen Diff aller Änderungen
4. Wähle für jeden Konflikt: "Lokale behalten" oder "Importierte nutzen"
5. Nach dem Merge wird das Change-Log zurückgesetzt

### 4. Change-Log exportieren
1. Öffne den Charakter
2. Navigiere zum "Change Log" Tab
3. Klicke "Export CSV" oder "Export PDF"
4. Nutze das Protokoll, um Änderungen in FVTT nachzuvollziehen

## API-Endpunkte

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Aktueller User

### Characters
- `GET /api/characters` - Alle Charaktere (gefiltert nach Rolle)
- `GET /api/characters/:id` - Einzelner Charakter
- `POST /api/characters/import` - Charakter importieren
- `PUT /api/characters/:id` - Charakter bearbeiten
- `DELETE /api/characters/:id` - Charakter löschen
- `POST /api/characters/:id/merge` - Re-Import & Merge

### Change Logs
- `GET /api/changelogs/:characterId` - Change-Logs für Charakter
- `GET /api/changelogs/:characterId/export` - Change-Log exportieren

### Users (Admin only)
- `GET /api/users` - Alle User
- `POST /api/users` - User erstellen
- `PUT /api/users/:id` - User bearbeiten
- `DELETE /api/users/:id` - User löschen

## WebSocket Events

### Client → Server
- `join_character` - Charakter-Room beitreten
- `leave_character` - Charakter-Room verlassen

### Server → Client
- `character_update` - Charakter wurde geändert
- `character_delete` - Charakter wurde gelöscht
- `user_online` - User ist online
- `user_offline` - User ist offline

## Lizenz

MIT License - siehe [LICENSE](LICENSE)

## Autor

Hans Stark

## Support

Bei Fragen oder Problemen bitte ein Issue auf GitHub erstellen.
