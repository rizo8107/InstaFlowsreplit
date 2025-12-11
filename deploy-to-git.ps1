# Git Deployment Script for Dokploy
# Run this script to prepare and push your code to Git

Write-Host "🚀 Instagram Automation Platform - Git Deployment" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

# Check if git is initialized
if (!(Test-Path .git)) {
    Write-Host "📦 Initializing Git repository..." -ForegroundColor Yellow
    git init
    Write-Host "✅ Git initialized" -ForegroundColor Green
}
else {
    Write-Host "✅ Git repository already initialized" -ForegroundColor Green
}

# Check current branch
$currentBranch = git branch --show-current 2>$null
if ([string]::IsNullOrEmpty($currentBranch)) {
    Write-Host "📌 Creating main branch..." -ForegroundColor Yellow
    git checkout -b main
    $currentBranch = "main"
}

Write-Host "📁 Current branch: $currentBranch" -ForegroundColor Cyan
Write-Host ""

# Show status
Write-Host "📊 Git Status:" -ForegroundColor Cyan
git status --short
Write-Host ""

# Add all files
Write-Host "📦 Adding files to Git..." -ForegroundColor Yellow
git add .

# Show what will be committed
Write-Host ""
Write-Host "📝 Files to be committed:" -ForegroundColor Cyan
git status --short
Write-Host ""

# Get commit message from user
$commitMessage = Read-Host "Enter commit message (or press Enter for default)"
if ([string]::IsNullOrEmpty($commitMessage)) {
    $commitMessage = "feat: Instagram automation platform with auto webhook subscription"
}

# Commit
Write-Host ""
Write-Host "💾 Committing changes..." -ForegroundColor Yellow
git commit -m "$commitMessage"

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Nothing to commit or commit failed" -ForegroundColor Yellow
    Write-Host ""
}

# Check if remote exists
$remoteUrl = git remote get-url origin 2>$null

if ([string]::IsNullOrEmpty($remoteUrl)) {
    Write-Host ""
    Write-Host "🔗 No remote repository configured" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Enter your Git repository URL:" -ForegroundColor Cyan
    Write-Host "Examples:" -ForegroundColor Gray
    Write-Host "  - https://github.com/username/repo.git" -ForegroundColor Gray
    Write-Host "  - git@github.com:username/repo.git" -ForegroundColor Gray
    Write-Host ""
    
    $repoUrl = Read-Host "Repository URL"
    
    if (![string]::IsNullOrEmpty($repoUrl)) {
        Write-Host ""
        Write-Host "🔗 Adding remote 'origin'..." -ForegroundColor Yellow
        git remote add origin $repoUrl
        Write-Host "✅ Remote added: $repoUrl" -ForegroundColor Green
    }
    else {
        Write-Host "❌ No repository URL provided. Skipping remote configuration." -ForegroundColor Red
        exit 1
    }
}
else {
    Write-Host "✅ Remote configured: $remoteUrl" -ForegroundColor Green
}

# Push to remote
Write-Host ""
Write-Host "🚀 Pushing to remote repository..." -ForegroundColor Yellow
Write-Host ""

git push -u origin $currentBranch

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Successfully pushed to Git!" -ForegroundColor Green
    Write-Host ""
    Write-Host "===================================================" -ForegroundColor Cyan
    Write-Host "Next Steps for Dokploy Deployment:" -ForegroundColor Cyan
    Write-Host "===================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Login to your Dokploy dashboard" -ForegroundColor White
    Write-Host "2. Click 'New Application'" -ForegroundColor White
    Write-Host "3. Configure:" -ForegroundColor White
    Write-Host "   - Source: Git" -ForegroundColor Gray
    Write-Host "   - Repository: $remoteUrl" -ForegroundColor Gray
    Write-Host "   - Branch: $currentBranch" -ForegroundColor Gray
    Write-Host "   - Build Type: Docker Compose" -ForegroundColor Gray
    Write-Host ""
    Write-Host "4. Add Environment Variables:" -ForegroundColor White
    Write-Host "   Required:" -ForegroundColor Yellow
    Write-Host "   - SESSION_SECRET" -ForegroundColor Gray
    Write-Host "   - INSTAGRAM_APP_ID" -ForegroundColor Gray
    Write-Host "   - INSTAGRAM_APP_SECRET" -ForegroundColor Gray
    Write-Host "   - INSTAGRAM_WEBHOOK_VERIFY_TOKEN" -ForegroundColor Gray
    Write-Host "   - OAUTH_BASE_URL" -ForegroundColor Gray
    Write-Host "   Optional:" -ForegroundColor Yellow
    Write-Host "   - GEMINI_API_KEY" -ForegroundColor Gray
    Write-Host "   - FACEBOOK_APP_ID" -ForegroundColor Gray
    Write-Host "   - FACEBOOK_APP_SECRET" -ForegroundColor Gray
    Write-Host ""
    Write-Host "5. Click 'Deploy' and wait 3-5 minutes" -ForegroundColor White
    Write-Host ""
    Write-Host "📚 See DOKPLOY_DEPLOY.md for complete instructions" -ForegroundColor Cyan
    Write-Host ""
}
else {
    Write-Host ""
    Write-Host "❌ Push failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "- Authentication required (use SSH key or HTTPS token)" -ForegroundColor Gray
    Write-Host "- Branch protection enabled" -ForegroundColor Gray
    Write-Host "- Network issues" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Try:" -ForegroundColor Yellow
    Write-Host "  git push -u origin $currentBranch --force" -ForegroundColor Gray
    Write-Host ""
    exit 1
}
