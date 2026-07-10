import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { wordProblems, rewards, challengeLevels } from './seedData.js';
import { ALL_TOPIC_KEYS } from './curriculum.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(here, '../data');
fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(path.join(dataDir, 'mathpal.db'));
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL DEFAULT 'word',
  topic TEXT NOT NULL,
  difficulty INTEGER NOT NULL,
  theme TEXT NOT NULL DEFAULT 'general',
  prompt TEXT NOT NULL,
  answer TEXT NOT NULL,
  answer_type TEXT NOT NULL DEFAULT 'number',
  hints TEXT NOT NULL DEFAULT '[]',
  explanation TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER,
  kind TEXT NOT NULL,
  topic TEXT NOT NULL,
  difficulty INTEGER NOT NULL,
  prompt TEXT NOT NULL,
  given TEXT NOT NULL,
  correct INTEGER NOT NULL,
  attempt_no INTEGER NOT NULL DEFAULT 1,
  mode TEXT NOT NULL DEFAULT 'practice',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS points_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🎁',
  cost INTEGER NOT NULL,
  active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS redemptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reward_id INTEGER NOT NULL,
  reward_name TEXT NOT NULL,
  cost INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  decided_at TEXT
);
CREATE TABLE IF NOT EXISTS challenge_levels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ord INTEGER NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '⭐',
  kind TEXT NOT NULL,
  topic TEXT NOT NULL,
  difficulty INTEGER NOT NULL,
  question_count INTEGER NOT NULL,
  pass_correct INTEGER NOT NULL,
  bonus INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS challenge_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  level_id INTEGER NOT NULL,
  questions TEXT NOT NULL,
  answers TEXT NOT NULL DEFAULT '[]',
  correct INTEGER NOT NULL DEFAULT 0,
  finished INTEGER NOT NULL DEFAULT 0,
  stars INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS tutor_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  note TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS daily_quests (
  day TEXT PRIMARY KEY,
  quests TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS daily_awards (
  day TEXT NOT NULL,
  key TEXT NOT NULL,
  points INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (day, key)
);
CREATE TABLE IF NOT EXISTS ai_chats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT NOT NULL,
  question TEXT NOT NULL,
  user_msg TEXT NOT NULL,
  reply TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'ai',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

// Lightweight migrations: add columns introduced after first release.
{
  const cols = (db.prepare('PRAGMA table_info(questions)').all() as { name: string }[]).map((c) => c.name);
  if (!cols.includes('source')) db.exec(`ALTER TABLE questions ADD COLUMN source TEXT NOT NULL DEFAULT 'seed'`);
  if (!cols.includes('verified')) db.exec(`ALTER TABLE questions ADD COLUMN verified INTEGER NOT NULL DEFAULT 1`);
}

const defaultSettings: Record<string, string> = {
  admin_pin: '1234',
  student_name: 'Elena',
  buddy_name: 'Kai',
  target_difficulty: '2',
  tutor_language: 'English',
  interests: 'volleyball, Haikyuu!!, My Hero Academia',
  // AI provider selection (API keys live in server/.env, never here)
  ai_provider: 'claude',
  ai_model_claude: 'claude-opus-4-8',
  ai_model_gemini: 'gemini-2.5-flash',
  ai_model_openai: 'gpt-5-mini',
  ai_model_ollama: 'gpt-oss:20b',
  // Curriculum scope: JSON array of topic keys the student currently sees.
  enabled_topics: JSON.stringify(ALL_TOPIC_KEYS),
};

const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
for (const [k, v] of Object.entries(defaultSettings)) insertSetting.run(k, v);

// Seed word problems and challenge levels incrementally: new seed entries are
// added on startup without touching existing rows (so adding Saxon 3 content
// later doesn't require wiping Elena's data). A registry of already-seeded
// prompts makes seeding one-shot per entry: questions the parent later edits
// or deletes stay edited/deleted instead of being resurrected on restart.
// Rewards seed only once — parents own that list after first run.
db.exec('CREATE TABLE IF NOT EXISTS seeded_prompts (prompt TEXT PRIMARY KEY)');
{
  const seeded = db.prepare('SELECT 1 FROM seeded_prompts WHERE prompt = ?');
  const markSeeded = db.prepare('INSERT OR IGNORE INTO seeded_prompts (prompt) VALUES (?)');
  const exists = db.prepare('SELECT 1 FROM questions WHERE prompt = ?');
  const ins = db.prepare(
    `INSERT INTO questions (kind, topic, difficulty, theme, prompt, answer, answer_type, hints, explanation)
     VALUES ('word', ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const p of wordProblems) {
    if (!seeded.get(p.prompt)) {
      if (!exists.get(p.prompt)) {
        ins.run(p.topic, p.difficulty, p.theme, p.prompt, p.answer, p.answerType, JSON.stringify(p.hints), p.explanation);
      }
      markSeeded.run(p.prompt);
    }
  }
}

const rCount = (db.prepare('SELECT COUNT(*) AS n FROM rewards').get() as { n: number }).n;
if (rCount === 0) {
  const ins = db.prepare('INSERT INTO rewards (name, emoji, cost) VALUES (?, ?, ?)');
  for (const r of rewards) ins.run(r.name, r.emoji, r.cost);
}

{
  const exists = db.prepare('SELECT 1 FROM challenge_levels WHERE name = ?');
  const ins = db.prepare(
    'INSERT INTO challenge_levels (ord, name, emoji, kind, topic, difficulty, question_count, pass_correct, bonus) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  for (const l of challengeLevels) {
    if (!exists.get(l.name)) {
      ins.run(l.ord, l.name, l.emoji, l.kind, l.topic, l.difficulty, l.questionCount, l.passCorrect, l.bonus);
    }
  }
}

export function getSetting(key: string): string {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
  return row?.value ?? '';
}

export function setSetting(key: string, value: string) {
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, value);
}

export function pointsBalance(): number {
  const row = db.prepare('SELECT COALESCE(SUM(delta), 0) AS total FROM points_ledger').get() as { total: number };
  return row.total;
}

export function addPoints(delta: number, reason: string) {
  if (delta === 0) return;
  db.prepare('INSERT INTO points_ledger (delta, reason) VALUES (?, ?)').run(delta, reason);
}
