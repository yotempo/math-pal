// Procedural arithmetic question generator.
// Difficulty 1-5, calibrated for a student who finished Saxon Course 2.

export const ARITHMETIC_TOPICS = [
  // Saxon Course 2 review
  'add_sub',
  'mult',
  'div',
  'fractions',
  'decimals',
  'percent',
  'integers',
  'order_ops',
  // Saxon Course 3 (pre-algebra)
  'exponents_roots',
  'equations',
  'proportions',
  'geometry',
] as const;

export type ArithmeticTopic = (typeof ARITHMETIC_TOPICS)[number];

export interface GeneratedQuestion {
  kind: 'arithmetic';
  topic: ArithmeticTopic;
  difficulty: number;
  prompt: string;
  answer: string;
  answerType: 'number' | 'fraction';
  hints: string[];
  explanation: string;
}

const rnd = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

function gcd(a: number, b: number): number {
  a = Math.abs(a); b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

export function simplifyFraction(n: number, d: number): [number, number] {
  const g = gcd(n, d);
  return [n / g, d / g];
}

function fracStr(n: number, d: number): string {
  const [sn, sd] = simplifyFraction(n, d);
  return sd === 1 ? String(sn) : `${sn}/${sd}`;
}

function round2(x: number): number {
  return Math.round(x * 100) / 100;
}

export function generateArithmetic(topic: ArithmeticTopic | 'mixed', difficulty: number, allowedTopics?: readonly string[]): GeneratedQuestion {
  const d = Math.min(5, Math.max(1, Math.round(difficulty)));
  // 'mixed' draws only from the allowed (curriculum-enabled) topics when given.
  const pool = allowedTopics?.length
    ? ARITHMETIC_TOPICS.filter((t) => allowedTopics.includes(t))
    : ARITHMETIC_TOPICS;
  const t: ArithmeticTopic = topic === 'mixed' ? pick(pool.length ? pool : ARITHMETIC_TOPICS) : topic;
  switch (t) {
    case 'add_sub': return genAddSub(d);
    case 'mult': return genMult(d);
    case 'div': return genDiv(d);
    case 'fractions': return genFractions(d);
    case 'decimals': return genDecimals(d);
    case 'percent': return genPercent(d);
    case 'integers': return genIntegers(d);
    case 'order_ops': return genOrderOps(d);
    case 'exponents_roots': return genExponentsRoots(d);
    case 'equations': return genEquations(d);
    case 'proportions': return genProportions(d);
    case 'geometry': return genGeometry(d);
  }
}

function base(t: ArithmeticTopic, d: number, prompt: string, answer: string, hints: string[], explanation: string, answerType: 'number' | 'fraction' = 'number'): GeneratedQuestion {
  return { kind: 'arithmetic', topic: t, difficulty: d, prompt, answer, answerType, hints, explanation };
}

function genAddSub(d: number): GeneratedQuestion {
  if (d <= 3) {
    const digits = d === 1 ? [10, 99] : d === 2 ? [100, 999] : [1000, 9999];
    const a = rnd(digits[0], digits[1]);
    const b = rnd(digits[0], digits[1]);
    const add = Math.random() < 0.5;
    const [x, y] = add || a >= b ? [a, b] : [b, a];
    const ans = add ? x + y : x - y;
    const op = add ? '+' : '−';
    return base('add_sub', d, `${x} ${op} ${y} = ?`, String(ans),
      ['Line up the digits by place value.', add ? 'Add column by column, starting from the ones.' : 'Subtract column by column; borrow if you need to.'],
      `${x} ${op} ${y} = ${ans}`);
  }
  // decimals
  const a = round2(rnd(100, 9999) / 100);
  const b = round2(rnd(100, 9999) / 100);
  const add = Math.random() < 0.5;
  const [x, y] = add || a >= b ? [a, b] : [b, a];
  const ans = round2(add ? x + y : x - y);
  const op = add ? '+' : '−';
  return base('add_sub', d, `${x.toFixed(2)} ${op} ${y.toFixed(2)} = ?`, String(ans),
    ['Line up the decimal points first.', 'Then add or subtract just like whole numbers.'],
    `${x.toFixed(2)} ${op} ${y.toFixed(2)} = ${ans}`);
}

function genMult(d: number): GeneratedQuestion {
  if (d === 1) {
    const a = rnd(11, 99), b = rnd(3, 9);
    return base('mult', d, `${a} × ${b} = ?`, String(a * b),
      [`Break it up: ${Math.floor(a / 10) * 10} × ${b} plus ${a % 10} × ${b}.`],
      `${a} × ${b} = ${a * b}`);
  }
  if (d === 2) {
    const a = rnd(12, 99), b = rnd(12, 99);
    return base('mult', d, `${a} × ${b} = ?`, String(a * b),
      ['Multiply by the ones digit, then the tens digit, then add.'],
      `${a} × ${b} = ${a * b}`);
  }
  if (d === 3) {
    const a = rnd(112, 999), b = rnd(12, 99);
    return base('mult', d, `${a} × ${b} = ?`, String(a * b),
      ['Use long multiplication: one row per digit of the second number.'],
      `${a} × ${b} = ${a * b}`);
  }
  if (d === 4) {
    const a = round2(rnd(11, 99) / 10), b = rnd(3, 12);
    const ans = round2(a * b);
    return base('mult', d, `${a} × ${b} = ?`, String(ans),
      ['Ignore the decimal first, multiply, then put the decimal back.'],
      `${a} × ${b} = ${ans}`);
  }
  const a = round2(rnd(11, 99) / 10), b = round2(rnd(11, 99) / 10);
  const ans = round2(a * b);
  return base('mult', d, `${a} × ${b} = ?`, String(ans),
    ['Multiply as whole numbers, then count decimal places in both factors.'],
    `${a} × ${b} = ${ans}`);
}

function genDiv(d: number): GeneratedQuestion {
  if (d === 1) {
    const b = rnd(3, 9), q = rnd(3, 12);
    return base('div', d, `${b * q} ÷ ${b} = ?`, String(q),
      [`Think: ${b} times what equals ${b * q}?`],
      `${b * q} ÷ ${b} = ${q}`);
  }
  if (d === 2) {
    const b = rnd(3, 9), q = rnd(21, 150);
    return base('div', d, `${b * q} ÷ ${b} = ?`, String(q),
      ['Use long division, one digit at a time.'],
      `${b * q} ÷ ${b} = ${q}`);
  }
  if (d === 3) {
    const b = rnd(11, 25), q = rnd(12, 60);
    return base('div', d, `${b * q} ÷ ${b} = ?`, String(q),
      ['Estimate first: about how many times does the divisor fit?'],
      `${b * q} ÷ ${b} = ${q}`);
  }
  if (d === 4) {
    const b = pick([2, 4, 5, 8]);
    const q = rnd(3, 20) + pick([0.5, 0.25, 0.75]);
    const a = round2(b * q);
    return base('div', d, `${a} ÷ ${b} = ?`, String(q),
      ['The answer is not a whole number — keep dividing past the decimal point.'],
      `${a} ÷ ${b} = ${q}`);
  }
  const b = rnd(12, 40), q = rnd(25, 250);
  return base('div', d, `${b * q} ÷ ${b} = ?`, String(q),
    ['Long division with a 2-digit divisor: estimate, multiply, subtract, bring down.'],
    `${b * q} ÷ ${b} = ${q}`);
}

function genFractions(d: number): GeneratedQuestion {
  if (d === 1) {
    const g = rnd(2, 6);
    const [n0, dn0] = pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5], [3, 5]]);
    const n = n0 * g, dd = dn0 * g;
    return base('fractions', d, `Simplify the fraction ${n}/${dd}.`, fracStr(n, dd),
      [`What number divides evenly into both ${n} and ${dd}?`],
      `Divide top and bottom by ${g}: ${n}/${dd} = ${fracStr(n, dd)}`, 'fraction');
  }
  if (d === 2) {
    const dd = pick([5, 6, 8, 10, 12]);
    const a = rnd(1, dd - 2), b = rnd(1, dd - a - 1);
    return base('fractions', d, `${a}/${dd} + ${b}/${dd} = ? (simplify your answer)`, fracStr(a + b, dd),
      ['Same denominator — just add the tops.', `${a} + ${b} = ${a + b}, keep the denominator ${dd}. Then simplify.`],
      `${a}/${dd} + ${b}/${dd} = ${a + b}/${dd} = ${fracStr(a + b, dd)}`, 'fraction');
  }
  if (d === 3) {
    const d1 = pick([2, 3, 4]), d2 = pick([3, 4, 5, 6, 8].filter((x) => x !== d1));
    const n1 = rnd(1, d1 - 1), n2 = rnd(1, d2 - 1);
    const cd = d1 * d2 / gcd(d1, d2);
    const sum = n1 * (cd / d1) + n2 * (cd / d2);
    return base('fractions', d, `${n1}/${d1} + ${n2}/${d2} = ? (simplify your answer)`, fracStr(sum, cd),
      ['Find a common denominator first.', `A common denominator of ${d1} and ${d2} is ${cd}.`],
      `${n1}/${d1} = ${n1 * (cd / d1)}/${cd}, ${n2}/${d2} = ${n2 * (cd / d2)}/${cd}. Sum = ${fracStr(sum, cd)}`, 'fraction');
  }
  if (d === 4) {
    const n1 = rnd(1, 5), d1 = rnd(n1 + 1, 8), n2 = rnd(1, 5), d2 = rnd(n2 + 1, 8);
    return base('fractions', d, `${n1}/${d1} × ${n2}/${d2} = ? (simplify your answer)`, fracStr(n1 * n2, d1 * d2),
      ['Multiply the tops together and the bottoms together.', 'Then simplify the result.'],
      `${n1}/${d1} × ${n2}/${d2} = ${n1 * n2}/${d1 * d2} = ${fracStr(n1 * n2, d1 * d2)}`, 'fraction');
  }
  const n1 = rnd(1, 5), d1 = rnd(n1 + 1, 8), n2 = rnd(1, 5), d2 = rnd(n2 + 1, 8);
  return base('fractions', d, `${n1}/${d1} ÷ ${n2}/${d2} = ? (simplify your answer)`, fracStr(n1 * d2, d1 * n2),
    ['Dividing by a fraction = multiplying by its flip (reciprocal).', `Rewrite as ${n1}/${d1} × ${d2}/${n2}.`],
    `${n1}/${d1} ÷ ${n2}/${d2} = ${n1}/${d1} × ${d2}/${n2} = ${fracStr(n1 * d2, d1 * n2)}`, 'fraction');
}

function genDecimals(d: number): GeneratedQuestion {
  if (d <= 2) {
    const a = round2(rnd(10, 999) / 10), b = round2(rnd(10, 999) / 10);
    const add = d === 1;
    const [x, y] = add || a >= b ? [a, b] : [b, a];
    const ans = round2(add ? x + y : x - y);
    return base('decimals', d, `${x} ${add ? '+' : '−'} ${y} = ?`, String(ans),
      ['Line up the decimal points.'],
      `${x} ${add ? '+' : '−'} ${y} = ${ans}`);
  }
  if (d === 3) {
    const a = round2(rnd(100, 9999) / 100);
    const m = pick([10, 100, 1000]);
    return base('decimals', d, `${a} × ${m} = ?`, String(round2(a * m * 100) / 100 * 1 === a * m ? a * m : round2(a * m)),
      [`Multiplying by ${m} moves the decimal point ${String(m).length - 1} place(s) to the right.`],
      `${a} × ${m} = ${a * m}`);
  }
  if (d === 4) {
    const a = round2(rnd(11, 99) / 10), b = round2(rnd(11, 99) / 10);
    const ans = round2(a * b);
    return base('decimals', d, `${a} × ${b} = ?`, String(ans),
      ['Multiply as whole numbers, then count total decimal places.'],
      `${a} × ${b} = ${ans}`);
  }
  const b = pick([2, 4, 5, 8]);
  const q = round2(rnd(11, 99) / 4);
  const a = round2(b * q);
  return base('decimals', d, `${a} ÷ ${b} = ?`, String(q),
    ['Keep dividing past the decimal point until it comes out even.'],
    `${a} ÷ ${b} = ${q}`);
}

function genPercent(d: number): GeneratedQuestion {
  if (d === 1) {
    const p = pick([10, 25, 50]);
    const n = pick([20, 40, 60, 80, 100, 120, 200]);
    return base('percent', d, `What is ${p}% of ${n}?`, String((p / 100) * n),
      [p === 50 ? '50% is one half.' : p === 25 ? '25% is one quarter.' : '10% means divide by 10.'],
      `${p}% of ${n} = ${(p / 100) * n}`);
  }
  if (d === 2) {
    const p = pick([5, 15, 20, 30, 40, 60, 75]);
    const n = rnd(2, 20) * 10;
    return base('percent', d, `What is ${p}% of ${n}?`, String(round2((p / 100) * n)),
      ['Turn the percent into a decimal and multiply.', `${p}% = ${p / 100}`],
      `${p / 100} × ${n} = ${round2((p / 100) * n)}`);
  }
  if (d === 3) {
    const b = pick([20, 25, 40, 50, 80, 200]);
    const factor = pick([0.1, 0.2, 0.25, 0.5, 0.75]);
    const a = b * factor;
    return base('percent', d, `${a} is what percent of ${b}?`, String(factor * 100),
      [`Write it as a fraction: ${a}/${b}.`, 'Turn the fraction into a percent.'],
      `${a}/${b} = ${factor} = ${factor * 100}%`);
  }
  if (d === 4) {
    const price = rnd(2, 20) * 10;
    const p = pick([10, 20, 25, 30, 40, 50]);
    const ans = round2(price * (1 - p / 100));
    return base('percent', d, `A jersey costs $${price}. It is ${p}% off. What is the sale price in dollars?`, String(ans),
      ['First find the discount amount in dollars.', `${p}% of ${price} = ${round2(price * p / 100)}. Subtract it from the price.`],
      `Discount = $${round2(price * p / 100)}. Sale price = $${ans}`);
  }
  const p = pick([10, 20, 25, 50]);
  const whole = rnd(2, 20) * 10;
  const part = whole * p / 100;
  return base('percent', d, `${part} is ${p}% of what number?`, String(whole),
    [`If ${p}% of the number is ${part}, what is 100%?`, `Divide ${part} by ${p / 100}.`],
    `${part} ÷ ${p / 100} = ${whole}`);
}

function genIntegers(d: number): GeneratedQuestion {
  if (d === 1) {
    const a = -rnd(1, 12), b = rnd(1, 12);
    return base('integers', d, `${a} + ${b} = ?`, String(a + b),
      ['Start at the negative number on a number line and move right.'],
      `${a} + ${b} = ${a + b}`);
  }
  if (d === 2) {
    const a = rnd(1, 12), b = rnd(a + 1, 20);
    return base('integers', d, `${a} − ${b} = ?`, String(a - b),
      ['You are subtracting more than you have — the answer goes below zero.'],
      `${a} − ${b} = ${a - b}`);
  }
  if (d === 3) {
    const a = -rnd(2, 15), b = -rnd(2, 15);
    return base('integers', d, `${a} + (${b}) = ?`, String(a + b),
      ['Adding two negatives: add the sizes, keep the negative sign.'],
      `${a} + (${b}) = ${a + b}`);
  }
  if (d === 4) {
    const a = pick([-1, 1]) * rnd(2, 12), b = pick([-1, 1]) * rnd(2, 12);
    return base('integers', d, `${a} × (${b}) = ?`, String(a * b),
      ['Same signs → positive. Different signs → negative.'],
      `${a} × (${b}) = ${a * b}`);
  }
  const a = pick([-1, 1]) * rnd(2, 10), b = pick([-1, 1]) * rnd(2, 10), c = pick([-1, 1]) * rnd(2, 10);
  return base('integers', d, `${a} + (${b}) − (${c}) = ?`, String(a + b - c),
    ['Work left to right. Subtracting a negative is the same as adding.'],
    `${a} + (${b}) − (${c}) = ${a + b - c}`);
}

function genOrderOps(d: number): GeneratedQuestion {
  if (d <= 2) {
    const a = rnd(2, 12), b = rnd(2, 9), c = rnd(2, 9);
    return base('order_ops', d, `${a} + ${b} × ${c} = ?`, String(a + b * c),
      ['Multiplication comes before addition!', `First find ${b} × ${c}.`],
      `${b} × ${c} = ${b * c}, then ${a} + ${b * c} = ${a + b * c}`);
  }
  if (d === 3) {
    const a = rnd(2, 9), b = rnd(2, 9), c = rnd(2, 6);
    return base('order_ops', d, `(${a} + ${b}) × ${c} = ?`, String((a + b) * c),
      ['Parentheses first!'],
      `(${a} + ${b}) = ${a + b}, then × ${c} = ${(a + b) * c}`);
  }
  if (d === 4) {
    const a = rnd(2, 6), b = rnd(2, 9), c = rnd(1, 20);
    return base('order_ops', d, `${a}² + ${b} × ${c} = ?`, String(a * a + b * c),
      ['Exponents first, then multiplication, then addition.', `${a}² means ${a} × ${a}.`],
      `${a}² = ${a * a}, ${b} × ${c} = ${b * c}, total ${a * a + b * c}`);
  }
  const a = rnd(2, 6), b = rnd(2, 6), c = rnd(2, 9), e = rnd(2, 9);
  return base('order_ops', d, `${a} × (${b} + ${c}) − ${e}² = ?`, String(a * (b + c) - e * e),
    ['Parentheses → exponents → multiplication → subtraction.'],
    `${a} × ${b + c} = ${a * (b + c)}, ${e}² = ${e * e}, answer ${a * (b + c) - e * e}`);
}

// ---- Saxon Course 3 topics --------------------------------------------------

const SUP = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];
const sup = (n: number) => String(n).split('').map((c) => SUP[Number(c)]).join('');

function genExponentsRoots(d: number): GeneratedQuestion {
  if (d === 1) {
    const a = rnd(2, 12);
    return base('exponents_roots', d, `${a}² = ?`, String(a * a),
      [`${a}² means ${a} × ${a}.`],
      `${a}² = ${a} × ${a} = ${a * a}`);
  }
  if (d === 2) {
    const a = pick([2, 3, 4, 5, 10]);
    const e = a === 2 ? rnd(3, 6) : a === 10 ? rnd(2, 5) : 3;
    return base('exponents_roots', d, `${a}${sup(e)} = ?`, String(a ** e),
      [`${a}${sup(e)} means multiplying ${a} by itself ${e} times.`],
      `${a}${sup(e)} = ${Array(e).fill(a).join(' × ')} = ${a ** e}`);
  }
  if (d === 3) {
    const r = rnd(2, 15);
    return base('exponents_roots', d, `√${r * r} = ?`, String(r),
      [`√ asks: what number times itself gives ${r * r}?`],
      `${r} × ${r} = ${r * r}, so √${r * r} = ${r}`);
  }
  if (d === 4) {
    const a = rnd(2, 9), r = rnd(2, 10);
    return base('exponents_roots', d, `${a}² − √${r * r} = ?`, String(a * a - r),
      ['Work out the square and the square root separately first.', `${a}² = ${a * a} and √${r * r} = ${r}.`],
      `${a * a} − ${r} = ${a * a - r}`);
  }
  const a = pick([2, 3]), e = a === 2 ? rnd(3, 5) : rnd(2, 3), b = rnd(2, 5);
  return base('exponents_roots', d, `${a}${sup(e)} × ${b}² = ?`, String(a ** e * b * b),
    ['Evaluate each power first, then multiply.', `${a}${sup(e)} = ${a ** e} and ${b}² = ${b * b}.`],
    `${a ** e} × ${b * b} = ${a ** e * b * b}`);
}

function genEquations(d: number): GeneratedQuestion {
  if (d === 1) {
    const x = rnd(3, 30), a = rnd(2, 40);
    return base('equations', d, `Solve for x:  x + ${a} = ${x + a}`, String(x),
      ['What do you add to get the total? Try subtracting.', `x = ${x + a} − ${a}`],
      `x = ${x + a} − ${a} = ${x}`);
  }
  if (d === 2) {
    const x = rnd(3, 12), a = rnd(3, 9);
    return base('equations', d, `Solve for x:  ${a}x = ${a * x}`, String(x),
      [`${a}x means ${a} × x. Undo the multiplication.`, `x = ${a * x} ÷ ${a}`],
      `x = ${a * x} ÷ ${a} = ${x}`);
  }
  if (d === 3) {
    const x = rnd(4, 60), a = rnd(2, 6);
    return Math.random() < 0.5
      ? base('equations', d, `Solve for x:  x − ${a * 3} = ${x - a * 3}`, String(x),
          ['Undo the subtraction by adding.'],
          `x = ${x - a * 3} + ${a * 3} = ${x}`)
      : base('equations', d, `Solve for x:  x ÷ ${a} = ${Math.floor(x / a) || 5}`, String((Math.floor(x / a) || 5) * a),
          ['Undo the division by multiplying.'],
          `x = ${Math.floor(x / a) || 5} × ${a} = ${(Math.floor(x / a) || 5) * a}`);
  }
  if (d === 4) {
    const x = rnd(2, 12), a = rnd(2, 9), b = rnd(1, 20);
    return base('equations', d, `Solve for x:  ${a}x + ${b} = ${a * x + b}`, String(x),
      ['Two steps: first undo the + by subtracting from both sides.', `${a}x = ${a * x}. Now undo the multiplication.`],
      `${a}x = ${a * x + b} − ${b} = ${a * x}, so x = ${a * x} ÷ ${a} = ${x}`);
  }
  const x = rnd(2, 12), a = rnd(2, 9), b = rnd(1, 15);
  return base('equations', d, `Solve for x:  ${a}x − ${b} = ${a * x - b}`, String(x),
    ['Two steps: first undo the − by adding to both sides.', `${a}x = ${a * x}. Now divide.`],
    `${a}x = ${a * x - b} + ${b} = ${a * x}, so x = ${a * x} ÷ ${a} = ${x}`);
}

function genProportions(d: number): GeneratedQuestion {
  if (d <= 2) {
    const n = rnd(1, 5), dn = rnd(n + 1, 8), m = d === 1 ? pick([2, 3]) : pick([3, 4, 5]);
    return base('proportions', d, `Find x:  ${n}/${dn} = x/${dn * m}`, String(n * m),
      [`How did ${dn} become ${dn * m}? The top changes the same way.`, `The denominator was multiplied by ${m}.`],
      `${dn} × ${m} = ${dn * m}, so x = ${n} × ${m} = ${n * m}`);
  }
  if (d === 3) {
    const n = rnd(2, 6), dn = rnd(n + 1, 9), m = rnd(2, 6);
    return base('proportions', d, `Find x:  x/${dn * m} = ${n}/${dn}`, String(n * m),
      ['Cross-multiply: top × opposite bottom.', `x × ${dn} = ${n} × ${dn * m}`],
      `x = ${n} × ${dn * m} ÷ ${dn} = ${n * m}`);
  }
  if (d === 4) {
    const x = rnd(2, 12), a = rnd(2, 6), m = rnd(2, 5);
    return base('proportions', d, `Find x:  ${a}/x = ${a * m}/${x * m}`, String(x),
      ['Cross-multiply, or ask: how did the top go from one side to the other?'],
      `${a * m} ÷ ${a} = ${m}, so x = ${x * m} ÷ ${m} = ${x}`);
  }
  const x = rnd(2, 9), b = pick([4, 5, 8, 10]);
  const c = pick([4, 5]) / 2; // 2 or 2.5
  return base('proportions', d, `Find x:  x/${b} = ${(x * c)}/${b * c}`, String(x),
    ['Cross-multiply and divide carefully — decimals allowed!'],
    `x = ${x * c} × ${b} ÷ ${b * c} = ${x}`);
}

function genGeometry(d: number): GeneratedQuestion {
  if (d === 1) {
    const l = rnd(5, 20), w = rnd(3, l);
    return base('geometry', d, `A rectangle is ${l} cm long and ${w} cm wide. What is its perimeter in cm?`, String(2 * (l + w)),
      ['Perimeter = the distance all the way around.', `Add all four sides: ${l} + ${w} + ${l} + ${w}.`],
      `Perimeter = 2 × (${l} + ${w}) = ${2 * (l + w)} cm`);
  }
  if (d === 2) {
    const l = rnd(5, 25), w = rnd(3, 15);
    return base('geometry', d, `A rectangle is ${l} m long and ${w} m wide. What is its area in square meters?`, String(l * w),
      ['Area of a rectangle = length × width.'],
      `${l} × ${w} = ${l * w} m²`);
  }
  if (d === 3) {
    const b = rnd(3, 12) * 2, h = rnd(3, 15);
    return base('geometry', d, `A triangle has a base of ${b} cm and a height of ${h} cm. What is its area in cm²?`, String((b * h) / 2),
      ['Area of a triangle = base × height ÷ 2.'],
      `${b} × ${h} ÷ 2 = ${(b * h) / 2} cm²`);
  }
  if (d === 4) {
    const r = rnd(2, 10);
    const ans = Math.round(2 * 3.14 * r * 100) / 100;
    return base('geometry', d, `A circle has a radius of ${r} cm. Using π ≈ 3.14, what is its circumference in cm?`, String(ans),
      ['Circumference = 2 × π × radius.'],
      `2 × 3.14 × ${r} = ${ans} cm`);
  }
  const r = rnd(2, 10);
  const ans = Math.round(3.14 * r * r * 100) / 100;
  return base('geometry', d, `A circle has a radius of ${r} m. Using π ≈ 3.14, what is its area in m²?`, String(ans),
    ['Area = π × radius². Square the radius first.', `${r}² = ${r * r}, then multiply by 3.14.`],
    `3.14 × ${r * r} = ${ans} m²`);
}
