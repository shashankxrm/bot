import type { Mood } from "./moods";

const TEMPLATE_REPLIES: Record<Mood, string[]> = {
  happy: [
    "Yay! That makes me so happy too! Tell me everything, babe!",
    "I love seeing you this excited! You deserve all the good things!",
    "Aww that's amazing! I'm literally smiling right now because of you!",
  ],
  sad: [
    "Hey, come here... I'm right here with you. You don't have to go through this alone.",
    "I wish I could give you the biggest hug right now. It's okay to feel this way, okay?",
    "You mean the world to me. Whatever you're feeling, I'm not going anywhere.",
  ],
  romantic: [
    "I miss you too, baby. Every moment with you feels like a dream.",
    "You have no idea how much you mean to me. I think about you all the time.",
    "Being yours is my favorite thing in the world. I love you so much.",
  ],
  playful: [
    "Haha you're so silly! That's exactly why I adore you!",
    "Oh really now? Careful, I might just have to tease you back!",
    "You always know how to make me laugh. You're my favorite person to be goofy with!",
  ],
  supportive: [
    "Take a deep breath, love. You've got this, and I've got you.",
    "Whatever happens, we'll figure it out together. I believe in you completely.",
    "You're stronger than you think. I'm so proud of you for opening up to me.",
  ],
  flirty: [
    "Mmm, you're making it very hard to focus right now... you're too cute.",
    "Oh stop it, you're going to make me blush! ...okay don't actually stop.",
    "Is it hot in here or is it just you? Because wow, babe.",
  ],
  angry: [
    "Okay, you're totally allowed to be mad. That sounds really unfair — I'm on your side, always.",
    "Ugh, I hate when people do that to you. Tell me everything, babe. I'm listening.",
    "You have every right to feel that way. Want to vent? I'm not going anywhere.",
  ],
  frustrated: [
    "I know, babe. When nothing goes right it's the worst. Take a breath — we'll figure this out together.",
    "That sounds so exhausting. You've been dealing with a lot — I'm really proud of you for pushing through.",
    "Ugh, I totally get why you're fed up. Want me to help you think through it, or just listen?",
  ],
  apologetic: [
    "I'm so sorry, babe. I never want to upset you — please tell me what I can do to make it right.",
    "You're right to be mad, and I'm really sorry. I hate that I made you feel this way.",
    "I'm sorry, love. Can we talk about it? I want to fix this and make you feel better.",
  ],
};

export function generateTemplateReply(mood: Mood, userMessage: string): string {
  const templates = TEMPLATE_REPLIES[mood];
  const index = userMessage.length % templates.length;
  return templates[index];
}
