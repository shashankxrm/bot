"use client";

import { useEffect, useRef } from "react";
import { MessageBubble, type ChatMessage } from "@/components/message-bubble";
import { TypingIndicator } from "@/components/typing-indicator";

interface ChatWindowProps {
  messages: ChatMessage[];
  isTyping: boolean;
}

export function ChatWindow({ messages, isTyping }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 space-y-3 scrollbar-thin">
      {messages.length === 0 && !isTyping && (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
          <div className="text-4xl">💕</div>
          <p className="text-sm text-white/70">
            Hey babe! Pick a mood or just start chatting~
          </p>
        </div>
      )}

      {messages.map((msg, i) => (
        <MessageBubble key={`${msg.timestamp ?? i}-${msg.role}`} message={msg} />
      ))}

      {isTyping && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
}
