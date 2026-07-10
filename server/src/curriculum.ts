import { getSetting } from './db.js';

// Curriculum scope: which topics the student currently sees. The parent
// checks/unchecks topics in the admin panel (e.g. when school starts, uncheck
// the Saxon 2 review topics and keep only the early Saxon 3 material).
// The enabled set is enforced server-side everywhere questions come from:
// practice drills, word-problem picks, challenge levels, and AI generation.

export interface BilingualLabel {
  zh: string;
  en: string;
}

export interface CurriculumTopic {
  key: string;
  label: BilingualLabel; // admin-facing; the admin UI picks by its language setting
  kinds: ('arithmetic' | 'word')[];
}

export interface CurriculumGroup {
  key: string;
  label: BilingualLabel;
  topics: CurriculumTopic[];
}

export const CURRICULUM: CurriculumGroup[] = [
  {
    key: 'saxon2',
    label: { zh: 'Saxon Course 2（複習）', en: 'Saxon Course 2 (review)' },
    topics: [
      { key: 'add_sub', label: { zh: '加減法（含小數）', en: 'Addition & subtraction' }, kinds: ['arithmetic'] },
      { key: 'mult', label: { zh: '乘法', en: 'Multiplication' }, kinds: ['arithmetic'] },
      { key: 'div', label: { zh: '除法', en: 'Division' }, kinds: ['arithmetic'] },
      { key: 'fractions', label: { zh: '分數', en: 'Fractions' }, kinds: ['arithmetic', 'word'] },
      { key: 'decimals', label: { zh: '小數', en: 'Decimals' }, kinds: ['arithmetic'] },
      { key: 'percent', label: { zh: '百分比', en: 'Percentages' }, kinds: ['arithmetic', 'word'] },
      { key: 'integers', label: { zh: '負數', en: 'Negative numbers' }, kinds: ['arithmetic'] },
      { key: 'order_ops', label: { zh: '運算順序', en: 'Order of operations' }, kinds: ['arithmetic'] },
      { key: 'multi_step', label: { zh: '多步驟應用題', en: 'Multi-step problems' }, kinds: ['word'] },
      { key: 'ratio', label: { zh: '比與比例應用', en: 'Ratios' }, kinds: ['word'] },
      { key: 'rate', label: { zh: '速率／單價', en: 'Rates & unit price' }, kinds: ['word'] },
      { key: 'average', label: { zh: '平均數', en: 'Averages' }, kinds: ['word'] },
    ],
  },
  {
    key: 'saxon3',
    label: { zh: 'Saxon Course 3（先修）', en: 'Saxon Course 3 (preview)' },
    topics: [
      { key: 'exponents_roots', label: { zh: '次方與開根號', en: 'Powers & square roots' }, kinds: ['arithmetic'] },
      { key: 'equations', label: { zh: '解方程式', en: 'Solving equations' }, kinds: ['arithmetic', 'word'] },
      { key: 'proportions', label: { zh: '比例式', en: 'Proportion equations' }, kinds: ['arithmetic'] },
      { key: 'geometry', label: { zh: '幾何（周長／面積／圓）', en: 'Geometry (perimeter/area/circles)' }, kinds: ['arithmetic', 'word'] },
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
