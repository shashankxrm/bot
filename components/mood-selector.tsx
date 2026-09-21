"use client";

import { SELECTABLE_MOODS, type Mood } from "@/lib/moods";
import { cn } from "@/lib/utils";

interface MoodSelectorProps {
  selected: Mood | null;
  onSelect: (mood: Mood | null) => void;
}

export function MoodSelector({ selected, onSelect }: MoodSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {SELECTABLE_MOODS.map((mood) => {
        const isSelected = selected === mood.id;
        return (
          <button
            key={mood.id}
            type="button"
            onClick={() => onSelect(isSelected ? null : mood.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200",
              isSelected
                ? cn(mood.selectedClass, "shadow-md scale-105")
                : cn(mood.color, "hover:scale-105 hover:shadow-sm")
            )}
          >
            <span>{mood.emoji}</span>
            <span>{mood.label}</span>
          </button>
        );
      })}
    </div>
  );
}
