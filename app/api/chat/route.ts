import { NextRequest, NextResponse } from "next/server";
import { generateReply, predictMood } from "@/lib/ai";
import { appendMessages, getMessages } from "@/lib/db";
import { MOODS, type Mood } from "@/lib/moods";

const VALID_MOODS: Mood[] = MOODS.filter((m) => m.selectable !== false).map(
  (m) => m.id
);

function isValidMood(value: unknown): value is Mood {
  return typeof value === "string" && VALID_MOODS.includes(value as Mood);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const sessionId =
      typeof body.sessionId === "string" && body.sessionId
        ? body.sessionId
        : "default";
    const selectedMood = isValidMood(body.mood) ? body.mood : null;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const userMood = selectedMood ?? (await predictMood(message));
    const history = await getMessages(sessionId);
    const timestamp = new Date().toISOString();

    const { reply, botMood, source, fallbackReason } = await generateReply(
      userMood,
      history,
      message
    );
    const replyTimestamp = new Date().toISOString();

    await appendMessages(sessionId, [
      { role: "user", content: message, mood: userMood, timestamp },
      { role: "assistant", content: reply, mood: botMood, timestamp: replyTimestamp },
    ]);

    return NextResponse.json({
      reply,
      userMood,
      botMood,
      timestamp: replyTimestamp,
      source,
      fallbackReason,
    });
  } catch (error) {
    console.error("Chat error:", error);
    const errMsg =
      error instanceof Error ? error.message : "Failed to generate reply";

    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
