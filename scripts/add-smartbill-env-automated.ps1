# Automated script to add SmartBill environment variables to Vercel Production
# This script uses Vercel CLI with piped values for non-interactive execution

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "SmartBill Environment Variables - Automated Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if npx is available
if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
    Write-Host "Error: npx not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Get Vercel token
Write-Host "Acquiring Vercel authentication token..." -ForegroundColor Yellow
$tokenScript = Join-Path $PSScriptRoot "get-vercel-token.ps1"
if (-not (Test-Path $tokenScript)) {
    Write-Host "Error: Token acquisition script not found at $tokenScript" -ForegroundColor Red
    exit 1
}

# Check for token in various locations first
$vercelToken = $null

if (Test-Path ".vercel/token") {
    $vercelToken = Get-Content ".vercel/token" -Raw | ForEach-Object { $_.Trim() }
    if ($vercelToken) {
        Write-Host "Found token in .vercel/token" -ForegroundColor Green
    }
} elseif ($env:VERCEL_TOKEN) {
    $vercelToken = $env:VERCEL_TOKEN
    Write-Host "Found token in VERCEL_TOKEN environment variable" -ForegroundColor Green
}

# If no token found, run token acquisition script
if (-not $vercelToken) {
    Write-Host "No token found. Running token acquisition script..." -ForegroundColor Yellow
    $tokenResult = & powershell -ExecutionPolicy Bypass -File $tokenScript 2>&1
    if ($tokenResult -and $tokenResult.Trim()) {
        $vercelToken = $tokenResult.Trim()
    }
    
    # Check again after script runs
    if (-not $vercelToken -and (Test-Path ".vercel/token")) {
        $vercelToken = Get-Content ".vercel/token" -Raw | ForEach-Object { $_.Trim() }
    }
}

# Verify token works
if ($vercelToken) {
    Write-Host "Testing Vercel token..." -ForegroundColor Yellow
    $ErrorActionPreference = "SilentlyContinue"
    $whoamiOutput = npx vercel whoami --token $vercelToken 2>&1 | Out-String
    $exitCode = $LASTEXITCODE
    $ErrorActionPreference = "Stop"
    
    if ($exitCode -eq 0 -and $whoamiOutput -notmatch "error" -and $whoamiOutput -notmatch "not logged") {
        Write-Host "Vercel authentication successful!" -ForegroundColor Green
    } else {
        Write-Host "Token validation failed. Please run get-vercel-token.ps1 manually." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "No Vercel token found. Attempting CLI login..." -ForegroundColor Yellow
    Write-Host "This will open your browser for authentication." -ForegroundColor White
    Write-Host ""
    npx vercel login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Login failed or cancelled." -ForegroundColor Red
        exit 1
    }
    Write-Host "Login successful!" -ForegroundColor Green
    $vercelToken = $null  # Will use CLI's stored credentials
}

Write-Host ""

# Check if project is linked
if (-not (Test-Path .vercel)) {
    Write-Host "Project not linked to Vercel. Linking now..." -ForegroundColor Yellow
    if ($vercelToken) {
        npx vercel link --yes --token $vercelToken 2>&1 | Out-Null
    } else {
        npx vercel link --yes 2>&1 | Out-Null
    }
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to link project. Please run 'npx vercel link' manually." -ForegroundColor Red
        exit 1
    }
    Write-Host "Project linked successfully." -ForegroundColor Green
} else {
    Write-Host "Project is already linked to Vercel." -ForegroundColor Green
}

Write-Host ""

# Define variables as hashtable
$vars = @{
    "INVOICE_PROVIDER" = "smartbill"
    "SMARTBILL_API_BASE" = "https://ws.smartbill.ro/SBORO/api"
    "SMARTBILL_USERNAME" = "eugen.costachescu@yahoo.com"
    "SMARTBILL_TOKEN" = "30b85d9ce1b9f12edab13fd83d448b2b"
    "SMARTBILL_SERIES" = "PO"
    "COMPANY_VAT_NUMBER" = "RO43414871"
}

Write-Host "Adding environment variables to Vercel Production..." -ForegroundColor Yellow
Write-Host ""

$successCount = 0
$failCount = 0

# Add each variable using piped input
foreach ($varName in $vars.Keys) {
    $varValue = $vars[$varName]
    
    Write-Host "Adding $varName..." -ForegroundColor Cyan -NoNewline
    
    # Create a temporary file with the value
    $tempFile = [System.IO.Path]::GetTempFileName()
    try {
        # Write value to temp file
        [System.IO.File]::WriteAllText($tempFile, $varValue)
        
        # Use Get-Content to pipe to vercel env add
        if ($vercelToken) {
            $result = Get-Content $tempFile | npx vercel env add $varName production --token $vercelToken 2>&1
        } else {
            $result = Get-Content $tempFile | npx vercel env add $varName production 2>&1
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host " Success" -ForegroundColor Green
            $successCount++
        } else {
            # Check if variable already exists
            $resultStr = $result | Out-String
            if ($resultStr -match "already exists" -or $resultStr -match "already set") {
                Write-Host " Already exists (skipping)" -ForegroundColor Yellow
                $successCount++
            } else {
                Write-Host " Failed" -ForegroundColor Red
                Write-Host "   Error: $resultStr" -ForegroundColor Red
                $failCount++
            }
        }
    } catch {
        Write-Host " Error: $_" -ForegroundColor Red
        $failCount++
    } finally {
        # Clean up temp file
        if (Test-Path $tempFile) {
            Remove-Item $tempFile -Force
        }
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Successfully added: $successCount" -ForegroundColor Green
if ($failCount -gt 0) {
    Write-Host "Failed: $failCount" -ForegroundColor Red
}
Write-Host ""

if ($successCount -eq $vars.Count) {
    Write-Host "All environment variables added successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Go to Vercel Dashboard -> Deployments" -ForegroundColor White
    Write-Host "2. Click Redeploy on the latest deployment" -ForegroundColor White
    Write-Host "3. Wait for deployment to complete" -ForegroundColor White
    Write-Host "4. Verify at https://pots.ro/admin/smartbill" -ForegroundColor White
    Write-Host ""
    
    # Ask if user wants to trigger redeploy
    $redeploy = Read-Host "Do you want to trigger a redeploy now? (y/n)"
    if ($redeploy -eq "y" -or $redeploy -eq "Y") {
        Write-Host ""
        Write-Host "Triggering redeploy..." -ForegroundColor Yellow
        if ($vercelToken) {
            npx vercel --prod --yes --token $vercelToken
        } else {
            npx vercel --prod --yes
        }
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Redeploy triggered successfully!" -ForegroundColor Green
        } else {
            Write-Host "Failed to trigger redeploy. Please do it manually from Vercel Dashboard." -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "Some variables failed to add. Please check the errors above." -ForegroundColor Yellow
    Write-Host "You can add them manually via Vercel Dashboard" -ForegroundColor Yellow
    Write-Host "Visit: https://vercel.com/dashboard" -ForegroundColor Cyan
}
