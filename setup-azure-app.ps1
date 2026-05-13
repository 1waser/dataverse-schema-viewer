
# Dataverse Schema Viewer - Azure AD App Registration Script
# Usage: .\setup-azure-app.ps1

param(
    [string]$VercelUri = ""
)

$AppName      = "dataverse-schema-viewer"
$LocalhostUri = "http://localhost:5500"

# 1. Install module
Write-Host ""
Write-Host "[1/5] Checking Microsoft.Graph module..." -ForegroundColor Cyan

if (-not (Get-Module -ListAvailable Microsoft.Graph.Applications)) {
    Write-Host "  Installing..." -ForegroundColor Yellow
    Install-Module Microsoft.Graph.Applications -Scope CurrentUser -Force -ErrorAction Stop
    Write-Host "  Done" -ForegroundColor Green
} else {
    Write-Host "  Already installed" -ForegroundColor Green
}

Import-Module Microsoft.Graph.Applications -ErrorAction Stop

# 2. Sign in
Write-Host ""
Write-Host "[2/5] Signing in to Microsoft 365..." -ForegroundColor Cyan
Write-Host "  Browser will open - sign in with your admin account" -ForegroundColor Yellow

Connect-MgGraph -Scopes "Application.ReadWrite.All","DelegatedPermissionGrant.ReadWrite.All" -UseDeviceAuthentication -ErrorAction Stop

$ctx = Get-MgContext
Write-Host "  Signed in as: $($ctx.Account)" -ForegroundColor Green

# 3. Register app
Write-Host ""
Write-Host "[3/5] Registering app..." -ForegroundColor Cyan

$existing = Get-MgApplication -Filter "displayName eq '$AppName'" -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "  Using existing app: $($existing.AppId)" -ForegroundColor Yellow
    $app = $existing
} else {
    $redirectUris = @($LocalhostUri)
    if ($VercelUri) { $redirectUris += $VercelUri }

    $spaRedirect = @{ RedirectUris = $redirectUris }

    # Dynamics CRM scope
    $crmAppId = "00000007-0000-0000-c000-000000000000"
    $crmSp    = Get-MgServicePrincipal -Filter "appId eq '$crmAppId'" -ErrorAction SilentlyContinue

    $requiredAccess = @()

    if ($crmSp) {
        $scopeId = ($crmSp.Oauth2PermissionScopes | Where-Object { $_.Value -eq "user_impersonation" }).Id
        if ($scopeId) {
            $requiredAccess += @{
                ResourceAppId  = $crmAppId
                ResourceAccess = @(@{ Id = $scopeId; Type = "Scope" })
            }
        }
    }

    # Graph scopes
    $graphAppId = "00000003-0000-0000-c000-000000000000"
    $graphSp    = Get-MgServicePrincipal -Filter "appId eq '$graphAppId'"
    $scopes     = @("openid","profile","email","offline_access")
    $graphAccess = $scopes | ForEach-Object {
        $id = ($graphSp.Oauth2PermissionScopes | Where-Object { $_.Value -eq $_ }).Id
        @{ Id = $id; Type = "Scope" }
    }
    $requiredAccess += @{
        ResourceAppId  = $graphAppId
        ResourceAccess = $graphAccess
    }

    $app = New-MgApplication `
        -DisplayName $AppName `
        -SignInAudience "AzureADMultipleOrgs" `
        -Spa $spaRedirect `
        -RequiredResourceAccess $requiredAccess `
        -ErrorAction Stop

    Write-Host "  App registered: $($app.AppId)" -ForegroundColor Green
}

# 4. Service principal
Write-Host ""
Write-Host "[4/5] Service principal..." -ForegroundColor Cyan

$sp = Get-MgServicePrincipal -Filter "appId eq '$($app.AppId)'" -ErrorAction SilentlyContinue
if (-not $sp) {
    $null = New-MgServicePrincipal -AppId $app.AppId -ErrorAction Stop
    Write-Host "  Created" -ForegroundColor Green
} else {
    Write-Host "  Already exists" -ForegroundColor Yellow
}

# 5. Update auth.js
Write-Host ""
Write-Host "[5/5] Updating auth.js..." -ForegroundColor Cyan

$authPath = Join-Path $PSScriptRoot "src\auth.js"
if (Test-Path $authPath) {
    $content = Get-Content $authPath -Raw
    $updated = $content -replace "const CLIENT_ID = '.*?';", "const CLIENT_ID = '$($app.AppId)';"
    Set-Content $authPath $updated -Encoding UTF8
    Write-Host "  auth.js updated" -ForegroundColor Green
} else {
    Write-Host "  auth.js not found: $authPath" -ForegroundColor Red
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Done!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  App Name  : $AppName"
Write-Host "  Client ID : $($app.AppId)"
Write-Host "  Tenant ID : $($ctx.TenantId)"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Deploy to Vercel and get the URL"
Write-Host "  2. Re-run with: .\setup-azure-app.ps1 -VercelUri https://your-app.vercel.app"
Write-Host "  3. Grant admin consent for user_impersonation if needed"
Write-Host ""
$portalBase = "https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade"
Write-Host "  Portal: $portalBase"
Write-Host "  App ID: $($app.AppId)"
Write-Host ""
