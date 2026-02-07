# 🏢 Comparação de Plataformas de Hosting

## Frontend Hosting

### Comparação Rápida

| Plataforma | Free Tier | Build/mês | CDN | Deploy | Edge | Recomendação |
|------------|-----------|-----------|-----|--------|------|--------------|
| **Vercel** | ✅ Ilimitado | 6,000 min | ✅ Global | Git push | ✅ | ⭐⭐⭐⭐⭐ |
| **Netlify** | ✅ 300 min | 300 min | ✅ Global | Git push | ✅ | ⭐⭐⭐⭐ |
| **Cloudflare Pages** | ✅ Ilimitado | 500/mês | ✅ Global | Git push | ✅ | ⭐⭐⭐⭐⭐ |
| **GitHub Pages** | ✅ Ilimitado | - | ✅ | Git push | ❌ | ⭐⭐⭐ |

### Detalhes

#### 🥇 Vercel (Recomendado)
**Melhor para:** React, Next.js, Vite

**Pros:**
- ✅ Deploy automático no push
- ✅ Preview deployments para PRs
- ✅ Edge functions gratuitas
- ✅ Analytics incluído
- ✅ Excelente DX

**Cons:**
- ⚠️ Limite de bandwidth (100GB/mês free)
- ⚠️ Funções serverless têm timeout de 10s (free)

**Preço:**
- Free: $0/mês
- Pro: $20/mês
- Team: $40/mês

**Setup:**
```bash
npm install -g vercel
vercel --prod
```

---

#### 🥈 Cloudflare Pages
**Melhor para:** Performance máxima

**Pros:**
- ✅ CDN mais rápido do mundo
- ✅ Unlimited bandwidth
- ✅ DDoS protection gratuito
- ✅ Web Analytics free

**Cons:**
- ⚠️ Build limit: 500/mês (free)
- ⚠️ UI menos intuitivo

**Preço:**
- Free: $0/mês (sempre)
- Workers: $5/mês (opcional)

**Setup:**
```bash
npm install -g wrangler
wrangler pages deploy apps/web/dist
```

---

#### 🥉 Netlify
**Melhor para:** JAMstack

**Pros:**
- ✅ Forms handling gratuito
- ✅ Identity/Auth built-in
- ✅ Split testing A/B

**Cons:**
- ⚠️ Build minutes limitados (300/mês)
- ⚠️ Functions limitadas (125k/mês)

**Preço:**
- Free: $0/mês
- Pro: $19/mês
- Team: $99/mês

---

## Backend Hosting

### Comparação Rápida

| Plataforma | Free | RAM | CPU | Storage | Database | Recomendação |
|------------|------|-----|-----|---------|----------|--------------|
| **Render** | 750h | 512MB | 0.5 | 1GB | Extra | ⭐⭐⭐⭐⭐ |
| **Railway** | $5 | 8GB | 8 | 10GB | Incluído | ⭐⭐⭐⭐⭐ |
| **Fly.io** | 3 VMs | 256MB | Shared | 3GB | Extra | ⭐⭐⭐⭐ |
| **Heroku** | ❌ | - | - | - | Extra | ⭐⭐ |
| **Digital Ocean** | ❌ | 1GB | 1 | 25GB | Extra | ⭐⭐⭐⭐ |

### Detalhes

#### 🥇 Render (Recomendado)
**Melhor para:** Node.js, APIs REST

**Pros:**
- ✅ 750 horas grátis (suficiente para 1 app)
- ✅ Auto-deploy no Git push
- ✅ Managed PostgreSQL
- ✅ SSL gratuito
- ✅ Zero configuração

**Cons:**
- ⚠️ Free tier tem cold start (spin down após 15 min)
- ⚠️ Apenas 512MB RAM (free)

**Preço:**
- Free: $0/mês (com limitações)
- Starter: $7/mês (sempre ativo)
- Standard: $25/mês (2GB RAM)

**Database:**
- Free: $0 (90 dias, depois $7/mês)
- Starter: $7/mês (1GB)
- Pro: $25/mês (10GB)

**Setup:**
```yaml
# render.yaml
services:
  - type: web
    name: zeroguard-api
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
```

---

#### 🥇 Railway (Alternativa Premium)
**Melhor para:** Full-stack com database

**Pros:**
- ✅ Database PostgreSQL incluído
- ✅ Excelente DX
- ✅ Volume persistente
- ✅ Monitoring built-in
- ✅ Sem cold start

**Cons:**
- ⚠️ Não tem free tier real (apenas $5 de crédito)
- ⚠️ Cobra por uso (pode ser imprevisível)

**Preço:**
- Developer: $5 crédito/mês
- Hobby: $5-20/mês (típico)
- Pro: $20-100/mês

**Setup:**
```bash
npm install -g @railway/cli
railway init
railway up
```

---

#### 🥈 Fly.io
**Melhor para:** Global edge deployment

**Pros:**
- ✅ 3 VMs gratuitas (256MB cada)
- ✅ Deploy em múltiplas regiões
- ✅ Mais próximo dos usuários
- ✅ IPv6 nativo

**Cons:**
- ⚠️ Configuração mais complexa (Dockerfile)
- ⚠️ 256MB RAM (muito baixo)
- ⚠️ Database não incluído

**Preço:**
- Free: 3 VMs (256MB)
- Paid: $1.94/VM/mês (256MB)

**Setup:**
```bash
fly launch
fly deploy
```

---

#### 🥉 Digital Ocean
**Melhor para:** Controle total, VPS

**Pros:**
- ✅ Controle completo (SSH, root)
- ✅ Preço previsível
- ✅ Managed databases bons
- ✅ Object storage (Spaces)

**Cons:**
- ⚠️ Sem free tier
- ⚠️ Requer mais setup manual
- ⚠️ Sem deploy automático

**Preço:**
- Droplet: $6-12/mês
- Managed DB: $15/mês
- App Platform: $5/mês

---

## Database Hosting

### Comparação Rápida

| Plataforma | Free | Storage | Bandwidth | Backups | Recomendação |
|------------|------|---------|-----------|---------|--------------|
| **Supabase** | ✅ | 500MB | 2GB | ❌ | ⭐⭐⭐⭐⭐ |
| **Neon** | ✅ | 3GB | ∞ | ✅ | ⭐⭐⭐⭐⭐ |
| **PlanetScale** | ✅ | 5GB | 1B reads | ✅ | ⭐⭐⭐⭐ |
| **Railway** | ❌ | 10GB | ∞ | ✅ | ⭐⭐⭐⭐ |

### Detalhes

#### 🥇 Supabase (Melhor Free Tier)
**PostgreSQL completo + Realtime + Auth**

**Pros:**
- ✅ 500MB storage grátis
- ✅ 2GB bandwidth
- ✅ Realtime subscriptions
- ✅ Auth built-in
- ✅ Storage de arquivos
- ✅ API REST automática

**Cons:**
- ⚠️ Sem backups automáticos (free)
- ⚠️ Projeto pausa após 1 semana de inatividade

**Preço:**
- Free: $0/mês
- Pro: $25/mês (8GB + backups)
- Team: $599/mês

---

#### 🥇 Neon (Melhor Serverless)
**PostgreSQL serverless com autoscaling**

**Pros:**
- ✅ 3GB storage grátis
- ✅ Unlimited bandwidth
- ✅ Backups automáticos
- ✅ Branch database (staging)
- ✅ Scale to zero

**Cons:**
- ⚠️ Limita compute hours (100h/mês free)

**Preço:**
- Free: $0/mês
- Pro: $19/mês
- Scale: $69/mês

---

#### 🥈 PlanetScale (MySQL)
**MySQL serverless da Vitess**

**Pros:**
- ✅ 5GB storage
- ✅ 1 billion reads/mês
- ✅ Database branching
- ✅ Schema migrations sem downtime

**Cons:**
- ⚠️ MySQL (não PostgreSQL)
- ⚠️ Removeu free tier (mas ainda tem)

---

## 💰 Cenários de Custo

### 🆓 Cenário Free (Hobby Project)
```
Frontend: Vercel Free
Backend: Render Free (750h)
Database: Supabase Free (500MB)
Domínio: Freenom (.tk/.ml) ou Namecheap ($0.88)

Total: ~$0-1/mês
Limitações: Cold starts, 500MB storage, sem backups
```

### 💵 Cenário Starter (Side Project)
```
Frontend: Vercel Free
Backend: Render Starter ($7)
Database: Neon Free (3GB)
Domínio: Namecheap ($10/ano)

Total: ~$8/mês
Benefícios: Sem cold start, 3GB storage, backups
```

### 💰 Cenário Growth (Pequeno negócio)
```
Frontend: Vercel Pro ($20)
Backend: Render Standard ($25)
Database: Neon Pro ($19)
Monitoring: Sentry Team ($26)
Domínio + SSL: ($1)

Total: ~$91/mês
Benefícios: Analytics, 10GB DB, error tracking, SLA
```

### 🏢 Cenário Production (Enterprise)
```
Frontend: Cloudflare Workers ($5-20)
Backend: Digital Ocean Droplets ($24)
Database: DO Managed PostgreSQL ($30)
Redis: Upstash ($10)
Monitoring: Datadog ($31)
Backups: DO Spaces ($5)

Total: ~$105-130/mês
Benefícios: Controle total, SLA 99.99%, suporte
```

---

## 🎯 Recomendação por Caso de Uso

### Iniciante / Learning
✅ **Vercel + Render Free + Supabase**
- Custo: $0-1/mês
- Mais fácil de configurar
- Deploy em minutos

### Side Project / MVP
✅ **Vercel + Render Starter + Neon Free**
- Custo: ~$8/mês
- Sem cold starts
- Backups automáticos

### Startup / SaaS
✅ **Vercel Pro + Railway + Neon Pro**
- Custo: ~$50-70/mês
- Escalável
- Ótimo DX

### Enterprise / High Traffic
✅ **Cloudflare + Digital Ocean + AWS RDS**
- Custo: $200-500/mês
- Máximo controle
- SLA garantido

---

## 📊 Tabela de Decisão Rápida

| Prioridade | Frontend | Backend | Database |
|------------|----------|---------|----------|
| **Custo** | Vercel Free | Render Free | Supabase |
| **Performance** | Cloudflare | Fly.io | Neon |
| **DX** | Vercel | Railway | Supabase |
| **Controle** | Cloudflare | Digital Ocean | PostgreSQL self-hosted |
| **Escalabilidade** | Vercel Pro | AWS ECS | AWS RDS |

---

## 🔗 Links Oficiais

### Frontend
- [Vercel](https://vercel.com)
- [Netlify](https://netlify.com)
- [Cloudflare Pages](https://pages.cloudflare.com)

### Backend
- [Render](https://render.com)
- [Railway](https://railway.app)
- [Fly.io](https://fly.io)
- [Digital Ocean](https://digitalocean.com)

### Database
- [Supabase](https://supabase.com)
- [Neon](https://neon.tech)
- [PlanetScale](https://planetscale.com)

### Monitoring
- [Sentry](https://sentry.io)
- [Datadog](https://datadoghq.com)
- [UptimeRobot](https://uptimerobot.com)
