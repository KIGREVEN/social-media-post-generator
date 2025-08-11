# Render.com Deployment Anleitung

Da Render.com Blueprint nur Backend Services unterstützt, müssen Frontend und Backend separat deployed werden.

## Schritt 1: Backend Service (über Blueprint)

1. **Render.com Dashboard** → "New" → "Blueprint"
2. **Repository verbinden:** `KIGREVEN/social-media-post-generator`
3. **Blueprint anwenden** - Das Backend wird automatisch deployed

## Schritt 2: Frontend Service (manuell)

1. **Render.com Dashboard** → "New" → "Static Site"
2. **Repository:** `KIGREVEN/social-media-post-generator`
3. **Konfiguration:**
   - **Name:** `social-media-post-generator-frontend`
   - **Branch:** `main`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`

4. **Environment Variables:**
   - `VITE_API_URL`: `https://social-media-post-generator-backend.onrender.com`

## Schritt 3: Environment Variables für Backend

Nach dem Blueprint-Deployment, Backend Service konfigurieren:

### Pflicht-Variablen:
- `OPENAI_API_KEY`: Ihr OpenAI API Key

### Optional (für vollständige Social Media Integration):
- `LINKEDIN_CLIENT_ID`
- `LINKEDIN_CLIENT_SECRET`
- `FACEBOOK_APP_ID`
- `FACEBOOK_APP_SECRET`
- `TWITTER_CLIENT_ID`
- `TWITTER_CLIENT_SECRET`
- `INSTAGRAM_CLIENT_ID`
- `INSTAGRAM_CLIENT_SECRET`

## Schritt 4: URLs nach Deployment

- **Backend API:** `https://social-media-post-generator-backend.onrender.com`
- **Frontend App:** `https://social-media-post-generator-frontend.onrender.com`

## Wichtige Hinweise

1. **Erste Anfrage kann langsam sein** - Render.com Services schlafen nach Inaktivität
2. **Datenbank wird automatisch erstellt** und mit dem Backend verbunden
3. **CORS ist konfiguriert** für Frontend-Backend-Kommunikation
4. **Automatische HTTPS** für beide Services

## Troubleshooting

- **Backend startet nicht:** Überprüfen Sie die Logs und Environment Variables
- **Frontend kann Backend nicht erreichen:** Überprüfen Sie die `VITE_API_URL`
- **Datenbank-Fehler:** Warten Sie, bis die Datenbank vollständig initialisiert ist

