# Add SmartBill Environment Variables to Vercel Production

## Quick Reference - Copy/Paste Values

Use these exact values when adding environment variables in Vercel Dashboard:

| Variable Name | Value | Environment |
|--------------|------|-------------|
| `INVOICE_PROVIDER` | `smartbill` | Production |
| `SMARTBILL_API_BASE` | `https://ws.smartbill.ro/SBORO/api` | Production |
| `SMARTBILL_USERNAME` | `eugen.costachescu@yahoo.com` | Production |
| `SMARTBILL_TOKEN` | `30b85d9ce1b9f12edab13fd83d448b2b` | Production |
| `SMARTBILL_SERIES` | `PO` | Production |
| `COMPANY_VAT_NUMBER` | `RO43414871` | Production |

## Step-by-Step Instructions

### Via Vercel Dashboard (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select the `pots.ro` project (or `ppgamedevs/pots.ro`)
3. Navigate to **Settings** → **Environment Variables**
4. For each variable in the table above:
   - Click **Add New**
   - Paste the **Variable Name**
   - Paste the **Value**
   - Select **Production** environment
   - Click **Save**
5. After adding all 6 variables, go to **Deployments**
6. Click **Redeploy** on the latest deployment

### Via Vercel CLI (Alternative)

If you prefer command line, run these commands (you'll be prompted for values):

```bash
# Login to Vercel
npx vercel login

# Link project (if not already linked)
npx vercel link

# Add each environment variable (you'll be prompted to enter the value)
npx vercel env add INVOICE_PROVIDER production
# When prompted, enter: smartbill

npx vercel env add SMARTBILL_API_BASE production
# When prompted, enter: https://ws.smartbill.ro/SBORO/api

npx vercel env add SMARTBILL_USERNAME production
# When prompted, enter: eugen.costachescu@yahoo.com

npx vercel env add SMARTBILL_TOKEN production
# When prompted, enter: 30b85d9ce1b9f12edab13fd83d448b2b

npx vercel env add SMARTBILL_SERIES production
# When prompted, enter: PO

npx vercel env add COMPANY_VAT_NUMBER production
# When prompted, enter: RO43414871

# Redeploy
npx vercel --prod
```

## Verification

After redeploying:

1. Wait 2-5 minutes for deployment to complete
2. Visit `https://pots.ro/admin/smartbill` (or your production domain)
3. Login as admin
4. Verify all SmartBill variables show as "configured" (green checkmarks)
5. Sensitive variables (USERNAME, TOKEN) should show fingerprints, not actual values

## Troubleshooting

If variables still show "Not configured":
- Verify exact spelling (case-sensitive)
- Confirm variables are added to **Production** environment (not Preview)
- Check Vercel deployment logs for errors
- Wait a few minutes and hard refresh the page (Ctrl+F5)
