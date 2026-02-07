# 🚀 PRODUCTION DEPLOYMENT GUIDE

## Architecture Overview

```
                                    ┌─────────────────┐
                                    │   CloudFlare    │
                                    │   (CDN + WAF)   │
                                    └────────┬────────┘
                                             │
                                             │ HTTPS (TLS 1.3)
                                             │
                       ┌─────────────────────┴──────────────────────┐
                       │                                             │
                ┌──────▼──────┐                              ┌──────▼──────┐
                │  Region 1   │                              │  Region 2   │
                │  Load       │◄────────Health Check────────►│  Load       │
                │  Balancer   │                              │  Balancer   │
                └──────┬──────┘                              └──────┬──────┘
                       │                                             │
        ┌──────────────┼──────────────┐               ┌──────────────┼──────────────┐
        │              │               │               │              │               │
   ┌────▼───┐    ┌────▼───┐     ┌────▼───┐      ┌────▼───┐    ┌────▼───┐     ┌────▼───┐
   │ API-1  │    │ API-2  │     │ API-3  │      │ API-4  │    │ API-5  │     │ API-6  │
   │ Node   │    │ Node   │     │ Node   │      │ Node   │    │ Node   │     │ Node   │
   └────┬───┘    └────┬───┘     └────┬───┘      └────┬───┘    └────┬───┘     └────┬───┘
        │             │               │               │             │               │
        └─────────────┼───────────────┘               └─────────────┼───────────────┘
                      │                                             │
                      └─────────────────┬───────────────────────────┘
                                        │
                    ┌───────────────────┴────────────────────┐
                    │                                         │
             ┌──────▼─────┐                           ┌──────▼─────┐
             │ PostgreSQL │                           │  Redis     │
             │  Primary   │◄───Streaming Repl────────►│  Cluster   │
             │            │                           │            │
             └──────┬─────┘                           └────────────┘
                    │
         ┌──────────┴──────────┐
         │                     │
    ┌────▼─────┐         ┌────▼─────┐
    │ PG Read  │         │ PG Read  │
    │ Replica  │         │ Replica  │
    └──────────┘         └──────────┘

                    ┌────────────┐
                    │ S3/Blob    │
                    │ Storage    │
                    │ (encrypted)│
                    └────────────┘
```

---

## 1. Infrastructure Setup

### 1.1 Cloud Provider Selection

**Recommended**: AWS (best security features)  
**Alternatives**: GCP, Azure, DigitalOcean

**Why AWS**:
- Mature security tooling (GuardDuty, CloudTrail)
- Compliance certifications (SOC 2, HIPAA, PCI DSS)
- VPC isolation
- IAM fine-grained permissions
- KMS for secrets management

### 1.2 Network Architecture

```hcl
# Terraform example
# vpc.tf

resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "zeroguard-vpc"
  }
}

# Public subnets (for load balancers)
resource "aws_subnet" "public_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-east-1a"

  tags = {
    Name = "public-1"
  }
}

resource "aws_subnet" "public_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "us-east-1b"

  tags = {
    Name = "public-2"
  }
}

# Private subnets (for application servers)
resource "aws_subnet" "private_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.10.0/24"
  availability_zone = "us-east-1a"

  tags = {
    Name = "private-1"
  }
}

resource "aws_subnet" "private_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = "us-east-1b"

  tags = {
    Name = "private-2"
  }
}

# Database subnets (isolated)
resource "aws_subnet" "database_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.20.0/24"
  availability_zone = "us-east-1a"

  tags = {
    Name = "database-1"
  }
}

resource "aws_subnet" "database_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.21.0/24"
  availability_zone = "us-east-1b"

  tags = {
    Name = "database-2"
  }
}

# Security Groups
resource "aws_security_group" "api" {
  name        = "api-sg"
  description = "API server security group"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "HTTPS from load balancer"
    from_port       = 3001
    to_port         = 3001
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "api-sg"
  }
}

resource "aws_security_group" "database" {
  name        = "database-sg"
  description = "Database security group"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from API servers"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.api.id]
  }

  tags = {
    Name = "database-sg"
  }
}
```

---

## 2. Database Deployment

### 2.1 PostgreSQL Configuration

**Recommended**: AWS RDS PostgreSQL 15  
**Instance Type**: db.t3.medium (2 vCPU, 4GB RAM) for start  
**Storage**: 100GB GP3 SSD with encryption at rest

```yaml
# RDS Configuration
DBInstanceIdentifier: zeroguard-db-primary
Engine: postgres
EngineVersion: "15.4"
DBInstanceClass: db.t3.medium
AllocatedStorage: 100
StorageType: gp3
StorageEncrypted: true
KmsKeyId: "arn:aws:kms:us-east-1:123456789012:key/..."

# Backups
BackupRetentionPeriod: 30
PreferredBackupWindow: "03:00-04:00"
PreferredMaintenanceWindow: "sun:04:00-sun:05:00"

# High Availability
MultiAZ: true
PubliclyAccessible: false

# Monitoring
EnableCloudwatchLogsExports:
  - postgresql
MonitoringInterval: 60

# Security
VPCSecurityGroupIds:
  - sg-database
DBSubnetGroupName: database-subnet-group

# Parameters
ParameterGroupName: custom-postgres15
```

**Custom Parameter Group**:
```sql
-- postgresql.conf overrides
max_connections = 200
shared_buffers = 1GB
effective_cache_size = 3GB
maintenance_work_mem = 256MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 5242kB
min_wal_size = 1GB
max_wal_size = 4GB

-- Security
ssl = on
password_encryption = scram-sha-256
```

### 2.2 Database Initialization

```bash
# Run migrations
psql $DATABASE_URL < apps/api/src/db/schema.sql

# Create read-only user (for read replicas)
CREATE USER readonly_user WITH PASSWORD 'strong_password';
GRANT CONNECT ON DATABASE zeroguard TO readonly_user;
GRANT USAGE ON SCHEMA public TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly_user;

# Create maintenance user (for cleanup tasks)
CREATE USER maintenance_user WITH PASSWORD 'strong_password';
GRANT CONNECT ON DATABASE zeroguard TO maintenance_user;
GRANT USAGE ON SCHEMA public TO maintenance_user;
GRANT DELETE ON audit_log TO maintenance_user;
GRANT DELETE ON sessions TO maintenance_user;
```

### 2.3 Backup Strategy

**Automated RDS Backups**:
- Daily snapshots (30-day retention)
- Point-in-time recovery (PITR)
- Cross-region replication

**Manual Backup Export**:
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="zeroguard_backup_$DATE.sql.gz"

pg_dump $DATABASE_URL \
  --format=custom \
  --compress=9 \
  --no-owner \
  --no-acl \
  | gzip > "$BACKUP_FILE"

# Upload to S3
aws s3 cp "$BACKUP_FILE" "s3://zeroguard-backups/database/"

# Encrypt with GPG (additional layer)
gpg --encrypt --recipient security@zeroguard.io "$BACKUP_FILE"
aws s3 cp "$BACKUP_FILE.gpg" "s3://zeroguard-backups/secure/"

# Cleanup
rm "$BACKUP_FILE" "$BACKUP_FILE.gpg"
```

---

## 3. Application Deployment

### 3.1 Docker Configuration

**Production Dockerfile** (apps/api):
```dockerfile
# Multi-stage build for security
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/api/package.json ./apps/api/

# Install dependencies (production only)
RUN npm ci --only=production

# Copy source
COPY apps/api ./apps/api
COPY packages ./packages

# Build TypeScript
RUN npm run build

# --- Production Image ---
FROM node:20-alpine

# Security: Run as non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S appuser -u 1001

WORKDIR /app

# Copy built artifacts
COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:nodejs /app/apps/api/dist ./dist

# Security: Remove unnecessary packages
RUN apk del apk-tools

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/server.js"]
```

### 3.2 Kubernetes Deployment

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: zeroguard-api
  namespace: production
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  selector:
    matchLabels:
      app: zeroguard-api
  template:
    metadata:
      labels:
        app: zeroguard-api
    spec:
      serviceAccountName: zeroguard-api
      
      # Security context
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        fsGroup: 1001
        seccompProfile:
          type: RuntimeDefault
      
      containers:
      - name: api
        image: zeroguard/api:v1.0.0
        imagePullPolicy: Always
        
        ports:
        - containerPort: 3001
          name: http
          protocol: TCP
        
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3001"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-credentials
              key: url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: jwt-secret
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-credentials
              key: url
        
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2
        
        # Security
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          runAsNonRoot: true
          runAsUser: 1001
          capabilities:
            drop:
              - ALL
        
        volumeMounts:
        - name: tmp
          mountPath: /tmp
      
      volumes:
      - name: tmp
        emptyDir: {}
      
      # Pod anti-affinity (spread across nodes)
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - zeroguard-api
              topologyKey: kubernetes.io/hostname
```

### 3.3 Secrets Management

**AWS Secrets Manager**:
```bash
# Store secrets
aws secretsmanager create-secret \
  --name zeroguard/production/database \
  --secret-string '{
    "username": "vault_user",
    "password": "secure_random_password",
    "host": "zeroguard-db.xyz.us-east-1.rds.amazonaws.com",
    "port": 5432,
    "database": "zeroguard"
  }'

aws secretsmanager create-secret \
  --name zeroguard/production/jwt \
  --secret-string "$(openssl rand -base64 64)"

# Rotation policy
aws secretsmanager rotate-secret \
  --secret-id zeroguard/production/database \
  --rotation-lambda-arn arn:aws:lambda:us-east-1:123456789012:function:SecretsManagerRotation \
  --rotation-rules AutomaticallyAfterDays=90
```

---

## 4. Monitoring & Observability

### 4.1 Metrics (Prometheus + Grafana)

**Key Metrics**:
- API request rate (req/sec)
- Response time (p50, p95, p99)
- Error rate (5XX responses)
- Database connection pool usage
- Memory usage
- CPU usage
- Failed login attempts (security)

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'zeroguard-api'
    static_configs:
      - targets: ['api-1:3001', 'api-2:3001', 'api-3:3001']
    metrics_path: '/metrics'
    scrape_interval: 15s
```

### 4.2 Logging (ELK Stack)

**Log Structure**:
```json
{
  "timestamp": "2026-02-07T12:34:56.789Z",
  "level": "info",
  "service": "api",
  "instance": "api-pod-xyz",
  "request_id": "req-123456",
  "user_id": "uuid-...",
  "action": "create_vault_item",
  "duration_ms": 45,
  "status": 201,
  "ip": "203.0.113.45",
  "user_agent": "Mozilla/5.0..."
}
```

**Privacy-Preserving Logging**:
```javascript
// NEVER log:
// - Master passwords
// - Plaintext vault data
// - Encryption keys
// - User emails (use hashes)

// Logger configuration
const logger = pino({
  redact: {
    paths: [
      'req.headers.authorization',
      'req.body.password',
      'req.body.encryptedData',
      'res.body.*.encryptedData',
    ],
    censor: '[REDACTED]',
  },
});
```

### 4.3 Alerting

**Critical Alerts** (PagerDuty):
- Database connection failures
- API response time > 5s (p95)
- Error rate > 1%
- Failed login spike (10x normal)
- Disk space < 10%
- SSL certificate expiring (< 30 days)

**Warning Alerts** (Email):
- Memory usage > 80%
- CPU usage > 80%
- Unusual traffic patterns
- New device logins (user notification)

```yaml
# alertmanager.yml
route:
  receiver: 'pagerduty-critical'
  routes:
    - match:
        severity: critical
      receiver: pagerduty-critical
    - match:
        severity: warning
      receiver: email

receivers:
  - name: 'pagerduty-critical'
    pagerduty_configs:
      - service_key: '<key>'
  
  - name: 'email'
    email_configs:
      - to: 'ops@zeroguard.io'
        from: 'alerts@zeroguard.io'
```

---

## 5. Security Hardening

### 5.1 Network Security

```bash
# Firewall rules (iptables)
# Allow only necessary ports

# Allow HTTPS
iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Allow SSH (from bastion only)
iptables -A INPUT -p tcp --dport 22 -s 10.0.1.10/32 -j ACCEPT

# Drop everything else
iptables -A INPUT -j DROP
```

### 5.2 OS Hardening

```bash
# Disable root login
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

# Disable password authentication (use keys)
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config

# Enable automatic security updates
apt install unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades

# Install fail2ban (brute force protection)
apt install fail2ban
systemctl enable fail2ban
```

### 5.3 Application Security

```javascript
// Helmet configuration (comprehensive)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // TODO: Remove unsafe-inline
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  frameguard: {
    action: 'deny',
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
```

---

## 6. Disaster Recovery

### 6.1 Backup Testing

**Monthly**:
```bash
# Test backup restoration
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier zeroguard-test-restore \
  --db-snapshot-identifier zeroguard-snapshot-20260207

# Verify data integrity
psql -h zeroguard-test-restore.xyz.amazon aws.com -U vault_user -c "SELECT COUNT(*) FROM vault_items;"

# Cleanup
aws rds delete-db-instance --db-instance-identifier zeroguard-test-restore
```

### 6.2 Failover Procedures

**Automated Failover** (RDS Multi-AZ):
- Automatic: 60-120 seconds
- No data loss (synchronous replication)

**Manual Failover** (Region):
1. Update DNS to point to secondary region
2. Promote read replica to primary
3. Verify application connectivity
4. Update monitoring dashboards

**RTO**: 4 hours  
**RPO**: 1 hour

---

## 7. Scaling Strategy

### 7.1 Horizontal Scaling

**API Servers**:
- Auto-scaling based on CPU/memory
- Min: 3 instances, Max: 20 instances
- Scale up threshold: CPU > 70%
- Scale down threshold: CPU < 30%

**Database**:
- Read replicas for read-heavy workloads
- Connection pooling (PgBouncer)
- Vertical scaling (upgrade instance type)

### 7.2 Caching Strategy

**Redis**:
- Session storage
- Rate limit counters
- Frequently accessed metadata

```javascript
// Cache configuration
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: 6379,
  password: process.env.REDIS_PASSWORD,
  db: 0,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    if (times > 3) return null;
    return Math.min(times * 100, 3000);
  },
});
```

---

## 8. Compliance & Auditing

### 8.1 SOC 2 Type II Preparation

**Required Controls**:
- [ ] Access logging (audit table)
- [ ] Encryption at rest and in transit
- [ ] Regular vulnerability scanning
- [ ] Incident response plan
- [ ] Business continuity plan
- [ ] Vendor risk management
- [ ] Change management process
- [ ] Security awareness training

### 8.2 GDPR Compliance

**Features**:
- Data portability (export vault)
- Right to deletion (account deletion)
- Data minimization (zero-knowledge)
- Breach notification (< 72 hours)
- Data processing agreements

---

## 9. Cost Optimization

### Estimated Monthly Costs (AWS, 10k users)

| Service | Configuration | Monthly Cost |
|---------|---------------|--------------|
| **ECS Fargate** | 3 tasks, 0.5 vCPU, 1GB RAM | $45 |
| **RDS PostgreSQL** | db.t3.medium, Multi-AZ | $120 |
| **RDS Read Replica** | db.t3.small | $60 |
| **ElastiCache Redis** | cache.t3.small | $30 |
| **S3** | 500GB encrypted storage | $12 |
| **CloudFront** | 1TB transfer | $85 |
| **ALB** | 2 load balancers | $40 |
| **Route 53** | Hosted zone + queries | $5 |
| **CloudWatch** | Logs + metrics | $25 |
| **Secrets Manager** | 10 secrets | $4 |
| **WAF** | Basic rules | $20 |
| **Backup** | RDS snapshots, S3 | $15 |
| **Total** | | **$461/month** |

**Cost per user**: $0.046/month

---

## 10. Launch Checklist

### Pre-Launch

- [ ] Security audit completed
- [ ] Penetration test passed
- [ ] Load testing (10x expected traffic)
- [ ] Backup restoration tested
- [ ] Disaster recovery plan documented
- [ ] Monitoring dashboards configured
- [ ] SSL certificates installed
- [ ] DNS configured
- [ ] Terms of Service finalized
- [ ] Privacy Policy reviewed

### Launch Day

- [ ] Deploy to production
- [ ] Verify health checks
- [ ] Monitor error rates
- [ ] Test critical user flows
- [ ] Announce launch
- [ ] Monitor user feedback

### Post-Launch (Week 1)

- [ ] Review audit logs for anomalies
- [ ] Check performance metrics
- [ ] Address critical bugs
- [ ] Collect user feedback
- [ ] Plan iterative improvements

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-07  
**Maintained By**: DevOps Team
