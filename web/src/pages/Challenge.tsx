import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet, apiPost } from '../api';

interface Level {
  id: number; ord: number; name: string; emoji: string; kind: string;
  difficulty: number; questionCount: number; passCorrect: number; bonus: number; bestStars: number;
}
interface RunQuestion { index: number; prompt: string; answerType: string; kind: string }
interface Run {
  runId: number;
  level: { id: number; name: string; emoji: string; bonus: number; passCorrect: number };
  questions: RunQuestion[];
}
interface FinishResult {
  correct: number; total: number; stars: number; passed: boolean; points: number; balance: number;
  questAwards?: { key: string; label: string; emoji: string; points: number }[];
}

export default function Challenge({ onPointsChange }: { onPointsChange: () => void }) {
  const [levels, setLevels] = useState<Level[]>([]);
  const [run, setRun] = useState<Run | null>(null);
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [lastFeedback, setLastFeedback] = useState<{ correct: boolean; explanation?: string } | null>(null);
  const [finish, setFinish] = useState<FinishResult | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadLevels = () => apiGet<Level[]>('/challenges').then(setLevels).catch(() => {});
  useEffect(() => { loadLevels(); }, []);

  async function start(level: Level) {
    const r = await apiPost<Run>(`/challenges/${level.id}/start`);
    setRun(r); setIdx(0); setAnswer(''); setFinish(null); setLastFeedback(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  async function submit() {
    if (!run || busy || !answer.trim()) return;
    setBusy(true);
    try {
      const q = run.questions[idx];
      const r = await apiPost<{ correct: boolean; explanation?: string }>(
        `/challenges/runs/${run.runId}/answer`, { index: q.index, answer });
      setLastFeedback(r);
      setAnswer('');
      // brief pause so she sees the feedback, then advance
      setTimeout(async () => {
        setLastFeedback(null);
        if (idx + 1 < run.questions.length) {
          setIdx(idx + 1);
          inputRef.current?.focus();
        } else {
          const f = await apiPost<FinishResult>(`/challenges/runs/${run.runId}/finish`);
          setFinish(f);
          onPointsChange();
          loadLevels();
        }
        setBusy(false);
      }, r.correct ? 700 : 1800);
    } catch {
      setBusy(false);
    }
  }

  if (finish && run) {
    return (
      <div>
        <div className="card center">
          <div className="result-burst">{finish.passed ? '🏆' : '💪'}</div>
          <h1>{finish.passed ? 'Level cleared!' : 'Good effort!'}</h1>
          <p className="stars mt" style={{ fontSize: 34 }}>
            {'★'.repeat(finish.stars)}{'☆'.repeat(3 - finish.stars)}
          </p>
          <p className="sub mt">{finish.correct} / {finish.total} correct · +{finish.points} points ⭐</p>
          {finish.questAwards?.map((a) => (
            <div key={a.key} className="feedback good" style={{ marginBottom: 8 }}>
              {a.emoji} Quest complete: {a.label} +{a.points}⭐
            </div>
          ))}
          <div className="row" style={{ justifyContent: 'center' }}>
            <button className="btn" onClick={() => { setRun(null); setFinish(null); }}>Back to levels</button>
          </div>
        </div>
      </div>
    );
  }

  if (run) {
    const q = run.questions[idx];
    return (
      <div>
        <h1>{run.level.emoji} {run.level.name}</h1>
        <div className="progress-bar"><div style={{ width: `${(idx / run.questions.length) * 100}%` }} /></div>
        <p className="sub">Question {idx + 1} of {run.questions.length}</p>
        <div className="card">
          <p className="question-prompt">{q.prompt}</p>
          <div className="answer-row">
            <input
              ref={inputRef}
              className="answer-input"
              value={answer}
              inputMode={q.answerType === 'text' ? 'text' : 'decimal'}
              placeholder="Your answer..."
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              disabled={busy}
            />
            <button className="btn" onClick={submit} disabled={busy || !answer.trim()}>Go!</button>
          </div>
          {lastFeedback && (
            <div className={`feedback ${lastFeedback.correct ? 'good' : 'bad'}`}>
              {lastFeedback.correct ? 'Nice! ✅' : `Not this time ❌ ${lastFeedback.explanation ?? ''}`}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="row">
        <Link to="/" className="btn ghost small">← Home</Link>
        <h1 style={{ fontSize: 24 }}>🏆 Challenge Court</h1>
      </div>
      <p className="sub">Clear a level to earn bonus points. 3 stars = perfect game!</p>
      <div className="level-grid">
        {levels.map((l) => (
          <div key={l.id} className="level-card" onClick={() => start(l)}>
            <div className="emoji">{l.emoji}</div>
            <div className="name">{l.ord}. {l.name}</div>
            <div className="meta">{l.questionCount} questions · Lv {l.difficulty} · +{l.bonus} bonus</div>
            <div className="stars">{'★'.repeat(l.bestStars)}{'☆'.repeat(3 - l.bestStars)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
