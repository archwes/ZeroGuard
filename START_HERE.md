# 🎯 COMECE AQUI

Bem-vindo ao ZeroGuard! Este é seu ponto de partida.

---

## 🤔 O que você quer fazer?

### 1️⃣ Rodar o projeto pela primeira vez
**→ Vá para:** [LOCAL_SETUP.md](./LOCAL_SETUP.md)

**Inclui:**
- ✅ Instalação de todas as ferramentas necessárias
- ✅ Configuração do banco de dados
- ✅ Setup completo passo a passo
- ✅ Como acessar de outros dispositivos na rede

**Use junto com:** [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md) para acompanhar progresso

---

### 2️⃣ Já tenho tudo instalado, só quero rodar
**→ Vá para:** [QUICK_START.md](./QUICK_START.md)

**Comandos rápidos:**
```bash
# Instalar dependências
npm install

# Iniciar tudo
npm run dev

# Acessar
http://localhost:3000
```

---

### 3️⃣ Quero colocar em produção (deploy na internet)
**→ Vá para:** [PRODUCTION.md](./PRODUCTION.md)

**Também útil:**
- [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md) - Passo a passo de deploy
- [HOSTING_COMPARISON.md](./HOSTING_COMPARISON.md) - Onde hospedar

**Custo:** $0-100/mês dependendo do plano

---

### 4️⃣ Entender como funciona
**→ Vá para:** [README.md](./README.md)

**Tópicos:**
- Arquitetura de segurança
- Criptografia zero-knowledge
- Fluxos de autenticação
- Estrutura do código

---

## 🚀 Fluxo Recomendado para Iniciantes

```
┌──────────────────────────────────────────────────────┐
│  1. LOCAL_SETUP.md (Setup inicial)                   │
│     ↓                                                 │
│  2. SETUP_CHECKLIST.md (Marcar progresso)            │
│     ↓                                                 │
│  3. Testar localmente (criar conta, login, etc.)     │
│     ↓                                                 │
│  4. QUICK_START.md (Explorar funcionalidades)        │
│     ↓                                                 │
│  5. README.md (Entender arquitetura)                 │
│     ↓                                                 │
│  6. PRODUCTION.md (Quando pronto para deploy)        │
└──────────────────────────────────────────────────────┘
```

---

## 📱 Estrutura do Projeto

```
zeroguard/
├── apps/
│   ├── api/          # Backend (Fastify + Prisma)
│   └── web/          # Frontend (React + Vite)
├── packages/
│   └── crypto/       # Biblioteca de criptografia
├── scripts/          # Scripts úteis
└── docs/            # Documentação adicional
```

---

## ⚡ Comandos Mais Usados

```bash
# Desenvolvimento
npm run dev              # Inicia backend + frontend
cd apps/api && npm run dev     # Apenas backend
cd apps/web && npm run dev     # Apenas frontend

# Banco de dados
cd apps/api
npm run prisma:migrate:dev    # Executar migrations
npm run prisma:studio         # Interface visual do banco

# Build para produção
npm run build            # Build de todos os apps
cd apps/api && npm run build  # Apenas backend
cd apps/web && npm run build  # Apenas frontend

# Testes
npm test                 # Executar testes
npm run lint             # Verificar código

# Úteis
.\scripts\generate-secrets.ps1     # Gerar secrets (Windows)
.\scripts\pre-deploy-check.ps1     # Verificar antes deploy
```

---

## 🆘 Preciso de Ajuda!

### Perguntas Frequentes

❓ **[FAQ.md](./FAQ.md)** - Respostas rápidas para dúvidas comuns

### Erros Comuns

| Problema | Solução |
|----------|---------|
| "Port already in use" | Ver [LOCAL_SETUP.md](./LOCAL_SETUP.md#-problemas-comuns) |
| "Cannot connect to database" | Verificar se PostgreSQL está rodando |
| CORS error | Verificar CORS_ORIGIN no `.env` |
| Página branca | Abrir DevTools (F12) e ver console |
| "Module not found" | Executar `npm install` |

### Onde Buscar Respostas

1. **Erros de setup:** [LOCAL_SETUP.md](./LOCAL_SETUP.md) → seção "Problemas Comuns"
2. **Erros de deploy:** [PRODUCTION.md](./PRODUCTION.md) → seção "Troubleshooting"
3. **Questões de segurança:** [README.md](./README.md) → seção "Security"
4. **Dúvidas gerais:** Leia os comentários no código

---

## 📚 Todos os Guias Disponíveis

### Para Desenvolvimento Local
- 🏠 [LOCAL_SETUP.md](./LOCAL_SETUP.md) - Setup completo
- ✅ [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md) - Checklist interativo
- ⚡ [QUICK_START.md](./QUICK_START.md) - Guia rápido

### Para Deploy em Produção
- 🚀 [PRODUCTION.md](./PRODUCTION.md) - Guia completo de deploy
- 📋 [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md) - Checklist de deploy
- 🏢 [HOSTING_COMPARISON.md](./HOSTING_COMPARISON.md) - Comparar plataformas

### Para Entender o Projeto
- 📖 [README.md](./README.md) - Visão geral e arquitetura
- 🔐 [AUTHENTICATION.md](./apps/web/AUTHENTICATION.md) - Sistema de auth
- 📜 [scripts/README.md](./scripts/README.md) - Scripts disponíveis

---

## 🎮 Testando Rapidamente

Se você está com pressa e quer apenas ver funcionando:

### Opção 1: Docker (Mais rápido)
```bash
# TODO: Adicionar Docker setup
docker-compose up
```

### Opção 2: Sem Docker (10-15 minutos)
```bash
# 1. Instalar dependências
npm install

# 2. Configurar .env (copiar exemplos)
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 3. Configurar DATABASE_URL em apps/api/.env
# Editar: postgresql://postgres:senha@localhost:5432/zeroguard_dev

# 4. Criar database
psql -U postgres -c "CREATE DATABASE zeroguard_dev;"

# 5. Executar migrations
cd apps/api && npm run prisma:migrate:dev

# 6. Iniciar aplicação
cd ../.. && npm run dev

# 7. Acessar
# http://localhost:3000
```

---

## 🎯 Sua Primeira Vez? Siga Este Caminho:

### Etapa 1: Preparação (5 min)
1. ✅ Instalar Node.js 18+
2. ✅ Instalar PostgreSQL
3. ✅ Instalar Git

### Etapa 2: Setup (10 min)
1. 📥 Clonar/baixar projeto
2. ⚙️ Configurar `.env` files
3. 🗄️ Criar database
4. 📦 Instalar dependências

### Etapa 3: Execução (2 min)
1. 🗃️ Executar migrations
2. 🚀 Iniciar servidores
3. ✅ Testar no navegador

### Etapa 4: Exploração (∞)
1. 🎨 Criar conta
2. 🔐 Fazer login
3. 📝 Adicionar itens no vault
4. 🌗 Testar dark mode
5. 📱 Acessar do celular

**Total:** ~20 minutos até estar funcionando!

---

## 🎊 Próximo Nível

Depois que tudo estiver funcionando localmente:

1. **Explorar o código:**
   - Backend: `apps/api/src/`
   - Frontend: `apps/web/src/`
   - Crypto: `packages/crypto/`

2. **Adicionar funcionalidades:**
   - Implementar CRUD de vault items
   - Conectar com API real
   - Adicionar gerador de senhas
   - Implementar 2FA/TOTP

3. **Deploy:**
   - Seguir [PRODUCTION.md](./PRODUCTION.md)
   - Escolher plataformas em [HOSTING_COMPARISON.md](./HOSTING_COMPARISON.md)
   - Usar [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md)

---

## 💡 Dicas Finais

- 📌 **Marque esta página** para referência rápida
- 🔖 **Abra o VS Code** na pasta do projeto
- 🎯 **Siga um guia por vez** - não pule etapas
- ✅ **Use os checklists** para não esquecer nada
- 🐛 **Leia os erros** - eles geralmente dizem o problema
- 🔍 **Use Ctrl+F** para buscar nos guias

---

**Boa sorte! 🚀**

Qualquer dúvida, consulte os guias acima ou leia os comentários no código.

**Happy coding! 💻**
