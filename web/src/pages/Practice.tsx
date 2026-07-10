import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiGet, apiPost, type AnswerResult, type AppState, type Question } from '../api';

const ARITH_TOPICS = [
  ['mixed', '🎲 Mix'],
  ['add_sub', '➕ Add/Sub'],
  ['mult', '✖️ Multiply'],
  ['div', '➗ Divide'],
  ['fractions', '🍕 Fractions'],
  ['decimals', '🔟 Decimals'],
  ['percent', '💯 Percent'],
  ['integers', '❄️ Negatives'],
  ['order_ops', '🧮 Order of Ops'],
  ['exponents_roots', '🧨 Powers & Roots'],
  ['equations', '🧩 Solve for x'],
  ['proportions', '⚖️ Proportions'],
  ['geometry', '📐 Geometry'],
] as const;

interface ChatMsg { role: 'user' | 'assistant'; content: string }

export default function Practice({ onPointsChange, state }: { onPointsChange: () => void; state: AppState | null }) {
  const { mode } = useParams<{ mode: string }>();
  const isWord = mode === 'word';
  const [topic, setTopic] = useState('mixed');
  const [difficulty, setDifficulty] = useState('auto');
  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<{ answer: string; explanation: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Only offer topics inside the current study plan (parent-controlled).
  const enabledTopics = state?.enabledTopics;
  const visibleTopics = ARITH_TOPICS.filter(([key]) => key === 'mixed' || !enabledTopics || enabledTopics.includes(key));

  useEffect(() => {
    if (topic !== 'mixed' && enabledTopics && !enabledTopics.includes(topic)) setTopic('mixed');
  }, [topic, enabledTopics]);

  const load = useCallback(() => {
    setLoading(true);
    setResult(null); setHint(null); setRevealed(null); setAnswer(''); setChat([]); setChatOpen(false); setError('');
    const params = new URLSearchParams({ mode: isWord ? 'word' : 'arithmetic', topic, difficulty });
    apiGet<Question>(`/question?${params}`)
      .then((q) => { setQuestion(q); setTimeout(() => inputRef.current?.focus(), 50); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [isWord, topic, difficulty]);

  useEffect(() => { load(); }, [load]);

  const solved = result?.correct === true;

  async function submit() {
    if (!question || !answer.trim() || solved || revealed) return;
    try {
      const r = await apiPost<AnswerResult>('/answer', { token: question.token, answer });
      setResult(r);
      if (r.correct) {
        onPointsChange();
      } else {
        setHint(r.hint ?? null);
        setAnswer('');
        inputRef.current?.focus();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }
  }

  async function reveal() {
    if (!question) return;
    try {
      const r = await apiPost<{ answer: string; explanation: string }>('/reveal', { token: question.token });
      setRevealed(r);
    } catch { /* expired */ }
  }

  const buddy = state?.buddyName || 'Kai';

  return (
    <div>
      <div className="row">
        <Link to="/" className="btn ghost small">← Home</Link>
        <h1 style={{ fontSize: 24 }}>{isWord ? '📖 Story Solver' : '⚡ Number Ninja'}</h1>
      </div>

      {!isWord && (
        <div className="card">
          <div className="pill-options">
            {visibleTopics.map(([key, label]) => (
              <button key={key} className={topic === key ? 'selected' : ''} onClick={() => setTopic(key)}>{label}</button>
            ))}
          </div>
          <div className="pill-options mt">
            {['auto', '1', '2', '3', '4', '5'].map((d) => (
              <button key={d} className={difficulty === d ? 'selected' : ''} onClick={() => setDifficulty(d)}>
                {d === 'auto' ? '🤖 Auto' : `Lv ${d}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <div className="feedback bad">{error} <button className="btn small ghost" onClick={load}>Try again</button></div>}

      {question && !loading && (
        <div className="card">
          <div>
            <span className="badge">{question.topic.replace('_', ' ')}</span>
            <span className="badge">Level {question.difficulty}</span>
            {question.theme !== 'drill' && question.theme !== 'general' && <span className="badge">✨ {question.theme}</span>}
          </div>
          <p className="question-prompt">{question.prompt}</p>

          {!solved && !revealed && (
            <div className="answer-row">
              <input
                ref={inputRef}
                className="answer-input"
                value={answer}
                inputMode={question.answerType === 'text' ? 'text' : 'decimal'}
                placeholder="Your answer..."
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
              />
              <button className="btn" onClick={submit} disabled={!answer.trim()}>Check ✓</button>
            </div>
          )}

          {result && !result.correct && !revealed && (
            <div className="feedback bad">Not quite — try again! (attempt {result.attemptNo})</div>
          )}
          {hint && !solved && !revealed && <div className="feedback hint">💡 {hint}</div>}

          {solved && (
            <>
              <div className="result-burst">🎉</div>
              <div className="feedback good">
                Correct! +{result?.points} points ⭐
                {result?.explanation && <div style={{ fontWeight: 500, marginTop: 8 }}>{result.explanation}</div>}
              </div>
              {result?.questAwards?.map((a) => (
                <div key={a.key} className="feedback good" style={{ marginTop: 8 }}>
                  {a.emoji} Quest complete: {a.label} +{a.points}⭐
                </div>
              ))}
            </>
          )}

          {revealed && (
            <div className="feedback hint">
              The answer is <b>{revealed.answer}</b>. {revealed.explanation}
            </div>
          )}

          <div className="row mt">
            {(solved || revealed) ? (
              <button className="btn" onClick={load}>Next question →</button>
            ) : (
              <>
                <button className="btn secondary" onClick={() => setChatOpen((o) => !o)}>
                  🤖 Ask {buddy}
                </button>
                {result && !result.correct && (result.attemptNo ?? 0) >= 2 && (
                  <button className="btn ghost" onClick={reveal}>Show me how 🙈</button>
                )}
                <div className="spacer" />
                <button className="btn ghost small" onClick={load}>Skip ↷</button>
              </>
            )}
          </div>
        </div>
      )}

      {loading && <div className="card center">Loading... 🏐</div>}

      {chatOpen && question && !solved && !revealed && (
        <TutorChat token={question.token} buddy={buddy} chat={chat} setChat={setChat} />
      )}
    </div>
  );
}

function TutorChat({ token, buddy, chat, setChat }: {
  token: string; buddy: string; chat: ChatMsg[]; setChat: (m: ChatMsg[]) => void;
}) {
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chat, thinking]);

  // Kick off the conversation automatically when opened
  useEffect(() => {
    if (chat.length === 0) send('Can you help me get started?', true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function send(text?: string, silent = false) {
    const content = (text ?? input).trim();
    if (!content || thinking) return;
    const next: ChatMsg[] = silent ? [...chat] : [...chat, { role: 'user', content }];
    setChat(next);
    setInput('');
    setThinking(true);
    try {
      const history = silent ? [...next, { role: 'user' as const, content }] : next;
      const r = await apiPost<{ reply: string }>('/ai/chat', { token, messages: history });
      setChat([...next, { role: 'assistant', content: r.reply }]);
    } catch (e) {
      setChat([...next, { role: 'assistant', content: 'Oops, I had trouble connecting. Try the hint button!' }]);
    } finally {
      setThinking(false);
    }
  }

  return (
    <div className="card chat-panel">
      <h2>🤖 {buddy}</h2>
      <div className="chat-messages">
        {chat.map((m, i) => (
          <div key={i} className={`chat-bubble ${m.role === 'assistant' ? 'buddy' : 'me'}`}>{m.content}</div>
        ))}
        {thinking && <div className="chat-bubble buddy">…thinking 🤔</div>}
        <div ref={bottomRef} />
      </div>
      <div className="chat-input-row">
        <input
          value={input}
          placeholder={`Ask ${buddy} anything about this problem...`}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <button className="btn small" onClick={() => send()} disabled={thinking || !input.trim()}>Send</button>
      </div>
    </div>
  );
}
