import crypto from 'node:crypto';

// In-memory store for questions currently being answered.
// Answers stay server-side so they never reach the browser.

export interface PendingQuestion {
  token: string;
  kind: 'arithmetic' | 'word';
  questionId: number | null; // DB id for word problems
  topic: string;
  difficulty: number;
  prompt: string;
  answer: string;
  answerType: string;
  hints: string[];
  explanation: string;
  attempts: number;
  revealed: boolean;
  createdAt: number;
}

const store = new Map<string, PendingQuestion>();
const TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

export function registerQuestion(q: Omit<PendingQuestion, 'token' | 'attempts' | 'revealed' | 'createdAt'>): PendingQuestion {
  // opportunistic cleanup
  const now = Date.now();
  for (const [k, v] of store) {
    if (now - v.createdAt > TTL_MS) store.delete(k);
  }
  const token = crypto.randomUUID();
  const entry: PendingQuestion = { ...q, token, attempts: 0, revealed: false, createdAt: now };
  store.set(token, entry);
  return entry;
}

export function getPending(token: string): PendingQuestion | undefined {
  return store.get(token);
}

export function removePending(token: string) {
  store.delete(token);
}
