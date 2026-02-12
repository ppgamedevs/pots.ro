# Vercel Authentication Automation

This project includes automated scripts for Vercel authentication and deployment configuration.

## Overview

The automation system uses Vercel API tokens for authentication, allowing scripts to run without manual browser-based login.

## Files

- **`scripts/get-vercel-token.ps1`** - Acquires and stores Vercel API token
- **`scripts/add-smartbill-env-automated.ps1`** - Adds SmartBill environment variables to Vercel Production
- **`.env.local`** - Contains Vercel credentials (gitignored)

## Setup

### 1. Credentials Storage

Credentials are stored in `.env.local` (already gitignored):

```env
VERCEL_EMAIL=ppgamedevs@gmail.com
VERCEL_PASSWORD=Muierapid33#
```

**Security Note**: These credentials are stored locally and never committed to git.

### 2. Token Acquisition

Run the token acquisition script:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/get-vercel-token.ps1
```

This script offers two options:

**Option 1: Manual Token (Recommended)**
1. Go to https://vercel.com/account/tokens
2. Create a new token
3. Paste it when prompted
4. Token is saved to `.vercel/token`

**Option 2: CLI Login**
- Opens browser for OAuth authentication
- Stores credentials in Vercel CLI config
- May extract token if available

### 3. Using the Token

Once a token is acquired, it's stored in:
- `.vercel/token` (local file, gitignored)
- Or `VERCEL_TOKEN` environment variable

All Vercel CLI commands will automatically use the token via `--token` flag.

## Usage

### Add SmartBill Environment Variables

```powershell
powershell -ExecutionPolicy Bypass -File scripts/add-smartbill-env-automated.ps1
```

This script will:
1. Check for existing Vercel token
2. Acquire token if needed (via `get-vercel-token.ps1`)
3. Link project to Vercel (if not already linked)
4. Add all 6 SmartBill environment variables to Production
5. Optionally trigger redeploy

### Manual Token Setup

If you prefer to set up the token manually:

1. Create token at https://vercel.com/account/tokens
2. Store it in one of these locations:
   - `.vercel/token` file
   - `VERCEL_TOKEN` environment variable
   - Or paste when prompted by `get-vercel-token.ps1`

## Security

- Credentials stored in `.env.local` (gitignored)
- Token stored in `.vercel/token` (gitignored)
- Never commit credentials or tokens to git
- Token expires after 10 days of inactivity - script handles refresh

## Troubleshooting

**"No token found"**
- Run `scripts/get-vercel-token.ps1` to acquire token
- Or create token manually and save to `.vercel/token`

**"Token validation failed"**
- Token may be expired
- Run `get-vercel-token.ps1` again to get new token
- Or create new token from Vercel Dashboard

**"Project not linked"**
- Script will attempt to link automatically
- Or run `npx vercel link` manually

## Token Storage Locations

The scripts check for tokens in this order:
1. `.vercel/token` file (project-local)
2. `VERCEL_TOKEN` environment variable
3. Vercel CLI global config (if logged in via CLI)
