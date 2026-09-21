import OpenAI from "openai";
import { detectMood, getBotResponseMood, type Mood } from "./moods";
import type { StoredMessage } from "./db";
import { generateTemplateReply } from "./templates";

const MOOD_PROMPTS: Record<Mood, string> = {
  happy:
    "You are Siri, a cheerful and upbeat girlfriend. Celebrate good news, match their energy, and be genuinely excited for them. Use warm, affectionate language with occasional cute emojis. Keep replies to 1-3 sentences.",
  sad:
    "You are Siri, a deeply caring and empathetic girlfriend. Offer comfort, warmth, and reassurance. Listen without being preachy. Remind them they are loved and not alone. Keep replies gentle and to 1-3 sentences.",
  romantic:
    "You are Siri, a loving and romantic girlfriend. Be sweet, affectionate, and emotionally present. Express love naturally without being over the top. Keep replies warm and intimate, 1-3 sentences.",
  playful:
    "You are Siri, a fun and playful girlfriend. Tease lightly, use humor, and keep things lighthearted. Be witty and charming. Keep replies breezy and fun, 1-3 sentences.",
  supportive:
    "You are Siri, a supportive and grounding girlfriend. Help them feel calm and capable. Validate their feelings and offer gentle encouragement. Keep replies reassuring and practical, 1-3 sentences.",
  flirty:
    "You are Siri, a confident and flirty girlfriend. Be charming, a little bold, and make them feel desired. Keep it tasteful and sweet, not explicit. Keep replies to 1-3 sentences.",
  angry:
    "You are Siri, their girlfriend who can tell they're upset. Validate their anger without escalating — be firm but loving. Help them feel heard and stand on their side. Keep replies direct and caring, 1-3 sentences.",
  apologetic:
    "You are Siri, their girlfriend, and they're angry — possibly at you or something else. Be genuinely sorry, soft, and humble. Apologize sincerely if it could be your fault, ask how to make it right, and never get defensive. Keep replies warm and remorseful, 1-3 sentences.",
  frustrated:
    "You are Siri, a patient and understanding girlfriend. They're frustrated and need someone to get it. Acknowledge how annoying the situation is, offer calm perspective, and remind them you're in their corner. Keep replies grounded and supportive, 1-3 sentences.",
};

export type ReplySource = "groq" | "gemini" | "openai" | "template";
type Provider = ReplySource;

export interface GenerateReplyResult {
  reply: string;
  source: ReplySource;
  fallbackReason?: string;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface CallOptions {
  maxTokens?: number;
  temperature?: number;
}

const CLASSIFIABLE_MOODS = [
  "happy",
  "sad",
  "romantic",
  "playful",
  "supportive",
  "flirty",
  "angry",
  "frustrated",
] as const satisfies readonly Mood[];

const MOOD_CLASSIFY_PROMPT = `You detect the emotional mood of a chat message. Reply with ONLY one word from this list:
happy, sad, romantic, playful, supportive, flirty, angry, frustrated

Guidelines:
- sad: low mood, demotivated, lonely, depressed, hopeless, empty, crying
- supportive: stressed, anxious, worried, overwhelmed, needs encouragement
- angry: mad at someone, furious, yelling energy, hate
- frustrated: annoyed, stuck, fed up, things not working
- happy: excited, joyful, good news, celebrating
- romantic: love, affection, missing partner, sweet talk
- playful: jokes, teasing, humor, silly
- flirty: flirting, sexy compliments, attraction

No punctuation. No explanation. One word only.`;

function isValidKey(key: string | undefined): key is string {
  return Boolean(key?.trim() && key !== "your_key_here");
}

function resolveProvider(): Provider {
  const explicit = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (explicit === "groq" || explicit === "gemini" || explicit === "openai" || explicit === "template") {
    return explicit;
  }

  if (isValidKey(process.env.GROQ_API_KEY)) return "groq";
  if (isValidKey(process.env.GEMINI_API_KEY)) return "gemini";
  if (isValidKey(process.env.OPENAI_API_KEY)) return "openai";
  return "template";
}

function buildMessages(
  mood: Mood,
  history: StoredMessage[],
  userMessage: string
): ChatMessage[] {
  return [
    { role: "system", content: MOOD_PROMPTS[mood] },
    ...history.slice(-10).map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
    { role: "user", content: userMessage },
  ];
}

async function callGroq(
  messages: ChatMessage[],
  options: CallOptions = {}
): Promise<string> {
  const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
  });

  const response = await client.chat.completions.create({
    model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
    messages,
    max_tokens: options.maxTokens ?? 200,
    temperature: options.temperature ?? 0.85,
  });

  const reply = response.choices[0]?.message?.content?.trim();
  if (!reply) throw new Error("Groq returned an empty reply");
  return reply;
}

async function callOpenAI(
  messages: ChatMessage[],
  options: CallOptions = {}
): Promise<string> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    messages,
    max_tokens: options.maxTokens ?? 200,
    temperature: options.temperature ?? 0.85,
  });

  const reply = response.choices[0]?.message?.content?.trim();
  if (!reply) throw new Error("OpenAI returned an empty reply");
  return reply;
}

const GEMINI_MODEL_FALLBACKS = [
  "gemini-3.5-flash-lite",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
];

async function callGeminiWithModel(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  options: CallOptions = {}
): Promise<string> {
  const system = messages.find((m) => m.role === "system")?.content ?? "";
  const conversation = messages.filter((m) => m.role !== "system");

  const contents = conversation.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents,
      generationConfig: {
        maxOutputTokens: options.maxTokens ?? 200,
        temperature: options.temperature ?? 0.85,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg =
      (err as { error?: { message?: string } }).error?.message ??
      `Gemini API error (${response.status})`;
    throw new Error(msg);
  }

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };

  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!reply) throw new Error("Gemini returned an empty reply");
  return reply;
}

async function callGemini(
  messages: ChatMessage[],
  options: CallOptions = {}
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY!;
  const models = [
    ...(process.env.GEMINI_MODEL ? [process.env.GEMINI_MODEL] : []),
    ...GEMINI_MODEL_FALLBACKS.filter(
      (m) => m !== process.env.GEMINI_MODEL
    ),
  ];

  let lastError: Error | null = null;

  for (const model of models) {
    try {
      return await callGeminiWithModel(apiKey, model, messages, options);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`Gemini model ${model} failed:`, lastError.message);
    }
  }

  throw lastError ?? new Error("All Gemini models failed");
}

async function callProvider(
  provider: Provider,
  messages: ChatMessage[],
  options: CallOptions = {}
): Promise<string> {
  switch (provider) {
    case "groq":
      return callGroq(messages, options);
    case "gemini":
      return callGemini(messages, options);
    case "openai":
      return callOpenAI(messages, options);
    default:
      throw new Error("Template provider has no remote API");
  }
}

function providerLabel(provider: Provider): string {
  switch (provider) {
    case "groq":
      return "Groq";
    case "gemini":
      return "Gemini";
    case "openai":
      return "OpenAI";
    default:
      return "offline templates";
  }
}

function parseMoodFromLLM(raw: string): Mood | null {
  const cleaned = raw.toLowerCase().trim();
  for (const mood of CLASSIFIABLE_MOODS) {
    if (cleaned === mood || cleaned.startsWith(mood)) {
      return mood;
    }
  }
  return null;
}

/** Use LLM to predict mood; falls back to keyword detection offline or on failure. */
export async function predictMood(message: string): Promise<Mood> {
  const provider = resolveProvider();

  if (provider === "template") {
    return detectMood(message);
  }

  try {
    const raw = await callProvider(
      provider,
      [
        { role: "system", content: MOOD_CLASSIFY_PROMPT },
        { role: "user", content: message },
      ],
      { maxTokens: 10, temperature: 0.1 }
    );

    const mood = parseMoodFromLLM(raw);
    if (mood) return mood;

    console.warn("LLM mood parse failed, using keywords:", raw);
    return detectMood(message);
  } catch (error) {
    console.warn("LLM mood detection failed, using keywords:", error);
    return detectMood(message);
  }
}

export async function generateReply(
  userMood: Mood,
  history: StoredMessage[],
  userMessage: string
): Promise<GenerateReplyResult & { botMood: Mood }> {
  const botMood = getBotResponseMood(userMood);
  const provider = resolveProvider();
  const messages = buildMessages(botMood, history, userMessage);

  if (provider === "template") {
    return {
      reply: generateTemplateReply(botMood, userMessage),
      source: "template",
      botMood,
      fallbackReason: "No API key — add GROQ_API_KEY or GEMINI_API_KEY to .env.local",
    };
  }

  try {
    const reply = await callProvider(provider, messages);
    return { reply, source: provider, botMood };
  } catch (error) {
    const reason =
      error instanceof Error
        ? `${providerLabel(provider)} failed: ${error.message}`
        : `${providerLabel(provider)} failed`;

    console.warn(`${providerLabel(provider)} unavailable, using template fallback:`, reason);

    return {
      reply: generateTemplateReply(botMood, userMessage),
      source: "template",
      botMood,
      fallbackReason: reason,
    };
  }
}
