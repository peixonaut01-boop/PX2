# ============================================================================
# PX2 - Script de Deploy
# ============================================================================
# Executa os scripts R e faz push para o GitHub
#
# Uso:
#   .\deploy.ps1                    # Atualiza dados e faz push
#   .\deploy.ps1 -NoPush            # Só atualiza dados, sem push
#   .\deploy.ps1 -ScriptOnly "ipca" # Só roda o script do IPCA
# ============================================================================

param(
    [switch]$NoPush,
    [string]$ScriptOnly = ""
)

$ErrorActionPreference = "Stop"

# Paths
$ProjectRoot = "C:\Users\Lucas\Desktop\PX2"
$ScriptsDir = "$ProjectRoot\scripts\R"
$DataDir = "$ProjectRoot\frontend\public\data"

Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "PX2 - Deploy de Dados" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

# 1. Executa scripts R
Write-Host "`n📊 Executando scripts R..." -ForegroundColor Yellow

Set-Location $ScriptsDir

if ($ScriptOnly -ne "") {
    $script = "${ScriptOnly}_update.R"
    Write-Host "Executando apenas: $script"
    Rscript $script
} else {
    Write-Host "Executando todos os scripts..."
    Rscript run_all.R
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao executar scripts R" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Scripts R executados" -ForegroundColor Green

# 2. Verifica se há mudanças
Set-Location $ProjectRoot

$changes = git status --porcelain "$DataDir"
if (-not $changes) {
    Write-Host "`n📝 Nenhuma mudança nos dados" -ForegroundColor Yellow
    exit 0
}

Write-Host "`n📝 Arquivos modificados:" -ForegroundColor Yellow
Write-Host $changes

# 3. Git add, commit, push
if (-not $NoPush) {
    Write-Host "`n📤 Fazendo commit e push..." -ForegroundColor Yellow
    
    git add "$DataDir/*.json"
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
    $commitMsg = "data: atualiza dados - $timestamp"
    
    git commit -m $commitMsg
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro no commit" -ForegroundColor Red
        exit 1
    }
    
    git push origin main
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro no push" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Push realizado - Vercel fará deploy automático" -ForegroundColor Green
} else {
    Write-Host "`n⏭️  Push pulado (flag -NoPush)" -ForegroundColor Yellow
}

Write-Host "`n" + "=" * 60 -ForegroundColor Cyan
Write-Host "✅ Concluído!" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Cyan

