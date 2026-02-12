# Script to obtain Vercel API token
# This script helps automate Vercel authentication by obtaining and storing an API token

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Vercel Token Acquisition" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
if (-not (Test-Path .env.local)) {
    Write-Host "Error: .env.local file not found." -ForegroundColor Red
    Write-Host "Please create .env.local file first." -ForegroundColor Yellow
    exit 1
}

# Load credentials from .env.local
$envContent = Get-Content .env.local -Raw
$vercelEmail = ""
$vercelPassword = ""

if ($envContent -match "VERCEL_EMAIL=(.+)") {
    $vercelEmail = $matches[1].Trim()
}
if ($envContent -match "VERCEL_PASSWORD=(.+)") {
    $vercelPassword = $matches[1].Trim()
}

# Check for existing token
$tokenFile = ".vercel/token"
$existingToken = $null

if (Test-Path $tokenFile) {
    $existingToken = Get-Content $tokenFile -Raw | ForEach-Object { $_.Trim() }
    if ($existingToken) {
        Write-Host "Found existing token in .vercel/token" -ForegroundColor Green
        Write-Host "Testing token..." -ForegroundColor Yellow
        
        $ErrorActionPreference = "SilentlyContinue"
        $testResult = npx vercel whoami --token $existingToken 2>&1 | Out-String
        $testExitCode = $LASTEXITCODE
        $ErrorActionPreference = "Stop"
        
        if ($testExitCode -eq 0 -and $testResult -notmatch "error" -and $testResult -notmatch "not logged") {
            Write-Host "Token is valid!" -ForegroundColor Green
            Write-Host "Token: $($existingToken.Substring(0, [Math]::Min(20, $existingToken.Length)))..." -ForegroundColor Gray
            Write-Output $existingToken
            exit 0
        } else {
            Write-Host "Existing token is invalid or expired." -ForegroundColor Yellow
        }
    }
}

# Check for VERCEL_TOKEN in environment
if ($env:VERCEL_TOKEN) {
    Write-Host "Found VERCEL_TOKEN in environment" -ForegroundColor Green
    Write-Host "Testing token..." -ForegroundColor Yellow
    
    $ErrorActionPreference = "SilentlyContinue"
    $testResult = npx vercel whoami --token $env:VERCEL_TOKEN 2>&1 | Out-String
    $testExitCode = $LASTEXITCODE
    $ErrorActionPreference = "Stop"
    
    if ($testExitCode -eq 0 -and $testResult -notmatch "error" -and $testResult -notmatch "not logged") {
        Write-Host "Token is valid!" -ForegroundColor Green
        Write-Output $env:VERCEL_TOKEN
        exit 0
    }
}

Write-Host ""
Write-Host "No valid token found. You need to create a Vercel API token." -ForegroundColor Yellow
Write-Host ""
Write-Host "Option 1: Create token manually (Recommended)" -ForegroundColor Cyan
Write-Host "1. Go to: https://vercel.com/account/tokens" -ForegroundColor White
Write-Host "2. Click 'Create Token'" -ForegroundColor White
Write-Host "3. Give it a name (e.g., 'SmartBill Setup')" -ForegroundColor White
Write-Host "4. Copy the token" -ForegroundColor White
Write-Host "5. Paste it below when prompted" -ForegroundColor White
Write-Host ""
Write-Host "Option 2: Use Vercel CLI login (will open browser)" -ForegroundColor Cyan
Write-Host "This will authenticate via browser and store credentials locally." -ForegroundColor White
Write-Host ""

$choice = Read-Host "Choose option (1 for manual token, 2 for CLI login, or 'q' to quit)"

if ($choice -eq "q" -or $choice -eq "Q") {
    Write-Host "Exiting..." -ForegroundColor Yellow
    exit 1
}

if ($choice -eq "1") {
    Write-Host ""
    Write-Host "Please paste your Vercel API token:" -ForegroundColor Cyan
    $token = Read-Host -AsSecureString
    $tokenPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($token))
    
    if (-not $tokenPlain) {
        Write-Host "No token provided. Exiting." -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host "Testing token..." -ForegroundColor Yellow
    $ErrorActionPreference = "SilentlyContinue"
    $testResult = npx vercel whoami --token $tokenPlain 2>&1 | Out-String
    $testExitCode = $LASTEXITCODE
    $ErrorActionPreference = "Stop"
    
    if ($testExitCode -eq 0 -and $testResult -notmatch "error" -and $testResult -notmatch "not logged") {
        Write-Host "Token is valid!" -ForegroundColor Green
        
        # Store token
        if (-not (Test-Path .vercel)) {
            New-Item -ItemType Directory -Path .vercel -Force | Out-Null
        }
        Set-Content -Path $tokenFile -Value $tokenPlain -NoNewline
        Write-Host "Token saved to .vercel/token" -ForegroundColor Green
        
        Write-Output $tokenPlain
        exit 0
    } else {
        Write-Host "Token validation failed: $testResult" -ForegroundColor Red
        exit 1
    }
} elseif ($choice -eq "2") {
    Write-Host ""
    Write-Host "Starting Vercel CLI login (will open browser)..." -ForegroundColor Yellow
    Write-Host "Please complete the authentication in your browser." -ForegroundColor White
    Write-Host ""
    
    npx vercel login
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Login successful!" -ForegroundColor Green
        
        # Try to extract token from Vercel config
        $vercelConfigPath = "$env:USERPROFILE\.vercel\auth.json"
        if (Test-Path $vercelConfigPath) {
            try {
                $config = Get-Content $vercelConfigPath | ConvertFrom-Json
                if ($config.token) {
                    Write-Host "Found token in Vercel config" -ForegroundColor Green
                    
                    # Store token in project .vercel directory
                    if (-not (Test-Path .vercel)) {
                        New-Item -ItemType Directory -Path .vercel -Force | Out-Null
                    }
                    Set-Content -Path $tokenFile -Value $config.token -NoNewline
                    Write-Host "Token saved to .vercel/token" -ForegroundColor Green
                    Write-Output $config.token
                    exit 0
                }
            } catch {
                Write-Host "Could not extract token from config, but login was successful." -ForegroundColor Yellow
                Write-Host "You can now use Vercel CLI commands without --token flag." -ForegroundColor Green
                Write-Output ""
                exit 0
            }
        } else {
            Write-Host "Login successful. Vercel CLI is now authenticated." -ForegroundColor Green
            Write-Host "Note: Token may be stored in Vercel CLI's global config." -ForegroundColor Gray
            Write-Output ""
            exit 0
        }
    } else {
        Write-Host "Login failed or cancelled." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Invalid choice. Exiting." -ForegroundColor Red
    exit 1
}
