# 🎓 ARCHITECTURE DEEP DIVE

## System Architecture Overview

### High-Level Components

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  React Application (TypeScript)                       │  │
│  │  - UI Components                                      │  │
│  │  - State Management (Zustand)                        │  │
│  │  - API Client (Axios)                                │  │
│  └───────────────────┬───────────────────────────────────┘  │
│                      │                                       │
│  ┌───────────────────▼───────────────────────────────────┐  │
│  │  Cryptography Layer (Web Crypto + @noble)            │  │
│  │  - Key Derivation (Argon2id)                         │  │
│  │  - Encryption/Decryption (AES-256-GCM)               │  │
│  │  - TOTP Generation                                   │  │
│  │  - Password Strength Analysis                        │  │
│  └───────────────────┬───────────────────────────────────┘  │
│                      │                                       │
│                      │ HTTPS (TLS 1.3)                      │
└──────────────────────┼───────────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────────┐
│                      API LAYER                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Fastify Server (Node.js + TypeScript)               │  │
│  │  - Rate Limiting                                      │  │
│  │  - JWT Authentication                                 │  │
│  │  - Request Validation (Zod)                          │  │
│  │  - Security Headers (Helmet)                         │  │
│  └───────────────────┬───────────────────────────────────┘  │
│                      │                                       │
│  ┌───────────────────▼───────────────────────────────────┐  │
│  │  Business Logic                                       │  │
│  │  - Vault Management                                   │  │
│  │  - Session Management                                 │  │
│  │  - Audit Logging                                     │  │
│  └───────────────────┬───────────────────────────────────┘  │
│                      │                                       │
└──────────────────────┼───────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
┌───────▼────────┐            ┌───────▼────────┐
│  PostgreSQL    │            │  Redis Cache   │
│  (Primary DB)  │            │  (Sessions)    │
│                │            │                │
│  - Users       │            │  - Tokens      │
│  - Vault Items │            │  - Rate Limits │
│  - Audit Log   │            │  - Temp Data   │
│  - Sessions    │            └────────────────┘
└───────┬────────┘
        │
        │ Streaming Replication
        │
┌───────▼────────┐
│  PostgreSQL    │
│  Read Replicas │
└────────────────┘
```

---

## Security Architecture

### Encryption Layers

```
USER MASTER PASSWORD (never leaves client)
        ↓
    Argon2id KDF (memory-hard, 64MB, 3 iterations)
        ↓
    ┌────────────────────────────────┐
    │   64 bytes of key material     │
    └───────────┬──────────────── ────┘
                │
        ┌───────┴────────┐
        │                │
        ↓                ↓
    MEK (32B)         AK (32B)
    │                  │
    │                  └──→ SRP Authentication
    │                       (server never learns password)
    │
    ├──→ Wraps Item Keys
    │    (each vault item has unique key)
    │
    └──→ MEK Storage
         - NEVER stored on server
         - NEVER sent over network
         - Kept in memory only
         - Cleared on lock/logout
         - Overwritten before disposal

VAULT ITEM ENCRYPTION:
1. Generate random Item Key (256-bit)
2. Encrypt item data: AES-256-GCM(ItemKey, Data) → Ciphertext
3. Wrap ItemKey: AES-256-GCM(MEK, ItemKey) → WrappedKey
4. Store: {Ciphertext, WrappedKey, Nonce, AuthTag}

DECRYPTION:
1. Fetch encrypted item from server
2. Unwrap ItemKey: AES-256-GCM-DECRYPT(MEK, WrappedKey) → ItemKey
3. Decrypt data: AES-256-GCM-DECRYPT(ItemKey, Ciphertext) → Plaintext
```

### Authentication Flow (SRP Protocol)

```
CLIENT                                          SERVER
  │                                               │
  │  1. Request Salt (email hash)                │
  ├─────────────────────────────────────────────►│
  │                                               │
  │  2. Return Salt                              │
  │◄─────────────────────────────────────────────┤
  │                                               │
  │  3. Derive MEK & AK (Argon2id)               │
  │     MEK = First 32 bytes                     │
  │     AK = Last 32 bytes                       │
  │                                               │
  │  4. SRP Client Computation                   │
  │     - Generate random a                     │
  │     - Compute A = g^a mod N                 │
  │     - Send A                                │
  ├─────────────────────────────────────────────►│
  │                                               │
  │                                               │  5. SRP Server Computation
  │                                               │     - Generate random b
  │                                               │     - Compute B = (kv + g^b) mod N
  │                                               │     - Send B
  │  6. Receive B                                │
  │◄─────────────────────────────────────────────┤
  │                                               │
  │  7. Compute Session Key                      │
  │     u = H(A, B)                              │
  │     S = (B - kg^x)^(a + ux)                  │
  │     K = H(S)                                 │
  │     M1 = H(H(N) xor H(g), H(I), s, A, B, K)  │
  │                                               │
  │  8. Send M1 (client proof)                   │
  ├─────────────────────────────────────────────►│
  │                                               │
  │                                               │  9. Verify M1
  │                                               │     Compute expected M1
  │                                               │     If match, compute M2
  │                                               │     M2 = H(A, M1, K)
  │                                               │
  │ 10. Receive M2 (server proof) + JWT          │
  │◄─────────────────────────────────────────────┤
  │                                               │
  │ 11. Verify M2                                │
  │     Both authenticated!                      │
  │                                               │

SECURITY GUARANTEES:
✓ Password never transmitted
✓ Server cannot impersonate client (doesn't know password)
✓ Client cannot be impersonated without password
✓ Mutual authentication (both sides verify each other)
✓ Resistant to man-in-the-middle
✓ Resistant to replay attacks
✓ Forward secrecy (session keys unique)
```

### Database Encryption Design

```sql
-- What's Stored in Database:
CREATE TABLE vault_items (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    item_type VARCHAR(20),
    
    -- Encrypted payloads (indecipherable without MEK)
    encrypted_data BYTEA NOT NULL,
    encrypted_key BYTEA NOT NULL,     -- Item key wrapped with MEK
    nonce BYTEA NOT NULL,
    auth_tag BYTEA NOT NULL,
    
    -- Encrypted metadata (for client-side search)
    encrypted_metadata BYTEA,
    
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Even with full database access, attacker sees:
{
  "encrypted_data": "7Kx9vPQm2w...random bytes...",
  "encrypted_key": "9Bz3nM5t7...random bytes...",
  "nonce": "aAbBcCdD...",
  "auth_tag": "eEfFgGhH..."
}

-- Cannot decrypt without user's master password!
```

---

## Key Management

### Key Hierarchy

```
Level 0: Master Password (user secret)
    ↓ Argon2id
Level 1: Master Encryption Key (MEK) + Authentication Key (AK)
    ↓ AES-256-GCM
Level 2: Item Keys (unique per vault item)
    ↓ AES-256-GCM
Level 3: Encrypted Data (passwords, cards, notes, files)
```

### Key Rotation

**Master Password Change**:
1. User enters new master password
2. Derive new MEK from new password
3. For each vault item:
   - Unwrap ItemKey with old MEK
   - Re-wrap ItemKey with new MEK
4. Update database (only wrapped keys change)
5. Item data never re-encrypted (efficiency!)

**Item Key Rotation** (future feature):
1. Generate new ItemKey
2. Decrypt data with old ItemKey
3. Encrypt data with new ItemKey
4. Wrap new ItemKey with MEK
5. Update database

---

## Performance Optimizations

### Client-Side

**Web Crypto API**:
- Hardware-accelerated AES
- Native implementation (faster than JS)
- Secure execution context

**Lazy Decryption**:
```javascript
// Don't decrypt all items on load
const items = await fetchVaultItems(); // Encrypted
// Only decrypt when user views
const plaintext = decryptItem(items[0]); // On-demand
```

**Caching Strategy**:
```javascript
// Cache encrypted items (safe)
localStorage.setItem('encrypted_items', JSON.stringify(items));

// NEVER cache decrypted data
// NEVER cache MEK
```

**Chunked Upload** (large files):
```javascript
// Split file into 1MB chunks
// Encrypt each chunk independently
// Upload in parallel
// Server reassembles
```

### Server-Side

**Connection Pooling**:
```javascript
const pool = new Pool({
  max: 20,                 // Max connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

**Query Optimization**:
```sql
-- Index on user_id + deleted_at
CREATE INDEX idx_vault_items_user 
  ON vault_items(user_id) 
  WHERE deleted_at IS NULL;

-- Prevent full table scans
EXPLAIN ANALYZE SELECT * FROM vault_items WHERE user_id = $1;
```

**Caching** (Redis):
```javascript
// Cache frequently accessed metadata
await redis.setex(
  `user:${userId}:stats`,
  300, // 5 minutes
  JSON.stringify(stats)
);
```

---

## Scaling Strategies

### Horizontal Scaling

**Stateless API Servers**:
- No session state in servers
- Sessions in Redis
- Scale API tier independently
- Load balancer distributes requests

**Database Read Replicas**:
- Primary: Write operations
- Replicas: Read operations
- Streaming replication (< 1s lag)
- Connection pooling (PgBouncer)

**Caching Layer** (Redis):
- Session storage
- Rate limit counters
- Metadata cache
- Temporary data

### Vertical Scaling

**When to Scale Up**:
- Database CPU > 80%
- Memory usage > 80%
- Disk I/O saturated
- Connection pool exhausted

**Database Sizing**:
```
Users     | Instance Type | vCPU | RAM  | Storage
------------------------------------------------------
< 1K      | db.t3.small   | 2    | 2GB  | 20GB
1K-10K    | db.t3.medium  | 2    | 4GB  | 100GB
10K-100K  | db.m5.large   | 2    | 8GB  | 500GB
100K-1M   | db.m5.xlarge  | 4    | 16GB | 2TB
> 1M      | db.m5.2xlarge | 8    | 32GB | 5TB
```

### Geographic Distribution

**Multi-Region Deployment**:
```
Region        | Purpose           | Latency
-------------------------------------------
US-East-1     | Primary (US)      | < 50ms (NA)
EU-West-1     | Primary (Europe)  | < 50ms (EU)
AP-Southeast-1| Primary (Asia)    | < 50ms (AP)
```

**Data Sovereignty**:
- EU data stays in EU (GDPR)
- US data in US
- Cross-region replication optional

---

## Monitoring & Observability

### Key Metrics

**Application**:
```
- Request rate (req/s)
- Response time (p50, p95, p99)
- Error rate (%)
- Active sessions
- Vault operations (encrypt/decrypt/create/delete)
```

**Database**:
```
- Connection pool usage
- Query latency
- Replication lag
- Cache hit ratio
- Disk I/O
```

**Security**:
```
- Failed login attempts
- Suspicious IP addresses
- Unusual access patterns
- MFA bypass attempts
- Rate limit triggers
```

### Alerting Thresholds

```yaml
Critical Alerts (PagerDuty):
  - Error rate > 1%
  - P99 latency > 5s
  - Database connections > 90%
  - Disk space < 10%

Warning Alerts (Email):
  - Error rate > 0.1%
  - P95 latency > 1s
  - Memory usage > 80%
  - Unusual login spike
```

---

## Disaster Recovery

### Backup Strategy

**Database Backups**:
- Automated daily snapshots (30-day retention)
- Point-in-time recovery (PITR)
- Cross-region backup replication
- Quarterly restore testing

**Application State**:
- Configuration in version control
- Infrastructure as code (Terraform)
- Secrets in HashiCorp Vault/AWS Secrets Manager
- Docker images in registry

### Recovery Procedures

**RTO (Recovery Time Objective)**: 4 hours  
**RPO (Recovery Point Objective)**: 1 hour

**Scenario 1: API Server Failure**:
1. Auto-scaling spawns new instances (2 min)
2. Load balancer routes around failed instance
3. No data loss (stateless servers)

**Scenario 2: Database Failure (Multi-AZ)**:
1. Automatic failover to standby (60-120 seconds)
2. No data loss (synchronous replication)
3. DNS update (automatic)

**Scenario 3: Region Failure**:
1. Manual failover to secondary region (30 min)
2. Promote read replica to primary
3. Update DNS, load balancers
4. Data loss: < 1 hour (RPO)

---

## Compliance & Auditing

### SOC 2 Type II Controls

**Security** (Trust Service Criteria):
- Access controls (RBAC, MFA)
- Encryption (at rest, in transit)
- Network security (firewalls, VPCs)
- Vulnerability management
- Incident response

**Availability**:
- System monitoring
- Performance management
- Disaster recovery
- Change management

**Confidentiality**:
- Data classification
- Encryption
- Access restrictions
- NDA with employees

### GDPR Compliance

**Data Subject Rights**:
```javascript
// Right to Access (Article 15)
GET /api/account/export
→ Returns all user data in JSON

// Right to Erasure (Article 17)
DELETE /api/account
→ Permanent deletion of all data

// Right to Data Portability (Article 20)
GET /api/vault/export
→ Encrypted vault export
```

**Breach Notification**:
- Detection: Real-time monitoring
- Assessment: < 24 hours
- Notification: < 72 hours (if required)
- Documentation: Incident log

---

## Cost Analysis

### Infrastructure Costs (10K Active Users)

```
Monthly Costs (AWS):

Compute (ECS Fargate)
- 3 tasks × 0.5 vCPU × 1GB RAM
- 24/7 running
- $45/month

Database (RDS PostgreSQL)
- db.t3.medium Multi-AZ
- 100GB storage
- $120/month

Cache (ElastiCache Redis)
- cache.t3.small
- $30/month

Storage (S3)
- 500GB encrypted files
- $12/month

CDN (CloudFront)
- 1TB data transfer
- $85/month

Load Balancing (ALB)
- 2 load balancers
- $40/month

Monitoring (CloudWatch)
- Logs + metrics
- $25/month

TOTAL: ~$460/month
Cost per user: $0.046/month
Annual cost: $5,520
```

### Revenue Model

```
Pricing Tiers:

Free:
- 100 vault items
- 1GB storage
- Basic features

Premium ($4.99/month):
- Unlimited vault items
- 10GB storage
- Priority support
- Advanced features

Family ($9.99/month):
- 6 users
- 50GB shared storage
- Emergency access
- All premium features

Business ($19.99/user/month):
- SAML/SSO
- Admin console
- Advanced reporting
- API access
- Compliance exports
```

---

## Security Audit Checklist

### Pre-Launch Audit

- [ ] Penetration testing (external firm)
- [ ] Code review (security-focused)
- [ ] Dependency audit (npm audit, Snyk)
- [ ] Cryptography review (by cryptographer)
- [ ] Infrastructure review (network, cloud)
- [ ] OWASP Top 10 verification
- [ ] CWE Top 25 verification
- [ ] Security headers validation
- [ ] SSL/TLS configuration check
- [ ] Rate limiting testing
- [ ] Authentication testing
- [ ] Authorization testing
- [ ] Input validation testing
- [ ] Error handling review
- [ ] Logging and monitoring review
- [ ] Backup and recovery testing
- [ ] Incident response plan review
- [ ] Documentation review
- [ ] Compliance check (GDPR, etc.)
- [ ] Privacy policy review

### Annual Audit

- [ ] External security audit
- [ ] Cryptography review
- [ ] Infrastructure security assessment
- [ ] Compliance audit (SOC 2, ISO 27001)
- [ ] Disaster recovery drill
- [ ] Penetration testing
- [ ] Threat model update

---

**Document Version**: 1.0  
**Created**: 2026-02-07  
**Author**: Security Architecture Team
