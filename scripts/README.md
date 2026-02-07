# 🛠️ Scripts de Deploy

Esta pasta contém scripts úteis para configuração e deploy em produção.

## 📜 Scripts Disponíveis

### 1. Gerar Secrets
Gera todas as secrets criptográficas necessárias para produção.

**Windows:**
```powershell
.\scripts\generate-secrets.ps1
```

**Linux/Mac:**
```bash
bash scripts/generate-secrets.sh
```

**Output:**
- JWT_SECRET
- JWT_REFRESH_SECRET
- ENCRYPTION_KEY
- CSRF_SECRET
- SESSION_SECRET

⚠️ **IMPORTANTE**: Salve essas secrets em um local seguro (gerenciador de senhas)!

---

### 2. Verificação Pré-Deploy
Verifica se todas as configurações estão corretas antes de fazer deploy.

**Windows:**
```powershell
.\scripts\pre-deploy-check.ps1
```

**Linux/Mac:**
```bash
bash scripts/pre-deploy-check.sh
```

**Verifica:**
- ✅ Arquivos de configuração (render.yaml, vercel.json, etc.)
- ✅ Variáveis de ambiente configuradas
- ✅ Dependências instaladas
- ✅ Build de produção
- ✅ Secrets geradas

---

## 🚀 Workflow Recomendado

### 1. Primeira vez (setup inicial)
```powershell
# 1. Gerar secrets
.\scripts\generate-secrets.ps1

# 2. Copiar exemplos de .env
Copy-Item apps\api\.env.production.example apps\api\.env.production
Copy-Item apps\web\.env.production.example apps\web\.env.production

# 3. Editar .env.production com as secrets geradas
# - Adicionar DATABASE_URL
# - Adicionar secrets geradas
# - Configurar CORS_ORIGIN

# 4. Verificar configurações
.\scripts\pre-deploy-check.ps1
```

### 2. Antes de cada deploy
```powershell
# Verificar se tudo está OK
.\scripts\pre-deploy-check.ps1

# Se tudo estiver ✅, fazer deploy
git push  # Dispara CI/CD
# ou
vercel --prod  # Deploy manual
```

---

## 📝 Notas

### Permissões (Linux/Mac)
Se os scripts não executarem, adicione permissão:
```bash
chmod +x scripts/*.sh
```

### Segurança
- ❌ **NUNCA** commite arquivos `.env.production`
- ❌ **NUNCA** commite secrets no código
- ✅ Use variáveis de ambiente da plataforma (Render, Vercel)
- ✅ Rotacione secrets regularmente

### Troubleshooting

**Erro: "não é reconhecido como comando"**
- Certifique-se de estar na raiz do projeto
- Use `.\scripts\` (Windows) ou `bash scripts/` (Linux/Mac)

**Secrets fracas**
- Scripts geram 256 bits de entropia
- Suficiente para uso em produção
- Para paranoia extra, use hardware RNG

---

## 🔗 Links Úteis

- [Guia Completo de Deploy](../PRODUCTION.md)
- [Checklist de Deploy](../DEPLOY_CHECKLIST.md)
- [Documentação de Autenticação](../apps/web/AUTHENTICATION.md)
