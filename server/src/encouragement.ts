import { db, getSetting } from './db.js';
import { aiComplete, describeError } from './tutor.js';

// Fandom-flavored encouragement. Hardcoded lines return instantly with the
// answer response (an AI call would add seconds of latency). For the "AI
// sometimes writes one for the moment" part, we occasionally pre-generate a
// contextual line in the background and use it on the NEXT trigger — AI
// flavor with zero added latency. All lines are original writing "in the
// spirit of" the characters; no quoted material.

const POOLS: Record<string, string[]> = {
  haikyuu: [
    "WHOA!! You spiked that problem right past the blockers!! 🏐 One more rally?",
    "Calm, precise, perfectly placed — that was a setter-level solution. 👑",
    "The little giants never stay down — and neither do you!",
    "Nice receive, nice set, NICE KILL. That's how a champion solves it! 🏐",
  ],
  mha: [
    "PLUS ULTRA!! That was hero-level problem solving! 💥",
    "Deku would be scribbling your strategy into his notebook right now. 📓",
    "You went beyond your limit on that one. A true hero move. 💪",
    "That quirk of yours — 'Super Math Power' — is getting stronger every day! ⚡",
  ],
  bsd: [
    "Case closed! Even Ranpo would tip his hat at that deduction. 🔍",
    "The Armed Detective Agency called — they want YOU on the squad. 🕵️",
    "Kunikida just added a note to his schedule: 'genius at work, on time.' 📔",
    "A perfect deduction — no clues wasted. Detective-grade thinking! 🐯",
  ],
  skz: [
    "That solution was smoother than Felix's brownies. 🍪✨",
    "Main-character energy on that one — the whole stage is yours! 🎤",
    "Clean, sharp, every step on beat — that was choreography-level precision. 🖤",
    "You just leveled up like it's a comeback stage. Encore!! 🌟",
  ],
  general: [
    "ACE! Straight down the line! 🏐",
    "Your brain did a full combo on that one. Incredible focus! 🔥",
    "That was a boss-level problem and you didn't even flinch. 👑",
  ],
};

const POOL_KEYS = Object.keys(POOLS);

function pickHardcoded(): string {
  const key = POOL_KEYS[Math.floor(Math.random() * POOL_KEYS.length)];
  const pool = POOLS[key];
  return pool[Math.floor(Math.random() * pool.length)];
}

// One-slot cache for a pre-generated contextual AI line.
let aiLine: string | null = null;
let aiPriming = false;

function primeAiLine(context: { topic: string; difficulty: number; streak: number }) {
  if (aiPriming) return;
  aiPriming = true;
  const fandom = ['Haikyuu!!', 'My Hero Academia', 'Bungo Stray Dogs', 'Stray Kids'][Math.floor(Math.random() * 4)];
  const name = getSetting('student_name') || 'the student';
  void aiComplete(
    'You write ONE short, energetic, kid-appropriate encouragement line (under 25 words). Original writing only — never quote lyrics or copyrighted lines. Reply with just the line, no quotes.',
    `${name}, age 11, just solved a level-${context.difficulty} ${context.topic} math problem${context.streak >= 3 ? ` and is on a ${context.streak}-in-a-row streak` : ''}. Write the line in the playful spirit of ${fandom} (character vibes fine, no direct quotes).`,
  ).then((line) => {
    const cleaned = line.trim().replace(/^["']|["']$/g, '');
    if (cleaned && cleaned.length <= 220) aiLine = cleaned;
  }).catch((err) => {
    console.error('[encourage] prime failed:', describeError(err));
  }).finally(() => { aiPriming = false; });
}

// Trailing run of correct first-try-or-not answers today (including this one).
function sessionStreak(): number {
  const rows = db.prepare(
    `SELECT correct FROM attempts WHERE date(created_at,'localtime') = date('now','localtime') ORDER BY id DESC LIMIT 30`
  ).all() as { correct: number }[];
  let run = 0;
  for (const r of rows) {
    if (r.correct) run += 1;
    else break;
  }
  return run;
}

// Called after a correct answer is recorded. Returns a line or null.
export function getEncouragement(topic: string, difficulty: number): string | null {
  const streak = sessionStreak();
  const trigger =
    difficulty >= 5 ||
    streak === 3 || streak === 5 || (streak > 5 && streak % 5 === 0) ||
    Math.random() < 0.06;
  if (!trigger) return null;

  // Occasionally restock the AI line for a future trigger (fire-and-forget).
  if (Math.random() < 0.35) primeAiLine({ topic, difficulty, streak });

  if (aiLine) {
    const line = aiLine;
    aiLine = null;
    return line;
  }
  return pickHardcoded();
}
