# Testing Sentry - Quick Guide

Your Sentry DSN has been added! Here's how to test it:

## Quick Test

1. **Start your dev server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Visit the test page**:
   - Go to: `http://localhost:3000/sentry-example-page`
   - Click "Trigger Client Error" or "Trigger Server Error"
   - Check your Sentry dashboard at [sentry.io](https://sentry.io)

## Important Notes

### Development vs Production

- **Development mode** (`NODE_ENV=development`):
  - Errors are logged to console
  - Errors are NOT sent to Sentry (to avoid spam during development)
  
- **Production mode** (`NODE_ENV=production`):
  - Errors are sent to Sentry
  - Errors are also logged to console

### To Test in Development

If you want to test Sentry in development, temporarily set:
```env
NODE_ENV=production
```

Or test on a production build:
```bash
npm run build
npm start
```

Then visit `http://localhost:3000/sentry-example-page`

## Verify It's Working

1. Trigger a test error from `/sentry-example-page`
2. Go to your Sentry dashboard → Issues
3. You should see the error appear within 10-30 seconds

## What to Look For

✅ **Success**: Error appears in Sentry dashboard with:
- Error message
- Stack trace
- Browser/device info
- User context (if set)

❌ **Not Working**: 
- Check that `NEXT_PUBLIC_SENTRY_DSN` is set correctly
- Check browser console for Sentry initialization errors
- Verify you're in production mode for errors to be sent

## Next Steps

Once you've verified Sentry is working:
1. ✅ Set up error alerts (email/Slack notifications)
2. ✅ Configure user context (after login)
3. ✅ Monitor your production errors

---

**Status**: ✅ DSN Added - Ready to Test!
