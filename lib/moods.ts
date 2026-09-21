export type Mood =
  | "happy"
  | "sad"
  | "romantic"
  | "playful"
  | "supportive"
  | "flirty"
  | "angry"
  | "frustrated"
  | "apologetic";

export interface MoodDefinition {
  id: Mood;
  label: string;
  emoji: string;
  color: string;
  selectedClass: string;
  keywords: string[];
  selectable?: boolean;
}

export const MOODS: MoodDefinition[] = [
  {
    id: "happy",
    label: "Happy",
    emoji: "😊",
    color: "bg-amber-100 text-amber-800 border-amber-200",
    selectedClass: "bg-amber-400 text-white border-amber-500 shadow-amber-200/50",
    keywords: ["great", "excited", "yay", "love this", "amazing", "wonderful", "happy", "awesome"],
  },
  {
    id: "angry",
    label: "Angry",
    emoji: "😤",
    color: "bg-red-100 text-red-800 border-red-200",
    selectedClass: "bg-red-500 text-white border-red-600 shadow-red-200/50",
    keywords: ["angry", "mad", "furious", "pissed", "rage", "hate this", "so annoyed", "infuriating"],
  },
  {
    id: "frustrated",
    label: "Frustrated",
    emoji: "😩",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    selectedClass: "bg-orange-500 text-white border-orange-600 shadow-orange-200/50",
    keywords: ["frustrated", "ugh", "stuck", "fed up", "can't stand", "nothing works", "so tired of", "exhausted with"],
  },
  {
    id: "sad",
    label: "Sad",
    emoji: "🥺",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    selectedClass: "bg-blue-400 text-white border-blue-500 shadow-blue-200/50",
    keywords: [
      "down", "lonely", "miss you", "crying", "sad", "upset", "hurt", "depressed",
      "demotivated", "unmotivated", "no motivation", "burnout", "burnt out", "burned out",
      "drained", "hopeless", "empty", "miserable", "discouraged", "disheartened",
      "worthless", "giving up", "lost interest", "feel like crap", "feeling low",
      "don't feel like", "no energy", "can't be bothered", "what's the point",
    ],
  },
  {
    id: "romantic",
    label: "Romantic",
    emoji: "💕",
    color: "bg-rose-100 text-rose-800 border-rose-200",
    selectedClass: "bg-rose-400 text-white border-rose-500 shadow-rose-200/50",
    keywords: ["love you", "kiss", "date", "together", "forever", "heart", "romantic", "babe"],
  },
  {
    id: "playful",
    label: "Playful",
    emoji: "😜",
    color: "bg-purple-100 text-purple-800 border-purple-200",
    selectedClass: "bg-purple-400 text-white border-purple-500 shadow-purple-200/50",
    keywords: ["haha", "tease", "joke", "funny", "lol", "silly", "play", "prank"],
  },
  {
    id: "supportive",
    label: "Supportive",
    emoji: "🤗",
    color: "bg-green-100 text-green-800 border-green-200",
    selectedClass: "bg-green-400 text-white border-green-500 shadow-green-200/50",
    keywords: [
      "stressed", "help", "worried", "anxious", "overwhelmed", "scared", "nervous",
      "panic", "pressure", "can't cope", "struggling", "hard time", "need support",
    ],
  },
  {
    id: "flirty",
    label: "Flirty",
    emoji: "😘",
    color: "bg-pink-100 text-pink-800 border-pink-200",
    selectedClass: "bg-pink-400 text-white border-pink-500 shadow-pink-200/50",
    keywords: ["cute", "hot", "wink", "gorgeous", "sexy", "beautiful", "handsome", "daddy"],
  },
  {
    id: "apologetic",
    label: "Sorry",
    emoji: "🙏",
    color: "bg-red-50 text-red-700 border-red-100",
    selectedClass: "bg-red-300 text-white border-red-400 shadow-red-200/50",
    keywords: [],
    selectable: false,
  },
];

export const SELECTABLE_MOODS = MOODS.filter((m) => m.selectable !== false);

export const DEFAULT_MOOD: Mood = "romantic";

export function detectMood(message: string): Mood {
  const lower = message.toLowerCase();

  for (const mood of MOODS) {
    if (mood.keywords.some((keyword) => lower.includes(keyword))) {
      return mood.id;
    }
  }

  return DEFAULT_MOOD;
}

export function resolveMood(message: string, selectedMood: Mood | null): Mood {
  return selectedMood ?? detectMood(message);
}

/** How Siri should respond — may differ from the user's detected mood. */
export function getBotResponseMood(userMood: Mood): Mood {
  switch (userMood) {
    case "angry":
      return "apologetic";
    case "frustrated":
    case "sad":
      return "supportive";
    default:
      return userMood;
  }
}

export function getMoodDefinition(mood: Mood): MoodDefinition {
  return MOODS.find((m) => m.id === mood) ?? MOODS.find((m) => m.id === "romantic")!;
}
