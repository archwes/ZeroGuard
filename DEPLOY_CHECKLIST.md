# 🚀 Deploy Checklist

## ✅ Preparação (Antes de começar)

### 1. Gerar Secrets
```powershell
# Windows
.\scripts\generate-secrets.ps1

# Linux/Mac
bash scripts/generate-secrets.sh
```

**Salve as secrets geradas em um gerenciador de senhas!**

### 2. Escolher Plataformas

#### Backend (escolha uma):
- [ ] **Render** - Fácil, $7/mês (recomendado)
- [ ] **Railway** - Bom DX, $5-20/mês
- [ ] **Fly.io** - Ótima performance
- [ ] **Digital Ocean** - Estável, $12/mês

#### Frontend (escolha uma):
- [ ] **Vercel** - Melhor para React (recomendado)
- [ ] **Netlify** - Alternativa sólida
- [ ] **Cloudflare Pages** - Mais rápido

#### Database (escolha uma):
- [ ] **Supabase** - Free 500MB (recomendado para começar)
- [ ] **Neon** - Free 3GB, excelente
- [ ] **Railway** - Integrado com backend
- [ ] **Digital Ocean** - Managed, $15/mês

---

## 📦 Deploy Backend (Render)

### Passo 1: Criar Database
1. Acesse [Supabase](https://supabase.com) ou [Neon](https://neon.tech)
2. Crie novo projeto
3. Copie a connection string (DATABASE_URL)

### Passo 2: Deploy API
1. Acesse [Render](https://render.com)
2. Conecte seu repositório GitHub
3. Clique "New" → "Blueprint"
4. Aponte para `render.yaml`
5. Configure variáveis de ambiente:
   ```
   DATABASE_URL=postgresql://...
   JWT_SECRET=<secret gerada>
   JWT_REFRESH_SECRET=<secret gerada>
   ENCRYPTION_KEY=<secret gerada>
   CORS_ORIGIN=https://seu-app.vercel.app
   ```
6. Clique "Apply"

### Passo 3: Executar Migrations
```bash
# No terminal do Render ou localmente
npm run prisma:migrate:deploy
```

### Passo 4: Testar
```bash
curl https://sua-api.onrender.com/health
```

✅ Deve retornar: `{"status":"ok",...}`

---

## 🎨 Deploy Frontend (Vercel)

### Passo 1: Instalar CLI
```bash
npm install -g vercel
```

### Passo 2: Configurar Variáveis
Copie `.env.production.example` para `.env.production`:
```env
VITE_API_URL=https://sua-api.onrender.com
VITE_APP_NAME=ZeroGuard
VITE_APP_VERSION=1.0.0
```

### Passo 3: Build Local (testar)
```bash
cd apps/web
npm run build
npm run preview
```

Abra http://localhost:4173 e teste login/registro

### Passo 4: Deploy
```bash
vercel --prod
```

Ou via GitHub:
1. Acesse [Vercel](https://vercel.com)
2. "Import Project"
3. Conecte GitHub
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `apps/web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Adicione variável: `VITE_API_URL`
6. Deploy!

### Passo 5: Configurar CORS no Backend
Atualize `CORS_ORIGIN` no Render com URL do Vercel:
```
CORS_ORIGIN=https://seu-app.vercel.app
```

---

## 🌐 Configurar Domínio (Opcional)

### Passo 1: Comprar Domínio
- [Namecheap](https://namecheap.com) - $8-12/ano
- [Cloudflare Registrar](https://cloudflare.com) - $8-10/ano

### Passo 2: Configurar DNS

**Para Frontend (Vercel):**
1. Vercel Dashboard → Settings → Domains
2. Adicione seu domínio: `meuapp.com`
3. Configure DNS:
   ```
   A     @       76.76.21.21
   CNAME www     cname.vercel-dns.com
   ```

**Para Backend (Render):**
1. Render Dashboard → Settings → Custom Domain
2. Adicione: `api.meuapp.com`
3. Configure DNS:
   ```
   CNAME api     seu-app.onrender.com
   ```

### Passo 3: Atualizar CORS
```env
CORS_ORIGIN=https://meuapp.com,https://www.meuapp.com
```

### Passo 4: Atualizar Frontend
```env
VITE_API_URL=https://api.meuapp.com
```

---

## 🔒 Segurança

### Headers de Segurança
✅ Já configurados em `vercel.json` e `netlify.toml`

### SSL/HTTPS
✅ Automático no Vercel, Render, Netlify

### Rate Limiting
✅ Verificar se está ativo no backend

### Backups Database
```bash
# Configurar backup diário
pg_dump DATABASE_URL | gzip > backup.sql.gz
```

Supabase e Neon fazem backups automáticos.

---

## 📊 Monitoramento

### 1. Uptime Monitoring
- [UptimeRobot](https://uptimerobot.com) - Free
- Adicione monitor para: `https://sua-api.onrender.com/health`

### 2. Error Tracking (Opcional)
- [Sentry](https://sentry.io) - Free tier generoso
```bash
npm install @sentry/node @sentry/react
```

### 3. Analytics (Opcional)
- Google Analytics
- Plausible (privacy-friendly)
- Umami (self-hosted)

---

## ✅ Checklist Final

### Antes de Anunciar
- [ ] Backend respondendo em produção
- [ ] Frontend acessível
- [ ] Login funcionando
- [ ] Registro funcionando
- [ ] Logout funcionando
- [ ] Dashboard carregando
- [ ] HTTPS ativo (cadeado verde)
- [ ] CORS configurado corretamente
- [ ] Nenhum erro no console
- [ ] Responsivo funciona (mobile)

### Testes em Produção
```bash
# 1. Health check
curl https://api.meuapp.com/health

# 2. Registrar usuário
curl -X POST https://api.meuapp.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"SenhaForte123!","name":"Test User"}'

# 3. Fazer login
curl -X POST https://api.meuapp.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"SenhaForte123!"}'

# 4. Verificar CORS
curl -I https://api.meuapp.com \
  -H "Origin: https://meuapp.com"
```

### Performance
- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3.5s

Testar em: https://pagespeed.web.dev/

### Segurança
- [ ] Security headers: https://securityheaders.com
- [ ] SSL test: https://www.ssllabs.com/ssltest/

---

## 💰 Custos Mensais

### Setup Free (começar)
```
✅ Vercel Free
✅ Render Free (750h)
✅ Supabase Free (500MB)
✅ UptimeRobot Free
❌ Domínio: ~$1/mês

Total: ~$1/mês
```

### Setup Recomendado
```
✅ Vercel Free
💵 Render Starter: $7/mês
💵 Neon Scale: $19/mês
✅ Sentry Free
✅ Cloudflare Free
💵 Domínio: $1/mês

Total: ~$27/mês
```

---

## 🆘 Problemas Comuns

### CORS Error
```
Access-Control-Allow-Origin missing
```
**Solução**: Verificar `CORS_ORIGIN` no backend inclui URL do frontend

### Database Connection Error
```
connect ETIMEDOUT
```
**Solução**: Adicionar `?sslmode=require` na DATABASE_URL

### Build Error
```
Cannot find module '@/...'
```
**Solução**: Verificar path aliases em `vite.config.ts`

### 502 Bad Gateway
**Solução**: Backend não iniciou corretamente, verificar logs

---

## 📞 Próximos Passos

Após deploy bem-sucedido:
1. ✅ Configurar domínio personalizado
2. ✅ Ativar monitoramento
3. ✅ Configurar backups
4. ✅ Documentar APIs
5. ✅ Adicionar analytics
6. ✅ Implementar CI/CD

## 🎉 Parabéns!

Seu ZeroGuard está em produção! 🚀

**Links úteis:**
- 📚 [Documentação completa](./PRODUCTION.md)
- 🔧 [Troubleshooting](./PRODUCTION.md#-troubleshooting)
- 💬 [Suporte](./PRODUCTION.md#-suporte)
