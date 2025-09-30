import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    const { path, tag } = await request.json();

    if (!path && !tag) {
      return NextResponse.json(
        { error: "path or tag is required" },
        { status: 400 }
      );
    }

    // Revalidate specific path
    if (path) {
      revalidatePath(path);
    }

    // Revalidate specific tag
    if (tag) {
      revalidateTag(tag);
    }

    return NextResponse.json({
      revalidated: true,
      path,
      tag,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Revalidation error:', error);
    return NextResponse.json(
      { error: "Failed to revalidate" },
      { status: 500 }
    );
  }
}

// GET endpoint for manual revalidation via URL
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');
  const tag = searchParams.get('tag');

  if (!path && !tag) {
    return NextResponse.json(
      { error: "path or tag parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Revalidate specific path
    if (path) {
      revalidatePath(path);
    }

    // Revalidate specific tag
    if (tag) {
      revalidateTag(tag);
    }

    return NextResponse.json({
      revalidated: true,
      path,
      tag,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Revalidation error:', error);
    return NextResponse.json(
      { error: "Failed to revalidate" },
      { status: 500 }
    );
  }
}