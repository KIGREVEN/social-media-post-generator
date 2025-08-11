# Social Media Post Generator

Ein vollständiges SaaS-Tool zur automatischen Generierung professioneller Social Media Posts mit KI-Unterstützung.

## Features

- 🤖 **KI-gestützte Post-Generierung** mit OpenAI ChatGPT und DALL-E
- 📱 **Multi-Platform Publishing** (LinkedIn, Facebook, Twitter, Instagram)
- 👥 **Benutzer- und Rollenverwaltung** mit Admin-Dashboard
- 📊 **Nutzungsstatistiken** und monatliche Limits
- 🔐 **OAuth-Integration** für Social Media Plattformen
- 📱 **Responsive Design** für alle Geräte

## Technologie-Stack

### Backend
- **Flask** - Python Web Framework
- **PostgreSQL** - Datenbank
- **SQLAlchemy** - ORM
- **Flask-JWT-Extended** - Authentifizierung
- **OpenAI API** - KI-Integration
- **OAuth 2.0** - Social Media Integration

### Frontend
- **React** - UI Framework
- **TypeScript** - Typisierung
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI-Komponenten
- **React Router** - Navigation
- **Vite** - Build Tool

## Projektstruktur

```
social-media-post-generator/
├── backend/                 # Flask Backend
│   ├── src/
│   │   ├── models/         # Datenbank-Modelle
│   │   ├── routes/         # API-Endpunkte
│   │   ├── services/       # Business Logic
│   │   ├── config.py       # Konfiguration
│   │   └── main.py         # Hauptanwendung
│   ├── requirements.txt    # Python Dependencies
│   ├── .env.example       # Umgebungsvariablen Beispiel
│   └── Procfile           # Deployment Konfiguration
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── components/     # React Komponenten
│   │   ├── pages/          # Seiten
│   │   ├── contexts/       # React Contexts
│   │   └── App.jsx         # Hauptkomponente
│   ├── package.json        # Node Dependencies
│   └── .env.example       # Umgebungsvariablen Beispiel
└── render.yaml            # Render.com Deployment
```

## Installation und Setup

### Voraussetzungen
- Python 3.8+
- Node.js 16+
- PostgreSQL
- OpenAI API Key

### Backend Setup

1. **Repository klonen**
   ```bash
   git clone <repository-url>
   cd social-media-post-generator/backend
   ```

2. **Virtual Environment erstellen**
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   # oder
   venv\Scripts\activate     # Windows
   ```

3. **Dependencies installieren**
   ```bash
   pip install -r requirements.txt
   ```

4. **Umgebungsvariablen konfigurieren**
   ```bash
   cp .env.example .env
   # .env Datei mit Ihren API-Keys und Datenbank-Credentials bearbeiten
   ```

5. **Datenbank initialisieren**
   ```bash
   flask db init
   flask db migrate -m "Initial migration"
   flask db upgrade
   ```

6. **Backend starten**
   ```bash
   python src/main.py
   ```

### Frontend Setup

1. **Frontend-Verzeichnis wechseln**
   ```bash
   cd ../frontend
   ```

2. **Dependencies installieren**
   ```bash
   npm install
   ```

3. **Umgebungsvariablen konfigurieren**
   ```bash
   cp .env.example .env
   # .env Datei mit Backend-URL bearbeiten
   ```

4. **Frontend starten**
   ```bash
   npm run dev
   ```

## Deployment auf Render.com

### Automatisches Deployment

1. **Repository auf GitHub pushen**
2. **Render.com Account erstellen**
3. **Blueprint verwenden**
   - "New" → "Blueprint" auswählen
   - Repository verbinden
   - `render.yaml` wird automatisch erkannt

### Manuelle Konfiguration

#### Backend Service
- **Type**: Web Service
- **Environment**: Python
- **Build Command**: `cd backend && pip install -r requirements.txt`
- **Start Command**: `cd backend && gunicorn --bind 0.0.0.0:$PORT src.main:app`

#### Frontend Service
- **Type**: Static Site
- **Build Command**: `cd frontend && npm install && npm run build`
- **Publish Directory**: `frontend/dist`

#### Datenbank
- **Type**: PostgreSQL
- **Name**: `social-media-post-generator-db`

### Umgebungsvariablen

Folgende Umgebungsvariablen müssen in Render.com konfiguriert werden:

#### Backend
- `SECRET_KEY` - Flask Secret Key
- `JWT_SECRET_KEY` - JWT Secret Key
- `DATABASE_URL` - PostgreSQL Connection String (automatisch)
- `OPENAI_API_KEY` - OpenAI API Key
- `LINKEDIN_CLIENT_ID` - LinkedIn OAuth Client ID
- `LINKEDIN_CLIENT_SECRET` - LinkedIn OAuth Client Secret
- `FACEBOOK_APP_ID` - Facebook App ID
- `FACEBOOK_APP_SECRET` - Facebook App Secret
- `TWITTER_CLIENT_ID` - Twitter Client ID
- `TWITTER_CLIENT_SECRET` - Twitter Client Secret
- `INSTAGRAM_CLIENT_ID` - Instagram Client ID
- `INSTAGRAM_CLIENT_SECRET` - Instagram Client Secret

#### Frontend
- `VITE_API_URL` - Backend URL (z.B. `https://your-backend.onrender.com`)

## API-Dokumentation

### Authentifizierung
- `POST /api/auth/register` - Benutzer registrieren
- `POST /api/auth/login` - Benutzer anmelden
- `GET /api/auth/profile` - Benutzerprofil abrufen

### Posts
- `POST /api/posts/generate` - Post generieren
- `GET /api/posts` - Posts abrufen
- `GET /api/posts/{id}` - Einzelnen Post abrufen
- `PUT /api/posts/{id}` - Post bearbeiten
- `DELETE /api/posts/{id}` - Post löschen
- `POST /api/posts/{id}/publish` - Post veröffentlichen

### Social Media
- `GET /api/social/accounts` - Verbundene Accounts abrufen
- `GET /api/social/connect/{platform}` - OAuth-Flow starten
- `GET /api/social/callback/{platform}` - OAuth-Callback
- `DELETE /api/social/disconnect/{platform}` - Account trennen
- `POST /api/social/publish` - Direkt veröffentlichen

### Admin
- `GET /api/admin/users` - Alle Benutzer abrufen
- `PUT /api/admin/users/{id}` - Benutzer bearbeiten
- `DELETE /api/admin/users/{id}` - Benutzer löschen
- `GET /api/admin/stats` - System-Statistiken

## Entwicklung

### Backend Tests
```bash
cd backend
python -m pytest tests/
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Code-Qualität
```bash
# Backend
cd backend
flake8 src/
black src/

# Frontend
cd frontend
npm run lint
npm run format
```

## Lizenz

MIT License - siehe [LICENSE](LICENSE) Datei für Details.

## Support

Bei Fragen oder Problemen erstellen Sie bitte ein Issue im GitHub Repository.

## Mitwirken

1. Fork des Repositories
2. Feature Branch erstellen (`git checkout -b feature/AmazingFeature`)
3. Änderungen committen (`git commit -m 'Add some AmazingFeature'`)
4. Branch pushen (`git push origin feature/AmazingFeature`)
5. Pull Request erstellen

## Changelog

### Version 1.0.0
- Initiale Veröffentlichung
- KI-gestützte Post-Generierung
- Multi-Platform Social Media Integration
- Benutzer- und Rollenverwaltung
- Responsive Web-Interface

