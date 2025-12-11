# Generate Secrets for Dokploy Deployment

Write-Host "🔐 Generating Secure Secrets for Dokploy" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Generating random secure values..." -ForegroundColor Yellow
Write-Host ""

# Generate SESSION_SECRET (64 characters)
$sessionSecret = -join ((48..57) + (65..70) * 8 | Get-Random -Count 64 | ForEach-Object { [char]$_ })

# Generate POSTGRES_PASSWORD (32 characters)
$postgresPassword = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object { [char]$_ })

# Generate WEBHOOK_VERIFY_TOKEN (32 characters)
$webhookToken = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object { [char]$_ })

Write-Host "✅ Secrets Generated!" -ForegroundColor Green
Write-Host ""
Write-Host "Copy these values to Dokploy Environment Variables:" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "SESSION_SECRET=" -NoNewline -ForegroundColor Yellow
Write-Host $sessionSecret -ForegroundColor White
Write-Host ""

Write-Host "POSTGRES_PASSWORD=" -NoNewline -ForegroundColor Yellow
Write-Host $postgresPassword -ForegroundColor White
Write-Host ""

Write-Host "INSTAGRAM_WEBHOOK_VERIFY_TOKEN=" -NoNewline -ForegroundColor Yellow
Write-Host $webhookToken -ForegroundColor White
Write-Host ""

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "You still need to set these manually:" -ForegroundColor Yellow
Write-Host ""
Write-Host "INSTAGRAM_APP_ID=" -NoNewline -ForegroundColor Yellow
Write-Host "4224943747791118" -ForegroundColor Gray
Write-Host ""
Write-Host "INSTAGRAM_APP_SECRET=" -NoNewline -ForegroundColor Yellow
Write-Host "<get from Meta for Developers>" -ForegroundColor Gray
Write-Host ""
Write-Host "OAUTH_BASE_URL=" -NoNewline -ForegroundColor Yellow
Write-Host "https://instagram.yourdomain.com" -ForegroundColor Gray
Write-Host ""

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Saving to secrets.txt for your reference..." -ForegroundColor Yellow

$secretsContent = @"
# Generated Secrets for Dokploy Deployment
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

# =============================================================================
# COPY THESE TO DOKPLOY ENVIRONMENT VARIABLES
# =============================================================================

SESSION_SECRET=$sessionSecret
POSTGRES_PASSWORD=$postgresPassword
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=$webhookToken

# =============================================================================
# SET THESE MANUALLY (GET FROM META FOR DEVELOPERS)
# =============================================================================

INSTAGRAM_APP_ID=4224943747791118
INSTAGRAM_APP_SECRET=<your_instagram_app_secret>
OAUTH_BASE_URL=https://instagram.yourdomain.com

# =============================================================================
# OPTIONAL (ONLY IF YOU NEED THESE FEATURES)
# =============================================================================

# GEMINI_API_KEY=<your_gemini_api_key>
# FACEBOOK_APP_ID=<your_facebook_app_id>
# FACEBOOK_APP_SECRET=<your_facebook_app_secret>

# =============================================================================
# AUTO-CONFIGURED (NO NEED TO SET)
# =============================================================================

# These are automatically configured in dokploy.yaml:
# - AUTO_SUBSCRIBE_WEBHOOKS=true
# - WEBHOOK_FIELDS=comments,messages,mentions,story_insights
# - POSTGRES_USER=postgres
# - POSTGRES_DB=instagram_automation
# - PORT=5000
# - NODE_ENV=production
"@

$secretsContent | Out-File -FilePath "secrets.txt" -Encoding UTF8

Write-Host "✅ Saved to secrets.txt" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANT: Delete secrets.txt after copying to Dokploy!" -ForegroundColor Red
Write-Host "   This file contains sensitive information." -ForegroundColor Red
Write-Host ""

Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Copy the values above to Dokploy Environment Variables" -ForegroundColor White
Write-Host "2. Set INSTAGRAM_APP_ID, INSTAGRAM_APP_SECRET, and OAUTH_BASE_URL" -ForegroundColor White
Write-Host "3. Click 'Deploy' in Dokploy" -ForegroundColor White
Write-Host "4. Delete secrets.txt file" -ForegroundColor White
Write-Host ""
