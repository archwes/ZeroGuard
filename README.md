# 🔐 ZeroGuard — Cofre Digital de Conhecimento Zero

> **Versão:** 0.9.0-alpha · **Última atualização:** Fevereiro 2026

Um cofre de senhas com criptografia de conhecimento zero. O servidor **nunca** tem acesso aos seus dados em texto claro — toda criptografia e descriptografia acontece exclusivamente no navegador.

---

## 📚 Índice

- [Stack Tecnológico](#-stack-tecnológico)
- [Funcionalidades Implementadas](#-funcionalidades-implementadas)
- [Changelog Recente](#-changelog-recente)
- [Executando Localmente](#-executando-localmente)
- [Executando em Produção](#-executando-em-produção)
- [Arquitetura de Segurança](#-arquitetura-de-segurança)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [TODO — O que Falta](#-todo--o-que-falta)
- [Documentação Adicional](#-documentação-adicional)

---

## 🧰 Stack Tecnológico

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| **Frontend** | React + TypeScript | 18 |
| **Bundler** | Vite | 7.3.1 |
| **Estilização** | Tailwind CSS | 3.x |
| **Animações** | Framer Motion | — |
| **Estado** | Zustand (persist) | — |
| **Roteamento** | React Router DOM | v6 |
| **Backend** | Fastify | 5.7.4 |
| **Banco de Dados** | PostgreSQL (raw SQL via `postgres`) | 15+ |
| **Autenticação** | JWT (15min) + bcrypt (pgcrypto) | — |
| **Criptografia** | AES-256-GCM (`@noble/ciphers`) + Argon2id (`@noble/hashes`) | — |
| **Monorepo** | npm workspaces | — |

---

## ✅ Funcionalidades Implementadas

### Segurança & Criptografia
- ✅ Criptografia de conhecimento zero (client-side)
- ✅ AES-256-GCM com chaves por item (wrapped com MEK)
- ✅ Derivação de chave mestra via Argon2id (64MB memória, 3 iterações)
- ✅ Senha mestra nunca sai do navegador
- ✅ MEK armazenada apenas em memória (perdida ao fechar/refresh)
- ✅ JWT com expiração curta (15 minutos)
- ✅ Bloqueio de conta após 10 tentativas falhadas
- ✅ Rate limiting (100 req / 15min)
- ✅ CORS, Helmet, cabeçalhos de segurança

### Autenticação
- ✅ Registro com validação (nome, email, senha mín. 12 caracteres)
- ✅ Login com hash bcrypt + salt individual
- ✅ Logout com limpeza de MEK + estado
- ✅ `apiFetch` centralizado — intercepta 401 e erros de rede → logout automático
- ✅ Validação de sessão ao montar o app (`useSessionValidator`)
- ✅ Redirecionamento ao login quando `masterPassword` não sobrevive refresh

### Cofre — 8 Tipos de Item

| Tipo | Formulário | Sidebar | Criar | Visualizar | Excluir |
|------|-----------|---------|-------|-----------|---------|
| 🔑 Login (password) | ✅ | ✅ | ✅ | ✅ | ✅ |
| 💳 Cartão (card) | ✅ | ✅ | ✅ | ✅ | ✅ |
| 📝 Nota Segura (note) | ✅ | ✅ | ✅ | ✅ | ✅ |
| 👤 Identidade (identity) | ✅ | ✅ | ✅ | ✅ | ✅ |
| 📁 Arquivo (file) | ⚠️ Stub | ✅ | ⚠️ | ✅ | ✅ |
| 🔐 Autenticador (totp) | ✅ | ✅ | ✅ | ✅ | ✅ |
| 🔗 API Key (api-key) | ✅ | ✅ | ✅ | ✅ | ✅ |
| 📜 Licença (license) | ✅ | ❌ | ✅ | ✅ | ✅ |

> ⚠️ **Arquivo**: o formulário tem zona de drag-and-drop visual, mas o upload real não está conectado.
>
> ❌ **Licença**: pode ser criada, mas não aparece na sidebar (falta categoria no DashboardPage).

### Formulário de Cartão
- ✅ Detecção automática de bandeira por BIN (8 bandeiras: Visa, Mastercard, AMEX, Discover, Elo, Hipercard, Diners, JCB)
- ✅ Ícone SVG da bandeira exibido dentro do input
- ✅ Formatação automática do número (grupos de 4 dígitos)
- ✅ Formatação de validade (MM/AA, máx. 4 dígitos)
- ✅ CVV dinâmico (4 dígitos para AMEX, 3 para o resto)
- ✅ Nome do titular em maiúsculas automaticamente
- ✅ BIN ranges abrangentes (fontes: Braintree, Wikipedia, erikhenrique): ~1.400+ BINs Elo, Hipercard expandido

### Interface
- ✅ Sidebar colapsável com menu hamburger animado
- ✅ Filtro por categoria + busca por nome/username
- ✅ Tema dark/light com toggle
- ✅ Cards com cópia, exclusão, clique para abrir detalhes
- ✅ `ViewItemModal` — modal de visualização com campos por tipo, toggle de visibilidade, botões de copiar
- ✅ `CreateItemModal` — modal de criação com validação e feedback visual
- ✅ Toasts em português com gênero correto ("copiada", "copiado")
- ✅ Fundo animado com partículas

### API (Endpoints Reais)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/auth/register` | Não | Registrar novo usuário |
| POST | `/auth/login` | Não | Login → JWT + salt |
| GET | `/vault/items` | JWT | Listar itens (blobs criptografados) |
| GET | `/vault/items/:id` | JWT | Obter item por ID |
| POST | `/vault/items` | JWT | Criar item (quota: 1GB) |
| PUT | `/vault/items/:id` | JWT | Atualizar item |
| DELETE | `/vault/items/:id` | JWT | Soft delete |
| GET | `/vault/stats` | JWT | Contagem por tipo + armazenamento |

---

## 📋 Changelog Recente

### Fevereiro 2026

**Detecção de Bandeiras de Cartão — BIN Ranges Abrangentes**
- Refatorado de regex para comparação numérica com suporte a ranges `[min, max]`
- Elo expandido de 5 para ~1.400+ BINs (13 prefixos + 15 ranges, fonte: Braintree)
- Hipercard expandido de 2 para 9 prefixos (inclui família Hiper)
- Discover: adicionado range `644–649` que faltava
- Diners: adicionado prefixo `39`
- Mastercard 2-series simplificado para `[2221, 2720]`
- **Ordem de detecção corrigida**: Elo/Hipercard verificados antes de Visa/Discover para evitar falsos positivos em BINs sobrepostos

**Gerenciamento de Sessão (`apiFetch`)**
- Criado `apps/web/src/lib/api.ts` com wrapper centralizado para todas as chamadas à API
- Intercepta respostas 401 → logout automático + limpeza de MEK + toast + redirecionamento
- Intercepta erros de rede (servidor offline) → mesmo tratamento quando token existe
- Substituídos todos os `fetch()` manuais em `useVault.ts` por `apiFetch()`
- Adicionado `useSessionValidator()` em `App.tsx` — valida token ao montar
- `DashboardPage`: detecta `masterPassword` ausente (refresh) → força re-login

**ViewItemModal**
- Novo componente para visualização detalhada de itens
- Mesmas dimensões do `CreateItemModal` (40rem × 28rem mín.)
- Campos específicos por tipo com toggle de visibilidade para segredos
- Botões de copiar em cada campo
- Sub-componentes reutilizáveis: `FieldRow`, `SecretRow`, `NotesBlock`

**Formulário de Cartão**
- Detecção de bandeira por BIN com ícones SVG externos (`aaronfagan/svg-credit-card-payment-icons`)
- Ícone exibido dentro do input (lado direito)
- Formatação automática: número (4 em 4), validade (MM/AA), CVV dinâmico
- Nome do titular auto-uppercase
- Renomeado: "American Express" → "AMEX", "Diners Club" → "Diners"

**Correções**
- Cópia de senha retornava literal `'senha-aqui'` → agora usa `item.plaintext.password`
- Toast grammar: "copiado" → "copiada" para substantivos femininos
- `e.stopPropagation()` em todos os botões interativos do VaultItemCard
- Fix Vite warning: import dinâmico → import estático de `useVault` em `api.ts`

---

## 🖥️ Executando Localmente

### Pré-requisitos
- **Node.js** 20+ (`node --version`)
- **npm** 10+ (`npm --version`)
- **PostgreSQL** 15+ rodando localmente

### Passo a Passo

```powershell
# 1. Clonar e instalar dependências
git clone <repo-url> ZeroGuard
cd ZeroGuard
npm install

# 2. Criar banco de dados
psql -U postgres -c "CREATE DATABASE zeroguard;"

# 3. Configurar variáveis de ambiente da API
cd apps/api
# Criar arquivo .env com:
#   DATABASE_URL=postgresql://postgres:SUA_SENHA@localhost:5432/zeroguard
#   JWT_SECRET=uma-chave-secreta-longa-aqui
#   PORT=3001
#   CORS_ORIGIN=http://localhost:5173

# 4. Aplicar schema no banco
psql -U postgres -d zeroguard -f src/db/schema.sql

# 5. Voltar à raiz e iniciar tudo
cd ../..
npm run dev
```

O **frontend** abre em `http://localhost:5173` e a **API** roda em `http://localhost:3001`.

### Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia web + api em paralelo (concurrently) |
| `npm run dev:web` | Apenas o frontend (Vite) |
| `npm run dev:api` | Apenas a API (tsx watch) |
| `npm run build` | Compila web + api para produção |
| `npm run start` | Inicia API compilada (`node dist/server.js`) |
| `npm run prod` | Compila web e inicia API em dev |

---

## 🚀 Executando em Produção

### Opção 1 — Docker Compose (PostgreSQL + Redis)

O `docker-compose.yml` sobe PostgreSQL e Redis prontos para uso:

```powershell
# Subir banco e cache
docker-compose up -d postgres redis

# Aplicar schema
psql -h localhost -U vault_user -d zeroguard -f apps/api/src/db/schema.sql

# Compilar e iniciar a aplicação
npm run build
npm run start
```

### Opção 2 — Deploy Manual (VPS / Cloud)

#### 1. Banco de Dados

Usar PostgreSQL gerenciado (Supabase, Neon, Railway) ou instalar em VPS:

```sql
CREATE DATABASE zeroguard;
CREATE USER zeroguard_user WITH PASSWORD 'SENHA_MUITO_FORTE';
GRANT ALL PRIVILEGES ON DATABASE zeroguard TO zeroguard_user;
```

Aplicar schema:
```bash
psql -h HOST -U zeroguard_user -d zeroguard -f apps/api/src/db/schema.sql
```

#### 2. Backend (API Fastify)

```bash
cd apps/api
npm install --production
npm run build
```

Variáveis de ambiente obrigatórias:
```bash
DATABASE_URL=postgresql://user:pass@host:5432/zeroguard
JWT_SECRET=<string-aleatória-64-chars-mínimo>
PORT=3001
CORS_ORIGIN=https://seu-dominio.com
NODE_ENV=production
```

Iniciar:
```bash
node dist/server.js
# Ou com PM2:
pm2 start dist/server.js --name zeroguard-api
```

#### 3. Frontend (Build Estático)

```bash
cd apps/web
VITE_API_URL=https://api.seu-dominio.com npm run build
# Resultado em: apps/web/dist/ — servir com Nginx, Vercel, Netlify, etc.
```

#### 4. Plataformas Recomendadas

| Serviço | Plataforma | Custo |
|---------|-----------|-------|
| **Frontend** | Vercel ou Netlify | Gratuito |
| **API** | Render ou Railway | $0–7/mês |
| **Banco** | Supabase ou Neon | Gratuito (até 500MB–3GB) |

**Custo total estimado:** $0–27/mês

#### 5. Deploy no Vercel (Frontend)

```bash
vercel --prod
# Root Directory = apps/web
# Build Command = npm run build
# Output Directory = dist
```

O `vercel.json` já está configurado com rewrites SPA.

#### 6. Deploy no Render (API)

Usar o `render.yaml` existente ou configurar manualmente:
- **Build Command:** `cd apps/api && npm install && npm run build`
- **Start Command:** `cd apps/api && node dist/server.js`
- **Variáveis:** `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `NODE_ENV=production`

---

## 🔒 Arquitetura de Segurança

```
┌──────────────────────────────────────────────────────────────┐
│                     NAVEGADOR (Cliente)                       │
│                                                              │
│  Senha Mestra → Argon2id (64MB, 3 iter, 4 threads)          │
│       ├── MEK (Chave Mestra de Criptografia) [memória]      │
│       └── AK  (Chave de Autenticação) [bcrypt no servidor]  │
│                                                              │
│  Para cada item:                                             │
│    1. Gerar chave AES-256-GCM aleatória (item key)          │
│    2. Criptografar dados com item key                        │
│    3. Envolver item key com MEK (key wrapping)               │
│    4. Enviar ao servidor: blob criptografado + wrapped key   │
│                                                              │
│  ⚠️ MEK nunca é enviada ao servidor                          │
│  ⚠️ Dados em texto claro nunca saem do navegador             │
└──────────────────────────────────────────────────────────────┘
                       │ HTTPS
                       ▼
┌──────────────────────────────────────────────────────────────┐
│                     SERVIDOR (API Fastify)                    │
│  • Armazena apenas blobs criptografados                      │
│  • Autenticação via JWT (15min expiração)                    │
│  • Rate limiting + CORS + Helmet                             │
│  • Log de auditoria (sem dados pessoais)                     │
│  • IMPOSSÍVEL descriptografar sem a senha mestra             │
└──────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│                  POSTGRESQL                                   │
│  users: email_hash, salt, srp_verifier (bcrypt), wrapped_mek │
│  vault_items: encrypted_data, encrypted_key, nonce, auth_tag │
│  audit_log: ações registradas sem dados sensíveis            │
└──────────────────────────────────────────────────────────────┘
```

### Modelo de Ameaças

| Ameaça | Mitigação |
|--------|-----------|
| Vazamento do banco de dados | Dados criptografados — inúteis sem a senha mestra |
| Ataque XSS | CSP rigoroso, sanitização, framework React |
| Man-in-the-Middle | HTTPS obrigatório, HSTS |
| Credential Stuffing | Rate limiting, bloqueio após 10 tentativas |
| Roubo de Token | JWT curto (15min), limpeza automática |
| Refresh da página | MEK perdida, exige re-login (by design) |

---

## 📁 Estrutura do Projeto

```
ZeroGuard/
├── apps/
│   ├── api/                        # Backend Fastify
│   │   ├── src/
│   │   │   ├── server.ts           # Entrada principal
│   │   │   ├── config.ts           # Configurações + env vars
│   │   │   ├── db/
│   │   │   │   ├── client.ts       # Conexão PostgreSQL (lib postgres)
│   │   │   │   └── schema.sql      # Schema completo do banco
│   │   │   ├── routes/
│   │   │   │   ├── index.ts        # Auth routes (register, login)
│   │   │   │   └── vault.ts        # CRUD do cofre
│   │   │   └── middleware/
│   │   │       ├── security.ts     # JWT, rate limit, CORS
│   │   │       ├── logging.ts      # Logs estruturados
│   │   │       └── errors.ts       # Handler de erros
│   │   └── package.json
│   │
│   └── web/                        # Frontend React
│       ├── src/
│       │   ├── App.tsx             # Rotas + useSessionValidator
│       │   ├── main.tsx            # Entrada React
│       │   ├── components/
│       │   │   ├── ui/             # Componentes base (Button, Input, GlassCard)
│       │   │   └── vault/
│       │   │       ├── CreateItemModal.tsx   # Modal de criação (8 tipos)
│       │   │       ├── ViewItemModal.tsx     # Modal de visualização
│       │   │       └── VaultItemCard.tsx     # Card na grid
│       │   ├── crypto/
│       │   │   ├── core.ts         # Argon2id, AES-256-GCM, key derivation
│       │   │   ├── password.ts     # Gerador/avaliador de senhas
│       │   │   └── totp.ts         # Geração TOTP
│       │   ├── hooks/
│       │   │   ├── useAuth.ts      # Zustand: login, register, logout
│       │   │   ├── useVault.ts     # Zustand: MEK, encrypt/decrypt, CRUD
│       │   │   └── useTheme.ts     # Dark/light mode
│       │   ├── lib/
│       │   │   ├── api.ts          # apiFetch() — wrapper com interceptors
│       │   │   └── utils.ts        # Utilitários
│       │   ├── pages/
│       │   │   ├── LoginPage.tsx
│       │   │   ├── RegisterPage.tsx
│       │   │   └── DashboardPage.tsx
│       │   ├── vault/
│       │   │   ├── service.ts      # VaultService: encrypt/decrypt
│       │   │   ├── types.ts        # Interfaces TypeScript (8 tipos)
│       │   │   └── fileUpload.ts   # Stub de upload
│       │   └── styles/
│       │       └── globals.css     # Tailwind directives
│       └── package.json
│
├── docs/                           # Documentação técnica
├── scripts/                        # Scripts de setup/deploy
├── docker-compose.yml              # PostgreSQL + Redis
├── vercel.json                     # Config Vercel (SPA)
├── render.yaml                     # Config Render (API)
└── package.json                    # Monorepo root
```

---

## ⚙️ Variáveis de Ambiente

### API (`apps/api/.env`)

| Variável | Obrigatória | Default | Descrição |
|----------|-------------|---------|-----------|
| `DATABASE_URL` | ✅ | `postgresql://vault_user:password@localhost:5432/zeroguard` | Conexão PostgreSQL |
| `JWT_SECRET` | ✅ | `CHANGE_THIS_IN_PRODUCTION` | Segredo para assinar JWTs |
| `PORT` | Não | `3001` | Porta da API |
| `CORS_ORIGIN` | Não | `http://localhost:3001` | Origem permitida para CORS |
| `NODE_ENV` | Não | `development` | Ambiente |
| `REDIS_URL` | Não | — | URL do Redis (opcional) |

### Web (`apps/web/.env`)

| Variável | Obrigatória | Default | Descrição |
|----------|-------------|---------|-----------|
| `VITE_API_URL` | Não | `http://localhost:3001` | URL base da API |

---

## 📌 TODO — O que Falta

Veja [ROADMAP.md](./ROADMAP.md) para a lista completa e priorizada.

---

## 📖 Documentação Adicional

| Guia | Descrição |
|------|-----------|
| [START_HERE.md](./START_HERE.md) | Ponto de partida para novos contribuidores |
| [LOCAL_SETUP.md](./LOCAL_SETUP.md) | Setup local detalhado passo a passo |
| [PRODUCTION.md](./PRODUCTION.md) | Guia completo de deploy em produção |
| [ROADMAP.md](./ROADMAP.md) | Roadmap + TODO list detalhado |
| [QUICK_START.md](./QUICK_START.md) | Guia rápido |
| [FAQ.md](./FAQ.md) | Perguntas frequentes |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Arquitetura técnica |
| [docs/THREAT_MODEL.md](./docs/THREAT_MODEL.md) | Modelo de ameaças |
| [docs/API.md](./docs/API.md) | Documentação da API REST |

---

**Licença:** MIT  
**Versão:** 0.9.0-alpha