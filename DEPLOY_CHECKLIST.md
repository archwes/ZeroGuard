# 🚀 Lista de Verificação de Implantação

## ✅ Preparação (Antes de começar)

### 1. Gerar Segredos
```powershell
# Windows
.\scripts\generate-secrets.ps1

# Linux/Mac
bash scripts/generate-secrets.sh
```

**Salve os segredos gerados em um gerenciador de senhas!**

### 2. Escolher Plataformas

#### Servidor (escolha uma):
- [ ] **Render** - Fácil, $7/mês (recomendado)
- [ ] **Railway** - Boa experiência, $5-20/mês
- [ ] **Fly.io** - Ótima performance
- [ ] **Digital Ocean** - Estável, $12/mês

#### Interface (escolha uma):
- [ ] **Vercel** - Melhor para React (recomendado)
- [ ] **Netlify** - Alternativa sólida
- [ ] **Cloudflare Pages** - Mais rápido

#### Banco de Dados (escolha uma):
- [ ] **Supabase** - Gratuito 500MB (recomendado para começar)
- [ ] **Neon** - Gratuito 3GB, excelente
- [ ] **Railway** - Integrado com servidor
- [ ] **Digital Ocean** - Gerenciado, $15/mês

---

## 📦 Implantar Servidor (Render)

### Passo 1: Criar Banco de Dados
1. Acesse [Supabase](https://supabase.com) ou [Neon](https://neon.tech)
2. Crie novo projeto
3. Copie a string de conexão (DATABASE_URL)

### Passo 2: Implantar API
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

### Passo 3: Executar Migrações
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

## 🎨 Implantar Interface (Vercel)

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

### Passo 3: Compilação Local (testar)
```bash
cd apps/web
npm run build
npm run preview
```

Abra http://localhost:4173 e teste login/registro

### Passo 4: Implantar
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
6. Implante!

### Passo 5: Configurar CORS no Servidor
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

**Para Interface (Vercel):**
1. Vercel Dashboard → Settings → Domains
2. Adicione seu domínio: `meuapp.com`
3. Configure DNS:
   ```
   A     @       76.76.21.21
   CNAME www     cname.vercel-dns.com
   ```

**Para Servidor (Render):**
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

### Passo 4: Atualizar Interface
```env
VITE_API_URL=https://api.meuapp.com
```

---

## 🔒 Segurança

### Cabeçalhos de Segurança
✅ Já configurados em `vercel.json` e `netlify.toml`

### SSL/HTTPS
✅ Automático no Vercel, Render, Netlify

### Limitação de Taxa
✅ Verificar se está ativa no servidor

### Backups do Banco de Dados
```bash
# Configurar backup diário
pg_dump DATABASE_URL | gzip > backup.sql.gz
```

Supabase e Neon fazem backups automáticos.

---

## 📊 Monitoramento

### 1. Monitoramento de Tempo de Atividade
- [UptimeRobot](https://uptimerobot.com) - Gratuito
- Adicione monitor para: `https://sua-api.onrender.com/health`

### 2. Rastreamento de Erros (Opcional)
- [Sentry](https://sentry.io) - Plano gratuito generoso
```bash
npm install @sentry/node @sentry/react
```

### 3. Analytics (Opcional)
- Google Analytics
- Plausible (privacy-friendly)
- Umami (self-hosted)

---

## ✅ Lista de Verificação Final

### Antes de Anunciar
- [ ] Servidor respondendo em produção
- [ ] Interface acessível
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
# 1. Verificação de saúde
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

### Configuração Gratuita (começar)
```
✅ Vercel Gratuito
✅ Render Gratuito (750h)
✅ Supabase Gratuito (500MB)
✅ UptimeRobot Gratuito
❌ Domínio: ~$1/mês

Total: ~$1/mês
```

### Configuração Recomendada
```
✅ Vercel Gratuito
💵 Render Inicial: $7/mês
💵 Neon Scale: $19/mês
✅ Sentry Gratuito
✅ Cloudflare Gratuito
💵 Domínio: $1/mês

Total: ~$27/mês
```

---

## 🆘 Problemas Comuns

### Erro de CORS
```
Access-Control-Allow-Origin missing
```
**Solução**: Verificar `CORS_ORIGIN` no servidor inclui URL da interface

### Erro de Conexão com Banco de Dados
```
connect ETIMEDOUT
```
**Solução**: Adicionar `?sslmode=require` na DATABASE_URL

### Erro de Compilação
```
Cannot find module '@/...'
```
**Solução**: Verificar path aliases em `vite.config.ts`

### 502 Bad Gateway
**Solução**: Servidor não iniciou corretamente, verificar logs

---

## 📞 Próximos Passos

Após implantação bem-sucedida:
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
- 🔧 [Solução de problemas](./PRODUCTION.md#-solução-de-problemas)
- 💬 [Suporte](./PRODUCTION.md#-suporte)
