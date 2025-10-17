import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('[test-otp] Starting test');
    
    const body = await request.json();
    console.log('[test-otp] Request body:', body);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test endpoint working',
      receivedData: body 
    });
    
  } catch (error) {
    console.error('[test-otp] Error:', error);
    return NextResponse.json(
      { error: 'Test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
