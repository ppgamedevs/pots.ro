import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth/middleware-session";

// In-memory settings store (fallback if no DB table exists)
// In production, this should be stored in database
const settingsStore = new Map<string, { value: string; description?: string; updatedAt: string; updatedBy?: string }>();

// Initialize default settings
settingsStore.set("shipping_fee_cents", {
  value: "2500", // 25 RON
  description: "Shipping fee in cents (RON)",
  updatedAt: new Date().toISOString(),
  updatedBy: "system"
});

/**
 * GET /api/admin/settings
 * Get all settings or a specific setting by key
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession();
    
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (key) {
      const setting = settingsStore.get(key);
      if (!setting) {
        return NextResponse.json({ error: "Setting not found" }, { status: 404 });
      }
      return NextResponse.json({ key, ...setting });
    }

    // Return all settings
    const allSettings = Array.from(settingsStore.entries()).map(([key, value]) => ({
      key,
      ...value
    }));

    return NextResponse.json({ settings: allSettings });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/settings
 * Update a setting
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession();
    
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { key, value, description } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: "Key and value are required" }, { status: 400 });
    }

    // Validate specific settings
    if (key === "shipping_fee_cents") {
      const numValue = parseInt(value, 10);
      if (isNaN(numValue) || numValue < 0) {
        return NextResponse.json({ error: "Shipping fee must be a positive number" }, { status: 400 });
      }
    }

    settingsStore.set(key, {
      value: value.toString(),
      description,
      updatedAt: new Date().toISOString(),
      updatedBy: user.email || user.id
    });

    return NextResponse.json({ 
      success: true, 
      key,
      ...settingsStore.get(key)
    });
  } catch (error) {
    console.error("Error updating setting:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

