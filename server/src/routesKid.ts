import { Router } from 'express';
import { db, getSetting, pointsBalance, addPoints } from './db.js';
import { generateArithmetic, ARITHMETIC_TOPICS, type ArithmeticTopic } from './arithmetic.js';
import { checkAnswer } from './answers.js';
import { registerQuestion, getPending, removePending } from './pending.js';
import { aiAvailable } from './tutor.js';
import { enabledTopicSet, enabledTopicsFor } from './curriculum.js';
import { evaluateQuests, practiceStreak } from './quests.js';

export const kidRouter = Router();

interface WordRow {
  id: number; topic: string; difficulty: number; theme: string; prompt: string;
  answer: string; answer_type: string; hints: string; explanation: string;
}

// ---- difficulty auto-adjustment ------------------------------------------

function targetDifficulty(selector: { topic?: string; kind?: string }): number {
  const base = parseInt(getSetting('target_difficulty') || '2', 10);
  const rows = (selector.kind
    ? db.prepare(`SELECT correct FROM attempts WHERE kind = ? AND attempt_no = 1 ORDER BY id DESC LIMIT 20`).all(selector.kind)
    : db.prepare(`SELECT correct FROM attempts WHERE topic = ? AND attempt_no = 1 ORDER BY id DESC LIMIT 20`).all(selector.topic)
  ) as { correct: number }[];
  let adj = 0;
  if (rows.length >= 6) {
    const acc = rows.reduce((s, r) => s + r.correct, 0) / rows.length;
    if (acc > 0.85) adj = 1;
    else if (acc < 0.5) adj = -1;
  }
  return Math.min(5, Math.max(1, base + adj));
}

function pickWordProblem(difficulty: number, topics: string[]): WordRow | undefined {
  if (!topics.length) return undefined;
  const placeholders = topics.map(() => '?').join(',');
  return db.prepare(
    `SELECT q.*, (
       SELECT COUNT(*) FROM attempts a WHERE a.question_id = q.id AND a.correct = 1
     ) AS solved
     FROM questions q
     WHERE q.active = 1 AND q.kind = 'word'
       AND q.topic IN (${placeholders})
       AND q.difficulty BETWEEN ? AND ?
     ORDER BY solved ASC, RANDOM()
     LIMIT 1`
  ).get(...topics, difficulty - 1, difficulty + 1) as WordRow | undefined;
}

// ---- state ---------------------------------------------------------------

kidRouter.get('/state', (_req, res) => {
  res.json({
    studentName: getSetting('student_name'),
    buddyName: getSetting('buddy_name'),
    points: pointsBalance(),
    aiAvailable: aiAvailable(),
    enabledTopics: [...enabledTopicSet()],
  });
});

// ---- practice questions ---------------------------------------------------

kidRouter.get('/question', (req, res) => {
  const mode = String(req.query.mode || 'arithmetic');
  const topicParam = String(req.query.topic || 'mixed');
  const diffParam = String(req.query.difficulty || 'auto');

  if (mode === 'word') {
    const diff = diffParam === 'auto' ? targetDifficulty({ kind: 'word' }) : parseInt(diffParam, 10);
    const row = pickWordProblem(diff, enabledTopicsFor('word'));
    if (!row) return res.status(404).json({ error: 'No word problems in the current study plan — ask your parent to check the settings!' });
    const entry = registerQuestion({
      kind: 'word', questionId: row.id, topic: row.topic, difficulty: row.difficulty,
      prompt: row.prompt, answer: row.answer, answerType: row.answer_type,
      hints: JSON.parse(row.hints), explanation: row.explanation,
    });
    return res.json({
      token: entry.token, kind: 'word', topic: row.topic, theme: row.theme,
      difficulty: row.difficulty, prompt: row.prompt, answerType: row.answer_type,
    });
  }

  const enabledArith = enabledTopicsFor('arithmetic');
  if (!enabledArith.length) {
    return res.status(404).json({ error: 'Math drills are paused in the current study plan — ask your parent to check the settings!' });
  }
  let topic = (ARITHMETIC_TOPICS as readonly string[]).includes(topicParam)
    ? (topicParam as ArithmeticTopic)
    : 'mixed' as const;
  // A topic outside the current study plan falls back to the enabled mix.
  if (topic !== 'mixed' && !enabledArith.includes(topic)) topic = 'mixed';
  const diff = diffParam === 'auto'
    ? (topic === 'mixed' ? targetDifficulty({ kind: 'arithmetic' }) : targetDifficulty({ topic }))
    : parseInt(diffParam, 10);
  const q = generateArithmetic(topic, diff, enabledArith);
  const entry = registerQuestion({
    kind: 'arithmetic', questionId: null, topic: q.topic, difficulty: q.difficulty,
    prompt: q.prompt, answer: q.answer, answerType: q.answerType,
    hints: q.hints, explanation: q.explanation,
  });
  res.json({
    token: entry.token, kind: 'arithmetic', topic: q.topic, theme: 'drill',
    difficulty: q.difficulty, prompt: q.prompt, answerType: q.answerType,
  });
});

function pointsFor(kind: string, difficulty: number, attemptNo: number, revealed: boolean): number {
  if (revealed) return 0;
  const full = kind === 'word' ? difficulty * 3 : difficulty * 2;
  if (attemptNo === 1) return full;
  if (attemptNo === 2) return Math.ceil(full / 2);
  return 1;
}

kidRouter.post('/answer', (req, res) => {
  const { token, answer } = req.body as { token?: string; answer?: string };
  if (!token || typeof answer !== 'string' || !answer.trim()) {
    return res.status(400).json({ error: 'token and answer are required' });
  }
  const q = getPending(token);
  if (!q) return res.status(410).json({ error: 'This question expired — grab a new one!' });

  q.attempts += 1;
  const correct = checkAnswer(q.answer, answer, q.answerType);

  db.prepare(
    `INSERT INTO attempts (question_id, kind, topic, difficulty, prompt, given, correct, attempt_no, mode)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'practice')`
  ).run(q.questionId, q.kind, q.topic, q.difficulty, q.prompt, answer.trim(), correct ? 1 : 0, q.attempts);

  if (correct) {
    const pts = pointsFor(q.kind, q.difficulty, q.attempts, q.revealed);
    addPoints(pts, `Solved ${q.kind} (${q.topic}, level ${q.difficulty})`);
    removePending(token);
    // Daily quests / streak may have just completed with this answer.
    const questAwards = evaluateQuests().newAwards;
    return res.json({
      correct: true, points: pts, balance: pointsBalance(),
      explanation: q.explanation, attemptNo: q.attempts, questAwards,
    });
  }

  const hint = q.hints[Math.min(q.attempts - 1, q.hints.length - 1)] ?? null;
  res.json({ correct: false, attemptNo: q.attempts, hint });
});

kidRouter.post('/reveal', (req, res) => {
  const { token } = req.body as { token?: string };
  const q = token ? getPending(token) : undefined;
  if (!q) return res.status(410).json({ error: 'This question expired.' });
  q.revealed = true;
  res.json({ answer: q.answer, explanation: q.explanation });
});

// ---- progress -------------------------------------------------------------

kidRouter.get('/progress', (_req, res) => {
  const perTopic = db.prepare(
    `SELECT topic, kind, COUNT(*) AS total, SUM(correct) AS correct
     FROM attempts WHERE attempt_no = 1
     GROUP BY topic, kind ORDER BY total DESC`
  ).all();
  const today = db.prepare(
    `SELECT COUNT(*) AS n, COALESCE(SUM(correct), 0) AS c FROM attempts
     WHERE attempt_no = 1 AND date(created_at,'localtime') = date('now','localtime')`
  ).get() as { n: number; c: number };
  res.json({ points: pointsBalance(), today, streak: practiceStreak(), perTopic });
});

// ---- challenges -----------------------------------------------------------

interface RunQuestion {
  kind: string; topic: string; difficulty: number; prompt: string;
  answer: string; answerType: string; explanation: string;
}

// A level is in scope when its specific topic is enabled; 'mixed' and word
// levels stay listed because they draw from the (filtered) enabled pools.
function levelInScope(l: any): boolean {
  if (l.topic === 'mixed' || l.kind === 'word') return true;
  return enabledTopicSet().has(l.topic);
}

kidRouter.get('/challenges', (_req, res) => {
  const levels = (db.prepare('SELECT * FROM challenge_levels ORDER BY ord').all() as any[]).filter(levelInScope);
  const best = db.prepare(
    `SELECT level_id, MAX(stars) AS stars FROM challenge_runs WHERE finished = 1 GROUP BY level_id`
  ).all() as { level_id: number; stars: number }[];
  const starMap = new Map(best.map((b) => [b.level_id, b.stars]));
  res.json(levels.map((l) => ({
    id: l.id, ord: l.ord, name: l.name, emoji: l.emoji, kind: l.kind,
    difficulty: l.difficulty, questionCount: l.question_count,
    passCorrect: l.pass_correct, bonus: l.bonus,
    bestStars: starMap.get(l.id) ?? 0,
  })));
});

kidRouter.post('/challenges/:id/start', (req, res) => {
  const level = db.prepare('SELECT * FROM challenge_levels WHERE id = ?').get(req.params.id) as any;
  if (!level) return res.status(404).json({ error: 'Level not found' });
  if (!levelInScope(level)) {
    return res.status(400).json({ error: 'This level is not in the current study plan — ask your parent!' });
  }

  const enabledWord = enabledTopicsFor('word');
  const enabledArith = enabledTopicsFor('arithmetic');
  const questions: RunQuestion[] = [];
  const usedWordIds = new Set<number>();
  for (let i = 0; i < level.question_count; i++) {
    const wantWord = level.kind === 'word' || (level.kind === 'mixed' && i % 2 === 1);
    if (wantWord && enabledWord.length) {
      const placeholders = enabledWord.map(() => '?').join(',');
      const rows = db.prepare(
        `SELECT * FROM questions WHERE active = 1 AND kind = 'word' AND topic IN (${placeholders}) AND difficulty BETWEEN ? AND ? ORDER BY RANDOM() LIMIT 10`
      ).all(...enabledWord, level.difficulty - 1, level.difficulty + 1) as WordRow[];
      const row = rows.find((r) => !usedWordIds.has(r.id)) ?? rows[0];
      if (row) {
        usedWordIds.add(row.id);
        questions.push({
          kind: 'word', topic: row.topic, difficulty: row.difficulty, prompt: row.prompt,
          answer: row.answer, answerType: row.answer_type, explanation: row.explanation,
        });
        continue;
      }
    }
    const g = generateArithmetic(level.topic === 'mixed' ? 'mixed' : level.topic, level.difficulty, enabledArith);
    questions.push({
      kind: 'arithmetic', topic: g.topic, difficulty: g.difficulty, prompt: g.prompt,
      answer: g.answer, answerType: g.answerType, explanation: g.explanation,
    });
  }

  const info = db.prepare('INSERT INTO challenge_runs (level_id, questions) VALUES (?, ?)')
    .run(level.id, JSON.stringify(questions));
  res.json({
    runId: info.lastInsertRowid,
    level: { id: level.id, name: level.name, emoji: level.emoji, bonus: level.bonus, passCorrect: level.pass_correct },
    questions: questions.map((q, i) => ({ index: i, prompt: q.prompt, answerType: q.answerType, kind: q.kind })),
  });
});

kidRouter.post('/challenges/runs/:runId/answer', (req, res) => {
  const run = db.prepare('SELECT * FROM challenge_runs WHERE id = ?').get(req.params.runId) as any;
  if (!run || run.finished) return res.status(410).json({ error: 'Run not found or already finished' });
  const { index, answer } = req.body as { index?: number; answer?: string };
  const questions: RunQuestion[] = JSON.parse(run.questions);
  if (typeof index !== 'number' || index < 0 || index >= questions.length || typeof answer !== 'string') {
    return res.status(400).json({ error: 'index and answer are required' });
  }
  const answers: (string | null)[] = JSON.parse(run.answers);
  while (answers.length < questions.length) answers.push(null);
  if (answers[index] !== null) return res.status(400).json({ error: 'Already answered' });

  const q = questions[index];
  const correct = checkAnswer(q.answer, answer, q.answerType);
  answers[index] = answer.trim();

  db.prepare(
    `INSERT INTO attempts (question_id, kind, topic, difficulty, prompt, given, correct, attempt_no, mode)
     VALUES (NULL, ?, ?, ?, ?, ?, ?, 1, 'challenge')`
  ).run(q.kind, q.topic, q.difficulty, q.prompt, answer.trim(), correct ? 1 : 0);

  const newCorrect = run.correct + (correct ? 1 : 0);
  db.prepare('UPDATE challenge_runs SET answers = ?, correct = ? WHERE id = ?')
    .run(JSON.stringify(answers), newCorrect, run.id);

  res.json({ correct, explanation: correct ? undefined : q.explanation });
});

kidRouter.post('/challenges/runs/:runId/finish', (req, res) => {
  const run = db.prepare('SELECT * FROM challenge_runs WHERE id = ?').get(req.params.runId) as any;
  if (!run) return res.status(404).json({ error: 'Run not found' });
  if (run.finished) return res.status(400).json({ error: 'Already finished' });
  const level = db.prepare('SELECT * FROM challenge_levels WHERE id = ?').get(run.level_id) as any;
  const questions: RunQuestion[] = JSON.parse(run.questions);
  const total = questions.length;
  const correct = run.correct;

  let stars = 0;
  if (correct === total) stars = 3;
  else if (correct >= level.pass_correct) stars = 2;
  else if (correct >= Math.ceil(total / 2)) stars = 1;
  const passed = correct >= level.pass_correct;

  const points = correct * level.difficulty + (passed ? level.bonus : 0);
  addPoints(points, `Challenge "${level.name}": ${correct}/${total}${passed ? ' + bonus' : ''}`);

  db.prepare('UPDATE challenge_runs SET finished = 1, stars = ? WHERE id = ?').run(stars, run.id);
  const questAwards = evaluateQuests().newAwards;
  res.json({ correct, total, stars, passed, points, balance: pointsBalance(), questAwards });
});

// ---- daily quests -----------------------------------------------------------

kidRouter.get('/quests', (_req, res) => {
  const { day, quests, streak, sweepDone, newAwards } = evaluateQuests();
  res.json({ day, quests, streak, sweepDone, newAwards, balance: pointsBalance() });
});

// ---- rewards --------------------------------------------------------------

kidRouter.get('/rewards', (_req, res) => {
  const items = db.prepare('SELECT * FROM rewards WHERE active = 1 ORDER BY cost').all();
  const pending = db.prepare(
    `SELECT id, reward_name, cost, status, created_at FROM redemptions ORDER BY id DESC LIMIT 10`
  ).all();
  res.json({ balance: pointsBalance(), rewards: items, recent: pending });
});

kidRouter.post('/rewards/:id/redeem', (req, res) => {
  const reward = db.prepare('SELECT * FROM rewards WHERE id = ? AND active = 1').get(req.params.id) as any;
  if (!reward) return res.status(404).json({ error: 'Reward not found' });
  if (pointsBalance() < reward.cost) {
    return res.status(400).json({ error: 'Not enough points yet — keep practicing!' });
  }
  addPoints(-reward.cost, `Redeemed: ${reward.name}`);
  db.prepare('INSERT INTO redemptions (reward_id, reward_name, cost) VALUES (?, ?, ?)')
    .run(reward.id, reward.name, reward.cost);
  res.json({ ok: true, balance: pointsBalance(), message: 'Sent to your parent for approval! 🎉' });
});
