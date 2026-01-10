# Sentry Setup Guide

Sentry has been installed and configured for error tracking in production. Follow these steps to complete the setup.

## 1. Create a Sentry Account

1. Go to [https://sentry.io](https://sentry.io)
2. Sign up for a free account (or use existing)
3. Create a new organization (if needed)

## 2. Create a Project

1. In Sentry dashboard, click "Create Project"
2. Select **"Next.js"** as the platform
3. Enter project name: `pots-ro` (or your preferred name)
4. Select your organization
5. Click "Create Project"

## 3. Get Your DSN

1. After creating the project, Sentry will show you a DSN (Data Source Name)
2. It looks like: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`
3. Copy this DSN - you'll need it for environment variables

## 4. Configure Environment Variables

Add these to your `.env.local` (for development) and Vercel environment variables (for production):

```env
# Sentry Error Tracking
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/your-project-id
SENTRY_DSN=https://your-dsn@sentry.io/your-project-id
SENTRY_ORG=your-sentry-org
SENTRY_PROJECT=your-sentry-project
SENTRY_AUTH_TOKEN=your-sentry-auth-token
```

### Getting the Auth Token (for source maps)

1. Go to Sentry Settings → Auth Tokens
2. Create a new token with these scopes:
   - `project:read`
   - `project:releases`
   - `org:read`
3. Copy the token and add it as `SENTRY_AUTH_TOKEN`

**Note**: The auth token is only needed if you want to upload source maps. For basic error tracking, you can skip it.

## 5. Test the Integration

### Test Client-Side Errors

1. Create a test page or add this to an existing page:

```tsx
'use client';

export default function TestSentry() {
  const triggerError = () => {
    throw new Error('Test Sentry error from client');
  };

  return (
    <button onClick={triggerError}>
      Trigger Test Error
    </button>
  );
}
```

2. Visit the page and click the button
3. Check your Sentry dashboard - you should see the error appear

### Test Server-Side Errors

1. Create a test API route:

```tsx
// app/api/test-sentry/route.ts
import { captureException } from '@/lib/sentry';

export async function GET() {
  try {
    throw new Error('Test Sentry error from server');
  } catch (error) {
    captureException(error instanceof Error ? error : new Error(String(error)));
    return Response.json({ error: 'Error captured' }, { status: 500 });
  }
}
```

2. Visit `/api/test-sentry` in your browser
3. Check your Sentry dashboard

## 6. Configure Alerts (Optional but Recommended)

1. In Sentry, go to Alerts → Create Alert Rule
2. Set up alerts for:
   - New issues (email/Slack notifications)
   - High error rates
   - Critical errors

## 7. Production Deployment

When deploying to Vercel:

1. Add all Sentry environment variables to Vercel:
   - Go to your project → Settings → Environment Variables
   - Add each variable for Production, Preview, and Development environments

2. Deploy your application

3. Verify errors are being captured:
   - Check Sentry dashboard after deployment
   - Look for any errors in the Issues tab

## Features Configured

✅ **Client-side error tracking** - Captures React errors and unhandled exceptions  
✅ **Server-side error tracking** - Captures API route errors and server component errors  
✅ **Edge runtime tracking** - Captures middleware errors  
✅ **Session Replay** - Records user sessions when errors occur (10% sample rate in production)  
✅ **Performance monitoring** - Tracks slow API routes and page loads (10% sample rate)  
✅ **Error filtering** - Filters out non-critical errors (network errors, validation errors)  
✅ **Development mode** - Errors are logged to console but not sent to Sentry in development  

## Usage Examples

### In API Routes

```tsx
import { captureException } from '@/lib/sentry';

export async function POST(request: Request) {
  try {
    // Your code here
  } catch (error) {
    captureException(error instanceof Error ? error : new Error(String(error)), {
      endpoint: '/api/example',
      method: 'POST',
    });
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### In Server Components

```tsx
import { captureException } from '@/lib/sentry';

export default async function MyComponent() {
  try {
    // Your code here
  } catch (error) {
    captureException(error instanceof Error ? error : new Error(String(error)));
    return <div>Something went wrong</div>;
  }
}
```

### Set User Context (after login)

```tsx
import { setUserContext } from '@/lib/sentry';

// After user logs in
setUserContext({
  id: user.id,
  email: user.email,
  role: user.role,
});
```

### Clear User Context (on logout)

```tsx
import { clearUserContext } from '@/lib/sentry';

// On logout
clearUserContext();
```

## Troubleshooting

### Errors not appearing in Sentry

1. Check that `NEXT_PUBLIC_SENTRY_DSN` is set correctly
2. Verify you're in production mode (`NODE_ENV=production`)
3. Check browser console for Sentry initialization errors
4. Verify your DSN is correct in Sentry dashboard

### Source maps not working

1. Ensure `SENTRY_AUTH_TOKEN` is set
2. Verify `SENTRY_ORG` and `SENTRY_PROJECT` are correct
3. Check build logs for source map upload errors

### Too many errors in development

- This is expected - errors are only sent to Sentry in production
- In development, errors are logged to console only

## Next Steps

1. ✅ Set up Sentry account and project
2. ✅ Add environment variables
3. ✅ Test error tracking
4. ✅ Configure alerts
5. ✅ Deploy to production
6. ✅ Monitor errors in Sentry dashboard

For more information, see the [Sentry Next.js documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/).
