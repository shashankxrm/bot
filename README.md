# Siri — Girlfriend Mood Bot

A beautiful, mood-aware AI girlfriend chatbot built with Next.js, Tailwind CSS, and OpenAI.

## Features

- **Mood-aware replies** — pick a mood or let Siri auto-detect it from your message
- **6 moods** — Happy, Sad, Romantic, Playful, Supportive, Flirty
- **Persistent chat** — conversations saved to a local SQLite database
- **Beautiful UI** — soft gradients, glass morphism, smooth animations

## Prerequisites

- Node.js 18+
- A **free** AI API key (Groq or Gemini recommended — no credit card needed)

## Free AI Setup (recommended)

### Option 1: Groq (best free option — fast, no card)

1. Sign up at [console.groq.com](https://console.groq.com)
2. Create an API key at [console.groq.com/keys](https://console.groq.com/keys)
3. Add to `.env.local`:

```
AI_PROVIDER=groq
GROQ_API_KEY=gsk_your_key_here
```

Uses **Llama 3.3 70B** — smart, fast, completely free.

### Option 2: Google Gemini (also free)

1. Get a key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Add to `.env.local`:

```
AI_PROVIDER=gemini
GEMINI_API_KEY=your_key_here
```

### Option 3: No API key (offline)

Leave all keys blank — Siri uses built-in mood templates. Works instantly, no signup.

## Setup

```bash
# Install dependencies
npm install

# Configure your API key
cp .env.example .env.local
# Edit .env.local with your Groq or Gemini key

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

1. Select a mood chip (optional) or just type a message
2. If no mood is selected, keywords in your message auto-detect the mood
3. The message is sent to your AI provider (Groq/Gemini/OpenAI) with a mood-specific system prompt
4. Siri replies in character, and both messages are saved to `data/conversations.db`

## Project Structure

```
app/           → Next.js pages and API routes
components/    → React UI components
lib/           → Mood logic, SQLite DB, AI integration
data/          → conversations.db (SQLite database)
```

## API

| Method | Endpoint       | Description              |
|--------|----------------|--------------------------|
| POST   | `/api/chat`    | Send a message, get reply |
| GET    | `/api/history` | Load conversation history |
