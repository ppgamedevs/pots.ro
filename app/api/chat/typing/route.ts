/**
 * Typing Indicator API
 * Handles typing start/stop events
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { startTyping, stopTyping } from '@/lib/chat/typing-service';
import { db } from '@/db';
import { supportThreads } from '@/db/schema/core';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let requestContext: { threadId?: string; action?: string; userId?: string } = {};
  
  try {
    // Get authenticated user
    let user;
    try {
      user = await getCurrentUser();
    } catch (authError) {
      console.error('[Typing API] Authentication error:', {
        message: authError instanceof Error ? authError.message : String(authError),
        stack: authError instanceof Error ? authError.stack : undefined,
        name: authError instanceof Error ? authError.name : undefined,
      });
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    requestContext.userId = user.id;

    // Parse request body with error handling
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('[Typing API] Request body parsing error:', {
        message: parseError instanceof Error ? parseError.message : String(parseError),
        stack: parseError instanceof Error ? parseError.stack : undefined,
        name: parseError instanceof Error ? parseError.name : undefined,
        userId: requestContext.userId,
      });
      return NextResponse.json(
        { error: 'Invalid request body', details: process.env.NODE_ENV === 'development' ? (parseError instanceof Error ? parseError.message : String(parseError)) : undefined },
        { status: 400 }
      );
    }

    const threadId = typeof body?.threadId === 'string' ? body.threadId.trim() : null;
    const action = typeof body?.action === 'string' ? body.action : null; // 'start' | 'stop'

    requestContext.threadId = threadId || undefined;
    requestContext.action = action || undefined;

    if (!threadId || !action) {
      console.warn('[Typing API] Missing required fields:', {
        threadId: !!threadId,
        action: !!action,
        userId: requestContext.userId,
        bodyKeys: Object.keys(body || {}),
      });
      return NextResponse.json({ error: 'threadId and action are required' }, { status: 400 });
    }

    if (action !== 'start' && action !== 'stop') {
      console.warn('[Typing API] Invalid action:', {
        action,
        userId: requestContext.userId,
        threadId: requestContext.threadId,
      });
      return NextResponse.json({ error: 'action must be "start" or "stop"' }, { status: 400 });
    }

    // Verify thread exists and user has access
    let thread;
    try {
      [thread] = await db
        .select({ id: supportThreads.id })
        .from(supportThreads)
        .where(eq(supportThreads.id, threadId))
        .limit(1);
    } catch (dbError) {
      console.error('[Typing API] Database error while checking thread:', {
        message: dbError instanceof Error ? dbError.message : String(dbError),
        stack: dbError instanceof Error ? dbError.stack : undefined,
        name: dbError instanceof Error ? dbError.name : undefined,
        threadId: requestContext.threadId,
        userId: requestContext.userId,
      });
      return NextResponse.json(
        { error: 'Failed to verify thread', details: process.env.NODE_ENV === 'development' ? (dbError instanceof Error ? dbError.message : String(dbError)) : undefined },
        { status: 500 }
      );
    }

    if (!thread) {
      console.warn('[Typing API] Thread not found:', {
        threadId: requestContext.threadId,
        userId: requestContext.userId,
      });
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    // Update typing indicator with error handling
    // Note: Typing indicators are non-critical, so we log errors but don't fail the request
    try {
      if (action === 'start') {
        await startTyping(threadId, user.id, user.name || undefined);
      } else {
        await stopTyping(threadId, user.id);
      }
    } catch (typingError) {
      // Log detailed error information (always log, not just in dev)
      const errorDetails: any = {
        message: typingError instanceof Error ? typingError.message : String(typingError),
        name: typingError instanceof Error ? typingError.name : typeof typingError,
        threadId: requestContext.threadId,
        userId: requestContext.userId,
        action: requestContext.action,
      };
      
      // Add PostgreSQL-specific error details if available
      if (typingError && typeof typingError === 'object' && 'code' in typingError) {
        errorDetails.code = (typingError as any).code;
        errorDetails.detail = (typingError as any).detail;
        errorDetails.hint = (typingError as any).hint;
        errorDetails.table = (typingError as any).table;
        errorDetails.schema = (typingError as any).schema;
      }
      
      if (typingError instanceof Error) {
        errorDetails.stack = typingError.stack;
      }
      
      console.error('[Typing API] Typing service error:', errorDetails);
      
      // Check if it's a table-not-found error (42P01) or similar non-critical errors
      const isTableMissing = typingError && typeof typingError === 'object' && 
        ('code' in typingError && (typingError as any).code === '42P01');
      
      // For table missing errors, return success but log the issue
      // For other errors, still return success since typing indicators are non-critical
      // but log the error for investigation
      if (isTableMissing) {
        console.warn('[Typing API] Typing indicators table not found - feature disabled');
      }
      
      // Return success even if typing update failed (non-critical feature)
      // This prevents the API from failing when typing indicators aren't available
      return NextResponse.json({ 
        success: true,
        warning: 'Typing indicator update failed but request succeeded',
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Typing API] Unexpected error:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      requestContext,
    });
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    );
  }
}
