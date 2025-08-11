# API-Dokumentation

Social Media Post Generator REST API

## Base URL

```
Production: https://social-media-post-generator-backend.onrender.com
Development: http://localhost:5000
```

## Authentifizierung

Die API verwendet JWT (JSON Web Tokens) für die Authentifizierung.

### Headers

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## Endpunkte

### Authentifizierung

#### POST /api/auth/register

Registriert einen neuen Benutzer.

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "role": "user",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

#### POST /api/auth/login

Meldet einen Benutzer an.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "role": "user"
  },
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

#### GET /api/auth/profile

Ruft das Benutzerprofil ab.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "role": "user",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### Posts

#### POST /api/posts/generate

Generiert einen neuen Social Media Post.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "profile_url": "https://example.com",
  "post_theme": "Neue Produkteinführung",
  "additional_details": "Zusätzliche Informationen...",
  "platform": "linkedin",
  "generate_image": true
}
```

**Response:**
```json
{
  "message": "Post generated successfully",
  "post": {
    "id": 1,
    "title": "Neue Produkteinführung bei Example.com",
    "content": "🚀 Spannende Neuigkeiten von Example.com!\n\nWir freuen uns...",
    "platform": "linkedin",
    "profile_url": "https://example.com",
    "generated_image_url": "https://example.com/generated-image.jpg",
    "created_at": "2024-01-01T00:00:00Z",
    "user_id": 1
  }
}
```

#### GET /api/posts

Ruft alle Posts des Benutzers ab.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (optional): Seitennummer (Standard: 1)
- `per_page` (optional): Posts pro Seite (Standard: 10)
- `platform` (optional): Filter nach Plattform

**Response:**
```json
{
  "posts": [
    {
      "id": 1,
      "title": "Neue Produkteinführung",
      "content": "Post-Inhalt...",
      "platform": "linkedin",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 10,
    "total": 25,
    "pages": 3
  }
}
```

#### GET /api/posts/{id}

Ruft einen spezifischen Post ab.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "post": {
    "id": 1,
    "title": "Neue Produkteinführung",
    "content": "Post-Inhalt...",
    "platform": "linkedin",
    "profile_url": "https://example.com",
    "generated_image_url": "https://example.com/image.jpg",
    "created_at": "2024-01-01T00:00:00Z",
    "user_id": 1
  }
}
```

#### PUT /api/posts/{id}

Bearbeitet einen Post.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "Neuer Titel",
  "content": "Neuer Inhalt..."
}
```

**Response:**
```json
{
  "message": "Post updated successfully",
  "post": {
    "id": 1,
    "title": "Neuer Titel",
    "content": "Neuer Inhalt...",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

#### DELETE /api/posts/{id}

Löscht einen Post.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Post deleted successfully"
}
```

#### GET /api/posts/usage

Ruft Nutzungsstatistiken ab.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "usage": {
    "posts_generated": 5,
    "posts_posted": 3,
    "monthly_limit": 10,
    "current_month": "2024-01",
    "reset_date": "2024-02-01T00:00:00Z"
  }
}
```

### Social Media Integration

#### GET /api/social/accounts

Ruft verbundene Social Media Accounts ab.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "accounts": [
    {
      "id": 1,
      "platform": "linkedin",
      "account_name": "John Doe",
      "account_id": "linkedin_user_123",
      "connected_at": "2024-01-01T00:00:00Z",
      "is_active": true
    }
  ]
}
```

#### GET /api/social/connect/{platform}

Startet OAuth-Flow für eine Plattform.

**Headers:** `Authorization: Bearer <token>`

**Parameters:**
- `platform`: linkedin, facebook, twitter, instagram

**Response:**
```json
{
  "auth_url": "https://linkedin.com/oauth/authorize?client_id=...",
  "state": "random_state_string"
}
```

#### GET /api/social/callback/{platform}

OAuth-Callback-Endpunkt.

**Query Parameters:**
- `code`: OAuth authorization code
- `state`: State parameter

**Response:**
```json
{
  "message": "Account connected successfully",
  "account": {
    "platform": "linkedin",
    "account_name": "John Doe",
    "account_id": "linkedin_user_123"
  }
}
```

#### DELETE /api/social/disconnect/{platform}

Trennt einen Social Media Account.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Account disconnected successfully"
}
```

#### POST /api/social/publish

Veröffentlicht einen Post direkt.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "platform": "linkedin",
  "content": "Post-Inhalt...",
  "image_url": "https://example.com/image.jpg"
}
```

**Response:**
```json
{
  "message": "Post published successfully",
  "post_id": "platform_post_123",
  "post_url": "https://linkedin.com/posts/..."
}
```

### Admin-Endpunkte

#### GET /api/admin/users

Ruft alle Benutzer ab (nur Admin).

**Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "users": [
    {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "role": "user",
      "created_at": "2024-01-01T00:00:00Z",
      "posts_count": 5,
      "last_login": "2024-01-01T12:00:00Z"
    }
  ]
}
```

#### PUT /api/admin/users/{id}

Bearbeitet einen Benutzer (nur Admin).

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "role": "admin",
  "is_active": true
}
```

**Response:**
```json
{
  "message": "User updated successfully",
  "user": {
    "id": 1,
    "username": "testuser",
    "role": "admin",
    "is_active": true
  }
}
```

#### DELETE /api/admin/users/{id}

Löscht einen Benutzer (nur Admin).

**Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "message": "User deleted successfully"
}
```

#### GET /api/admin/stats

Ruft System-Statistiken ab (nur Admin).

**Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "stats": {
    "total_users": 150,
    "active_users": 120,
    "total_posts": 1250,
    "posts_this_month": 300,
    "connected_accounts": 85,
    "api_usage": {
      "openai_requests": 1000,
      "social_media_posts": 450
    }
  }
}
```

## Fehler-Codes

### HTTP Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Unprocessable Entity
- `500` - Internal Server Error

### Fehler-Response Format

```json
{
  "error": "Error message",
  "details": "Detailed error description",
  "code": "ERROR_CODE"
}
```

### Häufige Fehler

#### Authentifizierung

```json
{
  "error": "Token expired",
  "code": "TOKEN_EXPIRED"
}
```

```json
{
  "error": "Invalid credentials",
  "code": "INVALID_CREDENTIALS"
}
```

#### Validierung

```json
{
  "error": "Validation failed",
  "details": {
    "username": ["Username is required"],
    "email": ["Invalid email format"]
  },
  "code": "VALIDATION_ERROR"
}
```

#### Rate Limiting

```json
{
  "error": "Monthly limit exceeded",
  "details": "You have reached your monthly limit of 10 posts",
  "code": "LIMIT_EXCEEDED"
}
```

## Rate Limiting

### Limits

- **Post Generation**: 10 Posts pro Monat (kostenloser Plan)
- **API Requests**: 1000 Requests pro Stunde
- **Social Media Publishing**: 50 Posts pro Tag

### Headers

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Webhooks

### Post Published

Wird ausgelöst, wenn ein Post erfolgreich veröffentlicht wurde.

**Payload:**
```json
{
  "event": "post.published",
  "data": {
    "post_id": 1,
    "platform": "linkedin",
    "user_id": 1,
    "published_at": "2024-01-01T00:00:00Z"
  }
}
```

### User Registered

Wird ausgelöst, wenn sich ein neuer Benutzer registriert.

**Payload:**
```json
{
  "event": "user.registered",
  "data": {
    "user_id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "registered_at": "2024-01-01T00:00:00Z"
  }
}
```

## SDKs und Libraries

### JavaScript/TypeScript

```javascript
import { SocialMediaPostGenerator } from 'social-media-post-generator-sdk';

const client = new SocialMediaPostGenerator({
  apiUrl: 'https://your-api.onrender.com',
  apiKey: 'your-jwt-token'
});

// Post generieren
const post = await client.posts.generate({
  profileUrl: 'https://example.com',
  postTheme: 'Produkteinführung',
  platform: 'linkedin'
});
```

### Python

```python
from social_media_post_generator import Client

client = Client(
    api_url='https://your-api.onrender.com',
    api_key='your-jwt-token'
)

# Post generieren
post = client.posts.generate(
    profile_url='https://example.com',
    post_theme='Produkteinführung',
    platform='linkedin'
)
```

## Beispiele

### Vollständiger Workflow

```javascript
// 1. Benutzer registrieren
const registerResponse = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123'
  })
});

const { token } = await registerResponse.json();

// 2. Post generieren
const postResponse = await fetch('/api/posts/generate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    profile_url: 'https://example.com',
    post_theme: 'Neue Features',
    platform: 'linkedin',
    generate_image: true
  })
});

const { post } = await postResponse.json();

// 3. Post veröffentlichen
const publishResponse = await fetch('/api/social/publish', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    platform: 'linkedin',
    content: post.content,
    image_url: post.generated_image_url
  })
});
```

## Support

Für API-Support und Fragen:
- **Email**: api-support@socialmediapostgenerator.com
- **Documentation**: [docs.socialmediapostgenerator.com](https://docs.socialmediapostgenerator.com)
- **GitHub Issues**: [github.com/username/social-media-post-generator/issues](https://github.com/username/social-media-post-generator/issues)

