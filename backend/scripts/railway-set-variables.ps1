# Railway: رفع متغيرات البيئة لخدمة خوام (التطبيق)
# التشغيل من مجلد backend بعد ربط المشروع:
#   1) railway login   (مرة واحدة، يفتح المتصفح)
#   2) railway link    (اختر مشروع خوام ثم خدمة التطبيق)
#   3) .\scripts\railway-set-variables.ps1
# أو عدّل RAILWAY_PUBLIC_BASE_URL و RAILWAY_FRONTEND_URL في البيئة قبل التشغيل.

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

# مفتاح سري مبني على khawam-pmrx.v2 مع إكمال آمن (44 حرف)
$SECRET_KEY = "khawam-pmrx.v2.KhawamPro.SecureKey.2025"

# عناوين النشر (نشر واحد = نفس الرابط للواجهة والـ API؛ يمكن override عبر متغيرات البيئة)
$PUBLIC_BASE_URL = if ($env:RAILWAY_PUBLIC_BASE_URL) { $env:RAILWAY_PUBLIC_BASE_URL } else { "https://khawam-production.up.railway.app" }
$FRONTEND_URL    = if ($env:RAILWAY_FRONTEND_URL)    { $env:RAILWAY_FRONTEND_URL }    else { $PUBLIC_BASE_URL }

Write-Host "Checking Railway link..." -ForegroundColor Cyan
railway status
if ($LASTEXITCODE -ne 0) {
    Write-Host "Run: railway login" -ForegroundColor Yellow
    Write-Host "Then: railway link  (select project khawam and the app service)" -ForegroundColor Yellow
    exit 1
}

Write-Host "Setting variables for Khawam app service..." -ForegroundColor Cyan
railway variables set "SECRET_KEY=$SECRET_KEY"
railway variables set "PUBLIC_BASE_URL=$PUBLIC_BASE_URL"
railway variables set "FRONTEND_URL=$FRONTEND_URL"
railway variables set "NODE_ENV=production"
railway variables set "PORT=8000"

# اختياري: إزالة التعليق وضبط القيم إن وُجدت
# railway variables set "REMOVE_BG_API_KEY=your_remove_bg_key"
# railway variables set "UPLOAD_DIR=/data/uploads"

Write-Host "Variables set. DATABASE_URL is injected by Railway when PostgreSQL is linked to this service." -ForegroundColor Green
railway variables
