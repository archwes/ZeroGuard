#!/bin/bash

# Script de verificação pré-deploy
# Verifica se tudo está configurado corretamente

echo "🔍 Verificando configurações para produção..."
echo ""

ERRORS=0
WARNINGS=0

# Cores
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Função para verificar arquivo
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2 - Arquivo não encontrado"
        ((ERRORS++))
    fi
}

# Função para verificar variável
check_env_var() {
    if grep -q "^$1=" "$2" 2>/dev/null; then
        value=$(grep "^$1=" "$2" | cut -d '=' -f2-)
        if [[ "$value" == *"CHANGE"* ]] || [[ "$value" == *"TODO"* ]] || [[ "$value" == *"..."* ]]; then
            echo -e "${YELLOW}⚠${NC} $1 - Precisa ser configurado"
            ((WARNINGS++))
        else
            echo -e "${GREEN}✓${NC} $1 configurado"
        fi
    else
        echo -e "${RED}✗${NC} $1 - Não encontrado em $2"
        ((ERRORS++))
    fi
}

echo "📦 Verificando arquivos de configuração..."
echo ""

# Arquivos de configuração
check_file "render.yaml" "Configuração Render"
check_file "vercel.json" "Configuração Vercel"
check_file "netlify.toml" "Configuração Netlify"
check_file ".github/workflows/deploy.yml" "GitHub Actions"

echo ""
echo "🔐 Verificando variáveis de ambiente do backend..."
echo ""

if [ -f "apps/api/.env.production" ]; then
    check_env_var "DATABASE_URL" "apps/api/.env.production"
    check_env_var "JWT_SECRET" "apps/api/.env.production"
    check_env_var "JWT_REFRESH_SECRET" "apps/api/.env.production"
    check_env_var "ENCRYPTION_KEY" "apps/api/.env.production"
    check_env_var "CORS_ORIGIN" "apps/api/.env.production"
else
    echo -e "${RED}✗${NC} Arquivo apps/api/.env.production não encontrado"
    echo "  Execute: cp apps/api/.env.production.example apps/api/.env.production"
    ((ERRORS++))
fi

echo ""
echo "🎨 Verificando variáveis de ambiente do frontend..."
echo ""

if [ -f "apps/web/.env.production" ]; then
    check_env_var "VITE_API_URL" "apps/web/.env.production"
else
    echo -e "${RED}✗${NC} Arquivo apps/web/.env.production não encontrado"
    echo "  Execute: cp apps/web/.env.production.example apps/web/.env.production"
    ((ERRORS++))
fi

echo ""
echo "📦 Verificando dependências..."
echo ""

if [ -f "package.json" ]; then
    if [ -d "node_modules" ]; then
        echo -e "${GREEN}✓${NC} Dependências instaladas"
    else
        echo -e "${YELLOW}⚠${NC} Dependências não instaladas"
        echo "  Execute: npm install"
        ((WARNINGS++))
    fi
else
    echo -e "${RED}✗${NC} package.json não encontrado"
    ((ERRORS++))
fi

echo ""
echo "🔨 Verificando build..."
echo ""

if [ -d "apps/web/dist" ]; then
    echo -e "${GREEN}✓${NC} Build do frontend existe"
else
    echo -e "${YELLOW}⚠${NC} Build do frontend não encontrado"
    echo "  Execute: cd apps/web && npm run build"
    ((WARNINGS++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ Tudo pronto para deploy!${NC}"
    echo ""
    echo "Próximos passos:"
    echo "1. git push para disparar CI/CD"
    echo "2. Ou deploy manual com: vercel --prod"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Existem $WARNINGS avisos${NC}"
    echo ""
    echo "Você pode fazer deploy, mas recomendamos resolver os avisos."
    exit 0
else
    echo -e "${RED}❌ Existem $ERRORS erros que precisam ser corrigidos${NC}"
    echo ""
    echo "Corrija os erros acima antes de fazer deploy."
    exit 1
fi
