# 🏠 Setup Local - Rodando na Sua Máquina e Rede

Guia completo passo a passo para rodar o ZeroGuard localmente e acessá-lo na sua rede local.

> 📝 **Acompanhe seu progresso:** Use o [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md) para marcar cada etapa concluída!

---

## 📋 Pré-requisitos

Antes de começar, instale:

### 1. Node.js 18+
**Windows:**
1. Baixe: https://nodejs.org/en/download
2. Execute o instalador
3. Verifique a instalação:
```powershell
node --version  # deve mostrar v18.x.x ou superior
npm --version   # deve mostrar 9.x.x ou superior
```

**Linux/Mac:**
```bash
# Usando nvm (recomendado)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

### 2. Git
**Windows:**
- Baixe: https://git-scm.com/download/win
- Execute o instalador

**Linux:**
```bash
sudo apt-get install git  # Ubuntu/Debian
sudo yum install git       # CentOS/RHEL
```

### 3. PostgreSQL 15+ (Recomendado)
**Windows:**
1. Baixe: https://www.postgresql.org/download/windows/
2. Execute o instalador
3. Durante instalação:
   - Porta: `5432` (padrão)
   - Senha do postgres: anote essa senha!
   - Locale: `Portuguese, Brazil`

4. Após instalação, abra pgAdmin ou terminal:
```powershell
# Conectar ao PostgreSQL
psql -U postgres
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# CentOS/RHEL
sudo yum install postgresql-server postgresql-contrib
sudo postgresql-setup initdb
sudo systemctl start postgresql
```

**Mac:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

### 4. Editor de Código (Opcional mas Recomendado)
- Visual Studio Code: https://code.visualstudio.com/

---

## 🗄️ Configurar Banco de Dados

### Passo 1: Criar Database

**Windows (pgAdmin):**
1. Abra pgAdmin
2. Conecte ao servidor local
3. Clique direito em "Databases" → "Create" → "Database"
4. Nome: `zeroguard_dev`
5. Owner: `postgres`
6. Save

**Windows/Linux/Mac (Terminal):**
```bash
# Conectar ao PostgreSQL
psql -U postgres

# Dentro do psql:
CREATE DATABASE zeroguard_dev;

# Criar usuário específico (opcional)
CREATE USER zeroguard_user WITH PASSWORD 'senha_segura_aqui';
GRANT ALL PRIVILEGES ON DATABASE zeroguard_dev TO zeroguard_user;

# Sair
\q
```

### Passo 2: Testar Conexão
```bash
# Testar conexão
psql -U postgres -d zeroguard_dev -c "SELECT version();"
```

Deve mostrar a versão do PostgreSQL.

---

## 📥 Baixar o Projeto

### Opção 1: Clonar do GitHub
```bash
# Navegar para pasta desejada
cd C:\Users\SeuUsuario\Documents  # Windows
# ou
cd ~/Documents  # Linux/Mac

# Clonar repositório
git clone https://github.com/seu-usuario/zeroguard.git
cd zeroguard
```

### Opção 2: Baixar ZIP
1. Acesse o repositório no GitHub
2. Clique em "Code" → "Download ZIP"
3. Extraia para uma pasta
4. Abra terminal/PowerShell nessa pasta

---

## ⚙️ Configurar Variáveis de Ambiente

### Backend (API)

**Passo 1: Copiar arquivo de exemplo**
```powershell
# Windows
Copy-Item apps\api\.env.example apps\api\.env

# Linux/Mac
cp apps/api/.env.example apps/api/.env
```

**Passo 2: Editar arquivo `.env`**

Abra `apps/api/.env` no editor e configure:

```env
# Servidor
NODE_ENV=development
PORT=4000
HOST=0.0.0.0

# Database (ajuste com suas configurações)
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/zeroguard_dev"

# JWT (pode deixar esses valores para desenvolvimento)
JWT_SECRET="dev-secret-change-in-production"
JWT_REFRESH_SECRET="dev-refresh-secret-change-in-production"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Criptografia (pode deixar para desenvolvimento)
ENCRYPTION_KEY="dev-encryption-key-change-in-production"

# CORS (permitir frontend local)
CORS_ORIGIN="http://localhost:3000,http://localhost:5173"

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW="15m"

# Logging
LOG_LEVEL=debug
```

**⚠️ IMPORTANTE:**
- Substitua `SUA_SENHA` pela senha que você definiu no PostgreSQL
- Se criou usuário específico, use: `postgresql://zeroguard_user:senha_segura_aqui@localhost:5432/zeroguard_dev`

### Frontend (Web)

**Passo 1: Copiar arquivo de exemplo**
```powershell
# Windows
Copy-Item apps\web\.env.example apps\web\.env

# Linux/Mac
cp apps/web/.env.example apps/web/.env
```

**Passo 2: Editar arquivo `.env`**

Abra `apps/web/.env` no editor:

```env
# API URL (backend local)
VITE_API_URL=http://localhost:4000

# App Info
VITE_APP_NAME=ZeroGuard
VITE_APP_VERSION=1.0.0-dev
```

---

## 📦 Instalar Dependências

### Passo 1: Instalar dependências root
```bash
# Na raiz do projeto
npm install
```

Isso pode levar alguns minutos. ☕

### Passo 2: Instalar dependências do backend
```bash
cd apps/api
npm install
cd ../..
```

### Passo 3: Instalar dependências do frontend
```bash
cd apps/web
npm install
cd ../..
```

### Verificar Instalação
```bash
# Verificar se node_modules foram criados
ls node_modules/          # Linux/Mac
dir node_modules\         # Windows
```

---

## 🗃️ Executar Migrations (Criar Tabelas)

```bash
cd apps/api

# Gerar cliente Prisma
npm run prisma:generate

# Executar migrations (criar tabelas)
npm run prisma:migrate:dev

# (Opcional) Seed - popular banco com dados de teste
npm run prisma:seed
```

**Saída esperada:**
```
✔ Generated Prisma Client
✔ Database schema created
✔ Migrations applied successfully
```

### Verificar Tabelas Criadas
```bash
# Acessar database
psql -U postgres -d zeroguard_dev

# Listar tabelas
\dt

# Deve mostrar:
# users
# vault_items
# sessions
# etc.

# Sair
\q
```

---

## 🚀 Iniciar Aplicação

### Opção 1: Iniciar Tudo de Uma Vez (Recomendado)

**Na raiz do projeto:**
```bash
npm run dev
```

Isso inicia backend e frontend simultaneamente! 🎉

### Opção 2: Iniciar Separadamente

**Terminal 1 - Backend:**
```bash
cd apps/api
npm run dev
```

Aguarde até ver:
```
✓ Server listening on http://localhost:4000
✓ Database connected
```

**Terminal 2 - Frontend (nova janela):**
```bash
cd apps/web
npm run dev
```

Aguarde até ver:
```
  VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.x.x:3000/
```

---

## 🌐 Acessar na Rede Local

### Descobrir seu IP Local

**Windows:**
```powershell
ipconfig

# Procure por "IPv4 Address" na seção "Wireless LAN adapter Wi-Fi"
# Exemplo: 192.168.1.100
```

**Linux/Mac:**
```bash
ifconfig | grep "inet "
# ou
ip addr show | grep "inet "

# Procure por algo como: 192.168.1.100
```

### Configurar Backend para Aceitar Conexões Externas

O backend já está configurado com `HOST=0.0.0.0` no `.env`, então já aceita conexões da rede.

### Configurar Frontend para Rede

**Editar `apps/web/.env`:**
```env
# Substitua pelo seu IP local
VITE_API_URL=http://192.168.1.100:4000
```

**Reiniciar frontend:**
```bash
cd apps/web
npm run dev
```

### Acessar de Outros Dispositivos

Agora você pode acessar de qualquer dispositivo na mesma rede:

- **Frontend:** `http://192.168.1.100:3000`
- **Backend:** `http://192.168.1.100:4000`

**Dispositivos que podem acessar:**
- ✅ Seu celular (via Wi-Fi)
- ✅ Tablet
- ✅ Outro computador na rede
- ✅ Smart TV

---

## 🔥 Configurar Firewall (Windows)

Se outros dispositivos não conseguem acessar:

### Passo 1: Permitir Node.js no Firewall

1. Abra "Firewall do Windows Defender"
2. "Configurações avançadas"
3. "Regras de Entrada" → "Nova Regra"
4. Tipo: "Programa"
5. Caminho: `C:\Program Files\nodejs\node.exe`
6. Ação: "Permitir conexão"
7. Perfis: Marque todos
8. Nome: "Node.js Development"

### Passo 2: Permitir Portas Específicas

**Criar regra para porta 3000 (frontend):**
1. "Regras de Entrada" → "Nova Regra"
2. Tipo: "Porta"
3. Protocolo: TCP
4. Porta: `3000`
5. Ação: "Permitir conexão"
6. Perfis: Privada e Pública
7. Nome: "Vite Dev Server"

**Criar regra para porta 4000 (backend):**
- Repetir os passos acima com porta `4000`
- Nome: "Fastify API Server"

---

## ✅ Verificar se Está Tudo Funcionando

### 1. Backend Health Check
```bash
curl http://localhost:4000/health
```

**Deve retornar:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-07T...",
  "uptime": 123.45
}
```

### 2. Frontend
Abra navegador: http://localhost:3000

**Deve ver:**
- ✅ Background com partículas animadas
- ✅ Página de login
- ✅ Botão "Criar nova conta"

### 3. Testar Registro
1. Clique em "Criar nova conta"
2. Preencha:
   - Nome: `Teste`
   - E-mail: `teste@teste.com`
   - Senha: `SenhaForte123!`
3. Clique em "Criar Conta"

**Deve:**
- ✅ Mostrar "Conta criada com sucesso!"
- ✅ Redirecionar para login

### 4. Testar Login
1. Login: `teste@teste.com`
2. Senha: `SenhaForte123!`
3. Clique em "Entrar"

**Deve:**
- ✅ Mostrar "Login realizado com sucesso!"
- ✅ Redirecionar para dashboard
- ✅ Ver sidebar com categorias
- ✅ Cards de vault

### 5. Testar da Rede Local

No celular/tablet conectado na mesma Wi-Fi:

1. Abra navegador
2. Acesse: `http://SEU_IP:3000` (ex: http://192.168.1.100:3000)
3. Deve funcionar igual!

---

## 🛠️ Comandos Úteis

### Parar Servidores
```bash
# Pressione Ctrl+C nos terminais onde estão rodando
```

### Reiniciar com Cache Limpo
```bash
# Frontend
cd apps/web
rm -rf node_modules/.vite  # Linux/Mac
rmdir /s node_modules\.vite  # Windows
npm run dev

# Backend
cd apps/api
npm run dev
```

### Ver Logs do Banco de Dados
```bash
cd apps/api
npm run prisma:studio
```

Isso abre interface web em `http://localhost:5555` para ver dados no banco.

### Resetar Banco de Dados
```bash
cd apps/api
npm run prisma:migrate:reset
# Confirme com 'y'
```

⚠️ **CUIDADO:** Isso apaga TODOS os dados!

---

## 🐛 Problemas Comuns

### 1. Erro: "Port 4000 is already in use"

**Solução:**
```powershell
# Windows - Matar processo na porta 4000
netstat -ano | findstr :4000
taskkill /PID <numero_do_pid> /F

# Linux/Mac
lsof -ti:4000 | xargs kill -9
```

### 2. Erro: "DATABASE_URL is not set"

**Solução:**
- Verifique se arquivo `apps/api/.env` existe
- Confirme que DATABASE_URL está definida
- Reinicie o servidor

### 3. Erro: "Cannot connect to database"

**Solução:**
```bash
# Verificar se PostgreSQL está rodando
# Windows
Get-Service -Name postgresql*

# Linux
sudo systemctl status postgresql

# Iniciar se parado
# Windows (Serviços → PostgreSQL → Iniciar)
# Linux
sudo systemctl start postgresql
```

### 4. Erro: "Module not found"

**Solução:**
```bash
# Reinstalar dependências
rm -rf node_modules package-lock.json  # Linux/Mac
rmdir /s /q node_modules && del package-lock.json  # Windows
npm install
```

### 5. Frontend não carrega (tela branca)

**Solução:**
1. Abra DevTools (F12)
2. Verifique Console por erros
3. Comum: CORS error

**Verificar CORS:**
- Backend `.env` deve ter: `CORS_ORIGIN="http://localhost:3000"`
- Frontend `.env` deve ter: `VITE_API_URL=http://localhost:4000`
- Reinicie ambos

### 6. Não consigo acessar da rede

**Checklist:**
- [ ] Backend tem `HOST=0.0.0.0` no `.env`
- [ ] Frontend `.env` tem IP correto: `VITE_API_URL=http://SEU_IP:4000`
- [ ] Firewall está permitindo portas 3000 e 4000
- [ ] Dispositivos estão na mesma rede Wi-Fi
- [ ] Frontend foi reiniciado após mudar `.env`

---

## 📱 Acessar do Celular (Detalhado)

### Passo 1: Verificar Conexão

- Celular e computador **devem** estar na mesma rede Wi-Fi
- Não funciona com dados móveis (4G/5G)

### Passo 2: Descobrir IP do Computador

```powershell
# Windows
ipconfig

# Procure: "Adaptador de Rede sem Fio Wi-Fi"
# IPv4: 192.168.1.100 (exemplo)
```

### Passo 3: Configurar Backend

Arquivo `apps/api/.env`:
```env
HOST=0.0.0.0
CORS_ORIGIN="http://192.168.1.100:3000"
```

Reinicie backend: `Ctrl+C` → `npm run dev`

### Passo 4: Configurar Frontend

Arquivo `apps/web/.env`:
```env
VITE_API_URL=http://192.168.1.100:4000
```

Reinicie frontend: `Ctrl+C` → `npm run dev`

### Passo 5: Acessar no Celular

1. Abra navegador (Chrome/Safari)
2. Digite: `http://192.168.1.100:3000`
3. Pronto! ✨

**Dica:** Adicione à tela inicial para parecer um app!

---

## 🎯 Resumo dos URLs

| Serviço | Localhost | Rede Local |
|---------|-----------|------------|
| **Frontend** | http://localhost:3000 | http://192.168.1.100:3000 |
| **Backend API** | http://localhost:4000 | http://192.168.1.100:4000 |
| **Prisma Studio** | http://localhost:5555 | ❌ (apenas local) |
| **Health Check** | http://localhost:4000/health | http://192.168.1.100:4000/health |

---

## 📚 Próximos Passos

Depois que estiver rodando localmente:

1. ✅ Explore a interface
2. ✅ Crie vault items
3. ✅ Teste dark/light mode
4. ✅ Leia [QUICK_START.md](./QUICK_START.md) para entender funcionalidades
5. ✅ Quando pronto, leia [PRODUCTION.md](./PRODUCTION.md) para deploy

---

## 🆘 Precisa de Ajuda?

### Documentação
- [README.md](./README.md) - Visão geral do projeto
- [QUICK_START.md](./QUICK_START.md) - Guia do frontend
- [PRODUCTION.md](./PRODUCTION.md) - Deploy em produção

### Logs
```bash
# Ver logs detalhados do backend
cd apps/api
npm run dev -- --log-level debug

# Ver logs do Prisma
cd apps/api
npm run prisma:studio
```

### Reset Total (última opção)
```bash
# Apagar tudo e começar do zero
rm -rf node_modules package-lock.json
rm -rf apps/*/node_modules apps/*/package-lock.json
npm install
cd apps/api && npm install
cd ../web && npm install

# Resetar banco
cd apps/api
npm run prisma:migrate:reset
```

---

**Boa sorte! 🚀**

Se tudo funcionou, você deve ver o ZeroGuard rodando perfeitamente na sua máquina e acessível de qualquer dispositivo na sua rede! 🎉
