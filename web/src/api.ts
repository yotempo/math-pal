// Tiny API client. Kid endpoints are open; admin endpoints send the PIN header.

async function handle<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any).error || `Request failed (${res.status})`);
  return data as T;
}

export function apiGet<T>(path: string): Promise<T> {
  return fetch(`/api${path}`).then((r) => handle<T>(r));
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return fetch(`/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  }).then((r) => handle<T>(r));
}

// ---- admin (PIN in localStorage) ----

export function getPin(): string {
  return localStorage.getItem('mathpal_admin_pin') || '';
}
export function setPin(pin: string) {
  localStorage.setItem('mathpal_admin_pin', pin);
}

export function adminFetch<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  return fetch(`/api/admin${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-admin-pin': getPin(),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  }).then((r) => handle<T>(r));
}

// ---- shared types ----

export interface Question {
  token: string;
  kind: 'arithmetic' | 'word';
  topic: string;
  theme: string;
  difficulty: number;
  prompt: string;
  answerType: string;
}

export interface QuestAward {
  key: string;
  label: string;
  emoji: string;
  points: number;
}

export interface Quest {
  key: string;
  emoji: string;
  label: string;
  target: number;
  points: number;
  progress: number;
  done: boolean;
  awarded: boolean;
}

export interface QuestsData {
  day: string;
  quests: Quest[];
  streak: number;
  sweepDone: boolean;
  newAwards: QuestAward[];
  balance: number;
}

export interface AnswerResult {
  correct: boolean;
  points?: number;
  balance?: number;
  explanation?: string;
  attemptNo: number;
  hint?: string | null;
  questAwards?: QuestAward[];
}

export interface AppState {
  studentName: string;
  buddyName: string;
  points: number;
  aiAvailable: boolean;
  enabledTopics: string[];
}
