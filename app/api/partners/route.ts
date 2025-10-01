import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ 
    message: "Partners section coming soon",
    status: "under_development" 
  }, { status: 200 });
}
