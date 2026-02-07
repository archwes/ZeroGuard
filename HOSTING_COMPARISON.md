# 🏢 Comparação de Plataformas de Hospedagem

## Hospedagem de Interface

### Comparação Rápida

| Plataforma | Plano Gratuito | Build/mês | CDN | Implantação | Edge | Recomendação |
|------------|-----------|-----------|-----|--------|------|--------------|
| **Vercel** | ✅ Ilimitado | 6,000 min | ✅ Global | Git push | ✅ | ⭐⭐⭐⭐⭐ |
| **Netlify** | ✅ 300 min | 300 min | ✅ Global | Git push | ✅ | ⭐⭐⭐⭐ |
| **Cloudflare Pages** | ✅ Ilimitado | 500/mês | ✅ Global | Git push | ✅ | ⭐⭐⭐⭐⭐ |
| **GitHub Pages** | ✅ Ilimitado | - | ✅ | Git push | ❌ | ⭐⭐⭐ |

### Detalhes

#### 🥇 Vercel (Recomendado)
**Melhor para:** React, Next.js, Vite

**Pros:**
- ✅ Implantação automática no push
- ✅ Implantações de preview para PRs
- ✅ Funções edge gratuitas
- ✅ Analytics incluído
- ✅ Excelente experiência de desenvolvimento

**Cons:**
- ⚠️ Limite de largura de banda (100GB/mês gratuito)
- ⚠️ Funções serverless têm timeout de 10s (gratuito)

**Preço:**
- Gratuito: $0/mês
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
- ✅ Largura de banda ilimitada
- ✅ Proteção DDoS gratuita
- ✅ Web Analytics gratuito

**Cons:**
- ⚠️ Limite de build: 500/mês (gratuito)
- ⚠️ UI menos intuitivo

**Preço:**
- Gratuito: $0/mês (sempre)
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
- ✅ Manipulação de formulários gratuita
- ✅ Identity/Auth integrado
- ✅ Teste split A/B

**Cons:**
- ⚠️ Minutos de build limitados (300/mês)
- ⚠️ Funções limitadas (125k/mês)

**Preço:**
- Gratuito: $0/mês
- Pro: $19/mês
- Team: $99/mês

---

## Hospedagem de Servidor

### Comparação Rápida

| Plataforma | Gratuito | RAM | CPU | Armazenamento | Banco de Dados | Recomendação |
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
- ✅ Implantação automática no Git push
- ✅ PostgreSQL gerenciado
- ✅ SSL gratuito
- ✅ Zero configuração

**Cons:**
- ⚠️ Plano gratuito tem cold start (desliga após 15 min)
- ⚠️ Apenas 512MB RAM (gratuito)

**Preço:**
- Gratuito: $0/mês (com limitações)
- Inicial: $7/mês (sempre ativo)
- Padrão: $25/mês (2GB RAM)

**Banco de Dados:**
- Gratuito: $0 (90 dias, depois $7/mês)
- Inicial: $7/mês (1GB)
- Profissional: $25/mês (10GB)

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
- ✅ Banco de dados PostgreSQL incluído
- ✅ Excelente experiência de desenvolvimento
- ✅ Volume persistente
- ✅ Monitoramento integrado
- ✅ Sem cold start

**Cons:**
- ⚠️ Não tem plano gratuito real (apenas $5 de crédito)
- ⚠️ Cobra por uso (pode ser imprevisível)

**Preço:**
- Desenvolvedor: $5 crédito/mês
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
**Melhor para:** Implantação global na borda

**Pros:**
- ✅ 3 VMs gratuitas (256MB cada)
- ✅ Implantar em múltiplas regiões
- ✅ Mais próximo dos usuários
- ✅ IPv6 nativo

**Cons:**
- ⚠️ Configuração mais complexa (Dockerfile)
- ⚠️ 256MB RAM (muito baixo)
- ⚠️ Banco de dados não incluído

**Preço:**
- Gratuito: 3 VMs (256MB)
- Pago: $1.94/VM/mês (256MB)

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
- ✅ Bancos de dados gerenciados bons
- ✅ Armazenamento de objetos (Spaces)

**Cons:**
- ⚠️ Sem plano gratuito
- ⚠️ Requer mais configuração manual
- ⚠️ Sem implantação automática

**Preço:**
- Droplet: $6-12/mês
- Banco Gerenciado: $15/mês
- Plataforma de App: $5/mês

---

## Hospedagem de Banco de Dados

### Comparação Rápida

| Plataforma | Gratuito | Armazenamento | Largura de Banda | Backups | Recomendação |
|------------|------|---------|-----------|---------|--------------|
| **Supabase** | ✅ | 500MB | 2GB | ❌ | ⭐⭐⭐⭐⭐ |
| **Neon** | ✅ | 3GB | ∞ | ✅ | ⭐⭐⭐⭐⭐ |
| **PlanetScale** | ✅ | 5GB | 1B reads | ✅ | ⭐⭐⭐⭐ |
| **Railway** | ❌ | 10GB | ∞ | ✅ | ⭐⭐⭐⭐ |

### Detalhes

#### 🥇 Supabase (Melhor Plano Gratuito)
**PostgreSQL completo + Realtime + Auth**

**Pros:**
- ✅ 500MB armazenamento grátis
- ✅ 2GB largura de banda
- ✅ Subscrições em tempo real
- ✅ Auth integrado
- ✅ Armazenamento de arquivos
- ✅ API REST automática

**Cons:**
- ⚠️ Sem backups automáticos (gratuito)
- ⚠️ Projeto pausa após 1 semana de inatividade

**Preço:**
- Gratuito: $0/mês
- Profissional: $25/mês (8GB + backups)
- Equipe: $599/mês

---

#### 🥇 Neon (Melhor Serverless)
**PostgreSQL serverless com autoscaling**

**Pros:**
- ✅ 3GB armazenamento grátis
- ✅ Largura de banda ilimitada
- ✅ Backups automáticos
- ✅ Ramificação de banco de dados (staging)
- ✅ Escala para zero

**Cons:**
- ⚠️ Limita horas de computação (100h/mês gratuito)

**Preço:**
- Gratuito: $0/mês
- Profissional: $19/mês
- Escalado: $69/mês

---

#### 🥈 PlanetScale (MySQL)
**MySQL serverless da Vitess**

**Pros:**
- ✅ 5GB armazenamento
- ✅ 1 bilhão de leituras/mês
- ✅ Ramificação de banco de dados
- ✅ Migrações de esquema sem downtime

**Cons:**
- ⚠️ MySQL (não PostgreSQL)
- ⚠️ Removeu plano gratuito (mas ainda tem)

---

## 💰 Cenários de Custo

### 🆓 Cenário Gratuito (Projeto Hobby)
```
Interface: Vercel Gratuito
Servidor: Render Gratuito (750h)
Banco de Dados: Supabase Gratuito (500MB)
Domínio: Freenom (.tk/.ml) ou Namecheap ($0.88)

Total: ~$0-1/mês
Limitações: Cold starts, 500MB armazenamento, sem backups
```

### 💵 Cenário Inicial (Projeto Pessoal)
```
Interface: Vercel Gratuito
Servidor: Render Inicial ($7)
Banco de Dados: Neon Gratuito (3GB)
Domínio: Namecheap ($10/ano)

Total: ~$8/mês
Benefícios: Sem cold start, 3GB armazenamento, backups
```

### 💰 Cenário Crescimento (Pequeno negócio)
```
Interface: Vercel Pro ($20)
Servidor: Render Padrão ($25)
Banco de Dados: Neon Pro ($19)
Monitoramento: Sentry Equipe ($26)
Domínio + SSL: ($1)

Total: ~$91/mês
Benefícios: Analytics, 10GB BD, rastreamento de erros, SLA
```

### 🏢 Cenário Produção (Enterprise)
```
Interface: Cloudflare Workers ($5-20)
Servidor: Digital Ocean Droplets ($24)
Banco de Dados: DO PostgreSQL Gerenciado ($30)
Redis: Upstash ($10)
Monitoramento: Datadog ($31)
Backups: DO Spaces ($5)

Total: ~$105-130/mês
Benefícios: Controle total, SLA 99.99%, suporte
```

---

## 🎯 Recomendação por Caso de Uso

### Iniciante / Aprendizado
✅ **Vercel + Render Gratuito + Supabase**
- Custo: $0-1/mês
- Mais fácil de configurar
- Implantação em minutos

### Projeto Pessoal / MVP
✅ **Vercel + Render Inicial + Neon Gratuito**
- Custo: ~$8/mês
- Sem cold starts
- Backups automáticos

### Startup / SaaS
✅ **Vercel Pro + Railway + Neon Pro**
- Custo: ~$50-70/mês
- Escalável
- Ótima experiência de desenvolvimento

### Enterprise / Alto Tráfego
✅ **Cloudflare + Digital Ocean + AWS RDS**
- Custo: $200-500/mês
- Máximo controle
- SLA garantido

---

## 📊 Tabela de Decisão Rápida

| Prioridade | Interface | Servidor | Banco de Dados |
|------------|----------|---------|----------|
| **Custo** | Vercel Gratuito | Render Gratuito | Supabase |
| **Performance** | Cloudflare | Fly.io | Neon |
| **Experiência** | Vercel | Railway | Supabase |
| **Controle** | Cloudflare | Digital Ocean | PostgreSQL auto-hospedado |
| **Escalabilidade** | Vercel Pro | AWS ECS | AWS RDS |

---

## 🔗 Links Oficiais

### Interface
- [Vercel](https://vercel.com)
- [Netlify](https://netlify.com)
- [Cloudflare Pages](https://pages.cloudflare.com)

### Servidor
- [Render](https://render.com)
- [Railway](https://railway.app)
- [Fly.io](https://fly.io)
- [Digital Ocean](https://digitalocean.com)

### Banco de Dados
- [Supabase](https://supabase.com)
- [Neon](https://neon.tech)
- [PlanetScale](https://planetscale.com)

### Monitoring
- [Sentry](https://sentry.io)
- [Datadog](https://datadoghq.com)
- [UptimeRobot](https://uptimerobot.com)
