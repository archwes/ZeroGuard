# 📚 API DOCUMENTATION

## Base URL

```
Production: https://api.zeroguard.io
Staging: https://staging-api.zeroguard.io
Development: http://localhost:3001
```

## Authentication

All API requests (except `/auth/*`) require a valid JWT token:

```http
Authorization: Bearer <access_token>
```

**Token Lifecycle**:
- Access tokens: 15 minutes
- Refresh tokens: 30 days (httpOnly cookie)

---

## Endpoints

### Authentication

#### POST /auth/register

Register a new user account.

**Request Body**:
```json
{
  "emailHash": "abc123...",
  "salt": "base64_encoded_salt",
  "srpVerifier": "srp_verifier_string",
  "wrappedMEK": "base64_encoded_wrapped_key"
}
```

**Response** (201 Created):
```json
{
  "userId": "uuid-...",
  "message": "Account created successfully"
}
```

**Errors**:
- `400` - Invalid request body
- `409` - Email already registered

---

#### POST /auth/login

Authenticate user (SRP protocol).

**Request Body**:
```json
{
  "emailHash": "abc123...",
  "clientPublic": "srp_client_public",
  "clientProof": "srp_client_proof"
}
```

**Response** (200 OK):
```json
{
  "accessToken": "jwt_token",
  "expiresIn": 900,
  "user": {
    "id": "uuid-...",
    "emailHash": "abc123...",
    "mfaEnabled": false
  }
}
```

**Errors**:
- `401` - Invalid credentials
- `423` - Account locked (too many failed attempts)

---

#### POST /auth/refresh

Refresh access token using refresh token.

**Request** (httpOnly cookie automatically sent):
```http
Cookie: refreshToken=...
```

**Response** (200 OK):
```json
{
  "accessToken": "new_jwt_token",
  "expiresIn": 900
}
```

**Errors**:
- `401` - Invalid or expired refresh token

---

#### POST /auth/logout

Revoke current session.

**Response** (200 OK):
```json
{
  "message": "Logged out successfully"
}
```

---

### Vault Items

#### GET /vault/items

Fetch all vault items for authenticated user.

**Query Parameters**:
- `type` (optional): Filter by item type
- `limit` (optional): Pagination limit (default: 100)
- `offset` (optional): Pagination offset

**Response** (200 OK):
```json
{
  "items": [
    {
      "id": "uuid-...",
      "type": "password",
      "encryptedData": "base64_encoded",
      "encryptedKey": "base64_encoded",
      "nonce": "base64_encoded",
      "authTag": "base64_encoded",
      "encryptedMetadata": "base64_encoded",
      "createdAt": "2026-02-07T12:00:00Z",
      "updatedAt": "2026-02-07T12:00:00Z"
    }
  ],
  "total": 42,
  "hasMore": false
}
```

---

#### GET /vault/items/:id

Fetch a single vault item.

**Response** (200 OK):
```json
{
  "id": "uuid-...",
  "type": "password",
  "encryptedData": "base64_encoded",
  "encryptedKey": "base64_encoded",
  "nonce": "base64_encoded",
  "authTag": "base64_encoded",
  "encryptedMetadata": "base64_encoded",
  "createdAt": "2026-02-07T12:00:00Z",
  "updatedAt": "2026-02-07T12:00:00Z"
}
```

**Errors**:
- `404` - Item not found
- `403` - Not authorized to access this item

---

#### POST /vault/items

Create a new vault item.

**Request Body**:
```json
{
  "type": "password",
  "encryptedData": "base64_encoded",
  "encryptedKey": "base64_encoded",
  "nonce": "base64_encoded",
  "authTag": "base64_encoded",
  "encryptedMetadata": "base64_encoded"
}
```

**Response** (201 Created):
```json
{
  "id": "uuid-...",
  "message": "Vault item created successfully"
}
```

**Errors**:
- `400` - Invalid request body
- `413` - Storage quota exceeded

---

#### PUT /vault/items/:id

Update an existing vault item.

**Request Body**: Same as POST /vault/items

**Response** (200 OK):
```json
{
  "message": "Vault item updated successfully"
}
```

**Errors**:
- `404` - Item not found
- `403` - Not authorized to modify this item

---

#### DELETE /vault/items/:id

Delete a vault item (soft delete).

**Response** (200 OK):
```json
{
  "message": "Vault item deleted successfully"
}
```

**Errors**:
- `404` - Item not found

---

#### GET /vault/stats

Get vault statistics and security metrics.

**Response** (200 OK):
```json
{
  "totalItems": 42,
  "passwordCount": 25,
  "cardCount": 5,
  "noteCount": 8,
  "identityCount": 2,
  "fileCount": 1,
  "totpCount": 1,
  "apiKeyCount": 0,
  "licenseCount": 0,
  "weakPasswords": 3,
  "reusedPasswords": 2,
  "oldPasswords": 5,
  "compromisedPasswords": 0,
  "storageUsed": 1048576,
  "storageLimit": 1073741824,
  "securityScore": 85
}
```

---

### File Upload

#### POST /vault/files

Upload an encrypted file.

**Request** (multipart/form-data):
```
file: <encrypted_binary>
encryptedKey: <base64>
nonce: <base64>
authTag: <base64>
checksum: <sha256_hex>
metadata: <json_string>
```

**Response** (201 Created):
```json
{
  "fileId": "uuid-...",
  "storageKey": "encrypted_filename",
  "message": "File uploaded successfully"
}
```

**Errors**:
- `400` - Invalid file or metadata
- `413` - File too large (> 50MB)
- `507` - Storage quota exceeded

---

#### GET /vault/files/:id

Download an encrypted file.

**Response** (200 OK):
```json
{
  "encryptedData": "base64_encoded",
  "encryptedKey": "base64_encoded",
  "nonce": "base64_encoded",
  "authTag": "base64_encoded",
  "keyNonce": "base64_encoded",
  "keyAuthTag": "base64_encoded",
  "checksum": "sha256_hex",
  "metadata": {
    "fileName": "document.pdf",
    "fileSize": 1024768,
    "mimeType": "application/pdf",
    "lastModified": 1675776000000
  }
}
```

---

#### DELETE /vault/files/:id

Delete a file.

**Response** (200 OK):
```json
{
  "message": "File deleted successfully"
}
```

---

### Account Management

#### GET /account/profile

Get account information.

**Response** (200 OK):
```json
{
  "id": "uuid-...",
  "emailHash": "abc123...",
  "tier": "premium",
  "mfaEnabled": true,
  "storageUsed": 1048576,
  "storageLimit": 10737418240,
  "createdAt": "2026-01-01T00:00:00Z",
  "lastLoginAt": "2026-02-07T12:00:00Z"
}
```

---

#### PUT /account/password

Change master password (re-wrap all item keys).

**Request Body**:
```json
{
  "currentPassword": "current_password_NEVER_SENT",
  "newSalt": "base64_encoded",
  "newSRPVerifier": "new_verifier",
  "newWrappedMEK": "base64_encoded",
  "reWrappedItems": [
    {
      "id": "uuid-...",
      "encryptedKey": "base64_encoded",
      "nonce": "base64_encoded",
      "authTag": "base64_encoded"
    }
  ]
}
```

**Response** (200 OK):
```json
{
  "message": "Master password changed successfully"
}
```

---

#### POST /account/mfa/enable

Enable multi-factor authentication.

**Request Body**:
```json
{
  "totpSecret": "base32_encoded",
  "verificationCode": "123456"
}
```

**Response** (200 OK):
```json
{
  "backupCodes": [
    "ABCD-1234",
    "EFGH-5678",
    ...
  ],
  "message": "MFA enabled successfully"
}
```

---

#### POST /account/mfa/verify

Verify TOTP code during login.

**Request Body**:
```json
{
  "code": "123456"
}
```

**Response** (200 OK):
```json
{
  "verified": true
}
```

**Errors**:
- `401` - Invalid code
- `429` - Too many attempts

---

#### DELETE /account

Delete account (permanent).

**Request Body**:
```json
{
  "confirmation": "DELETE",
  "password": "master_password_proof"
}
```

**Response** (200 OK):
```json
{
  "message": "Account deleted successfully"
}
```

---

### Sessions

#### GET /sessions

List all active sessions.

**Response** (200 OK):
```json
{
  "sessions": [
    {
      "id": "uuid-...",
      "deviceName": "Chrome on MacOS",
      "ipAddress": "203.0.113.45",
      "location": "San Francisco, CA",
      "lastUsed": "2026-02-07T12:00:00Z",
      "current": true
    }
  ]
}
```

---

#### DELETE /sessions/:id

Revoke a specific session.

**Response** (200 OK):
```json
{
  "message": "Session revoked successfully"
}
```

---

#### DELETE /sessions/all

Revoke all sessions except current.

**Response** (200 OK):
```json
{
  "message": "All sessions revoked",
  "count": 3
}
```

---

### Audit Log

#### GET /audit

Retrieve audit log for authenticated user.

**Query Parameters**:
- `limit` (optional): Number of entries (default: 50, max: 1000)
- `offset` (optional): Pagination offset
- `action` (optional): Filter by action type

**Response** (200 OK):
```json
{
  "entries": [
    {
      "id": 123456,
      "action": "login",
      "success": true,
      "ipAddress": "203.0.113.45",
      "userAgent": "Mozilla/5.0...",
      "timestamp": "2026-02-07T12:00:00Z"
    }
  ],
  "total": 142,
  "hasMore": true
}
```

---

## Rate Limiting

**Global Limits**:
- 100 requests per 15 minutes per IP
- 1000 requests per hour per user

**Specific Endpoints**:
- `/auth/login`: 5 attempts per 15 minutes
- `/auth/register`: 3 accounts per hour per IP
- `/account/mfa/verify`: 10 attempts per 5 minutes

**Headers**:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1675776000
```

**Response** (429 Too Many Requests):
```json
{
  "error": "Rate Limit Exceeded",
  "message": "Too many requests, please try again later",
  "retryAfter": 300
}
```

---

## Error Responses

### Standard Error Format

```json
{
  "error": "Error Type",
  "message": "Human-readable error message",
  "details": {
    "field": "email",
    "issue": "Invalid format"
  }
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request (validation error) |
| `401` | Unauthorized (invalid/missing token) |
| `403` | Forbidden (insufficient permissions) |
| `404` | Not Found |
| `409` | Conflict (duplicate resource) |
| `413` | Payload Too Large |
| `422` | Unprocessable Entity |
| `429` | Too Many Requests (rate limit) |
| `500` | Internal Server Error |
| `503` | Service Unavailable |

---

## Webhooks (Future Feature)

### Event Types

- `vault.item.created`
- `vault.item.updated`
- `vault.item.deleted`
- `account.login`
- `account.password_changed`
- `account.mfa_enabled`

### Webhook Payload

```json
{
  "event": "vault.item.created",
  "timestamp": "2026-02-07T12:00:00Z",
  "userId": "uuid-...",
  "data": {
    "itemId": "uuid-...",
    "itemType": "password"
  }
}
```

---

**API Version**: v1  
**Last Updated**: 2026-02-07  
**Support**: api-support@zeroguard.io
