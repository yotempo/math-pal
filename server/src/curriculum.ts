import { getSetting } from './db.js';

// Curriculum scope: which topics the student currently sees. The parent
// checks/unchecks topics in the admin panel (e.g. when school starts, uncheck
// the Saxon 2 review topics and keep only the early Saxon 3 material).
// The enabled set is enforced server-side everywhere questions come from:
// practice drills, word-problem picks, challenge levels, and AI generation.

export interface CurriculumTopic {
  key: string;
  label: string; // admin-facing (Traditional Chinese)
  kinds: ('arithmetic' | 'word')[];
}

export interface CurriculumGroup {
  key: string;
  label: string;
  topics: CurriculumTopic[];
}

export const CURRICULUM: CurriculumGroup[] = [
  {
    key: 'saxon2',
    label: 'Saxon Course 2（複習）',
    topics: [
      { key: 'add_sub', label: '加減法（含小數）', kinds: ['arithmetic'] },
      { key: 'mult', label: '乘法', kinds: ['arithmetic'] },
      { key: 'div', label: '除法', kinds: ['arithmetic'] },
      { key: 'fractions', label: '分數', kinds: ['arithmetic', 'word'] },
      { key: 'decimals', label: '小數', kinds: ['arithmetic'] },
      { key: 'percent', label: '百分比', kinds: ['arithmetic', 'word'] },
      { key: 'integers', label: '負數', kinds: ['arithmetic'] },
      { key: 'order_ops', label: '運算順序', kinds: ['arithmetic'] },
      { key: 'multi_step', label: '多步驟應用題', kinds: ['word'] },
      { key: 'ratio', label: '比與比例應用', kinds: ['word'] },
      { key: 'rate', label: '速率／單價', kinds: ['word'] },
      { key: 'average', label: '平均數', kinds: ['word'] },
    ],
  },
  {
    key: 'saxon3',
    label: 'Saxon Course 3（先修）',
    topics: [
      { key: 'exponents_roots', label: '次方與開根號', kinds: ['arithmetic'] },
      { key: 'equations', label: '解方程式', kinds: ['arithmetic', 'word'] },
      { key: 'proportions', label: '比例式', kinds: ['arithmetic'] },
      { key: 'geometry', label: '幾何（周長／面積／圓）', kinds: ['arithmetic', 'word'] },
    ],
  },
];

const ALL_TOPICS = CURRICULUM.flatMap((g) => g.topics);
export const ALL_TOPIC_KEYS = ALL_TOPICS.map((t) => t.key);

export function enabledTopicSet(): Set<string> {
  try {
    const arr = JSON.parse(getSetting('enabled_topics') || '[]');
    if (Array.isArray(arr)) {
      const valid = arr.filter((k) => typeof k === 'string' && ALL_TOPIC_KEYS.includes(k));
      if (valid.length) return new Set(valid);
    }
  } catch { /* invalid JSON — treat as unset */ }
  return new Set(ALL_TOPIC_KEYS); // unset/empty/invalid → everything enabled
}

export function enabledTopicsFor(kind: 'arithmetic' | 'word'): string[] {
  const enabled = enabledTopicSet();
  return ALL_TOPICS.filter((t) => t.kinds.includes(kind) && enabled.has(t.key)).map((t) => t.key);
}
