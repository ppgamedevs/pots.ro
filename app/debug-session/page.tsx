"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function DebugSessionPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const debugSession = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug-session', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
        }
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const createDebugSession = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          email: 'test@example.com', 
          code: '123456' 
        }),
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Session Debug Tool</CardTitle>
            <CardDescription>
              Debug session creation and validation issues
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                onClick={debugSession} 
                disabled={loading}
                variant="outline"
              >
                Debug Current Session
              </Button>
              <Button 
                onClick={createDebugSession} 
                disabled={loading}
                variant="default"
              >
                Create Debug Session
              </Button>
              <Button 
                onClick={testLogin} 
                disabled={loading}
                variant="secondary"
              >
                Test OTP Login
              </Button>
            </div>
            
            {result && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Result:</h3>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
            
            <Alert>
              <AlertDescription>
                <strong>Instructions:</strong>
                <br />
                1. Click "Debug Current Session" to see current session state
                <br />
                2. Click "Create Debug Session" to create a test session
                <br />
                3. Click "Debug Current Session" again to verify session persistence
                <br />
                4. Check browser DevTools → Application → Cookies to see if fm_session cookie is set
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
