#!/bin/bash

# Git Deployment Script for Dokploy
# Run this script to prepare and push your code to Git

echo "🚀 Instagram Automation Platform - Git Deployment"
echo "==================================================="
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "📦 Initializing Git repository..."
    git init
    echo "✅ Git initialized"
else
    echo "✅ Git repository already initialized"
fi

# Check current branch
currentBranch=$(git branch --show-current 2>/dev/null)
if [ -z "$currentBranch" ]; then
    echo "📌 Creating main branch..."
    git checkout -b main
    currentBranch="main"
fi

echo "📁 Current branch: $currentBranch"
echo ""

# Show status
echo "📊 Git Status:"
git status --short
echo ""

# Add all files
echo "📦 Adding files to Git..."
git add .

# Show what will be committed
echo ""
echo "📝 Files to be committed:"
git status --short
echo ""

# Get commit message from user
read -p "Enter commit message (or press Enter for default): " commitMessage
if [ -z "$commitMessage" ]; then
    commitMessage="feat: Instagram automation platform with auto webhook subscription"
fi

# Commit
echo ""
echo "💾 Committing changes..."
git commit -m "$commitMessage"

# Check if remote exists
remoteUrl=$(git remote get-url origin 2>/dev/null)

if [ -z "$remoteUrl" ]; then
    echo ""
    echo "🔗 No remote repository configured"
    echo ""
    echo "Enter your Git repository URL:"
    echo "Examples:"
    echo "  - https://github.com/username/repo.git"
    echo "  - git@github.com:username/repo.git"
    echo ""
    
    read -p "Repository URL: " repoUrl
    
    if [ ! -z "$repoUrl" ]; then
        echo ""
        echo "🔗 Adding remote 'origin'..."
        git remote add origin "$repoUrl"
        echo "✅ Remote added: $repoUrl"
    else
        echo "❌ No repository URL provided. Skipping remote configuration."
        exit 1
    fi
else
    echo "✅ Remote configured: $remoteUrl"
fi

# Push to remote
echo ""
echo "🚀 Pushing to remote repository..."
echo ""

git push -u origin "$currentBranch"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to Git!"
    echo ""
    echo "==================================================="
    echo "Next Steps for Dokploy Deployment:"
    echo "==================================================="
    echo ""
    echo "1. Login to your Dokploy dashboard"
    echo "2. Click 'New Application'"
    echo "3. Configure:"
    echo "   - Source: Git"
    echo "   - Repository: $remoteUrl"
    echo "   - Branch: $currentBranch"
    echo "   - Build Type: Docker Compose"
    echo ""
    echo "4. Add Environment Variables:"
    echo "   Required:"
    echo "   - SESSION_SECRET"
    echo "   - INSTAGRAM_APP_ID"
    echo "   - INSTAGRAM_APP_SECRET"
    echo "   - INSTAGRAM_WEBHOOK_VERIFY_TOKEN"
    echo "   - OAUTH_BASE_URL"
    echo "   Optional:"
    echo "   - GEMINI_API_KEY"
    echo "   - FACEBOOK_APP_ID"
    echo "   - FACEBOOK_APP_SECRET"
    echo ""
    echo "5. Click 'Deploy' and wait 3-5 minutes"
    echo ""
    echo "📚 See DOKPLOY_DEPLOY.md for complete instructions"
    echo ""
else
    echo ""
    echo "❌ Push failed!"
    echo ""
    echo "Common issues:"
    echo "- Authentication required (use SSH key or HTTPS token)"
    echo "- Branch protection enabled"
    echo "- Network issues"
    echo ""
    echo "Try:"
    echo "  git push -u origin $currentBranch --force"
    echo ""
    exit 1
fi
