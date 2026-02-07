# 🚀 Guia de Implantação em Produção

Este guia cobre todas as configurações necessárias para colocar o ZeroGuard em produção com segurança e performance otimizada.

## 📋 Lista de Verificação Pré-Implantação

### Servidor
- [ ] Banco de dados PostgreSQL configurado
- [ ] Variáveis de ambiente configuradas
- [ ] Limitação de taxa ativada
- [ ] CORS configurado corretamente
- [ ] HTTPS/SSL configurado
- [ ] Registro habilitado
- [ ] Monitoramento configurado
- [ ] Backups automáticos

### Interface
- [ ] Compilação de produção testada
- [ ] Variáveis de ambiente configuradas
- [ ] CDN configurado (opcional)
- [ ] Service Worker para PWA (opcional)
- [ ] Analytics configurado (opcional)

### Segurança
- [ ] Senhas fortes configuradas
- [ ] Segredos rotacionados
- [ ] Firewall configurado
- [ ] CSP (Política de Segurança de Conteúdo)
- [ ] Cabeçalhos de segurança
- [ ] Certificado SSL válido

---

## 1️⃣ Banco de Dados PostgreSQL

### Opções de Hospedagem

#### A) Banco de Dados Gerenciado (Recomendado)
- **Supabase** (Plano gratuito: 500MB, 2GB transferência)
- **Neon** (Plano gratuito: 3GB, dimensionamento automático)
- **Railway** ($5/mês, 8GB RAM)
- **AWS RDS** (produção empresarial)
- **Digital Ocean Managed Database** ($15/mês)

#### B) Auto-hospedado
- VPS com PostgreSQL 15+
- Docker Compose com volume persistente

### Configuração

**1. Criar banco de dados:**
```sql
CREATE DATABASE zeroguard;
CREATE USER zeroguard_user WITH PASSWORD 'SENHA_FORTE_AQUI';
GRANT ALL PRIVILEGES ON DATABASE zeroguard TO zeroguard_user;
```

**2. Executar migrações:**
```bash
cd apps/api
npm run prisma:migrate:deploy
```

**3. Configurar backups:**
```bash
# Backup diário (cron job)
0 2 * * * pg_dump -h localhost -U zeroguard_user zeroguard | gzip > /backups/zeroguard_$(date +\%Y\%m\%d).sql.gz
```

**4. Reter apenas últimos 30 dias:**
```bash
find /backups -name "zeroguard_*.sql.gz" -mtime +30 -delete
```

---

## 2️⃣ Servidor (API Fastify)

### Opções de Hospedagem

| Provedor | Plano Gratuito | Preço | Recomendação |
|----------|----------------|-------|--------------|
| **Render** | 750h/mês | $0-7/mês | ✅ Melhor para começar |
| **Railway** | $5 crédito | $5-20/mês | ✅ Ótima experiência |
| **Fly.io** | 3 VMs | $0-10/mês | ✅ Performance |
| **Digital Ocean** | - | $5-12/mês | ✅ Estável |
| **AWS/GCP** | Complexo | Variável | 🏢 Empresarial |

### Implantar no Render (Recomendado)

**1. Criar `render.yaml`:**
```yaml
services:
  - type: web
    name: zeroguard-api
    env: node
    region: oregon
    plan: starter # $7/mês
    buildCommand: cd apps/api && npm install && npm run build
    startCommand: cd apps/api && npm run start:prod
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 4000
      - key: DATABASE_URL
        sync: false # Configurar manualmente
      - key: JWT_SECRET
        generateValue: true
      - key: JWT_REFRESH_SECRET
        generateValue: true
      - key: ENCRYPTION_KEY
        generateValue: true
    healthCheckPath: /health
```

**2. Variáveis de Ambiente:**

Criar arquivo `.env.production` (NÃO commitar):
```env
# Servidor
NODE_ENV=production
PORT=4000
HOST=0.0.0.0

# Banco de dados (Supabase/Neon/Railway)
DATABASE_URL="postgresql://user:password@host:5432/zeroguard?sslmode=require"

# JWT
JWT_SECRET="SEGREDO_ALEATORIO_64_CARACTERES_AQUI"
JWT_REFRESH_SECRET="OUTRO_SEGREDO_DIFERENTE_64_CARACTERES"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Criptografia
ENCRYPTION_KEY="CHAVE_256_BITS_BASE64_AQUI"

# CORS
CORS_ORIGIN="https://seu-dominio.com"

# Limitação de Taxa
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW="15m"

# Registro
LOG_LEVEL=info
```

**3. Gerar segredos seguros:**
```bash
# Segredo JWT
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Chave de Criptografia
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**4. Configurar CORS no código:**

Editar `apps/api/src/server.ts`:
```typescript
await app.register(fastifyCors, {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
});
```

**5. Adicionar Verificação de Saúde:**

Criar `apps/api/src/routes/health.ts`:
```typescript
import { FastifyInstance } from 'fastify';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });
}
```

**6. Compilação de produção:**
```bash
cd apps/api
npm run build
npm run start:prod
```

### Implantar no Railway

**1. Instalar CLI do Railway:**
```bash
npm install -g @railway/cli
railway login
```

**2. Inicializar projeto:**
```bash
railway init
railway link
```

**3. Adicionar variáveis:**
```bash
railway variables set DATABASE_URL="postgresql://..."
railway variables set JWT_SECRET="..."
railway variables set NODE_ENV=production
```

**4. Implantar:**
```bash
railway up
```

---

## 3️⃣ Interface (React/Vite)

### Opções de Hospedagem

| Provedor | Plano Gratuito | CDN | Recomendação |
|----------|----------------|-----|--------------|
| **Vercel** | Ilimitado | ✅ | ✅ Melhor para React |
| **Netlify** | 100GB/mês | ✅ | ✅ Alternativa |
| **Cloudflare Pages** | Ilimitado | ✅ | ✅ Mais rápido |
| **GitHub Pages** | Ilimitado | ✅ | ⚠️ Sem APIs |

### Implantar no Vercel (Recomendado)

**1. Instalar CLI:**
```bash
npm install -g vercel
```

**2. Configurar `vercel.json`:**
```json
{
  "version": 2,
  "buildCommand": "cd apps/web && npm run build",
  "outputDirectory": "apps/web/dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://sua-api.render.com"
        }
      ]
    }
  ]
}
```

**3. Variáveis de ambiente:**

Criar `apps/web/.env.production`:
```env
VITE_API_URL=https://sua-api.render.com
VITE_APP_NAME=ZeroGuard
VITE_APP_VERSION=1.0.0
```

**4. Atualizar cliente da API:**

Editar `apps/web/src/api/client.ts`:
```typescript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para atualização de token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        localStorage.setItem('token', data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

**5. Compilação de produção:**
```bash
cd apps/web
npm run build
npm run preview # Testar compilação localmente
```

**6. Implantar:**
```bash
vercel --prod
```

### Implantar no Netlify

**1. Criar `netlify.toml`:**
```toml
[build]
  base = "apps/web"
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

**2. Implantar:**
```bash
npm install -g netlify-cli
netlify deploy --prod
```

---

## 4️⃣ Domínio e SSL

### Configurar Domínio

**1. Comprar domínio:**
- Namecheap ($8-12/ano)
- Google Domains ($12/ano)
- Cloudflare Registrar ($8-10/ano)

**2. Configurar DNS:**

Para frontend (Vercel):
```
A     @        76.76.21.21
CNAME www      cname.vercel-dns.com
```

Para servidor (Render):
```
CNAME api      your-app.onrender.com
```

**3. SSL/HTTPS:**

✅ **Automático** em Vercel, Netlify, Render, Railway
- Certificado Let's Encrypt gratuito
- Renovação automática
- Redirecionamento HTTP → HTTPS

### Cloudflare (Opcional mas Recomendado)

**Benefícios:**
- Cache global (CDN)
- Proteção DDoS
- Firewall WAF
- Analytics
- **Plano gratuito generoso**

**Configuração:**
1. Adicionar site no Cloudflare
2. Mudar nameservers do domínio
3. Ativar SSL/TLS (modo "Full")
4. Ativar "Always Use HTTPS"
5. Regras de página para cache

---

## 5️⃣ Segurança

### Cabeçalhos de Segurança

Adicionar no servidor (`apps/api/src/server.ts`):
```typescript
import helmet from '@fastify/helmet';

await app.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
});
```

### Limitação de Taxa

```typescript
import rateLimit from '@fastify/rate-limit';

await app.register(rateLimit, {
  max: 100,
  timeWindow: '15 minutes',
  cache: 10000,
  allowList: ['127.0.0.1'],
  redis: process.env.REDIS_URL, // Opcional
});
```

### CSRF Protection

```typescript
import csrf from '@fastify/csrf-protection';

await app.register(csrf, {
  sessionPlugin: '@fastify/session',
  cookieOpts: {
    signed: true,
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  },
});
```

### Validação de Entrada

Sempre usar Zod ou Joi:
```typescript
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
});

app.post('/auth/login', async (req, reply) => {
  const data = loginSchema.parse(req.body); // Throws se inválido
  // ...
});
```

---

## 6️⃣ Monitoramento e Registro

### Registro de Produção

**Opção 1: Pino (Integrado no Fastify)**
```typescript
const app = fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport:
      process.env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty' }
        : undefined,
  },
});
```

**Opção 2: Winston**
```bash
npm install winston
```

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}
```

### Monitoramento

**Opção 1: Sentry (Recomendado)**
```bash
npm install @sentry/node @sentry/tracing
```

```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

// Frontend
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});
```

**Opção 2: Monitoramento de Tempo de Atividade**
- UptimeRobot (gratuito, 50 monitores)
- Better Stack (plano gratuito)
- Pingdom (pago)

---

## 7️⃣ Performance

### Servidor

**1. Cache com Redis:**
```bash
npm install @fastify/redis
```

```typescript
import redis from '@fastify/redis';

await app.register(redis, {
  host: process.env.REDIS_HOST,
  port: 6379,
});

// Usar cache
app.get('/api/stats', async (req, reply) => {
  const cached = await app.redis.get('stats');
  if (cached) return JSON.parse(cached);

  const stats = await getStats();
  await app.redis.set('stats', JSON.stringify(stats), 'EX', 300); // 5 min
  return stats;
});
```

**2. Compressão:**
```typescript
import compress from '@fastify/compress';

await app.register(compress, {
  global: true,
  threshold: 1024,
});
```

### Interface

**1. Divisão de Código:**
```typescript
// apps/web/src/App.tsx
import { lazy, Suspense } from 'react';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));

<Suspense fallback={<LoadingScreen />}>
  <Routes>
    <Route path="/dashboard" element={<DashboardPage />} />
  </Routes>
</Suspense>
```

**2. Otimizar Compilação:**
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['framer-motion', 'lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
```

**3. Otimização de Imagens:**
```typescript
// Usar Cloudinary ou imgix
const imageUrl = `https://res.cloudinary.com/<cloud-name>/image/upload/w_400,f_auto,q_auto/v1/${imagePath}`;
```

---

## 8️⃣ CI/CD

### GitHub Actions

Criar `.github/workflows/deploy.yml`:
```yaml
name: Implantar em Produção

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run test
      - run: npm run lint

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Implantar no Render
        run: |
          curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK }}

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd apps/web && npm install && npm run build
      - name: Implantar no Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

---

## 9️⃣ Custos Estimados

### Configuração Mínima (Gratuita)
```
Interface: Vercel Gratuito
Servidor: Render Gratuito (750h/mês)
Banco de Dados: Supabase Gratuito (500MB)
Domínio: $10/ano
SSL: Grátis (Let's Encrypt)

Total: ~$1/mês
```

### Configuração Recomendada (Pequena)
```
Interface: Vercel Gratuito + CDN
Servidor: Render Starter ($7/mês)
Banco de Dados: Neon Scale ($19/mês)
Monitoramento: Sentry Gratuito
Redis: Upstash Gratuito

Total: ~$26/mês
```

### Configuração Profissional (Média)
```
Interface: Vercel Pro ($20/mês)
Servidor: Railway Pro ($20/mês)
Banco de Dados: Digital Ocean Managed ($15/mês)
Redis: Upstash Pro ($10/mês)
Monitoramento: Sentry Team ($26/mês)
Backups: Automático

Total: ~$91/mês
```

---

## 🔟 Lista de Verificação Final

### Antes da Implantação
- [ ] Todos os testes passando
- [ ] Compilação de produção funciona localmente
- [ ] Variáveis de ambiente configuradas
- [ ] Segredos gerados e seguros
- [ ] CORS configurado corretamente
- [ ] Limitação de taxa ativada
- [ ] Registro habilitado

### Pós-Implantação
- [ ] Verificação de saúde funcionando
- [ ] SSL/HTTPS ativo
- [ ] Domínio apontando corretamente
- [ ] Interface → Servidor comunicando
- [ ] Login/Registro funcionando
- [ ] Monitoramento ativo
- [ ] Backups configurados
- [ ] Documentação atualizada

### Testes em Produção
```bash
# Verificação de saúde
curl https://api.seudominio.com/health

# Login
curl -X POST https://api.seudominio.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"senha123"}'

# CORS
curl -I https://api.seudominio.com \
  -H "Origin: https://seudominio.com"
```

---

## 📚 Recursos Adicionais

### Documentação
- [Fastify Production Best Practices](https://www.fastify.io/docs/latest/Guides/Recommendations/)
- [Vite Production Build](https://vitejs.dev/guide/build.html)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)

### Ferramentas
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Performance audit
- [SecurityHeaders.com](https://securityheaders.com) - Security headers check
- [SSL Labs](https://www.ssllabs.com/ssltest/) - SSL/TLS test
- [PageSpeed Insights](https://pagespeed.web.dev/) - Performance metrics

### Comunidades
- [r/selfhosted](https://reddit.com/r/selfhosted)
- [Discord do Fastify](https://discord.gg/fastify)
- [Discord do Vite](https://chat.vitejs.dev/)

---

## 🆘 Solução de Problemas

### Erro de CORS
```
Acesso ao fetch 'https://api.com' da origem 'https://app.com' foi bloqueado pelo CORS
```

**Solução:**
```typescript
// Servidor
await app.register(fastifyCors, {
  origin: 'https://app.com',
  credentials: true,
});
```

### Erro de Conexão com Banco de Dados
```
Error: connect ETIMEDOUT
```

**Checklist:**
- [ ] DATABASE_URL está correto
- [ ] `?sslmode=require` está na URL
- [ ] Firewall permite conexões
- [ ] IP está na whitelist (se aplicável)

### Falha na Compilação
```
Error: Cannot find module '@/components/ui'
```

**Solução:**
```typescript
// vite.config.ts
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
},
```

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs (`heroku logs --tail` ou similar)
2. Teste localmente com compilação de produção
3. Consulte a documentação da plataforma
4. Abra issue no GitHub do projeto

**Boa sorte com a implantação! 🚀**
