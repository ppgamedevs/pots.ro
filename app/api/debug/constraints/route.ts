import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    // Check all constraints including CHECK constraints
    const constraints = await db.execute(`
      SELECT 
        tc.constraint_name, 
        tc.constraint_type,
        kcu.column_name,
        cc.check_clause
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      LEFT JOIN information_schema.check_constraints cc
        ON tc.constraint_name = cc.constraint_name
        AND tc.table_schema = cc.constraint_schema
      WHERE tc.table_name = 'users'
        AND tc.table_schema = 'public'
      ORDER BY tc.constraint_name, kcu.ordinal_position
    `);

    // Also try to insert a test user to see the exact error
    try {
      const testResult = await db.execute(`
        INSERT INTO users (email, role) 
        VALUES ('test-constraint@example.com', 'buyer') 
        RETURNING id
      `);
      
      // Clean up test user
      await db.execute(`
        DELETE FROM users WHERE email = 'test-constraint@example.com'
      `);
      
      return NextResponse.json({
        constraints: constraints.rows,
        testInsert: 'SUCCESS',
        testResult: testResult.rows
      });
    } catch (insertError) {
      return NextResponse.json({
        constraints: constraints.rows,
        testInsert: 'FAILED',
        error: String(insertError)
      });
    }
  } catch (error) {
    console.error('Debug constraints error:', error);
    return NextResponse.json({ 
      error: String(error)
    }, { status: 500 });
  }
}