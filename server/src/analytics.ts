import { db } from './db.js';

// Time-based weakness detection. A topic counts as "slow" when her average
// solve time on it is well above what she normally needs for problems of the
// same difficulty (e.g. Lv3 problems usually take ~1 min, but Lv3 proportion
// problems take ~5 min). Slow topics are treated as weak spots alongside
// accuracy-based ones: the AI tutor hears about them and the admin sees them.
//
// Only first attempts with valid timing count; anything over IDLE_SEC is
// assumed to be "walked away from the iPad" and excluded from averages
// (but still recorded in the attempts table).

export const IDLE_SEC = 15 * 60;

export interface SlowTopic {
  topic: string;
  kind: string;
  avgSec: number;      // her average on this topic
  expectedSec: number; // difficulty-matched baseline across all topics
  samples: number;
}

export function slowTopics(): SlowTopic[] {
  const rows = db.prepare(
    `SELECT topic, kind, difficulty, elapsed_sec
     FROM attempts
     WHERE attempt_no = 1 AND elapsed_sec IS NOT NULL AND elapsed_sec > 0 AND elapsed_sec <= ?
       AND created_at > datetime('now', '-30 days')`
  ).all(IDLE_SEC) as { topic: string; kind: string; difficulty: number; elapsed_sec: number }[];
  if (rows.length < 8) return [];

  // Baseline: average seconds per difficulty level, across all topics.
  const byDiff = new Map<number, { sum: number; n: number }>();
  for (const r of rows) {
    const d = byDiff.get(r.difficulty) ?? { sum: 0, n: 0 };
    d.sum += r.elapsed_sec; d.n += 1;
    byDiff.set(r.difficulty, d);
  }
  const baseline = (d: number) => {
    const b = byDiff.get(d);
    return b && b.n ? b.sum / b.n : 0;
  };

  // Per topic: her average vs the difficulty-weighted expectation.
  const byTopic = new Map<string, { kind: string; sum: number; expected: number; n: number }>();
  for (const r of rows) {
    const t = byTopic.get(r.topic) ?? { kind: r.kind, sum: 0, expected: 0, n: 0 };
    t.sum += r.elapsed_sec;
    t.expected += baseline(r.difficulty);
    t.n += 1;
    byTopic.set(r.topic, t);
  }

  const out: SlowTopic[] = [];
  for (const [topic, t] of byTopic) {
    if (t.n < 4) continue;
    const avgSec = t.sum / t.n;
    const expectedSec = t.expected / t.n;
    // 1.8x slower than her own norm, and not trivially fast in absolute terms
    if (expectedSec > 0 && avgSec >= 1.8 * expectedSec && avgSec >= 45) {
      out.push({ topic, kind: t.kind, avgSec: Math.round(avgSec), expectedSec: Math.round(expectedSec), samples: t.n });
    }
  }
  return out.sort((a, b) => b.avgSec / b.expectedSec - a.avgSec / a.expectedSec);
}
