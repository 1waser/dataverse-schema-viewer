
# Dataverse Schema Viewer - Azure AD App Registration
# STEP 1: Run "az login" in your terminal first, then run this script.
# Usage:  .\setup-azure-app-az.ps1
# With Vercel URL: .\setup-azure-app-az.ps1 -VercelUri https://your-app.vercel.app

param([string]$VercelUri = "")

$env:PATH += ";C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin"

$AppName      = "dataverse-schema-viewer"
$LocalhostUri = "http://localhost:5500"

# Check login (use signed-in-user instead of account show, works without subscriptions)
Write-Host ""
$me = az ad signed-in-user show --query "{upn:userPrincipalName, tenant:''}" -o json 2>$null | ConvertFrom-Json
$tenantRaw = az account show --query tenantId -o tsv --only-show-errors 2>$null
if (-not $tenantRaw) {
    $tenantRaw = az account list --query "[0].tenantId" -o tsv --all 2>$null
}
if (-not $me) {
    Write-Host "Not logged in. Run this first in your terminal:" -ForegroundColor Red
    Write-Host "  az login --allow-no-subscriptions" -ForegroundColor Yellow
    exit 1
}
$tenantId = $tenantRaw
Write-Host "[OK] Logged in as: $($me.upn)" -ForegroundColor Green
Write-Host "     Tenant: $tenantId"

# Check existing app
Write-Host ""
Write-Host "[1/3] Checking for existing app..." -ForegroundColor Cyan
$clientId = az ad app list --display-name $AppName --query "[0].appId" -o tsv 2>$null

if ($clientId -and $clientId.Trim() -ne "") {
    $clientId = $clientId.Trim()
    Write-Host "  Found existing app: $clientId" -ForegroundColor Yellow

    # Update redirect URIs if VercelUri given
    if ($VercelUri) {
        $objectId = az ad app show --id $clientId --query id -o tsv 2>$null
        $uriJson = '["' + $LocalhostUri + '","' + $VercelUri + '"]'
        az rest --method PATCH `
            --uri "https://graph.microsoft.com/v1.0/applications/$objectId" `
            --headers "Content-Type=application/json" `
            --body "{`"spa`":{`"redirectUris`":$uriJson}}" 2>&1 | Out-Null
        Write-Host "  Redirect URIs updated (added $VercelUri)" -ForegroundColor Green
    }
} else {
    Write-Host "  Creating new app..." -ForegroundColor Cyan

    $result = az ad app create `
        --display-name $AppName `
        --sign-in-audience AzureADMultipleOrgs `
        --query "{appId:appId, id:id}" -o json 2>&1

    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ERROR: $result" -ForegroundColor Red
        exit 1
    }

    $obj = $result | ConvertFrom-Json
    $clientId = $obj.appId
    $objectId = $obj.id
    Write-Host "  Created: $clientId" -ForegroundColor Green

    # SPA redirect URIs
    Write-Host "  Setting SPA redirect URIs..." -ForegroundColor Yellow
    $uriJson = if ($VercelUri) {
        '["' + $LocalhostUri + '","' + $VercelUri + '"]'
    } else {
        '["' + $LocalhostUri + '"]'
    }
    az rest --method PATCH `
        --uri "https://graph.microsoft.com/v1.0/applications/$objectId" `
        --headers "Content-Type=application/json" `
        --body "{`"spa`":{`"redirectUris`":$uriJson}}" 2>&1 | Out-Null

    # Dynamics CRM: user_impersonation
    Write-Host "  Adding Dynamics CRM permission..." -ForegroundColor Yellow
    $crmAppId   = "00000007-0000-0000-c000-000000000000"
    $crmScopeId = az ad sp show --id $crmAppId `
        --query "oauth2PermissionScopes[?value=='user_impersonation'].id | [0]" `
        -o tsv 2>$null

    if ($crmScopeId -and $crmScopeId.Trim() -ne "") {
        az ad app permission add --id $clientId `
            --api $crmAppId `
            --api-permissions "$($crmScopeId.Trim())=Scope" 2>&1 | Out-Null
        Write-Host "    user_impersonation: OK" -ForegroundColor Green
    } else {
        Write-Host "    Dynamics CRM SP not found - add permission manually if needed" -ForegroundColor Yellow
    }

    # Graph: openid, profile, email, offline_access
    Write-Host "  Adding Graph permissions..." -ForegroundColor Yellow
    $graphAppId = "00000003-0000-0000-c000-000000000000"
    $graphScopes = @{
        "openid"         = "37f7f235-527c-4136-accd-4a02d197296e"
        "profile"        = "14dad69e-099b-42c9-810b-d002981feec1"
        "email"          = "64a6cdd6-aab1-4aaf-94b8-3cc8405e90d0"
        "offline_access" = "7427e0e9-2fba-42fe-b0c0-848c9e6a8182"
    }
    foreach ($s in $graphScopes.GetEnumerator()) {
        az ad app permission add --id $clientId `
            --api $graphAppId `
            --api-permissions "$($s.Value)=Scope" 2>&1 | Out-Null
    }
    Write-Host "    openid/profile/email/offline_access: OK" -ForegroundColor Green

    # Service principal
    Write-Host ""
    Write-Host "[2/3] Creating service principal..." -ForegroundColor Cyan
    az ad sp create --id $clientId 2>&1 | Out-Null
    Write-Host "  Done" -ForegroundColor Green
}

# Update auth.js
Write-Host ""
Write-Host "[3/3] Updating auth.js..." -ForegroundColor Cyan
$authPath = Join-Path $PSScriptRoot "src\auth.js"
if (Test-Path $authPath) {
    $content = Get-Content $authPath -Raw
    $updated = $content -replace "const CLIENT_ID = '.*?';", "const CLIENT_ID = '$clientId';"
    Set-Content $authPath $updated -Encoding UTF8
    Write-Host "  auth.js updated!" -ForegroundColor Green
} else {
    Write-Host "  auth.js not found at: $authPath" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Done!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Client ID : $clientId"
Write-Host "  Tenant ID : $tenantId"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Commit & deploy to Vercel"
Write-Host "  2. Re-run: .\setup-azure-app-az.ps1 -VercelUri https://your-app.vercel.app"
Write-Host "  3. Admin consent for Dynamics CRM > user_impersonation in Azure Portal"
Write-Host ""
