'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

/**
 * Sentry Test Page
 * Use this page to verify Sentry error tracking is working
 * Visit /sentry-example-page and click the buttons to trigger test errors
 */
export default function SentryExamplePage() {
  const [errorTriggered, setErrorTriggered] = useState(false);

  const triggerClientError = () => {
    setErrorTriggered(true);
    // This will trigger an error that Sentry should capture
    throw new Error('Test error from Sentry example page - Client side');
  };

  const triggerServerError = async () => {
    try {
      const response = await fetch('/api/test-sentry');
      if (!response.ok) {
        throw new Error('Server error test failed');
      }
      alert('Server error test completed - check Sentry dashboard');
    } catch (error) {
      console.error('Error testing server:', error);
    }
  };

  return (
    <div className="container mx-auto py-12 px-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Sentry Error Tracking Test
          </CardTitle>
          <CardDescription>
            Use this page to verify that Sentry is correctly configured and capturing errors.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Before Testing</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Make sure you've added your Sentry DSN to environment variables</li>
              <li>Check that <code className="bg-blue-100 px-1 rounded">NODE_ENV=production</code> for errors to be sent to Sentry</li>
              <li>In development, errors are logged to console but not sent to Sentry</li>
            </ul>
          </div>

          <div className="space-y-3">
            <div>
              <h3 className="font-semibold mb-2">Test Client-Side Error</h3>
              <p className="text-sm text-gray-600 mb-2">
                This will trigger a client-side error that should be captured by Sentry.
              </p>
              <Button 
                onClick={triggerClientError}
                variant="destructive"
                className="w-full"
              >
                Trigger Client Error
              </Button>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Test Server-Side Error</h3>
              <p className="text-sm text-gray-600 mb-2">
                This will call an API route that triggers a server-side error.
              </p>
              <Button 
                onClick={triggerServerError}
                variant="destructive"
                className="w-full"
              >
                Trigger Server Error
              </Button>
            </div>
          </div>

          {errorTriggered && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-semibold">Error Triggered</span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                If Sentry is configured correctly, this error should appear in your Sentry dashboard.
              </p>
            </div>
          )}

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              How to Verify
            </h3>
            <ol className="text-sm text-green-800 space-y-1 list-decimal list-inside">
              <li>Click one of the buttons above to trigger an error</li>
              <li>Go to your Sentry dashboard at <a href="https://sentry.io" target="_blank" rel="noopener noreferrer" className="underline">sentry.io</a></li>
              <li>Navigate to Issues → Your Project</li>
              <li>You should see the test error appear within a few seconds</li>
            </ol>
          </div>

          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-2">Environment Check</h3>
            <div className="text-sm space-y-1">
              <div>
                <strong>NODE_ENV:</strong> <code className="bg-gray-100 px-1 rounded">{process.env.NODE_ENV || 'not set'}</code>
              </div>
              <div>
                <strong>Sentry DSN:</strong>{' '}
                {process.env.NEXT_PUBLIC_SENTRY_DSN ? (
                  <span className="text-green-600">✓ Configured</span>
                ) : (
                  <span className="text-red-600">✗ Not configured</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
