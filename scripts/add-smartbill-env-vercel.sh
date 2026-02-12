#!/bin/bash
# Script to add SmartBill environment variables to Vercel Production
# Usage: Run this script and follow the prompts, or use Vercel Dashboard instead

echo "=========================================="
echo "SmartBill Environment Variables Setup"
echo "=========================================="
echo ""
echo "This script will help you add SmartBill environment variables to Vercel."
echo "You can also add them manually via Vercel Dashboard (recommended)."
echo ""
echo "Press Ctrl+C to cancel, or Enter to continue..."
read

# Check if vercel CLI is available
if ! command -v vercel &> /dev/null && ! command -v npx &> /dev/null; then
    echo "Error: Vercel CLI not found. Install it with: npm i -g vercel"
    echo "Or use Vercel Dashboard instead: https://vercel.com/dashboard"
    exit 1
fi

# Use npx if vercel command not found
VERCEL_CMD="vercel"
if ! command -v vercel &> /dev/null; then
    VERCEL_CMD="npx vercel"
fi

echo ""
echo "Step 1: Login to Vercel (if not already logged in)"
$VERCEL_CMD login

echo ""
echo "Step 2: Link project (if not already linked)"
$VERCEL_CMD link

echo ""
echo "Step 3: Adding environment variables..."
echo "You will be prompted to enter each value."
echo ""

# Define variables
declare -A vars=(
    ["INVOICE_PROVIDER"]="smartbill"
    ["SMARTBILL_API_BASE"]="https://ws.smartbill.ro/SBORO/api"
    ["SMARTBILL_USERNAME"]="eugen.costachescu@yahoo.com"
    ["SMARTBILL_TOKEN"]="30b85d9ce1b9f12edab13fd83d448b2b"
    ["SMARTBILL_SERIES"]="PO"
    ["COMPANY_VAT_NUMBER"]="RO43414871"
)

# Add each variable
for var_name in "${!vars[@]}"; do
    var_value="${vars[$var_name]}"
    echo "Adding $var_name..."
    echo "$var_value" | $VERCEL_CMD env add "$var_name" production
    if [ $? -eq 0 ]; then
        echo "✓ $var_name added successfully"
    else
        echo "✗ Failed to add $var_name"
    fi
    echo ""
done

echo ""
echo "=========================================="
echo "Environment variables added!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Go to Vercel Dashboard → Deployments"
echo "2. Click 'Redeploy' on the latest deployment"
echo "3. Wait for deployment to complete (2-5 minutes)"
echo "4. Verify at https://pots.ro/admin/smartbill"
echo ""
