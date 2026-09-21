"use client";

import { Heart } from "lucide-react";

export function TypingIndicator() {
  return (
    <div className="flex gap-3 animate-in fade-in duration-200">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-pink-500 shadow-lg shadow-rose-200/50">
        <Heart className="h-4 w-4 fill-white text-white" />
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-md border border-white/40 bg-white/90 px-4 py-3 backdrop-blur">
        <span className="h-2 w-2 animate-bounce rounded-full bg-rose-400 [animation-delay:0ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-rose-400 [animation-delay:150ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-rose-400 [animation-delay:300ms]" />
      </div>
    </div>
  );
}
