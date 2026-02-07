# PowerShell script para gerar secrets

Write-Host "🔐 Gerando secrets para produção..." -ForegroundColor Cyan
Write-Host ""

function New-Secret {
    $bytes = New-Object byte[] 32
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    return [Convert]::ToBase64String($bytes)
}

Write-Host "JWT_SECRET:" -ForegroundColor Yellow
New-Secret
Write-Host ""

Write-Host "JWT_REFRESH_SECRET:" -ForegroundColor Yellow
New-Secret
Write-Host ""

Write-Host "ENCRYPTION_KEY:" -ForegroundColor Yellow
New-Secret
Write-Host ""

Write-Host "CSRF_SECRET:" -ForegroundColor Yellow
New-Secret
Write-Host ""

Write-Host "SESSION_SECRET:" -ForegroundColor Yellow
New-Secret
Write-Host ""

Write-Host "✅ Secrets geradas com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANTE:" -ForegroundColor Red
Write-Host "1. Salve essas secrets em um local seguro"
Write-Host "2. Adicione-as nas variáveis de ambiente do seu hosting"
Write-Host "3. NUNCA commite essas secrets no Git"
Write-Host ""
