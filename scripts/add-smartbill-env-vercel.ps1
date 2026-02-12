# PowerShell script to add SmartBill environment variables to Vercel Production
# Usage: Run this script in PowerShell, or use Vercel Dashboard instead

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "SmartBill Environment Variables Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script will help you add SmartBill environment variables to Vercel."
Write-Host "You can also add them manually via Vercel Dashboard (recommended)."
Write-Host ""
Write-Host "Press Enter to continue or Ctrl+C to cancel..."
Read-Host

# Check if npx is available
if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
    Write-Host "Error: npx not found. Please install Node.js first." -ForegroundColor Red
    Write-Host "Or use Vercel Dashboard instead: https://vercel.com/dashboard" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Step 1: Login to Vercel (if not already logged in)" -ForegroundColor Yellow
npx vercel login

Write-Host ""
Write-Host "Step 2: Link project (if not already linked)" -ForegroundColor Yellow
npx vercel link

Write-Host ""
Write-Host "Step 3: Adding environment variables..." -ForegroundColor Yellow
Write-Host "You will be prompted to enter each value."
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

# Add each variable
foreach ($varName in $vars.Keys) {
    $varValue = $vars[$varName]
    Write-Host "Adding $varName..." -ForegroundColor Cyan
    $varValue | npx vercel env add $varName production
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ $varName added successfully" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to add $varName" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Environment variables added!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Go to Vercel Dashboard → Deployments"
Write-Host "2. Click 'Redeploy' on the latest deployment"
Write-Host "3. Wait for deployment to complete (2-5 minutes)"
Write-Host "4. Verify at https://pots.ro/admin/smartbill"
Write-Host ""
