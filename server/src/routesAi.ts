import { Router } from 'express';
import { db } from './db.js';
import { getPending } from './pending.js';
import { tutorChat } from './tutor.js';

export const aiRouter = Router();

// Rate limit: this endpoint is unauthenticated (kid-facing) and each call can
// cost real money on cloud providers. 15/min is far above real usage but
// stops runaway loops and DevTools abuse.
const chatTimestamps: number[] = [];
function chatAllowed(): boolean {
  const now = Date.now();
  while (chatTimestamps.length && now - chatTimestamps[0] > 60_000) chatTimestamps.shift();
  if (chatTimestamps.length >= 15) return false;
  chatTimestamps.push(now);
  return true;
}

// Chat with the AI study buddy about the current question. The buddy is
// available anytime — but grading is always done by code (answers.ts);
// the AI never decides whether an answer is correct.
aiRouter.post('/chat', async (req, res) => {
  if (!chatAllowed()) {
    return res.status(429).json({ error: 'Whoa, slow down a little! Take a breath and try again in a minute. 🏐' });
  }
  const { token, messages } = req.body as {
    token?: string;
    messages?: { role: 'user' | 'assistant'; content: string }[];
  };
  const q = token ? getPending(token) : undefined;
  if (!q) return res.status(410).json({ error: 'This question expired — grab a new one first!' });

  const history = (messages ?? [])
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-16); // keep the conversation short

  const result = await tutorChat(
    {
      prompt: q.prompt, answer: q.answer, answerType: q.answerType,
      topic: q.topic, difficulty: q.difficulty, hints: q.hints,
      explanation: q.explanation, attempts: q.attempts,
    },
    history,
  );

  // Full transparency for parents: every exchange is stored and visible in the
  // admin panel. source = provider name ('claude', 'gemini', ...) or 'fallback'.
  const lastUser = [...history].reverse().find((m) => m.role === 'user');
  db.prepare('INSERT INTO ai_chats (token, question, user_msg, reply, source) VALUES (?, ?, ?, ?, ?)')
    .run(q.token, q.prompt, lastUser?.content ?? '(opened chat)', result.reply, result.source === 'ai' ? result.provider : 'fallback');

  res.json(result);
});
