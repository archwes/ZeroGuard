# 🔐 ZeroGuard - Cofre Digital de Conhecimento Zero

> 🎯 **Primeira vez aqui?** Comece por: [START_HERE.md](./START_HERE.md) - Seu guia de navegação rápida!

## Arquitetura de Segurança de Missão Crítica

Um cofre de criptografia de conhecimento zero de nível de produção para armazenar senhas, cartões de pagamento, notas seguras, documentos de identidade, arquivos, chaves de API e segredos TOTP.

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

### 🎯 Princípios Fundamentais de Segurança

1. **Arquitetura de Conhecimento Zero**: O servidor nunca vê dados em texto claro
2. **Criptografia no Cliente**: Toda criptografia acontece no navegador
3. **Defesa em Profundidade**: Múltiplas camadas de segurança
4. **Assume Violação**: Design assumindo comprometimento do banco de dados
5. **Privacidade por Padrão**: Coleta mínima de metadados

### 🏗️ Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENTE (Navegador)                      │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Senha Mestra do Usuário (nunca sai do cliente)     │  │
│  └───────────────────┬──────────────────────────────────┘  │
│                      │                                      │
│                      ▼                                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Derivação de Chave Argon2id (alto custo memória)   │  │
│  │  → Chave Mestra de Criptografia (MEK)               │  │
│  │  → Chave de Autenticação (AK)                       │  │
│  └───────────────────┬──────────────────────────────────┘  │
│                      │                                      │
│                      ▼                                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Chaves de Criptografia por Item (envoltas com MEK) │  │
│  │  Criptografia AES-256-GCM                            │  │
│  └───────────────────┬──────────────────────────────────┘  │
│                      │                                      │
│                      ▼ (apenas blobs criptografados)       │
└──────────────────────┼──────────────────────────────────────┘
                       │
                       │ HTTPS + Fixação de Certificado
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                     GATEWAY DE API                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ • Limitação de Taxa (proteção DDoS)                   │ │
│  │ • Validação JWT (tokens de curta duração)             │ │
│  │ • Cabeçalhos CSP (mitigação XSS)                      │ │
│  │ • Assinatura de Requisição (verificação integridade) │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  SERVIDOR DE APLICAÇÃO                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ • Nunca descriptografa dados (fisicamente impossível) │ │
│  │ • Armazena apenas blobs criptografados                │ │
│  │ • Log de auditoria (não-PII)                          │ │
│  │ • Monitoramento de detecção de violação               │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  BANCO DE DADOS (PostgreSQL)                 │
│                                                              │
│  tabela_usuarios:                                           │
│    • email_hash (não reversível)                           │
│    • srp_verifier (para auth, não criptografia)            │
│    • wrapped_mek (criptografado com chave derivada senha)  │
│                                                              │
│  tabela_itens_cofre:                                        │
│    • user_id (indexado)                                    │
│    • item_type (password|card|note|file|totp)              │
│    • encrypted_data (blob AES-256-GCM)                     │
│    • nonce/iv                                               │
│    • encrypted_item_key (envolta com MEK)                  │
│    • created_at, updated_at                                │
│                                                              │
│  ⚠️ MESMO COM ACESSO COMPLETO AO BANCO DE DADOS:            │
│     Atacante não pode descriptografar sem senha mestra     │
└─────────────────────────────────────────────────────────────┘
```

## 🔒 Ciclo de Vida da Criptografia

### Fluxo de Registro

```
1. Usuário insere senha mestra (mín 12 caracteres, complexidade imposta)
2. Gerar salt aleatório (32 bytes)
3. Derivar chaves usando Argon2id:
   - iterações: 10
   - memória: 64MB
   - paralelismo: 4
   Saída: 64 bytes de material de chave
   - Bytes 0-31: Chave Mestra de Criptografia (MEK)
   - Bytes 32-63: Chave de Autenticação (AK)
   
4. Gerar verificador SRP a partir da AK (para autenticação)
5. Criptografar MEK com chave derivada da senha (para recuperação)
6. Enviar ao servidor:
   - Hash do email (HMAC-SHA256)
   - Salt
   - Verificador SRP
   - MEK envolta
   ❌ Senha mestra NUNCA é enviada
```

### Fluxo de Login (Autenticação SRP)

```
1. Usuário insere email + senha
2. Solicitar salt do servidor (usando hash do email)
3. Derivar MEK e AK localmente (mesmo processo Argon2id)
4. Executar handshake SRP com AK:
   - Servidor não pode aprender a senha
   - Cliente não pode ser personificado
   - Autenticação mútua
5. Em caso de sucesso:
   - Servidor retorna JWT (expiração 15min)
   - Cliente armazena MEK apenas na memória (nunca persistido)
6. Token de atualização armazenado em cookie httpOnly
```

### Fluxo de Criptografia de Dados

```
PARA CADA ITEM DO COFRE:

1. Gerar chave de item aleatória (256-bit)
2. Criptografar dados do cofre:
   texto_claro → AES-256-GCM(item_key) → texto_cifrado
   
3. Envolver chave do item:
   item_key → AES-256-GCM(MEK) → wrapped_key
   
4. Enviar ao servidor:
   {
     encrypted_data: base64(texto_cifrado),
     encrypted_key: base64(wrapped_key),
     nonce: base64(nonce),
     auth_tag: base64(tag)
   }

5. Servidor armazena blob criptografado (nunca tem texto claro ou MEK)

DESCRIPTOGRAFIA (reverso):
1. Buscar item criptografado do servidor
2. Desembrulhar chave do item: AES-256-GCM-DECRYPT(MEK, wrapped_key)
3. Descriptografar dados: AES-256-GCM-DECRYPT(item_key, texto_cifrado)
```

## 🛡️ Modelo de Ameaças & Mitigações

| Ameaça | Probabilidade | Impacto | Mitigação |
|--------|---------------|---------|-----------|
| **Violação de Banco de Dados** | ALTA | CRÍTICO | Criptografia de conhecimento zero; dados inúteis sem senha |
| **Ataque XSS** | MÉDIA | ALTO | CSP rigoroso, DOMPurify, proteções XSS do framework, sanitização de entrada |
| **MITM** | MÉDIA | ALTO | Apenas HTTPS, HSTS, fixação de certificado, TLS 1.3+ |
| **Credential Stuffing** | ALTA | MÉDIA | Limitação de taxa, CAPTCHA, detecção de violação, bloqueio de conta |
| **Roubo de Token** | MÉDIA | ALTO | JWTs de curta duração (15min), cookies httpOnly, rotação de token |
| **Extensão Maliciosa** | MÉDIA | CRÍTICO | Monitoramento de integridade, Web Crypto API (mais difícil de interceptar) |
| **Ataque à Cadeia de Suprimentos** | BAIXA | CRÍTICO | Fixação de dependências, hashes SRI, auditorias automatizadas, deps mínimas |
| **Dump de Memória** | BAIXA | ALTO | Sem persistência de texto claro, limpar dados sensíveis, usar padrões SecureString |
| **Phishing** | ALTA | ALTO | Chaves de segurança (WebAuthn), verificação de email, rastreamento de dispositivo confiável |
| **Fixação de Sessão** | BAIXA | MÉDIA | Regenerar sessão no login, flags de cookie seguros |

## 📊 Schema do Banco de Dados

```sql
-- Tabela de usuários (apenas autenticação)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_hash VARCHAR(64) UNIQUE NOT NULL,  -- HMAC-SHA256 do email
    salt BYTEA NOT NULL,                     -- Para Argon2id
    srp_verifier TEXT NOT NULL,              -- Autenticação SRP
    wrapped_mek BYTEA NOT NULL,              -- MEK criptografada com senha
    mfa_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Itens do cofre (todos criptografados)
CREATE TABLE vault_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    item_type VARCHAR(20) NOT NULL,          -- password|card|note|file|totp|identity
    encrypted_data BYTEA NOT NULL,           -- Texto cifrado AES-256-GCM
    encrypted_key BYTEA NOT NULL,            -- Chave do item envolta com MEK
    nonce BYTEA NOT NULL,                    -- Nonce GCM
    auth_tag BYTEA NOT NULL,                 -- Tag de autenticação GCM
    metadata JSONB,                          -- Metadados criptografados (ex: categoria, tags)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_user_items (user_id, item_type)
);

-- Log de auditoria (preservando privacidade)
CREATE TABLE audit_log (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,             -- login|logout|create_item|delete_item
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Sessões (para blacklist de JWT)
CREATE TABLE sessions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(64) UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Acesso de emergência / Interruptor de homem morto
CREATE TABLE emergency_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    contact_email_hash VARCHAR(64) NOT NULL,
    waiting_period_days INTEGER DEFAULT 30,
    encrypted_recovery_key BYTEA NOT NULL,   -- Chave envolta para acesso de emergência
    status VARCHAR(20) DEFAULT 'active'
);
```

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose

### Configuração de Desenvolvimento

```bash
# Instalar dependências
cd apps/web && npm install
cd ../api && npm install

# Iniciar infraestrutura
docker-compose up -d

# Executar migrações
cd apps/api && npm run migrate

# Iniciar servidores de desenvolvimento
npm run dev  # Executa tanto web quanto API
```

### Variáveis de Ambiente

```bash
# API (.env)
DATABASE_URL=postgresql://vault:secret@localhost:5432/zeroguard
REDIS_URL=redis://localhost:6379
JWT_SECRET=<use-vault-ou-gerenciador-de-segredos>
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000

# Web (.env)
VITE_API_URL=https://api.zeroguard.io
VITE_ENABLE_ANALYTICS=false
```

## 📁 Estrutura do Projeto

```
vault/
├── apps/
│   ├── web/                    # Frontend React
│   │   ├── src/
│   │   │   ├── crypto/         # Primitivas de criptografia
│   │   │   ├── auth/           # Lógica de autenticação
│   │   │   ├── vault/          # Componentes do cofre
│   │   │   ├── components/     # Componentes de UI
│   │   │   └── hooks/          # Hooks React
│   │   └── package.json
│   │
│   └── api/                    # Backend Fastify
│       ├── src/
│       │   ├── routes/         # Endpoints da API
│       │   ├── middleware/     # Middleware de segurança
│       │   ├── services/       # Lógica de negócio
│       │   ├── db/             # Camada de banco de dados
│       │   └── utils/          # Utilitários
│       └── package.json
│
├── packages/
│   ├── shared/                 # Tipos/utils compartilhados
│   └── crypto/                 # Utilitários de criptografia compartilhados
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

## 🔐 Melhores Práticas de Segurança Implementadas

- ✅ Criptografia de conhecimento zero (apenas no cliente)
- ✅ Derivação de chave Argon2id (memória-pesada)
- ✅ Criptografia autenticada AES-256-GCM
- ✅ Autenticação SRP (senha nunca transmitida)
- ✅ JWTs de curta duração (15 minutos)
- ✅ Limitação de taxa e proteção DDoS
- ✅ Política de Segurança de Conteúdo rigorosa
- ✅ HSTS e cabeçalhos de segurança
- ✅ Validação e sanitização de entrada
- ✅ Prevenção de injeção SQL (consultas parametrizadas)
- ✅ Log de auditoria (preservando privacidade)
- ✅ Varredura de segurança automatizada (dependabot, snyk)
- ✅ Testes de penetração regulares
- ✅ Plano de resposta a incidentes

## 📍c Prontidão para Conformidade

- **SOC 2 Tipo II**: Log de auditoria, controles de acesso
- **GDPR**: Portabilidade de dados, direito ao esquecimento, minimização de dados
- **HIPAA**: Criptografia PHI, trilhas de auditoria (se armazenando registros de saúde)
- **PCI DSS**: Se lidando com cartões de pagamento (armazenamento criptografado de cartões)

## 🧪 Estratégia de Testes

- Testes unitários: Cobertura de 80%+
- Testes de integração: Endpoints da API
- Testes E2E: Fluxos críticos do usuário (Playwright)
- Testes de segurança: OWASP ZAP, Burp Suite
- Testes de penetração: Trimestralmente por empresa externa
- Auditorias de criptografia: Revisão anual por especialistas em criptografia

## 📈 Monitoramento & Observabilidade

- **Desempenho**: Tempos de resposta, consultas ao banco de dados
- **Segurança**: Tentativas de login falhadas, padrões de acesso incomuns
- **Negócios**: Crescimento de usuários, criação de itens do cofre
- **Alertas**: Detecção de anomalias, indicadores de violação

## 🚀 Início Rápido (Resumo)

### Desenvolvimento
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

### Deploy em Produção

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

**Custo Total:** ~$1-27/mês dependendo do plano

---

## 🔄 Backup & Recuperação de Desastres

- **Banco de Dados**: Backup contínuo com recuperação point-in-time
- **Chaves de Criptografia**: Nunca são armazenadas em backup em texto claro
- **Dados do Usuário**: Recurso de exportação de backup criptografado
- **RPO**: < 1 hora
- **RTO**: < 4 horas

## 🌐 Arquitetura de Implantação

```
[CloudFlare] → [Balanceador de Carga] → [Servidores API (Auto-scaling)]
                                      ↓
                               [PostgreSQL Primário]
                                      ↓
                            [Réplicas de Leitura PostgreSQL]
                                      
[Cluster Redis] ← [Gerenciamento de Sessão]
[HashiCorp Vault] ← [Gerenciamento de Segredos]
```

## 📞 Contato de Segurança

- **Reportar vulnerabilidades**: security@zeroguard.io
- **Chave PGP**: [Ver SECURITY.md]
- **Bug Bounty**: Programa HackerOne (em breve)

---

**Licença**: MIT (modificar para uso em produção)
**Versão**: 1.0.0-alpha
**Última Auditoria de Segurança**: [Data]
