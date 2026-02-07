#!/bin/bash

# 🔐 Script de setup para produção
# Gera todas as secrets necessárias

echo "🔐 Gerando secrets para produção..."
echo ""

# JWT Secret
echo "JWT_SECRET:"
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
echo ""

# JWT Refresh Secret
echo "JWT_REFRESH_SECRET:"
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
echo ""

# Encryption Key
echo "ENCRYPTION_KEY:"
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
echo ""

# CSRF Secret
echo "CSRF_SECRET:"
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
echo ""

# Session Secret
echo "SESSION_SECRET:"
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
echo ""

echo "✅ Secrets geradas com sucesso!"
echo ""
echo "⚠️  IMPORTANTE:"
echo "1. Salve essas secrets em um local seguro"
echo "2. Adicione-as nas variáveis de ambiente do seu hosting"
echo "3. NUNCA commite essas secrets no Git"
echo ""
