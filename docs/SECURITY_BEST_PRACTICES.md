# 🔒 SECURITY BEST PRACTICES

## For Developers

### 1. Cryptography Rules

#### ❌ NEVER DO THIS:
```javascript
// WRONG: Using Math.random() for security
const randomKey = Math.random().toString(36);

// WRONG: Inventing custom crypto
function myEncrypt(data, key) {
  return data.split('').map((c, i) => 
    String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length))
  ).join('');
}

// WRONG: ECB mode (leaks patterns)
const cipher = crypto.createCipher('aes-256-ecb', key);

// WRONG: Hardcoded secrets
const JWT_SECRET = 'mysecret123';
```

#### ✅ DO THIS INSTEAD:
```javascript
// CORRECT: Cryptographically secure random
const randomKey = crypto.getRandomValues(new Uint8Array(32));

// CORRECT: Use audited libraries
import { gcm } from '@noble/ciphers/aes';
import { argon2id } from '@noble/hashes/argon2';

// CORRECT: GCM mode (authenticated encryption)
const cipher = gcm(key, nonce);

// CORRECT: Load secrets from environment
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET not set');
```

### 2. Input Validation

#### ❌ NEVER DO THIS:
```javascript
// WRONG: No validation
app.post('/api/vault', (req, res) => {
  const { data } = req.body;
  database.insert(data); // SQL injection risk!
});

// WRONG: Client-side validation only
<input type="email" required />

// WRONG: Trusting user input
const userId = req.query.userId;
const data = await db.query(`SELECT * FROM users WHERE id = ${userId}`);
```

#### ✅ DO THIS INSTEAD:
```javascript
// CORRECT: Schema validation
import { z } from 'zod';

const VaultItemSchema = z.object({
  type: z.enum(['password', 'card', 'note']),
  encryptedData: z.string().min(1),
  nonce: z.string().length(16),
});

app.post('/api/vault', (req, res) => {
  const validated = VaultItemSchema.parse(req.body);
  // Now safe to use
});

// CORRECT: Parameterized queries
const data = await db.query(
  'SELECT * FROM users WHERE id = $1',
  [userId]
);
```

### 3. Authentication & Authorization

#### ❌ NEVER DO THIS:
```javascript
// WRONG: Storing passwords in plaintext
users.create({ email, password });

// WRONG: Weak password requirements
if (password.length >= 6) { /* OK */ }

// WRONG: No rate limiting
app.post('/login', loginHandler);

// WRONG: Long-lived tokens without refresh
const token = jwt.sign({ id }, secret, { expiresIn: '30d' });
```

#### ✅ DO THIS INSTEAD:
```javascript
// CORRECT: Zero-knowledge (password never sent)
// Use SRP or similar

// CORRECT: Strong password requirements
const strength = analyzePasswordStrength(password);
if (strength.score < 3) {
  throw new Error('Password too weak');
}

// CORRECT: Rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
}));

// CORRECT: Short-lived access tokens + refresh tokens
const accessToken = jwt.sign({ id }, secret, { expiresIn: '15m' });
const refreshToken = generateRefreshToken();
```

### 4. Session Management

#### ❌ NEVER DO THIS:
```javascript
// WRONG: Storing sensitive data in localStorage
localStorage.setItem('password', password);
localStorage.setItem('encryptionKey', key);

// WRONG: Not clearing sensitive data
let masterKey = derivedKey;
// ... key used ...
// Key still in memory!

// WRONG: No session expiry
const session = { userId, createdAt: Date.now() };
```

#### ✅ DO THIS INSTEAD:
```javascript
// CORRECT: Memory-only storage for encryption keys
class SecureKey {
  private key: Uint8Array;
  
  clear() {
    // Overwrite with random
    crypto.getRandomValues(this.key);
    // Then zero
    this.key.fill(0);
  }
}

// CORRECT: Auto-lock on inactivity
const LOCK_TIMEOUT = 15 * 60 * 1000; // 15 minutes
let lastActivity = Date.now();

setInterval(() => {
  if (Date.now() - lastActivity > LOCK_TIMEOUT) {
    lockVault(); // Clear MEK from memory
  }
}, 60 * 1000);

// CORRECT: Session expiry
const session = {
  userId,
  expiresAt: Date.now() + (15 * 60 * 1000),
};
```

### 5. Error Handling

#### ❌ NEVER DO THIS:
```javascript
// WRONG: Leaking stack traces to client
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.stack });
});

//  WRONG: Detailed error messages (info disclosure)
catch (err) {
  throw new Error(`Decryption failed: Invalid key at byte ${offset}`);
}

// WRONG: Different errors for username vs password
if (!user) return res.status(404).json({ error: 'User not found' });
if (!validPassword) return res.status(401).json({ error: 'Invalid password' });
```

#### ✅ DO THIS INSTEAD:
```javascript
// CORRECT: Generic error messages
app.use((err, req, res, next) => {
  logger.error(err); // Log internally
  res.status(500).json({ error: 'Internal Server Error' });
});

// CORRECT: Generic crypto errors
catch (err) {
  throw new Error('Decryption failed - data may be corrupted');
}

// CORRECT: Same error for both (prevent username enumeration)
if (!user || !validPassword) {
  return res.status(401).json({ error: 'Invalid credentials' });
}
```

### 6. Logging

#### ❌ NEVER DO THIS:
```javascript
// WRONG: Logging sensitive data
logger.info('User login', { email, password });
logger.info('Vault item', { item: plaintextItem });
logger.info('Request', { headers: req.headers }); // Contains auth tokens
```

#### ✅ DO THIS INSTEAD:
```javascript
// CORRECT: Privacy-preserving logging
logger.info('User login', { 
  emailHash: sha256(email),
  success: true,
});

logger.info('Vault item created', {
  itemId: item.id,
  itemType: item.type,
  // No plaintext data!
});

// CORRECT: Redact sensitive fields
const logger = pino({
  redact: ['req.headers.authorization', 'req.body.password'],
});
```

---

## For End Users

### 1. Master Password Best Practices

**DO**:
- ✅ Use at least 12 characters
- ✅ Include uppercase, lowercase, numbers, symbols
- ✅ Use a passphrase (e.g., "correct-horse-battery-staple")
- ✅ Make it unique (never reuse)
- ✅ Use password generator for maximum security

**DON'T**:
- ❌ Use common words or patterns
- ❌ Include personal information (name, birthday)
- ❌ Reuse passwords from other sites
- ❌ Write it down (unless in a truly secure location)
- ❌ Share it with anyone

**Example Strong Master Password**:
```
Correct-Horse-Battery-Staple-82!
(20 characters, memorable, strong)
```

### 2. Multi-Factor Authentication (MFA)

**Setup MFA Immediately**:
1. Enable built-in TOTP authenticator
2. Save backup codes in a secure location (not in the vault!)
3. Consider using a hardware key (YubiKey) when supported

**Backup Codes**:
- Print and store in a safe
- Don't store digitally
- Use only in emergencies

### 3. Device Security

**Before Using ZeroGuard**:
- ✅ Keep OS updated
- ✅ Use antivirus software
- ✅ Enable firewall
- ✅ Use trusted browser (Chrome, Firefox, Safari, Edge)
- ✅ Install browser updates
- ✅ Avoid public/shared computers

**Warning Signs Your Device May Be Compromised**:
- Unexpected software installations
- Unusual network activity
- Slow performance
- Pop-ups or strange behavior

**If Device Compromised**:
1. **Immediately** change master password from trusted device
2. Revoke all sessions
3. Review audit log for unauthorized access
4. Run full malware scan

### 4. Public Networks

**Never Use Public Wi-Fi For ZeroGuard**:
- ❌ Coffee shops
- ❌ Airports
- ❌ Hotels
- ❌ Any untrusted network

**If You Must**:
- Use VPN
- Enable "Travel Mode" (planned feature)
- Lock vault immediately after use

### 5. Browser Extensions

**Be Cautious**:
- Only install extensions from official stores
- Check reviews and ratings
- Review permissions carefully
- Disable extensions before using ZeroGuard

**Recommended Extensions** (Security):
- uBlock Origin (ad blocker)
- HTTPS Everywhere
- Privacy Badger

**Avoid**:
- Password managers that conflict
- Unknown/unverified extensions
- Extensions with excessive permissions

### 6. Sharing & Emergency Access

**DO**:
- ✅ Use built-in sharing (when available)
- ✅ Set up emergency contacts with waiting period
- ✅ Review shared items regularly

**DON'T**:
- ❌ Share master password
- ❌ Screenshot sensitive information
- ❌ Copy passwords to unencrypted locations
- ❌ Trust unsecured channels (SMS, email)

### 7. Regular Security Checks

**Monthly**:
- [ ] Review security dashboard
- [ ] Check for weak/reused passwords
- [ ] Update compromised passwords
- [ ] Review active sessions
- [ ] Check audit log for suspicious activity

**Every 3 Months**:
- [ ] Change critical passwords
- [ ] Review emergency contacts
- [ ] Verify backup codes are safe
- [ ] Update recovery email

**Annually**:
- [ ] Change master password
- [ ] Full security audit
- [ ] Review all vault items
- [ ] Delete unused items

---

## For System Administrators

### 1. Server Hardening

```bash
# Disable unnecessary services
systemctl disable bluetooth
systemctl disable cups

# Configure firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp  # SSH (from bastion only)
ufw allow 443/tcp # HTTPS
ufw enable

# Automatic updates
apt install unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades

# Audit logging
apt install auditd
systemctl enable auditd
```

### 2. Regular Security Tasks

**Daily**:
- [ ] Check error logs
- [ ] Review failed login attempts
- [ ] Monitor resource usage

**Weekly**:
- [ ] Review audit logs
- [ ] Check security patches
- [ ] Database backup verification

**Monthly**:
- [ ] Dependency security scan (`npm audit`, Snyk)
- [ ] SSL certificate expiry check
- [ ] Access review (remove old accounts)
- [ ] Penetration test (automated)

**Quarterly**:
- [ ] External security audit
- [ ] Disaster recovery drill
- [ ] Update threat model
- [ ] Review and update access controls

### 3. Incident Response

**Suspected Breach**:
1. **Isolate** affected systems
2. **Preserve** logs and evidence
3. **Investigate** scope of breach
4. **Notify** appropriate parties (GDPR: < 72 hours)
5. **Remediate** vulnerabilities
6. **Review** and improve security

**Post-Incident**:
- Conduct post-mortem
- Update security policies
- Communicate transparently with users
- Implement additional monitoring

---

## Compliance Checklists

### SOC 2 Type II

**Security**:
- [ ] Access controls implemented
- [ ] Encryption at rest and in transit
- [ ] Logging and monitoring
- [ ] Incident response plan
- [ ] Vulnerability management

**Availability**:
- [ ] System monitoring
- [ ] Performance management
- [ ] Disaster recovery plan
- [ ] Backup and restoration tested

**Confidentiality**:
- [ ] Data classification
- [ ] Encryption of sensitive data
- [ ] Access restrictions
- [ ] Non-disclosure agreements

### GDPR

**Data Subject Rights**:
- [ ] Right to access (data export)
- [ ] Right to deletion (account deletion)
- [ ] Right to portability (vault export)
- [ ] Right to rectification (data edit)

**Security Measures**:
- [ ] Encryption
- [ ] Pseudonymization (email hashes)
- [ ] Access controls
- [ ] Regular security testing

**Documentation**:
- [ ] Data processing records
- [ ] Privacy policy
- [ ] Data protection impact assessment (DPIA)
- [ ] Breach notification procedures

---

## Security Resources

### Learning

**Books**:
- "Cryptography Engineering" by Ferguson, Schneier, Kohno
- "The Web Application Hacker's Handbook" by Stuttard, Pinto
- "Security Engineering" by Ross Anderson

**Courses**:
- Stanford CS 255: Introduction to Cryptography
- MIT 6.858: Computer Systems Security
- OWASP WebGoat (hands-on)

**Websites**:
- OWASP Top 10
- CWE Top 25
- NIST Cybersecurity Framework
- Have I Been Pwned (breach monitoring)

### Tools

**Security Scanners**:
- OWASP ZAP (web app security)
- Burp Suite (penetration testing)
- Nmap (network scanning)
- Wireshark (packet analysis)

**Dependency Scanners**:
- Snyk
- npm audit
- Dependabot
- OWASP Dependency-Check

**Static Analysis**:
- SonarQube
- ESLint (with security plugins)
- Semgrep
- CodeQL

---

**Last Updated**: 2026-02-07  
**Version**: 1.0  
**Review Cycle**: Quarterly
