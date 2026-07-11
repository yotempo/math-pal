import { db, addPoints, scaleAward } from './db.js';
import { enabledTopicSet } from './curriculum.js';

// Daily quests + practice-streak rewards.
//
// Three quests per day, frozen at first access (stored in daily_quests so the
// set doesn't shift mid-day when e.g. weak topics change). Progress is always
// computed live from the attempts/challenge tables — there is no client input,
// so quests inherit the anti-cheat property: the browser only ever submits
// answers. Completions auto-award points exactly once (daily_awards PK).
//
// Day boundaries use the server's local timezone (container sets TZ).

interface QuestDef {
  key: string;
  emoji: string;
  label: string; // kid-facing, English
  target: number;
  points: number;
  metric: 'drills' | 'word' | 'combo' | 'challenge' | 'topic';
  topic?: string;
}

export interface QuestState extends QuestDef {
  progress: number;
  done: boolean;
  awarded: boolean;
}

export interface QuestAward {
  key: string;
  label: string;
  emoji: string;
  points: number;
}

const SWEEP_POINTS = 15;

function today(): string {
  return (db.prepare(`SELECT date('now','localtime') AS d`).get() as { d: string }).d;
}

function hashStr(s: string): number {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

const TOPIC_NAMES: Record<string, string> = {
  add_sub: 'add & subtract', mult: 'multiplication', div: 'division',
  fractions: 'fraction', decimals: 'decimal', percent: 'percent',
  integers: 'negative-number', order_ops: 'order-of-operations',
  exponents_roots: 'powers & roots', equations: 'equation',
  proportions: 'proportion', geometry: 'geometry',
  multi_step: 'multi-step', ratio: 'ratio', rate: 'rate', average: 'average',
};

function weakestEnabledTopic(): string | null {
  const enabled = enabledTopicSet();
  const rows = db.prepare(
    `SELECT topic, COUNT(*) AS total, SUM(correct) AS correct
     FROM attempts
     WHERE attempt_no = 1 AND created_at > datetime('now', '-30 days')
     GROUP BY topic HAVING total >= 4`
  ).all() as { topic: string; total: number; correct: number }[];
  const weak = rows
    .filter((r) => enabled.has(r.topic) && r.correct / r.total < 0.7)
    .sort((a, b) => a.correct / a.total - b.correct / b.total);
  return weak[0]?.topic ?? null;
}

function generateQuests(day: string): QuestDef[] {
  const quests: QuestDef[] = [
    { key: 'drills', emoji: '⚡', label: 'Solve 10 drills correctly', target: 10, points: 8, metric: 'drills' },
    { key: 'word', emoji: '📖', label: 'Solve 4 word problems correctly', target: 4, points: 12, metric: 'word' },
  ];
  const pick = hashStr(day) % 3;
  const weak = weakestEnabledTopic();
  if (pick === 2 && weak) {
    quests.push({
      key: `focus_${weak}`, emoji: '🎯',
      label: `Solve 5 ${TOPIC_NAMES[weak] ?? weak} problems correctly`,
      target: 5, points: 10, metric: 'topic', topic: weak,
    });
  } else if (pick === 1) {
    quests.push({ key: 'challenge', emoji: '🏆', label: 'Clear any challenge level (2+ stars)', target: 1, points: 10, metric: 'challenge' });
  } else {
    quests.push({ key: 'combo', emoji: '🔥', label: 'Get 6 correct in a row', target: 6, points: 10, metric: 'combo' });
  }
  return quests;
}

function questsForToday(): { day: string; defs: QuestDef[] } {
  const day = today();
  const row = db.prepare('SELECT quests FROM daily_quests WHERE day = ?').get(day) as { quests: string } | undefined;
  if (row) return { day, defs: JSON.parse(row.quests) };
  const defs = generateQuests(day);
  db.prepare('INSERT OR IGNORE INTO daily_quests (day, quests) VALUES (?, ?)').run(day, JSON.stringify(defs));
  return { day, defs };
}

function metricProgress(q: QuestDef, day: string): number {
  switch (q.metric) {
    case 'drills':
      return (db.prepare(
        `SELECT COUNT(*) AS n FROM attempts WHERE correct = 1 AND kind = 'arithmetic' AND date(created_at,'localtime') = ?`
      ).get(day) as { n: number }).n;
    case 'word':
      return (db.prepare(
        `SELECT COUNT(*) AS n FROM attempts WHERE correct = 1 AND kind = 'word' AND date(created_at,'localtime') = ?`
      ).get(day) as { n: number }).n;
    case 'topic':
      return (db.prepare(
        `SELECT COUNT(*) AS n FROM attempts WHERE correct = 1 AND topic = ? AND date(created_at,'localtime') = ?`
      ).get(q.topic, day) as { n: number }).n;
    case 'challenge':
      return (db.prepare(
        `SELECT COUNT(*) AS n FROM challenge_runs WHERE finished = 1 AND stars >= 2 AND date(created_at,'localtime') = ?`
      ).get(day) as { n: number }).n;
    case 'combo': {
      const rows = db.prepare(
        `SELECT correct FROM attempts WHERE date(created_at,'localtime') = ? ORDER BY id`
      ).all(day) as { correct: number }[];
      let best = 0, run = 0;
      for (const r of rows) {
        run = r.correct ? run + 1 : 0;
        if (run > best) best = run;
      }
      return best;
    }
  }
}

// Consecutive practice days ending today (days with at least one attempt).
export function practiceStreak(): number {
  const rows = db.prepare(
    `SELECT DISTINCT date(created_at,'localtime') AS day FROM attempts ORDER BY day DESC LIMIT 60`
  ).all() as { day: string }[];
  if (!rows.length) return 0;
  const dayMs = 86400000;
  const toDay = (s: string) => Math.floor(new Date(s + 'T00:00:00Z').getTime() / dayMs);
  const todayN = toDay(today());
  let streak = 0;
  for (let i = 0; i < rows.length; i++) {
    if (toDay(rows[i].day) === todayN - i) streak += 1;
    else break;
  }
  return streak;
}

// Returns the actual coins granted (issuance curve applied), or 0 when the
// award was already claimed today.
function tryAward(day: string, key: string, rawPoints: number, reason: string): number {
  const scaled = scaleAward(rawPoints);
  const info = db.prepare('INSERT OR IGNORE INTO daily_awards (day, key, points) VALUES (?, ?, ?)').run(day, key, scaled);
  if (!info.changes) return 0;
  addPoints(scaled, reason);
  return scaled;
}

// Compute quest state, auto-award any newly completed quests plus the
// all-done sweep and the streak bonus. Returns state + what was just awarded.
export function evaluateQuests(): {
  day: string;
  quests: QuestState[];
  streak: number;
  sweepDone: boolean;
  newAwards: QuestAward[];
} {
  const { day, defs } = questsForToday();
  const awardedKeys = new Set(
    (db.prepare('SELECT key FROM daily_awards WHERE day = ?').all(day) as { key: string }[]).map((r) => r.key)
  );
  const newAwards: QuestAward[] = [];

  const quests: QuestState[] = defs.map((q) => {
    const progress = Math.min(q.target, metricProgress(q, day));
    const done = progress >= q.target;
    if (done && !awardedKeys.has(q.key)) {
      const got = tryAward(day, q.key, q.points, `Daily quest: ${q.label}`);
      if (got) {
        newAwards.push({ key: q.key, label: q.label, emoji: q.emoji, points: got });
        awardedKeys.add(q.key);
      }
    }
    // Display the issuance-curve-adjusted value so the card never over-promises.
    return { ...q, points: scaleAward(q.points), progress, done, awarded: awardedKeys.has(q.key) };
  });

  if (quests.every((q) => q.done) && !awardedKeys.has('sweep')) {
    const got = tryAward(day, 'sweep', SWEEP_POINTS, 'Daily sweep: all quests complete!');
    if (got) {
      newAwards.push({ key: 'sweep', label: 'All quests complete!', emoji: '🎉', points: got });
      awardedKeys.add('sweep');
    }
  }

  const streak = practiceStreak();
  const hasCorrectToday = (db.prepare(
    `SELECT 1 AS x FROM attempts WHERE correct = 1 AND date(created_at,'localtime') = ? LIMIT 1`
  ).get(day)) !== undefined;
  if (streak >= 2 && hasCorrectToday && !awardedKeys.has('streak')) {
    const got = tryAward(day, 'streak', Math.min(2 * streak, 14), `Practice streak: day ${streak}`);
    if (got) {
      newAwards.push({ key: 'streak', label: `${streak}-day streak!`, emoji: '🔥', points: got });
    }
  }

  return { day, quests, streak, sweepDone: awardedKeys.has('sweep'), newAwards };
}
