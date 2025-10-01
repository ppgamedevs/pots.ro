import { NextResponse } from "next/server";
import { db } from "@/db";

export async function GET() {
  try {
    // Test database connection
    const result = await db.execute("SELECT 1 as test");
    return NextResponse.json({ 
      status: "success", 
      message: "Database connection working",
      test: result.rows[0]
    });
  } catch (error) {
    console.error("Database test error:", error);
    return NextResponse.json({ 
      status: "error", 
      message: "Database connection failed",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
