import { Router, type Request, type Response, type NextFunction } from 'express';
import { db, getSetting, setSetting, pointsBalance, addPoints } from './db.js';
import { PROVIDERS, providerKeyConfigured } from './tutor.js';
import { startGeneration, getLatestJob } from './generator.js';

export const adminRouter = Router();

// Simple PIN auth: client sends x-admin-pin header.
// Brute-force lockout: 5 wrong PINs → locked for 15 minutes. Global (not
// per-IP) is fine for a single-family LAN app and can't be spoofed around.
let pinFailures = 0;
let pinLockedUntil = 0;
function requirePin(req: Request, res: Response, next: NextFunction) {
  if (Date.now() < pinLockedUntil) {
    return res.status(429).json({ error: 'PIN 錯誤次數過多，請 15 分鐘後再試' });
  }
  const pin = req.header('x-admin-pin');
  if (!pin || pin !== getSetting('admin_pin')) {
    pinFailures += 1;
    if (pinFailures >= 5) {
      pinLockedUntil = Date.now() + 15 * 60 * 1000;
      pinFailures = 0;
    }
    return res.status(401).json({ error: 'Wrong PIN' });
  }
  pinFailures = 0;
  next();
}
adminRouter.use(requirePin);

adminRouter.get('/ping', (_req, res) => res.json({ ok: true }));

// ---- overview --------------------------------------------------------------

adminRouter.get('/overview', (_req, res) => {
  const week = db.prepare(
    `SELECT COUNT(*) AS total, COALESCE(SUM(correct), 0) AS correct FROM attempts
     WHERE attempt_no = 1 AND created_at > datetime('now', '-7 days')`
  ).get() as { total: number; correct: number };
  const perTopic = db.prepare(
    `SELECT topic, kind, COUNT(*) AS total, SUM(correct) AS correct
     FROM attempts WHERE attempt_no = 1
     GROUP BY topic, kind ORDER BY total DESC`
  ).all();
  const recent = db.prepare(
    `SELECT kind, topic, difficulty, prompt, given, correct, attempt_no, mode, created_at
     FROM attempts ORDER BY id DESC LIMIT 25`
  ).all();
  const pendingRedemptions = db.prepare(
    `SELECT COUNT(*) AS n FROM redemptions WHERE status = 'pending'`
  ).get() as { n: number };
  const ledger = db.prepare('SELECT delta, reason, created_at FROM points_ledger ORDER BY id DESC LIMIT 20').all();

  res.json({ points: pointsBalance(), week, perTopic, recent, pendingRedemptions: pendingRedemptions.n, ledger });
});

adminRouter.post('/points', (req, res) => {
  const { delta, reason } = req.body as { delta?: number; reason?: string };
  if (typeof delta !== 'number' || !Number.isFinite(delta) || delta === 0) {
    return res.status(400).json({ error: 'delta must be a non-zero number' });
  }
  addPoints(Math.round(delta), reason?.trim() || 'Parent adjustment');
  res.json({ ok: true, balance: pointsBalance() });
});

// ---- settings ---------------------------------------------------------------

const EDITABLE_SETTINGS = [
  'admin_pin', 'student_name', 'buddy_name', 'target_difficulty', 'tutor_language', 'interests',
  'ai_provider', 'ai_model_claude', 'ai_model_gemini', 'ai_model_openai', 'ai_model_ollama',
];

adminRouter.get('/settings', (_req, res) => {
  const out: Record<string, unknown> = {};
  for (const k of EDITABLE_SETTINGS) out[k] = getSetting(k);
  // Which providers have credentials configured in server/.env (read-only info)
  out._keyStatus = Object.fromEntries(PROVIDERS.map((p) => [p, providerKeyConfigured(p)]));
  res.json(out);
});

adminRouter.put('/settings', (req, res) => {
  const body = req.body as Record<string, string>;
  for (const k of EDITABLE_SETTINGS) {
    if (typeof body[k] === 'string' && body[k].trim()) setSetting(k, body[k].trim());
  }
  res.json({ ok: true });
});

// ---- tutor notes -------------------------------------------------------------

adminRouter.get('/notes', (_req, res) => {
  res.json(db.prepare('SELECT * FROM tutor_notes ORDER BY id DESC').all());
});
adminRouter.post('/notes', (req, res) => {
  const { note } = req.body as { note?: string };
  if (!note?.trim()) return res.status(400).json({ error: 'note is required' });
  db.prepare('INSERT INTO tutor_notes (note) VALUES (?)').run(note.trim());
  res.json({ ok: true });
});
adminRouter.delete('/notes/:id', (req, res) => {
  db.prepare('DELETE FROM tutor_notes WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ---- AI chat logs ------------------------------------------------------------

adminRouter.get('/chats', (_req, res) => {
  res.json(db.prepare('SELECT * FROM ai_chats ORDER BY id DESC LIMIT 200').all());
});

// ---- question bank -----------------------------------------------------------

adminRouter.get('/questions', (_req, res) => {
  const rows = db.prepare('SELECT * FROM questions ORDER BY id DESC').all() as any[];
  res.json(rows.map((r) => ({ ...r, hints: JSON.parse(r.hints) })));
});

function questionFields(body: any) {
  const hints = Array.isArray(body.hints) ? body.hints.filter((h: unknown) => typeof h === 'string' && (h as string).trim()) : [];
  return {
    topic: String(body.topic || 'multi_step'),
    difficulty: Math.min(5, Math.max(1, parseInt(body.difficulty, 10) || 2)),
    theme: String(body.theme || 'general'),
    prompt: String(body.prompt || '').trim(),
    answer: String(body.answer || '').trim(),
    answer_type: ['number', 'fraction', 'text'].includes(body.answer_type) ? body.answer_type : 'number',
    hints: JSON.stringify(hints),
    explanation: String(body.explanation || '').trim(),
    active: body.active === 0 || body.active === false ? 0 : 1,
  };
}

adminRouter.post('/questions', (req, res) => {
  const f = questionFields(req.body);
  if (!f.prompt || !f.answer) return res.status(400).json({ error: 'prompt and answer are required' });
  const info = db.prepare(
    `INSERT INTO questions (kind, topic, difficulty, theme, prompt, answer, answer_type, hints, explanation, active, source)
     VALUES ('word', @topic, @difficulty, @theme, @prompt, @answer, @answer_type, @hints, @explanation, @active, 'parent')`
  ).run(f);
  res.json({ ok: true, id: info.lastInsertRowid });
});

// AI question generation (Phase 2). Runs as an async job — local models take
// minutes per problem, far beyond what a browser fetch survives. POST starts
// the job (409 if one is running); the UI polls GET /generate/latest.
// Generated problems are inserted INACTIVE until a parent approves them.
adminRouter.post('/generate', (req, res) => {
  const { count, topic, difficulty, theme } = req.body ?? {};
  const result = startGeneration({
    count: Number(count) || 1,
    topic: String(topic || 'auto'),
    difficulty: String(difficulty || 'auto'),
    theme: String(theme || 'mixed'),
  });
  if (!result.ok) return res.status(409).json({ error: result.error });
  res.json({ jobId: result.job.id });
});

adminRouter.get('/generate/latest', (_req, res) => {
  res.json(getLatestJob());
});

adminRouter.post('/questions/:id/approve', (req, res) => {
  const info = db.prepare('UPDATE questions SET active = 1 WHERE id = ?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

adminRouter.put('/questions/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM questions WHERE id = ?').get(req.params.id) as any;
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const f = questionFields(req.body);
  if (!f.prompt || !f.answer) return res.status(400).json({ error: 'prompt and answer are required' });
  // Don't let a missing `active` field silently activate a pending question.
  if (req.body.active === undefined) f.active = existing.active;
  // Changing the problem or answer invalidates the blind-solve verification.
  const verified = existing.source === 'ai' && (f.prompt !== existing.prompt || f.answer !== existing.answer)
    ? 0 : existing.verified;
  db.prepare(
    `UPDATE questions SET topic=@topic, difficulty=@difficulty, theme=@theme, prompt=@prompt,
     answer=@answer, answer_type=@answer_type, hints=@hints, explanation=@explanation, active=@active, verified=@verified
     WHERE id=@id`
  ).run({ ...f, verified, id: req.params.id });
  res.json({ ok: true });
});

adminRouter.delete('/questions/:id', (req, res) => {
  db.prepare('DELETE FROM questions WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ---- rewards -------------------------------------------------------------------

adminRouter.get('/rewards', (_req, res) => {
  res.json(db.prepare('SELECT * FROM rewards ORDER BY cost').all());
});
adminRouter.post('/rewards', (req, res) => {
  const { name, emoji, cost } = req.body;
  if (!name?.trim() || !Number.isFinite(Number(cost))) return res.status(400).json({ error: 'name and cost required' });
  db.prepare('INSERT INTO rewards (name, emoji, cost) VALUES (?, ?, ?)').run(name.trim(), emoji?.trim() || '🎁', Math.round(Number(cost)));
  res.json({ ok: true });
});
adminRouter.put('/rewards/:id', (req, res) => {
  const { name, emoji, cost, active } = req.body;
  db.prepare('UPDATE rewards SET name=?, emoji=?, cost=?, active=? WHERE id=?')
    .run(String(name).trim(), String(emoji || '🎁').trim(), Math.round(Number(cost)), active ? 1 : 0, req.params.id);
  res.json({ ok: true });
});
adminRouter.delete('/rewards/:id', (req, res) => {
  db.prepare('DELETE FROM rewards WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ---- redemptions ----------------------------------------------------------------

adminRouter.get('/redemptions', (_req, res) => {
  res.json(db.prepare('SELECT * FROM redemptions ORDER BY id DESC LIMIT 100').all());
});

adminRouter.post('/redemptions/:id', (req, res) => {
  const { action } = req.body as { action?: string };
  const r = db.prepare('SELECT * FROM redemptions WHERE id = ?').get(req.params.id) as any;
  if (!r) return res.status(404).json({ error: 'Not found' });
  if (r.status !== 'pending') return res.status(400).json({ error: 'Already decided' });
  if (action === 'approve') {
    db.prepare(`UPDATE redemptions SET status='approved', decided_at=datetime('now') WHERE id=?`).run(r.id);
  } else if (action === 'reject') {
    db.prepare(`UPDATE redemptions SET status='rejected', decided_at=datetime('now') WHERE id=?`).run(r.id);
    addPoints(r.cost, `Refund: ${r.reward_name}`);
  } else {
    return res.status(400).json({ error: 'action must be approve or reject' });
  }
  res.json({ ok: true, balance: pointsBalance() });
});
