# تشغيل seed على قاعدة بيانات Railway مرة واحدة (إنشاء المدير)
# من مجلد backend: railway link (اختر مشروع خوام وخدمة khawam) ثم:
# .\scripts\run-seed-railway.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host "Running prisma db seed on Railway..." -ForegroundColor Cyan
railway run pnpm exec prisma db seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "Seed failed. Run: railway link then try again." -ForegroundColor Red
    exit 1
}
Write-Host "Done. Use the admin credentials to log in." -ForegroundColor Green
