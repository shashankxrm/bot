"use client";

import { getMoodDefinition, type Mood } from "@/lib/moods";
import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  mood?: Mood;
  timestamp?: string;
}

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const moodDef = message.mood ? getMoodDefinition(message.mood) : null;

  return (
    <div
      className={cn(
        "flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {!isUser && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-pink-500 shadow-lg shadow-rose-200/50">
          <Heart className="h-4 w-4 fill-white text-white" />
        </div>
      )}

      <div
        className={cn(
          "flex max-w-[75%] flex-col gap-1",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
            isUser
              ? "rounded-tr-md bg-gradient-to-br from-rose-500 to-pink-500 text-white"
              : "rounded-tl-md border border-white/40 bg-white/90 text-gray-800 backdrop-blur"
          )}
        >
          {message.content}
        </div>

        {moodDef && (
          <span
            className={cn(
              "px-1 text-[10px]",
              isUser ? "text-white/70" : "text-white/60"
            )}
          >
            {moodDef.emoji} {moodDef.label}
          </span>
        )}
      </div>
    </div>
  );
}
