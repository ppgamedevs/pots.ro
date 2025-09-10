import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tag, secret } = body;

    // Verify secret to prevent unauthorized revalidation
    if (secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json(
        { message: "Invalid secret" },
        { status: 401 }
      );
    }

    if (!tag) {
      return NextResponse.json(
        { message: "Tag is required" },
        { status: 400 }
      );
    }

    // Revalidate the specified tag
    revalidateTag(tag);

    return NextResponse.json(
      { 
        message: `Revalidated tag: ${tag}`,
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Revalidation error:", error);
    return NextResponse.json(
      { message: "Error revalidating cache" },
      { status: 500 }
    );
  }
}

// GET endpoint for testing
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get("tag");
  const secret = searchParams.get("secret");

  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json(
      { message: "Invalid secret" },
      { status: 401 }
    );
  }

  if (!tag) {
    return NextResponse.json(
      { message: "Tag is required" },
      { status: 400 }
    );
  }

  try {
    revalidateTag(tag);
    return NextResponse.json(
      { 
        message: `Revalidated tag: ${tag}`,
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Revalidation error:", error);
    return NextResponse.json(
      { message: "Error revalidating cache" },
      { status: 500 }
    );
  }
}
