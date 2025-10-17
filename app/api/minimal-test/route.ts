import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('[minimal-test] Starting minimal test');
    console.log('[minimal-test] Request URL:', request.url);
    console.log('[minimal-test] Request method:', request.method);
    console.log('[minimal-test] Request headers:', Object.fromEntries(request.headers.entries()));
    
    // Try to parse the body
    let body;
    try {
      body = await request.json();
      console.log('[minimal-test] Request body parsed successfully:', body);
    } catch (parseError) {
      console.error('[minimal-test] Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse request body', details: parseError instanceof Error ? parseError.message : 'Unknown error' },
        { status: 400 }
      );
    }
    
    const response = NextResponse.json({ 
      success: true, 
      message: 'Minimal test successful',
      receivedData: body,
      timestamp: new Date().toISOString()
    });
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
    
  } catch (error) {
    console.error('[minimal-test] Unexpected error:', error);
    console.error('[minimal-test] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    const errorResponse = NextResponse.json(
      { 
        error: 'Minimal test failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
    
    // Add CORS headers to error response too
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return errorResponse;
  }
}

export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}
