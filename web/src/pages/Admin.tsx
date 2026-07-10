import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminFetch, getPin, setPin } from '../api';
import { I18nContext, getAdminLang, saveAdminLang, translate, pickLabel, useT, type AdminLang } from '../i18n';

type Tab = 'overview' | 'questions' | 'rewards' | 'redemptions' | 'chats' | 'settings';

function LangSwitch() {
  const { lang, setLang } = useT();
  return (
    <div className="pill-options" style={{ marginLeft: 'auto' }}>
      {(['zh', 'en'] as AdminLang[]).map((l) => (
        <button key={l} className={lang === l ? 'selected' : ''} onClick={() => setLang(l)}>
          {l === 'zh' ? '中文' : 'EN'}
        </button>
      ))}
    </div>
  );
}

export default function Admin() {
  const [lang, setLangState] = useState<AdminLang>(getAdminLang());
  const i18n = useMemo(() => ({
    lang,
    t: (key: any, ...args: (string | number)[]) => translate(lang, key, ...args),
    setLang: (l: AdminLang) => { saveAdminLang(l); setLangState(l); },
  }), [lang]);

  return (
    <I18nContext.Provider value={i18n}>
      <AdminInner />
    </I18nContext.Provider>
  );
}

function AdminInner() {
  const { t } = useT();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [tab, setTab] = useState<Tab>('overview');

  useEffect(() => {
    if (!getPin()) { setAuthed(false); return; }
    adminFetch('/ping').then(() => setAuthed(true)).catch(() => setAuthed(false));
  }, []);

  async function tryLogin() {
    setPin(pinInput);
    try {
      await adminFetch('/ping');
      setAuthed(true);
    } catch (e) {
      setAuthed(false);
      alert(e instanceof Error && e.message !== 'Wrong PIN' ? e.message : t('wrongPin'));
    }
  }

  if (authed === null) return <div className="card center">{t('loading')}</div>;

  if (!authed) {
    return (
      <div className="card" style={{ maxWidth: 420, margin: '40px auto' }}>
        <div className="row">
          <h2>{t('adminTitle')}</h2>
          <LangSwitch />
        </div>
        <p className="muted">{t('pinPrompt')}</p>
        <div className="answer-row mt">
          <input className="answer-input" type="password" inputMode="numeric" value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && tryLogin()} />
          <button className="btn" onClick={tryLogin}>{t('enter')}</button>
        </div>
        <p className="mt"><Link to="/">{t('backHome')}</Link></p>
      </div>
    );
  }

  const tabs: [Tab, string][] = [
    ['overview', t('tabOverview')], ['questions', t('tabQuestions')], ['rewards', t('tabRewards')],
    ['redemptions', t('tabRedemptions')], ['chats', t('tabChats')], ['settings', t('tabSettings')],
  ];

  return (
    <div>
      <div className="row">
        <Link to="/" className="btn ghost small">{t('backHome')}</Link>
        <h1 style={{ fontSize: 24 }}>{t('adminTitle')}</h1>
        <LangSwitch />
      </div>
      <div className="admin-tabs mt">
        {tabs.map(([key, label]) => (
          <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>
      {tab === 'overview' && <Overview />}
      {tab === 'questions' && <Questions />}
      {tab === 'rewards' && <RewardsAdmin />}
      {tab === 'redemptions' && <Redemptions />}
      {tab === 'chats' && <ChatLogs />}
      {tab === 'settings' && <Settings />}
    </div>
  );
}

// ---------------- Overview ----------------

function Overview() {
  const { t } = useT();
  const [data, setData] = useState<any>(null);
  const [delta, setDelta] = useState('');
  const [reason, setReason] = useState('');

  const load = () => adminFetch<any>('/overview').then(setData).catch(() => {});
  useEffect(() => { load(); }, []);

  async function adjust() {
    const n = parseInt(delta, 10);
    if (!n) return;
    await adminFetch('/points', 'POST', { delta: n, reason: reason || t('parentAdjust') });
    setDelta(''); setReason('');
    load();
  }

  if (!data) return <div className="card center">{t('loading')}</div>;
  const acc = data.week.total ? Math.round((100 * data.week.correct) / data.week.total) : null;

  return (
    <>
      <div className="card">
        <h2>{t('weekTitle')}</h2>
        <p>{t('currentPoints')}：<b>⭐ {data.points}</b> ｜ {t('answered7d')}：<b>{data.week.total}</b>
          {acc !== null && <>｜ {t('accuracy')}：<b>{acc}%</b></>}
          ｜ {t('pendingRedemptions')}：<b>{data.pendingRedemptions}</b></p>
        <div className="row mt">
          <input className="answer-input" style={{ maxWidth: 130, fontSize: 16 }} placeholder={t('deltaPlaceholder')} value={delta} onChange={(e) => setDelta(e.target.value)} />
          <input className="answer-input" style={{ fontSize: 16 }} placeholder={t('reasonPlaceholder')} value={reason} onChange={(e) => setReason(e.target.value)} />
          <button className="btn small" onClick={adjust}>{t('adjustPoints')}</button>
        </div>
      </div>

      <div className="card">
        <h2>{t('topicAccuracy')}</h2>
        <table className="data">
          <thead><tr><th>{t('colTopic')}</th><th>{t('colKind')}</th><th>{t('colCount')}</th><th>{t('accuracy')}</th></tr></thead>
          <tbody>
            {data.perTopic.map((row: any, i: number) => (
              <tr key={i}>
                <td>{row.topic}</td>
                <td>{row.kind === 'word' ? t('kindWord') : t('kindArith')}</td>
                <td>{row.total}</td>
                <td style={{ color: row.correct / row.total < 0.7 ? 'var(--red)' : 'var(--green)' }}>
                  {Math.round((100 * row.correct) / row.total)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted mt">{t('redNote')}</p>
      </div>

      <div className="card">
        <h2>{t('recentAttempts')}</h2>
        <table className="data">
          <thead><tr><th>{t('colTime')}</th><th>{t('colQuestion')}</th><th>{t('colGiven')}</th><th>{t('colResult')}</th></tr></thead>
          <tbody>
            {data.recent.map((a: any, i: number) => (
              <tr key={i}>
                <td style={{ whiteSpace: 'nowrap' }}>{a.created_at.slice(5, 16)}</td>
                <td>{a.prompt.slice(0, 60)}{a.prompt.length > 60 ? '…' : ''}</td>
                <td>{a.given}</td>
                <td>{a.correct ? '✅' : '❌'}{a.attempt_no > 1 ? t('attemptNo', a.attempt_no) : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>{t('pointsLedger')}</h2>
        <table className="data">
          <tbody>
            {data.ledger.map((l: any, i: number) => (
              <tr key={i}>
                <td style={{ whiteSpace: 'nowrap' }}>{l.created_at.slice(5, 16)}</td>
                <td style={{ color: l.delta > 0 ? 'var(--green)' : 'var(--red)' }}>{l.delta > 0 ? '+' : ''}{l.delta}</td>
                <td>{l.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ---------------- Questions ----------------

const TOPIC_OPTIONS = ['multi_step', 'fractions', 'percent', 'ratio', 'rate', 'average', 'geometry', 'equations'];
const THEME_OPTIONS = ['volleyball', 'haikyuu', 'mha', 'general'];

const emptyQuestion = {
  id: 0, topic: 'multi_step', difficulty: 2, theme: 'general', prompt: '', answer: '',
  answer_type: 'number', hints: ['', '', ''], explanation: '', active: 1,
};

function GeneratePanel({ onDone }: { onDone: () => void }) {
  const { t } = useT();
  const [topic, setTopic] = useState('auto');
  const [difficulty, setDifficulty] = useState('auto');
  const [theme, setTheme] = useState('mixed');
  const [count, setCount] = useState(1);
  const [job, setJob] = useState<any | null>(null);
  const [error, setError] = useState('');

  // Generation runs as a server-side job — polling survives tab switches and
  // browser fetch timeouts. On mount, pick up any job that's already running.
  useEffect(() => {
    let timer: number | undefined;
    let cancelled = false;
    async function poll() {
      try {
        const j = await adminFetch<any>('/generate/latest');
        if (cancelled) return;
        setJob(j);
        if (j && j.status === 'running') {
          timer = window.setTimeout(poll, 4000);
        } else if (j) {
          onDone(); // refresh the question list with the new pending rows
        }
      } catch { /* transient poll failure — next action retries */ }
    }
    poll();
    return () => { cancelled = true; if (timer) window.clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const running = job?.status === 'running';

  async function run() {
    setError('');
    try {
      await adminFetch('/generate', 'POST', { topic, difficulty, theme, count });
      const j = await adminFetch<any>('/generate/latest');
      setJob(j);
      const tick = async () => {
        const cur = await adminFetch<any>('/generate/latest').catch(() => null);
        if (cur) setJob(cur);
        if (cur && cur.status === 'running') window.setTimeout(tick, 4000);
        else onDone();
      };
      window.setTimeout(tick, 4000);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('genFailed'));
    }
  }

  return (
    <div className="card">
      <h2>{t('genTitle')}</h2>
      <p className="muted">{t('genDesc')}</p>
      <div className="row mt">
        <select value={topic} onChange={(e) => setTopic(e.target.value)}>
          <option value="auto">{t('topicAuto')}</option>
          {TOPIC_OPTIONS.map((tp) => <option key={tp} value={tp}>{tp}</option>)}
        </select>
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option value="auto">{t('diffAuto')}</option>
          {['1', '2', '3', '4', '5'].map((d) => <option key={d} value={d}>{t('diffN', d)}</option>)}
        </select>
        <select value={theme} onChange={(e) => setTheme(e.target.value)}>
          <option value="mixed">{t('themeRandom')}</option>
          {THEME_OPTIONS.map((th) => <option key={th} value={th}>{th}</option>)}
        </select>
        <select value={count} onChange={(e) => setCount(parseInt(e.target.value, 10))}>
          {[1, 2, 3].map((n) => <option key={n} value={n}>{t('countN', n)}</option>)}
        </select>
        <button className="btn small" onClick={run} disabled={running}>{running ? t('generating') : t('generate')}</button>
      </div>
      {running && (
        <p className="muted mt">{t('genProgress', job.items.length, job.total)}</p>
      )}
      {error && <div className="feedback bad">{error}</div>}
      {job && job.items.length > 0 && (
        <div className="mt">
          {job.items.map((it: any, i: number) => (
            <div key={i} className={`feedback ${it.ok ? (it.verified ? 'good' : 'hint') : 'bad'}`} style={{ marginTop: 8, fontWeight: 500 }}>
              {it.ok ? (
                <>
                  {it.verified
                    ? t('verifiedPass')
                    : it.solverFailed
                      ? t('solverFailedMsg')
                      : t('mismatch', it.answer, it.solverAnswer)}
                  <div style={{ marginTop: 6 }}>{it.prompt}</div>
                  <div className="muted">{t('answerLabel')}：{it.answer}｜{it.topic}｜{t('diffN', it.difficulty)}</div>
                </>
              ) : (
                <>❌ {t('genFailed')}：{it.error}</>
              )}
            </div>
          ))}
          {job.status === 'done' && <p className="muted mt">{t('genDone')}</p>}
        </div>
      )}
    </div>
  );
}

function Questions() {
  const { t } = useT();
  const [list, setList] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);

  const load = () => adminFetch<any[]>('/questions').then(setList).catch(() => {});
  useEffect(() => { load(); }, []);

  async function save() {
    const q = { ...editing, hints: editing.hints.filter((h: string) => h.trim()) };
    try {
      if (q.id) await adminFetch(`/questions/${q.id}`, 'PUT', q);
      else await adminFetch('/questions', 'POST', q);
      setEditing(null);
      load();
    } catch (e) {
      alert(`${t('saveFailed')}: ${e instanceof Error ? e.message : e}`);
    }
  }

  async function remove(id: number) {
    if (!confirm(t('confirmDelete'))) return;
    try {
      await adminFetch(`/questions/${id}`, 'DELETE');
    } catch (e) {
      alert(`${t('deleteFailed')}: ${e instanceof Error ? e.message : e}`);
    }
    load();
  }

  if (editing) {
    const hints = [...editing.hints];
    while (hints.length < 3) hints.push('');
    return (
      <div className="card">
        <h2>{editing.id ? t('editQuestion') : t('newQuestion')}</h2>
        <div className="form-col mt">
          <label>{t('fieldPrompt')}
            <textarea value={editing.prompt} onChange={(e) => setEditing({ ...editing, prompt: e.target.value })} />
          </label>
          <div className="form-grid">
            <label>{t('answerLabel')}
              <input value={editing.answer} onChange={(e) => setEditing({ ...editing, answer: e.target.value })} />
            </label>
            <label>{t('fieldAnswerType')}
              <select value={editing.answer_type} onChange={(e) => setEditing({ ...editing, answer_type: e.target.value })}>
                <option value="number">{t('typeNumber')}</option>
                <option value="fraction">{t('typeFraction')}</option>
                <option value="text">{t('typeText')}</option>
              </select>
            </label>
            <label>{t('colTopic')}
              <select value={editing.topic} onChange={(e) => setEditing({ ...editing, topic: e.target.value })}>
                {TOPIC_OPTIONS.map((tp) => <option key={tp} value={tp}>{tp}</option>)}
              </select>
            </label>
            <label>{t('fieldDifficulty')}
              <input type="number" min={1} max={5} value={editing.difficulty}
                onChange={(e) => setEditing({ ...editing, difficulty: parseInt(e.target.value, 10) || 2 })} />
            </label>
            <label>{t('fieldTheme')}
              <select value={editing.theme} onChange={(e) => setEditing({ ...editing, theme: e.target.value })}>
                {THEME_OPTIONS.map((th) => <option key={th} value={th}>{th}</option>)}
              </select>
            </label>
            <label>{t('fieldActive')}
              <select value={editing.active} onChange={(e) => setEditing({ ...editing, active: parseInt(e.target.value, 10) })}>
                <option value={1}>{t('statusActive')}</option>
                <option value={0}>{t('statusInactive')}</option>
              </select>
            </label>
          </div>
          {hints.map((h: string, i: number) => (
            <label key={i}>{t('hintN', i + 1)}
              <input value={h} onChange={(e) => {
                const next = [...hints]; next[i] = e.target.value;
                setEditing({ ...editing, hints: next });
              }} />
            </label>
          ))}
          <label>{t('fieldExplanation')}
            <textarea value={editing.explanation} onChange={(e) => setEditing({ ...editing, explanation: e.target.value })} />
          </label>
          <div className="row">
            <button className="btn" onClick={save} disabled={!editing.prompt.trim() || !editing.answer.trim()}>{t('save')}</button>
            <button className="btn ghost" onClick={() => setEditing(null)}>{t('cancel')}</button>
          </div>
        </div>
      </div>
    );
  }

  async function approve(q: any) {
    if (!q.verified && !confirm(t('confirmUnverified'))) return;
    try {
      await adminFetch(`/questions/${q.id}/approve`, 'POST');
    } catch (e) {
      alert(`${t('publishFailed')}: ${e instanceof Error ? e.message : e}`);
    }
    load();
  }

  const pendingAi = list.filter((q) => q.source === 'ai' && !q.active).length;

  return (
    <>
      <GeneratePanel onDone={load} />
      <div className="card">
        <div className="row">
          <h2>{t('qBankTitle', list.length, pendingAi ? t('pendingSuffix', pendingAi) : '')}</h2>
          <div className="spacer" />
          <button className="btn small" onClick={() => setEditing({ ...emptyQuestion })}>{t('addQuestion')}</button>
        </div>
        <table className="data mt">
          <thead><tr><th>{t('colQuestion')}</th><th>{t('answerLabel')}</th><th>{t('colTopic')}</th><th>{t('fieldDifficulty')}</th><th>{t('colStatus')}</th><th></th></tr></thead>
          <tbody>
            {list.map((q) => (
              <tr key={q.id} style={{ opacity: q.active ? 1 : 0.55 }}>
                <td>
                  {q.source === 'ai' && <span className="badge">{q.verified ? t('badgeVerified') : t('badgeUnverified')}</span>}
                  {q.prompt.slice(0, 70)}{q.prompt.length > 70 ? '…' : ''}
                </td>
                <td>{q.answer}</td>
                <td>{q.topic}<br /><span className="muted">{q.theme}</span></td>
                <td>Lv {q.difficulty}</td>
                <td>{q.active ? t('statusActive') : (q.source === 'ai' ? t('statusPending') : t('statusInactive'))}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  {!q.active && q.source === 'ai' && (
                    <><button className="btn small" onClick={() => approve(q)}>{t('publish')}</button>{' '}</>
                  )}
                  <button className="btn small ghost" onClick={() => setEditing({ ...q, hints: [...q.hints] })}>{t('edit')}</button>{' '}
                  <button className="btn small danger" onClick={() => remove(q.id)}>{t('del')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ---------------- Rewards ----------------

function RewardsAdmin() {
  const { t } = useT();
  const [list, setList] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', emoji: '🎁', cost: 50 });

  const load = () => adminFetch<any[]>('/rewards').then(setList).catch(() => {});
  useEffect(() => { load(); }, []);

  async function add() {
    if (!form.name.trim()) return;
    await adminFetch('/rewards', 'POST', form);
    setForm({ name: '', emoji: '🎁', cost: 50 });
    load();
  }
  async function toggle(r: any) {
    await adminFetch(`/rewards/${r.id}`, 'PUT', { ...r, active: r.active ? 0 : 1 });
    load();
  }
  async function remove(id: number) {
    if (!confirm(t('confirmDeleteReward'))) return;
    await adminFetch(`/rewards/${id}`, 'DELETE');
    load();
  }

  return (
    <div className="card">
      <h2>{t('rewardsTitle')}</h2>
      <div className="row mt">
        <input className="answer-input" style={{ maxWidth: 90, fontSize: 16 }} value={form.emoji}
          onChange={(e) => setForm({ ...form, emoji: e.target.value })} />
        <input className="answer-input" style={{ fontSize: 16 }} placeholder={t('rewardNamePlaceholder')} value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="answer-input" style={{ maxWidth: 110, fontSize: 16 }} type="number" value={form.cost}
          onChange={(e) => setForm({ ...form, cost: parseInt(e.target.value, 10) || 0 })} />
        <button className="btn small" onClick={add}>{t('add')}</button>
      </div>
      <table className="data mt">
        <thead><tr><th></th><th>{t('colName')}</th><th>{t('colCost')}</th><th>{t('colStatus')}</th><th></th></tr></thead>
        <tbody>
          {list.map((r) => (
            <tr key={r.id} style={{ opacity: r.active ? 1 : 0.45 }}>
              <td style={{ fontSize: 22 }}>{r.emoji}</td>
              <td>{r.name}</td>
              <td>⭐ {r.cost}</td>
              <td>{r.active ? t('listed') : t('unlisted')}</td>
              <td style={{ whiteSpace: 'nowrap' }}>
                <button className="btn small ghost" onClick={() => toggle(r)}>{r.active ? t('unlisted') : t('listed')}</button>{' '}
                <button className="btn small danger" onClick={() => remove(r.id)}>{t('del')}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------- Redemptions ----------------

function Redemptions() {
  const { t } = useT();
  const [list, setList] = useState<any[]>([]);
  const load = () => adminFetch<any[]>('/redemptions').then(setList).catch(() => {});
  useEffect(() => { load(); }, []);

  async function decide(id: number, action: 'approve' | 'reject') {
    await adminFetch(`/redemptions/${id}`, 'POST', { action });
    load();
  }

  const label: Record<string, string> = {
    pending: t('statusPendingR'), approved: t('statusApproved'), rejected: t('statusRejected'),
  };

  return (
    <div className="card">
      <h2>{t('redemptionsTitle')}</h2>
      <table className="data mt">
        <thead><tr><th>{t('colTime')}</th><th>{t('colReward')}</th><th>{t('colCost')}</th><th>{t('colStatus')}</th><th></th></tr></thead>
        <tbody>
          {list.map((r) => (
            <tr key={r.id}>
              <td style={{ whiteSpace: 'nowrap' }}>{r.created_at.slice(5, 16)}</td>
              <td>{r.reward_name}</td>
              <td>⭐ {r.cost}</td>
              <td>{label[r.status] ?? r.status}</td>
              <td style={{ whiteSpace: 'nowrap' }}>
                {r.status === 'pending' && (
                  <>
                    <button className="btn small" onClick={() => decide(r.id, 'approve')}>{t('approve')}</button>{' '}
                    <button className="btn small ghost" onClick={() => decide(r.id, 'reject')}>{t('rejectRefund')}</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {list.length === 0 && <p className="muted mt">{t('noRedemptions')}</p>}
    </div>
  );
}

// ---------------- AI Chat Logs ----------------

function ChatLogs() {
  const { t } = useT();
  const [list, setList] = useState<any[]>([]);
  useEffect(() => { adminFetch<any[]>('/chats').then(setList).catch(() => {}); }, []);

  // Group consecutive rows by question token so each problem's conversation reads together
  const groups: { token: string; question: string; rows: any[] }[] = [];
  for (const row of list) {
    const last = groups[groups.length - 1];
    if (last && last.token === row.token) last.rows.push(row);
    else groups.push({ token: row.token, question: row.question, rows: [row] });
  }

  return (
    <div>
      <p className="muted" style={{ marginBottom: 12 }}>{t('chatsDesc')}</p>
      {groups.length === 0 && <div className="card center muted">{t('noChats')}</div>}
      {groups.map((g, gi) => (
        <div className="card" key={gi}>
          <p className="muted" style={{ marginBottom: 10 }}>
            📝 {g.question.slice(0, 90)}{g.question.length > 90 ? '…' : ''}
            <span style={{ float: 'right' }}>{g.rows[0].created_at.slice(5, 16)}</span>
          </p>
          {[...g.rows].reverse().map((r) => (
            <div key={r.id} style={{ marginBottom: 10 }}>
              <div><b>{t('studentLabel')}：</b>{r.user_msg}</div>
              <div style={{ color: 'var(--teal)' }}>
                <b>AI{r.source === 'fallback' ? t('offlineHint') : `（${r.source}）`}：</b>{r.reply}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ---------------- Settings ----------------

function Settings() {
  const { t, lang } = useT();
  const [s, setS] = useState<Record<string, string> | null>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    adminFetch<Record<string, string>>('/settings').then(setS).catch(() => {});
    loadNotes();
  }, []);
  const loadNotes = () => adminFetch<any[]>('/notes').then(setNotes).catch(() => {});

  async function save() {
    if (!s) return;
    try {
      await adminFetch('/settings', 'PUT', s);
      if (s.admin_pin) setPin(s.admin_pin);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      alert(`${t('saveFailed')}: ${e instanceof Error ? e.message : e}`);
    }
  }

  async function addNote() {
    if (!newNote.trim()) return;
    await adminFetch('/notes', 'POST', { note: newNote });
    setNewNote('');
    loadNotes();
  }

  if (!s) return <div className="card center">{t('loading')}</div>;
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setS({ ...s, [k]: e.target.value });
  const keyStatus: Record<string, boolean> = (s as any)._keyStatus ?? {};
  const curriculum: { key: string; label: any; topics: { key: string; label: any; kinds: string[] }[] }[] = (s as any)._curriculum ?? [];

  let enabledTopics: string[] = [];
  try { const arr = JSON.parse(s.enabled_topics || '[]'); if (Array.isArray(arr)) enabledTopics = arr; } catch { /* keep [] */ }
  const setTopics = (next: string[]) => setS({ ...s, enabled_topics: JSON.stringify(next) });
  const toggleTopic = (key: string) =>
    setTopics(enabledTopics.includes(key) ? enabledTopics.filter((k) => k !== key) : [...enabledTopics, key]);
  const kindLabel = (kinds: string[]) =>
    kinds.length === 2 ? t('kindBoth') : kinds[0] === 'word' ? t('kindWordOnly') : t('kindArithOnly');
  const PROVIDER_INFO: [string, string, string][] = [
    ['claude', 'Claude (Anthropic)', 'ai_model_claude'],
    ['gemini', 'Gemini (Google)', 'ai_model_gemini'],
    ['openai', 'ChatGPT (OpenAI)', 'ai_model_openai'],
    ['ollama', t('ollamaLabel'), 'ai_model_ollama'],
  ];

  return (
    <>
      <div className="card">
        <h2>{t('curriculumTitle')}</h2>
        <p className="muted">{t('curriculumDesc')}</p>
        {curriculum.map((g) => {
          const groupKeys = g.topics.map((tp) => tp.key);
          const allOn = groupKeys.every((k) => enabledTopics.includes(k));
          return (
            <div key={g.key} className="mt">
              <div className="row">
                <b>{pickLabel(g.label, lang)}</b>
                <button className="btn small ghost" onClick={() =>
                  setTopics(allOn
                    ? enabledTopics.filter((k) => !groupKeys.includes(k))
                    : [...new Set([...enabledTopics, ...groupKeys])])
                }>
                  {allOn ? t('uncheckAll') : t('checkAll')}
                </button>
              </div>
              <div className="row mt" style={{ gap: '6px 18px' }}>
                {g.topics.map((tp) => (
                  <label key={tp.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={enabledTopics.includes(tp.key)}
                      onChange={() => toggleTopic(tp.key)}
                      style={{ width: 18, height: 18 }}
                    />
                    {pickLabel(tp.label, lang)}
                    <span className="muted" style={{ fontSize: 12 }}>（{kindLabel(tp.kinds)}）</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
        {enabledTopics.length === 0 && <div className="feedback bad mt">{t('atLeastOne')}</div>}
      </div>

      <div className="card">
        <h2>{t('aiEngineTitle')}</h2>
        <div className="form-grid mt">
          <label>{t('aiInUse')}
            <select value={s.ai_provider} onChange={set('ai_provider')}>
              {PROVIDER_INFO.map(([p, label]) => (
                <option key={p} value={p}>
                  {label}{p === 'ollama' ? '' : keyStatus[p] ? t('keySet') : t('keyUnset')}
                </option>
              ))}
            </select>
          </label>
          {PROVIDER_INFO.map(([p, label, modelKey]) => (
            <label key={p}>{label} {t('modelSuffix')}
              <input value={s[modelKey] ?? ''} onChange={set(modelKey)} />
            </label>
          ))}
        </div>
        <p className="muted mt">
          {t('aiKeyNote')}
          {PROVIDER_INFO.map(([p]) => `${p}${p === 'ollama' ? t('noKeyNeeded') : keyStatus[p] ? ' ✓' : ' ✗'}`).join('｜')}
        </p>
      </div>

      <div className="card">
        <h2>{t('basicTitle')}</h2>
        <div className="form-grid mt">
          <label>{t('studentName')}<input value={s.student_name} onChange={set('student_name')} /></label>
          <label>{t('buddyName')}<input value={s.buddy_name} onChange={set('buddy_name')} /></label>
          <label>{t('baseDifficulty')}
            <select value={s.target_difficulty} onChange={set('target_difficulty')}>
              {['1', '2', '3', '4', '5'].map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
          <label>{t('tutorLang')}<input value={s.tutor_language} onChange={set('tutor_language')} /></label>
          <label>{t('interestsLabel')}<input value={s.interests} onChange={set('interests')} /></label>
          <label>{t('adminPin')}<input value={s.admin_pin} onChange={set('admin_pin')} /></label>
        </div>
        <div className="row mt">
          <button className="btn" onClick={save}>{t('saveSettings')}</button>
          {saved && <span style={{ color: 'var(--green)', fontWeight: 700 }}>{t('savedOk')}</span>}
        </div>
        <p className="muted mt">{t('autoDiffNote')}</p>
      </div>

      <div className="card">
        <h2>{t('notesTitle')}</h2>
        <p className="muted">{t('notesDesc')}</p>
        <div className="row mt">
          <input className="answer-input" style={{ fontSize: 16 }} value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addNote()} />
          <button className="btn small" onClick={addNote}>{t('add')}</button>
        </div>
        <table className="data mt">
          <tbody>
            {notes.map((n) => (
              <tr key={n.id}>
                <td>{n.note}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="btn small ghost" onClick={async () => { await adminFetch(`/notes/${n.id}`, 'DELETE'); loadNotes(); }}>{t('del')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
