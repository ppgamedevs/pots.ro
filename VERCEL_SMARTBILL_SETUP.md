# Configure SmartBill Environment Variables in Vercel Production

## Problem
The SmartBill environment variables are configured locally but missing in Vercel production, causing the admin page to show "Not configured".

## Solution
Add the SmartBill environment variables to Vercel Dashboard for the production environment.

## Required Variables

Add these 6 environment variables to Vercel Production:

| Variable Name | Value |
|---------------|-------|
| `INVOICE_PROVIDER` | `smartbill` |
| `SMARTBILL_API_BASE` | `https://ws.smartbill.ro/SBORO/api` |
| `SMARTBILL_USERNAME` | `eugen.costachescu@yahoo.com` |
| `SMARTBILL_TOKEN` | `30b85d9ce1b9f12edab13fd83d448b2b` |
| `SMARTBILL_SERIES` | `PO` |
| `COMPANY_VAT_NUMBER` | `RO43414871` |

## Quick Setup via Vercel Dashboard

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Select project: `pots.ro` (or `ppgamedevs/pots.ro`)

2. **Navigate to Environment Variables**
   - Click on your project
   - Go to **Settings** → **Environment Variables**

3. **Add Each Variable**
   - Click **Add New**
   - Enter variable name (e.g., `SMARTBILL_USERNAME`)
   - Enter value (e.g., `eugen.costachescu@yahoo.com`)
   - Select **Production** environment
   - Click **Save**
   - Repeat for all 6 variables

4. **Redeploy**
   - Go to **Deployments** tab
   - Click **Redeploy** on latest deployment
   - Wait 2-5 minutes for completion

5. **Verify**
   - Visit: `https://pots.ro/admin/smartbill`
   - Login as admin
   - All variables should show as "configured" (green checkmarks)

## Alternative: Use Helper Scripts

Helper scripts are available in the `scripts/` directory:

- **PowerShell (Windows)**: `scripts/add-smartbill-env-vercel.ps1`
- **Bash (Linux/Mac)**: `scripts/add-smartbill-env-vercel.sh`
- **Detailed Guide**: `scripts/add-smartbill-env-to-vercel.md`

## Important Notes

- **Security**: Vercel encrypts sensitive values (TOKEN, USERNAME)
- **Environment**: Must be added to **Production** environment specifically
- **Redeploy Required**: Variables only load on app start - redeploy after adding
- **No Code Changes**: Code already reads from `process.env` - no changes needed

## Troubleshooting

If variables still show "Not configured":

1. ✅ Verify exact spelling (case-sensitive: `SMARTBILL_USERNAME` not `smartbill_username`)
2. ✅ Confirm added to **Production** environment (not Preview)
3. ✅ Check Vercel deployment logs for errors
4. ✅ Wait a few minutes, then hard refresh page (Ctrl+F5)
5. ✅ Verify deployment completed successfully

## Files Involved

- `app/api/admin/smartbill/status/route.ts` - Checks environment variables
- `lib/invoicing/smartbill.ts` - Uses environment variables for API calls
