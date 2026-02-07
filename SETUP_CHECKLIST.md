# ✅ Checklist de Setup Local

Use este checklist para acompanhar seu progresso no setup do ZeroGuard.

## 📋 Pré-requisitos

- [ ] Node.js 18+ instalado e funcionando
  ```bash
  node --version  # v18.x.x ou superior
  ```

- [ ] Git instalado
  ```bash
  git --version
  ```

- [ ] PostgreSQL 15+ instalado
  ```bash
  psql --version
  ```

- [ ] Editor de código (VS Code recomendado)

---

## 🗄️ Banco de Dados

- [ ] PostgreSQL rodando
  ```powershell
  # Windows
  Get-Service -Name postgresql*
  
  # Linux
  sudo systemctl status postgresql
  ```

- [ ] Database `zeroguard_dev` criada
  ```bash
  psql -U postgres -c "\l" | grep zeroguard_dev
  ```

- [ ] Conexão testada com sucesso
  ```bash
  psql -U postgres -d zeroguard_dev -c "SELECT version();"
  ```

---

## 📥 Projeto

- [ ] Repositório clonado ou baixado

- [ ] Aberto terminal na pasta do projeto
  ```bash
  pwd  # Linux/Mac
  cd   # Windows
  ```

---

## ⚙️ Configuração

### Backend (apps/api)

- [ ] Arquivo `.env` criado
  ```bash
  ls apps/api/.env  # Linux/Mac
  dir apps\api\.env  # Windows
  ```

- [ ] DATABASE_URL configurada corretamente

- [ ] CORS_ORIGIN configurado

- [ ] Outras variáveis preenchidas

### Frontend (apps/web)

- [ ] Arquivo `.env` criado
  ```bash
  ls apps/web/.env  # Linux/Mac
  dir apps\web\.env  # Windows
  ```

- [ ] VITE_API_URL configurada

---

## 📦 Dependências

- [ ] Dependências root instaladas
  ```bash
  npm install
  ```

- [ ] Dependências do backend instaladas
  ```bash
  cd apps/api && npm install
  ```

- [ ] Dependências do frontend instaladas
  ```bash
  cd apps/web && npm install
  ```

- [ ] node_modules criados
  ```bash
  ls node_modules/  # Deve ter muitas pastas
  ```

---

## 🗃️ Database Setup

- [ ] Prisma client gerado
  ```bash
  cd apps/api
  npm run prisma:generate
  ```

- [ ] Migrations executadas
  ```bash
  npm run prisma:migrate:dev
  ```

- [ ] Tabelas criadas (verificar no banco)
  ```bash
  psql -U postgres -d zeroguard_dev -c "\dt"
  ```

- [ ] (Opcional) Seed executado
  ```bash
  npm run prisma:seed
  ```

---

## 🚀 Execução

- [ ] Backend iniciado
  ```bash
  cd apps/api
  npm run dev
  ```
  **Esperado:** `Server listening on http://localhost:4000`

- [ ] Frontend iniciado (nova janela/terminal)
  ```bash
  cd apps/web
  npm run dev
  ```
  **Esperado:** `Local: http://localhost:3000/`

---

## ✅ Testes

### Health Check

- [ ] Backend respondendo
  ```bash
  curl http://localhost:4000/health
  ```
  **Esperado:** `{"status":"ok",...}`

### Frontend

- [ ] Página abre no navegador
  - [ ] Background com partículas visível
  - [ ] Página de login carregada
  - [ ] Sem erros no console (F12)

### Funcionalidade

- [ ] Registro de usuário funciona
  - Nome: `Teste`
  - Email: `teste@teste.com`
  - Senha: `SenhaForte123!`
  - **Esperado:** "Conta criada com sucesso!"

- [ ] Login funciona
  - Email: `teste@teste.com`
  - Senha: `SenhaForte123!`
  - **Esperado:** Redireciona para dashboard

- [ ] Dashboard carrega
  - [ ] Sidebar com categorias
  - [ ] Cards de vault
  - [ ] Botão "Novo Item" funciona

- [ ] Dark/Light mode funciona

- [ ] Logout funciona

---

## 🌐 Acesso na Rede (Opcional)

- [ ] IP local descoberto
  ```powershell
  # Windows
  ipconfig
  
  # Linux/Mac
  ifconfig | grep "inet "
  ```
  **Meu IP:** `________________`

- [ ] Backend `.env` tem `HOST=0.0.0.0`

- [ ] Frontend `.env` atualizado com IP
  ```env
  VITE_API_URL=http://SEU_IP:4000
  ```

- [ ] Firewall configurado (Windows)
  - [ ] Porta 3000 liberada
  - [ ] Porta 4000 liberada

- [ ] Acessível do celular
  - URL: `http://SEU_IP:3000`
  - [ ] Página carrega
  - [ ] Login funciona

---

## 🎉 Setup Completo!

Se todas as caixas estão marcadas, parabéns! 🎊

Seu ZeroGuard está rodando perfeitamente!

### Próximos Passos:

1. ✅ Explorar todas as funcionalidades
2. ✅ Ler [QUICK_START.md](./QUICK_START.md) para detalhes
3. ✅ Quando pronto para produção, ver [PRODUCTION.md](./PRODUCTION.md)

---

## 🆘 Problemas?

Se algo não funcionou:

1. 📖 Consulte [LOCAL_SETUP.md](./LOCAL_SETUP.md) seção "Problemas Comuns"
2. 🔍 Verifique logs no terminal
3. 🐛 Abra DevTools (F12) e veja Console
4. 🔄 Tente reiniciar servidores

### Reset Rápido

Se tudo falhar:

```bash
# Parar servidores (Ctrl+C)

# Limpar cache
rm -rf node_modules/.vite  # Linux/Mac
rmdir /s node_modules\.vite  # Windows

# Reinstalar
npm install

# Resetar banco
cd apps/api
npm run prisma:migrate:reset

# Recriar migrations
npm run prisma:migrate:dev

# Reiniciar tudo
cd ../..
npm run dev
```

---

**Boa sorte! 🚀**
