# ❓ FAQ - Perguntas Frequentes

Respostas rápidas para as dúvidas mais comuns sobre o ZeroGuard.

---

## 🏁 Começando

### Por onde devo começar?

**Primeira vez aqui?**
→ [START_HERE.md](./START_HERE.md)

**Já sei o que fazer:**
→ [LOCAL_SETUP.md](./LOCAL_SETUP.md) (setup detalhado)
→ [QUICK_START.md](./QUICK_START.md) (comandos rápidos)

---

### Quais são os pré-requisitos?

- Node.js 18 ou superior
- PostgreSQL 15 ou superior
- Git
- 8GB RAM (mínimo)
- 2GB espaço em disco

**Detalhes:** [LOCAL_SETUP.md - Pré-requisitos](./LOCAL_SETUP.md#-pré-requisitos)

---

### Quanto tempo leva para configurar?

- **Primeira vez:** ~20-30 minutos
- **Já configurado antes:** ~5 minutos
- **Com Docker:** ~10 minutos (futuro)

---

## ⚙️ Configuração

### Como configurar o banco de dados?

```bash
# 1. Criar database
psql -U postgres -c "CREATE DATABASE zeroguard_dev;"

# 2. Configurar DATABASE_URL no .env
DATABASE_URL="postgresql://postgres:senha@localhost:5432/zeroguard_dev"

# 3. Executar migrations
cd apps/api
npm run prisma:migrate:dev
```

**Guia completo:** [LOCAL_SETUP.md - Configurar Banco de Dados](./LOCAL_SETUP.md#%EF%B8%8F-configurar-banco-de-dados)

---

### O que colocar no arquivo .env?

**Backend (apps/api/.env):**
```env
DATABASE_URL="postgresql://postgres:senha@localhost:5432/zeroguard_dev"
JWT_SECRET="dev-secret-change-in-production"
CORS_ORIGIN="http://localhost:3000"
```

**Frontend (apps/web/.env):**
```env
VITE_API_URL=http://localhost:4000
```

**Template completo:** Copie de `.env.example`

---

### Como gerar secrets para produção?

```powershell
# Windows
.\scripts\generate-secrets.ps1

# Linux/Mac
bash scripts/generate-secrets.sh
```

Isso gera todas as secrets necessárias!

---

## 🚀 Executando

### Como iniciar o projeto?

**Opção 1 - Tudo junto:**
```bash
npm run dev
```

**Opção 2 - Separado:**
```bash
# Terminal 1 - Backend
cd apps/api
npm run dev

# Terminal 2 - Frontend
cd apps/web
npm run dev
```

**Acesse:** http://localhost:3000

---

### Como parar os servidores?

Pressione `Ctrl+C` nos terminais onde estão rodando.

---

### Como reiniciar tudo do zero?

```bash
# 1. Parar servidores (Ctrl+C)

# 2. Limpar cache
rm -rf node_modules/.vite           # Linux/Mac
rmdir /s node_modules\.vite         # Windows

# 3. Reinstalar
npm install

# 4. Resetar banco (APAGA DADOS!)
cd apps/api
npm run prisma:migrate:reset

# 5. Recriar migrations
npm run prisma:migrate:dev

# 6. Reiniciar
cd ../..
npm run dev
```

---

## 🌐 Rede Local

### Como acessar do celular?

**1. Descobrir IP do computador:**
```powershell
ipconfig  # Windows
```

Procure por IPv4 (ex: 192.168.1.100)

**2. Configurar backend:**
```env
# apps/api/.env
HOST=0.0.0.0
CORS_ORIGIN="http://192.168.1.100:3000"
```

**3. Configurar frontend:**
```env
# apps/web/.env
VITE_API_URL=http://192.168.1.100:4000
```

**4. Reiniciar servidores**

**5. Acessar no celular:**
`http://192.168.1.100:3000`

**Mais detalhes:** [LOCAL_SETUP.md - Acessar na Rede](./LOCAL_SETUP.md#-acessar-na-rede-local)

---

### Por que não consigo acessar da rede?

**Checklist:**
- [ ] Dispositivos na mesma rede Wi-Fi?
- [ ] Backend tem `HOST=0.0.0.0`?
- [ ] Frontend tem IP correto no `.env`?
- [ ] Firewall permite portas 3000 e 4000?
- [ ] Servidores foram reiniciados após mudar `.env`?

**Windows:** Libere portas no firewall ([ver guia](./LOCAL_SETUP.md#-configurar-firewall-windows))

---

## 🐛 Problemas Comuns

### "Port 4000 is already in use"

**Solução:**
```powershell
# Windows
netstat -ano | findstr :4000
taskkill /PID <numero> /F

# Linux/Mac
lsof -ti:4000 | xargs kill -9
```

---

### "Cannot connect to database"

**Verificar se PostgreSQL está rodando:**
```bash
# Windows
Get-Service -Name postgresql*

# Linux
sudo systemctl status postgresql
```

**Se parado, iniciar:**
```bash
# Windows: Serviços → PostgreSQL → Iniciar

# Linux
sudo systemctl start postgresql
```

**Verificar DATABASE_URL no .env**

---

### "Module not found"

**Solução:**
```bash
# Reinstalar dependências
rm -rf node_modules package-lock.json  # Linux/Mac
rmdir /s /q node_modules && del package-lock.json  # Windows
npm install
```

---

### Frontend mostra tela branca

**1. Abrir DevTools (F12)**

**2. Ver Console por erros**

**3. Comum: CORS error**
- Backend `.env`: `CORS_ORIGIN="http://localhost:3000"`
- Frontend `.env`: `VITE_API_URL=http://localhost:4000`
- Reiniciar ambos

---

### "Prisma Client did not initialize yet"

**Solução:**
```bash
cd apps/api
npm run prisma:generate
```

---

### Login não funciona (sempre erro)

**Verificar:**
1. Backend está rodando? (`http://localhost:4000/health`)
2. Frontend aponta para backend correto? (ver `.env`)
3. CORS configurado? (ver backend `.env`)
4. Usuário foi criado? (testar registro primeiro)

**Debug:**
```bash
# Ver logs do backend
cd apps/api
npm run dev -- --log-level debug
```

---

## 🚀 Deploy

### Quanto custa hospedar?

| Plan | Custo/mês | Stack |
|------|-----------|-------|
| **Grátis** | $0-1 | Vercel + Render Free + Supabase |
| **Starter** | $8 | Vercel + Render Starter + Neon |
| **Pro** | $50-70 | Vercel Pro + Railway + Neon Pro |

**Detalhes:** [HOSTING_COMPARISON.md - Cenários de Custo](./HOSTING_COMPARISON.md#-cenários-de-custo)

---

### Onde hospedar?

**Para começar (grátis):**
- Frontend: Vercel
- Backend: Render Free
- Database: Supabase

**Para produção:**
- Frontend: Vercel ou Cloudflare Pages
- Backend: Render Starter ou Railway
- Database: Neon ou Supabase Pro

**Comparação completa:** [HOSTING_COMPARISON.md](./HOSTING_COMPARISON.md)

---

### Como fazer deploy?

**1. Preparação:**
```powershell
.\scripts\generate-secrets.ps1            # Gerar secrets
.\scripts\pre-deploy-check.ps1            # Verificar tudo
```

**2. Deploy:**
- **Backend:** Conectar GitHub no Render
- **Frontend:** `vercel --prod` ou conectar GitHub

**Guia completo:** [PRODUCTION.md](./PRODUCTION.md)
**Checklist:** [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md)

---

## 🔧 Desenvolvimento

### Como adicionar uma nova rota no backend?

```typescript
// apps/api/src/routes/exemplo.ts
import { FastifyInstance } from 'fastify';

export async function exemploRoutes(app: FastifyInstance) {
  app.get('/exemplo', async () => {
    return { mensagem: 'Hello World' };
  });
}

// apps/api/src/server.ts
import { exemploRoutes } from './routes/exemplo';
app.register(exemploRoutes, { prefix: '/api' });
```

---

### Como adicionar uma nova página no frontend?

```tsx
// apps/web/src/pages/NovaPage.tsx
export default function NovaPage() {
  return <div>Minha nova página</div>;
}

// apps/web/src/App.tsx
import NovaPage from './pages/NovaPage';

<Route path="/nova" element={<NovaPage />} />
```

---

### Como ver dados no banco?

```bash
cd apps/api
npm run prisma:studio
```

Abre interface web em `http://localhost:5555`

---

### Como adicionar nova tabela no banco?

```prisma
// apps/api/prisma/schema.prisma
model MinhaTabela {
  id        String   @id @default(uuid())
  nome      String
  createdAt DateTime @default(now())
}
```

```bash
npm run prisma:migrate:dev --name adicionar_minha_tabela
```

---

## 🔐 Segurança

### É seguro para produção?

**Atualmente:** NÃO! Este é um projeto de desenvolvimento.

**Para produção, você precisa:**
- ✅ Trocar secrets de desenvolvimento
- ✅ Configurar HTTPS
- ✅ Ativar rate limiting
- ✅ Implementar logging
- ✅ Configurar backups
- ✅ Usar variáveis de ambiente seguras

**Guia:** [PRODUCTION.md](./PRODUCTION.md)

---

### Como funciona a autenticação?

Atualmente usa mock com localStorage.

**Para entender:**
→ [AUTHENTICATION.md](./apps/web/AUTHENTICATION.md)

**Para produção:**
- Implementar Argon2id para hashing
- Usar JWT tokens
- Implementar refresh tokens
- Conectar com API real

---

### Os dados são criptografados?

**Frontend atual:** Não (mock).

**Arquitetura planejada:** Sim!
- Criptografia client-side (AES-256-GCM)
- Derivação de chaves com Argon2id
- Zero-knowledge (servidor nunca vê dados)

**Detalhes:** [README.md - Encryption Lifecycle](./README.md#-encryption-lifecycle)

---

## 📚 Documentação

### Qual documentação devo ler?

**Depende do seu objetivo:**

| Objetivo | Documentação |
|----------|--------------|
| Setup inicial | [LOCAL_SETUP.md](./LOCAL_SETUP.md) |
| Comandos rápidos | [QUICK_START.md](./QUICK_START.md) |
| Deploy | [PRODUCTION.md](./PRODUCTION.md) |
| Entender arquitetura | [README.md](./README.md) |
| Navegação rápida | [START_HERE.md](./START_HERE.md) |
| Índice completo | [INDEX.md](./INDEX.md) |

---

### Onde encontro exemplos de código?

- **Backend:** `apps/api/src/routes/`
- **Frontend:** `apps/web/src/pages/`
- **Componentes:** `apps/web/src/components/`
- **Hooks:** `apps/web/src/hooks/`

Leia os comentários no código!

---

## 🎯 Melhorias Futuras

### Está planejado adicionar...?

**Em breve:**
- ✅ Docker setup
- ✅ Integração com API real
- ✅ Criptografia end-to-end
- ✅ CRUD completo de vault items
- ✅ Gerador de senhas
- ✅ Autenticador TOTP

**Futuro:**
- ✅ Apps mobile (React Native)
- ✅ Extensão de navegador
- ✅ Compartilhamento seguro
- ✅ Auditoria de senhas

---

## 🆘 Ainda com Dúvidas?

### Onde buscar ajuda?

1. **Buscar neste FAQ** (Ctrl+F)
2. **Consultar guias:**
   - [LOCAL_SETUP.md](./LOCAL_SETUP.md) - Problemas de setup
   - [PRODUCTION.md](./PRODUCTION.md) - Problemas de deploy
3. **Ver logs dos servidores** (terminal)
4. **Abrir DevTools** (F12) e ver Console
5. **Ler comentários no código**

---

### Logs úteis

**Backend:**
```bash
cd apps/api
npm run dev -- --log-level debug
```

**Database:**
```bash
cd apps/api
npm run prisma:studio
```

**Frontend:**
- Abrir DevTools (F12)
- Aba "Console"
- Aba "Network" (para ver requisições)

---

## 💡 Dicas Finais

- 📌 Use `Ctrl+F` para buscar neste FAQ
- 🔖 Marque este arquivo para referência
- ✅ Sempre verifique os logs quando algo der errado
- 🎯 Siga um guia por vez
- 📖 Leia os comentários no código
- 🐛 Erros geralmente dizem o que está errado

---

**Não encontrou sua resposta?**

→ Veja o índice completo: [INDEX.md](./INDEX.md)
→ Ou consulte os guias específicos listados acima

---

_Última atualização: 07 de fevereiro de 2026_
