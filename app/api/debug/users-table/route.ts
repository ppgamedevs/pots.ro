import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    // Check if users table exists
    const result = await db.execute(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);

    return NextResponse.json({
      usersTableExists: result.rows.length > 0,
      columns: result.rows,
    });
  } catch (error) {
    console.error('Debug users table error:', error);
    return NextResponse.json({ 
      error: String(error),
      usersTableExists: false 
    }, { status: 500 });
  }
}
