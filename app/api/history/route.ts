import { NextRequest, NextResponse } from "next/server";
import { getMessages } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const sessionId =
      request.nextUrl.searchParams.get("sessionId") ?? "default";
    const messages = await getMessages(sessionId);
    return NextResponse.json({ messages });
  } catch (error) {
    console.error("History error:", error);
    return NextResponse.json(
      { error: "Failed to load history" },
      { status: 500 }
    );
  }
}
