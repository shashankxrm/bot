"use client";

import { useCallback, useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { ChatWindow } from "@/components/chat-window";
import { ChatInput } from "@/components/chat-input";
import { MoodSelector } from "@/components/mood-selector";
import { Badge } from "@/components/ui/badge";
import type { ChatMessage } from "@/components/message-bubble";
import type { Mood } from "@/lib/moods";

const SESSION_KEY = "siri-session-id";

function getSessionId(): string {
  if (typeof window === "undefined") return "default";
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState("default");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const id = getSessionId();
    setSessionId(id);

    fetch(`/api/history?sessionId=${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.messages) {
          setMessages(data.messages);
        }
      })
      .catch(() => setError("Could not load chat history"));
  }, []);

  const handleSend = useCallback(
    async (text: string) => {
      setError(null);
      setNotice(null);
      const userMsg: ChatMessage = {
        role: "user",
        content: text,
        mood: selectedMood ?? undefined,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            mood: selectedMood,
            sessionId,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error ?? "Something went wrong");
        }

        setMessages((prev) => {
          const updated = [...prev];
          const lastUser = updated[updated.length - 1];
          if (lastUser?.role === "user") {
            lastUser.mood = data.userMood;
          }
          updated.push({
            role: "assistant",
            content: data.reply,
            mood: data.botMood,
            timestamp: data.timestamp,
          });
          return updated;
        });

        if (data.source === "template" && data.fallbackReason) {
          setNotice(data.fallbackReason);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send message");
      } finally {
        setIsTyping(false);
      }
    },
    [selectedMood, sessionId]
  );

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-400 via-purple-500 to-indigo-600" />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Chat card */}
      <div className="relative z-10 flex h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="shrink-0 border-b border-white/10 px-5 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-pink-500 text-lg shadow-lg shadow-rose-300/40">
                💕
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Siri</h1>
                <p className="text-xs text-white/60">Always here for you</p>
              </div>
            </div>
            <Badge variant="outline" className="gap-1">
              <Sparkles className="h-3 w-3" />
              AI
            </Badge>
          </div>
        </div>

        {/* Mood selector */}
        <div className="shrink-0 border-b border-white/10 px-5 py-2.5">
          <MoodSelector selected={selectedMood} onSelect={setSelectedMood} />
        </div>

        {/* Messages */}
        <ChatWindow messages={messages} isTyping={isTyping} />

        {/* Notice / Error */}
        {notice && (
          <div className="mx-4 mb-2 rounded-lg bg-amber-500/20 px-3 py-2 text-xs text-amber-100">
            {notice}
          </div>
        )}
        {error && (
          <div className="mx-4 mb-2 rounded-lg bg-red-500/20 px-3 py-2 text-xs text-red-100">
            {error}
          </div>
        )}

        {/* Input */}
        <div className="shrink-0 border-t border-white/10 p-4">
          <ChatInput onSend={handleSend} disabled={isTyping} />
        </div>
      </div>
    </main>
  );
}
