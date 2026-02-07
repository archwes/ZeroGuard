# 🔐 ZeroGuard - Zero-Knowledge Digital Vault

> 🎯 **Primeira vez aqui?** Comece por: [START_HERE.md](./START_HERE.md) - Seu guia de navegação rápida!

## Mission-Critical Security Architecture

A production-grade, zero-knowledge encryption vault for storing passwords, payment cards, secure notes, identity documents, files, API keys, and TOTP secrets.

---

## 📚 Guias Rápidos

| Guia | Descrição | Para quem |
|------|-----------|-----------|
| 🏠 **[LOCAL_SETUP.md](./LOCAL_SETUP.md)** | Setup completo passo a passo | Primeira vez configurando |
| ✅ **[SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md)** | Checklist interativo | Acompanhar progresso |
| ⚡ **[QUICK_START.md](./QUICK_START.md)** | Guia rápido de desenvolvimento | Já tem ambiente configurado |
| 🚀 **[PRODUCTION.md](./PRODUCTION.md)** | Deploy em produção completo | Colocar no ar |
| 📋 **[DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md)** | Checklist de deploy | Deploy step-by-step |
| 🏢 **[HOSTING_COMPARISON.md](./HOSTING_COMPARISON.md)** | Comparação de plataformas | Escolher onde hospedar |
| 🔐 **[AUTHENTICATION.md](./apps/web/AUTHENTICATION.md)** | Sistema de autenticação | Entender auth |
| ❓ **[FAQ.md](./FAQ.md)** | Perguntas frequentes | Respostas rápidas |
| 📖 **[INDEX.md](./INDEX.md)** | Índice completo | Navegação total |

---

### 🎯 Core Security Principles

1. **Zero-Knowledge Architecture**: Server never sees plaintext data
2. **Client-Side Encryption**: All encryption happens in the browser
3. **Defense in Depth**: Multiple security layers
4. **Assume Breach**: Design assuming database compromise
5. **Privacy by Default**: Minimal metadata collection

### 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                      │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  User Master Password (never leaves client)          │  │
│  └───────────────────┬──────────────────────────────────┘  │
│                      │                                      │
│                      ▼                                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Argon2id Key Derivation (high memory cost)         │  │
│  │  → Master Encryption Key (MEK)                      │  │
│  │  → Authentication Key (AK)                          │  │
│  └───────────────────┬──────────────────────────────────┘  │
│                      │                                      │
│                      ▼                                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Per-Item Encryption Keys (wrapped with MEK)        │  │
│  │  AES-256-GCM encryption                             │  │
│  └───────────────────┬──────────────────────────────────┘  │
│                      │                                      │
│                      ▼ (encrypted blobs only)              │
└──────────────────────┼──────────────────────────────────────┘
                       │
                       │ HTTPS + Certificate Pinning
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                      API GATEWAY                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ • Rate Limiting (DDoS protection)                      │ │
│  │ • JWT Validation (short-lived tokens)                 │ │
│  │ • CSP Headers (XSS mitigation)                        │ │
│  │ • Request Signing (integrity verification)            │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION SERVER                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ • Never decrypts data (physically impossible)         │ │
│  │ • Stores encrypted blobs only                         │ │
│  │ • Audit logging (non-PII)                            │ │
│  │ • Breach detection monitoring                        │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATABASE (PostgreSQL)                   │
│                                                              │
│  users_table:                                               │
│    • email_hash (not reversible)                           │
│    • srp_verifier (for auth, not encryption)               │
│    • wrapped_mek (encrypted with password-derived key)     │
│                                                              │
│  vault_items_table:                                         │
│    • user_id (indexed)                                     │
│    • item_type (password|card|note|file|totp)             │
│    • encrypted_data (AES-256-GCM blob)                    │
│    • nonce/iv                                              │
│    • encrypted_item_key (wrapped with MEK)                 │
│    • created_at, updated_at                                │
│                                                              │
│  ⚠️ EVEN WITH FULL DATABASE ACCESS:                         │
│     Attacker cannot decrypt without user's master password  │
└─────────────────────────────────────────────────────────────┘
```

## 🔒 Encryption Lifecycle

### Registration Flow

```
1. User enters master password (min 12 chars, enforced complexity)
2. Generate random salt (32 bytes)
3. Derive keys using Argon2id:
   - iterations: 10
   - memory: 64MB
   - parallelism: 4
   Output: 64-byte key material
   - Bytes 0-31: Master Encryption Key (MEK)
   - Bytes 32-63: Authentication Key (AK)
   
4. Generate SRP verifier from AK (for authentication)
5. Encrypt MEK with password-derived key (for recovery)
6. Send to server:
   - Email hash (HMAC-SHA256)
   - Salt
   - SRP verifier
   - Wrapped MEK
   ❌ Master password NEVER sent
```

### Login Flow (SRP Authentication)

```
1. User enters email + password
2. Request salt from server (using email hash)
3. Derive MEK and AK locally (same Argon2id process)
4. Perform SRP handshake with AK:
   - Server cannot learn password
   - Client cannot be impersonated
   - Mutual authentication
5. On success:
   - Server returns JWT (15min expiry)
   - Client stores MEK in memory only (never persisted)
6. Refresh token stored in httpOnly cookie
```

### Data Encryption Flow

```
FOR EACH VAULT ITEM:

1. Generate random item key (256-bit)
2. Encrypt vault data:
   plaintext → AES-256-GCM(item_key) → ciphertext
   
3. Wrap item key:
   item_key → AES-256-GCM(MEK) → wrapped_key
   
4. Send to server:
   {
     encrypted_data: base64(ciphertext),
     encrypted_key: base64(wrapped_key),
     nonce: base64(nonce),
     auth_tag: base64(tag)
   }

5. Server stores encrypted blob (never has plaintext or MEK)

DECRYPTION (reverse):
1. Fetch encrypted item from server
2. Unwrap item key: AES-256-GCM-DECRYPT(MEK, wrapped_key)
3. Decrypt data: AES-256-GCM-DECRYPT(item_key, ciphertext)
```

## 🛡️ Threat Model & Mitigations

| Threat | Likelihood | Impact | Mitigation |
|--------|-----------|--------|------------|
| **Database Breach** | HIGH | CRITICAL | Zero-knowledge encryption; data useless without password |
| **XSS Attack** | MEDIUM | HIGH | Strict CSP, DOMPurify, Framework XSS protections, input sanitization |
| **MITM** | MEDIUM | HIGH | HTTPS only, HSTS, certificate pinning, TLS 1.3+ |
| **Credential Stuffing** | HIGH | MEDIUM | Rate limiting, CAPTCHA, breach detection, account lockout |
| **Token Theft** | MEDIUM | HIGH | Short-lived JWTs (15min), httpOnly cookies, token rotation |
| **Malicious Extension** | MEDIUM | CRITICAL | Integrity monitoring, Web Crypto API (harder to intercept) |
| **Supply Chain Attack** | LOW | CRITICAL | Dependency pinning, SRI hashes, automated audits, minimal deps |
| **Memory Dump** | LOW | HIGH | No plaintext persistence, clear sensitive data, use SecureString patterns |
| **Phishing** | HIGH | HIGH | Security keys (WebAuthn), email verification, trusted device tracking |
| **Session Fixation** | LOW | MEDIUM | Regenerate session on login, secure cookie flags |

## 📊 Database Schema

```sql
-- Users table (authentication only)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_hash VARCHAR(64) UNIQUE NOT NULL,  -- HMAC-SHA256 of email
    salt BYTEA NOT NULL,                     -- For Argon2id
    srp_verifier TEXT NOT NULL,              -- SRP authentication
    wrapped_mek BYTEA NOT NULL,              -- MEK encrypted with password
    mfa_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Vault items (all encrypted)
CREATE TABLE vault_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    item_type VARCHAR(20) NOT NULL,          -- password|card|note|file|totp|identity
    encrypted_data BYTEA NOT NULL,           -- AES-256-GCM ciphertext
    encrypted_key BYTEA NOT NULL,            -- Item key wrapped with MEK
    nonce BYTEA NOT NULL,                    -- GCM nonce
    auth_tag BYTEA NOT NULL,                 -- GCM authentication tag
    metadata JSONB,                          -- Encrypted metadata (e.g., category, tags)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_user_items (user_id, item_type)
);

-- Audit log (privacy-preserving)
CREATE TABLE audit_log (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,             -- login|logout|create_item|delete_item
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Sessions (for JWT blacklisting)
CREATE TABLE sessions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(64) UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Emergency access / Dead man's switch
CREATE TABLE emergency_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    contact_email_hash VARCHAR(64) NOT NULL,
    waiting_period_days INTEGER DEFAULT 30,
    encrypted_recovery_key BYTEA NOT NULL,   -- Key wrapped for emergency access
    status VARCHAR(20) DEFAULT 'active'
);
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose

### Development Setup

```bash
# Install dependencies
cd apps/web && npm install
cd ../api && npm install

# Start infrastructure
docker-compose up -d

# Run migrations
cd apps/api && npm run migrate

# Start development servers
npm run dev  # Runs both web and API
```

### Environment Variables

```bash
# API (.env)
DATABASE_URL=postgresql://vault:secret@localhost:5432/zeroguard
REDIS_URL=redis://localhost:6379
JWT_SECRET=<use-vault-or-secrets-manager>
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000

# Web (.env)
VITE_API_URL=https://api.zeroguard.io
VITE_ENABLE_ANALYTICS=false
```

## 📁 Project Structure

```
vault/
├── apps/
│   ├── web/                    # React frontend
│   │   ├── src/
│   │   │   ├── crypto/         # Encryption primitives
│   │   │   ├── auth/           # Authentication logic
│   │   │   ├── vault/          # Vault components
│   │   │   ├── components/     # UI components
│   │   │   └── hooks/          # React hooks
│   │   └── package.json
│   │
│   └── api/                    # Fastify backend
│       ├── src/
│       │   ├── routes/         # API endpoints
│       │   ├── middleware/     # Security middleware
│       │   ├── services/       # Business logic
│       │   ├── db/             # Database layer
│       │   └── utils/          # Utilities
│       └── package.json
│
├── packages/
│   ├── shared/                 # Shared types/utils
│   └── crypto/                 # Shared crypto utilities
│
├── infrastructure/
│   ├── docker/
│   ├── k8s/
│   └── terraform/
│
└── docs/
    ├── SECURITY.md
    ├── THREAT_MODEL.md
    └── API.md
```

## 🔐 Security Best Practices Implemented

- ✅ Zero-knowledge encryption (client-side only)
- ✅ Argon2id key derivation (memory-hard)
- ✅ AES-256-GCM authenticated encryption
- ✅ SRP authentication (password never transmitted)
- ✅ Short-lived JWTs (15 minutes)
- ✅ Rate limiting and DDoS protection
- ✅ Strict Content Security Policy
- ✅ HSTS and security headers
- ✅ Input validation and sanitization
- ✅ SQL injection prevention (parameterized queries)
- ✅ Audit logging (privacy-preserving)
- ✅ Automated security scanning (dependabot, snyk)
- ✅ Regular penetration testing
- ✅ Incident response plan

## 📜 Compliance Readiness

- **SOC 2 Type II**: Audit logging, access controls
- **GDPR**: Data portability, right to deletion, data minimization
- **HIPAA**: PHI encryption, audit trails (if storing health records)
- **PCI DSS**: If handling payment cards (encrypted card storage)

## 🧪 Testing Strategy

- Unit tests: 80%+ coverage
- Integration tests: API endpoints
- E2E tests: Critical user flows (Playwright)
- Security tests: OWASP ZAP, Burp Suite
- Penetration testing: Quarterly by external firm
- Crypto audits: Annual review by cryptography experts

## 📈 Monitoring & Observability

- **Performance**: Response times, database queries
- **Security**: Failed login attempts, unusual access patterns
- **Business**: User growth, vault item creation
- **Alerts**: Anomaly detection, breach indicators

## � Quick Start

### Development
```bash
# 1. Instalar dependências
npm install

# 2. Configurar banco de dados
cd apps/api
cp .env.example .env
# Editar .env com suas configurações

# 3. Executar migrations
npm run prisma:migrate:dev

# 4. Iniciar backend
npm run dev

# 5. Iniciar frontend (nova janela)
cd apps/web
npm run dev
```

Acesse: http://localhost:3000

📚 **Documentação:**
- 🏠 **[LOCAL_SETUP.md](./LOCAL_SETUP.md)** - Setup completo passo a passo (recomendado para iniciantes)
- ⚡ **[QUICK_START.md](./QUICK_START.md)** - Guia rápido de desenvolvimento

### Production Deploy

**Documentação Completa:**
- 📖 **[PRODUCTION.md](./PRODUCTION.md)** - Guia completo de configuração
- ✅ **[DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md)** - Checklist passo a passo
- 🔐 **[AUTHENTICATION.md](./apps/web/AUTHENTICATION.md)** - Sistema de autenticação

**Deploy Rápido:**
```powershell
# 1. Gerar secrets
.\scripts\generate-secrets.ps1

# 2. Configurar ambiente
cp apps/api/.env.production.example apps/api/.env.production
cp apps/web/.env.production.example apps/web/.env.production

# 3. Verificar configurações
.\scripts\pre-deploy-check.ps1

# 4. Deploy
vercel --prod  # Frontend
# Backend: usar Render/Railway (ver PRODUCTION.md)
```

**Plataformas Recomendadas:**
- Frontend: Vercel (Free) ou Netlify (Free)
- Backend: Render ($7/mês) ou Railway ($5/mês)
- Database: Supabase (Free) ou Neon (Free)

**Custo Total:** ~$1-27/mês dependendo do plan

---

## �🔄 Backup & Disaster Recovery

- **Database**: Continuous backup with point-in-time recovery
- **Encryption Keys**: Never backed up in plaintext
- **User Data**: Encrypted backup export feature
- **RPO**: < 1 hour
- **RTO**: < 4 hours

## 🌐 Deployment Architecture

```
[CloudFlare] → [Load Balancer] → [API Servers (Auto-scaling)]
                                      ↓
                               [PostgreSQL Primary]
                                      ↓
                            [PostgreSQL Read Replicas]
                                      
[Redis Cluster] ← [Session Management]
[HashiCorp Vault] ← [Secrets Management]
```

## 📞 Security Contact

- **Report vulnerabilities**: security@zeroguard.io
- **PGP Key**: [See SECURITY.md]
- **Bug Bounty**: HackerOne program (coming soon)

---

**License**: MIT (modify for production use)
**Version**: 1.0.0-alpha
**Last Security Audit**: [Date]
