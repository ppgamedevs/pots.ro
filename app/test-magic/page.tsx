"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function TestMagicPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testMagicLink = async () => {
    setLoading(true);
    setResult('Testing magic link...');
    
    try {
      // First, request an OTP to get a valid magic link
      const otpResponse = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com'
        })
      });
      
      const otpData = await otpResponse.json();
      setResult(`OTP Request Status: ${otpResponse.status}\nOTP Response: ${JSON.stringify(otpData, null, 2)}\n\n`);
      
      if (otpResponse.ok) {
        // Now test a magic link (this will fail but we can see the error)
        const magicResponse = await fetch('/api/auth/magic?t=test-token&e=test@example.com', {
          method: 'GET'
        });
        
        const magicData = await magicResponse.json();
        setResult(prev => prev + `Magic Link Status: ${magicResponse.status}\nMagic Response: ${JSON.stringify(magicData, null, 2)}`);
      }
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Magic Link Test Page</h1>
      
      <Button 
        onClick={testMagicLink} 
        disabled={loading}
        className="mb-4"
      >
        {loading ? 'Testing...' : 'Test Magic Link'}
      </Button>
      
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold mb-2">Result:</h2>
        <pre className="whitespace-pre-wrap text-sm">{result}</pre>
      </div>
    </div>
  );
}
