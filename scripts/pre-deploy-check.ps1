# Script de verificação pré-deploy (PowerShell)
# Verifica se tudo está configurado corretamente

Write-Host "🔍 Verificando configurações para produção..." -ForegroundColor Cyan
Write-Host ""

$Errors = 0
$Warnings = 0

# Função para verificar arquivo
function Check-File {
    param($Path, $Description)
    
    if (Test-Path $Path) {
        Write-Host "✓ $Description" -ForegroundColor Green
    } else {
        Write-Host "✗ $Description - Arquivo não encontrado" -ForegroundColor Red
        $script:Errors++
    }
}

# Função para verificar variável de ambiente
function Check-EnvVar {
    param($VarName, $FilePath)
    
    if (Test-Path $FilePath) {
        $content = Get-Content $FilePath -Raw
        if ($content -match "$VarName=(.+)") {
            $value = $matches[1]
            if ($value -match "(CHANGE|TODO|\.\.\.|\*\*\*)") {
                Write-Host "⚠ $VarName - Precisa ser configurado" -ForegroundColor Yellow
                $script:Warnings++
            } else {
                Write-Host "✓ $VarName configurado" -ForegroundColor Green
            }
        } else {
            Write-Host "✗ $VarName - Não encontrado em $FilePath" -ForegroundColor Red
            $script:Errors++
        }
    }
}

Write-Host "📦 Verificando arquivos de configuração..." -ForegroundColor Cyan
Write-Host ""

Check-File "render.yaml" "Configuração Render"
Check-File "vercel.json" "Configuração Vercel"
Check-File "netlify.toml" "Configuração Netlify"
Check-File ".github\workflows\deploy.yml" "GitHub Actions"

Write-Host ""
Write-Host "🔐 Verificando variáveis de ambiente do backend..." -ForegroundColor Cyan
Write-Host ""

if (Test-Path "apps\api\.env.production") {
    Check-EnvVar "DATABASE_URL" "apps\api\.env.production"
    Check-EnvVar "JWT_SECRET" "apps\api\.env.production"
    Check-EnvVar "JWT_REFRESH_SECRET" "apps\api\.env.production"
    Check-EnvVar "ENCRYPTION_KEY" "apps\api\.env.production"
    Check-EnvVar "CORS_ORIGIN" "apps\api\.env.production"
} else {
    Write-Host "✗ Arquivo apps\api\.env.production não encontrado" -ForegroundColor Red
    Write-Host "  Execute: Copy-Item apps\api\.env.production.example apps\api\.env.production" -ForegroundColor Yellow
    $Errors++
}

Write-Host ""
Write-Host "🎨 Verificando variáveis de ambiente do frontend..." -ForegroundColor Cyan
Write-Host ""

if (Test-Path "apps\web\.env.production") {
    Check-EnvVar "VITE_API_URL" "apps\web\.env.production"
} else {
    Write-Host "✗ Arquivo apps\web\.env.production não encontrado" -ForegroundColor Red
    Write-Host "  Execute: Copy-Item apps\web\.env.production.example apps\web\.env.production" -ForegroundColor Yellow
    $Errors++
}

Write-Host ""
Write-Host "📦 Verificando dependências..." -ForegroundColor Cyan
Write-Host ""

if (Test-Path "package.json") {
    if (Test-Path "node_modules") {
        Write-Host "✓ Dependências instaladas" -ForegroundColor Green
    } else {
        Write-Host "⚠ Dependências não instaladas" -ForegroundColor Yellow
        Write-Host "  Execute: npm install" -ForegroundColor Yellow
        $Warnings++
    }
} else {
    Write-Host "✗ package.json não encontrado" -ForegroundColor Red
    $Errors++
}

Write-Host ""
Write-Host "🔨 Verificando build..." -ForegroundColor Cyan
Write-Host ""

if (Test-Path "apps\web\dist") {
    Write-Host "✓ Build do frontend existe" -ForegroundColor Green
} else {
    Write-Host "⚠ Build do frontend não encontrado" -ForegroundColor Yellow
    Write-Host "  Execute: cd apps\web; npm run build" -ForegroundColor Yellow
    $Warnings++
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

if ($Errors -eq 0 -and $Warnings -eq 0) {
    Write-Host "✅ Tudo pronto para deploy!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximos passos:"
    Write-Host "1. git push para disparar CI/CD"
    Write-Host "2. Ou deploy manual com: vercel --prod"
    exit 0
} elseif ($Errors -eq 0) {
    Write-Host "⚠️  Existem $Warnings avisos" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Você pode fazer deploy, mas recomendamos resolver os avisos."
    exit 0
} else {
    Write-Host "❌ Existem $Errors erros que precisam ser corrigidos" -ForegroundColor Red
    Write-Host ""
    Write-Host "Corrija os erros acima antes de fazer deploy."
    exit 1
}
