import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminFetch, getPin, setPin } from '../api';

type Tab = 'overview' | 'questions' | 'rewards' | 'redemptions' | 'chats' | 'settings';

export default function Admin() {
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
    } catch {
      setAuthed(false);
      alert('PIN 錯誤');
    }
  }

  if (authed === null) return <div className="card center">載入中...</div>;

  if (!authed) {
    return (
      <div className="card" style={{ maxWidth: 400, margin: '40px auto' }}>
        <h2>👨‍👧 家長後台</h2>
        <p className="muted">請輸入 PIN 碼（預設 1234，可在設定中修改）</p>
        <div className="answer-row mt">
          <input className="answer-input" type="password" inputMode="numeric" value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && tryLogin()} />
          <button className="btn" onClick={tryLogin}>進入</button>
        </div>
        <p className="mt"><Link to="/">← 回首頁</Link></p>
      </div>
    );
  }

  return (
    <div>
      <div className="row">
        <Link to="/" className="btn ghost small">← 回首頁</Link>
        <h1 style={{ fontSize: 24 }}>👨‍👧 家長後台</h1>
      </div>
      <div className="admin-tabs mt">
        {([['overview', '總覽'], ['questions', '題庫'], ['rewards', '獎品'], ['redemptions', '兌換審核'], ['chats', 'AI 對話'], ['settings', '設定']] as [Tab, string][]).map(([t, label]) => (
          <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{label}</button>
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

// ---------------- 總覽 ----------------

function Overview() {
  const [data, setData] = useState<any>(null);
  const [delta, setDelta] = useState('');
  const [reason, setReason] = useState('');

  const load = () => adminFetch<any>('/overview').then(setData).catch(() => {});
  useEffect(() => { load(); }, []);

  async function adjust() {
    const n = parseInt(delta, 10);
    if (!n) return;
    await adminFetch('/points', 'POST', { delta: n, reason: reason || '家長調整' });
    setDelta(''); setReason('');
    load();
  }

  if (!data) return <div className="card center">載入中...</div>;
  const acc = data.week.total ? Math.round((100 * data.week.correct) / data.week.total) : null;

  return (
    <>
      <div className="card">
        <h2>本週狀況</h2>
        <p>目前積分：<b>⭐ {data.points}</b> ｜ 近 7 天答題：<b>{data.week.total}</b> 題
          {acc !== null && <>｜ 正確率：<b>{acc}%</b></>}
          ｜ 待審核兌換：<b>{data.pendingRedemptions}</b></p>
        <div className="row mt">
          <input className="answer-input" style={{ maxWidth: 130, fontSize: 16 }} placeholder="±積分" value={delta} onChange={(e) => setDelta(e.target.value)} />
          <input className="answer-input" style={{ fontSize: 16 }} placeholder="原因（例如：主動幫忙做家事）" value={reason} onChange={(e) => setReason(e.target.value)} />
          <button className="btn small" onClick={adjust}>調整積分</button>
        </div>
      </div>

      <div className="card">
        <h2>各主題正確率（首次作答）</h2>
        <table className="data">
          <thead><tr><th>主題</th><th>類型</th><th>題數</th><th>正確率</th></tr></thead>
          <tbody>
            {data.perTopic.map((t: any, i: number) => (
              <tr key={i}>
                <td>{t.topic}</td>
                <td>{t.kind === 'word' ? '應用題' : '算術'}</td>
                <td>{t.total}</td>
                <td style={{ color: t.correct / t.total < 0.7 ? 'var(--red)' : 'var(--green)' }}>
                  {Math.round((100 * t.correct) / t.total)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted mt">紅色 = 正確率低於 70%，AI 家教會自動針對弱項多加引導。</p>
      </div>

      <div className="card">
        <h2>最近作答紀錄</h2>
        <table className="data">
          <thead><tr><th>時間</th><th>題目</th><th>作答</th><th>結果</th></tr></thead>
          <tbody>
            {data.recent.map((a: any, i: number) => (
              <tr key={i}>
                <td style={{ whiteSpace: 'nowrap' }}>{a.created_at.slice(5, 16)}</td>
                <td>{a.prompt.slice(0, 60)}{a.prompt.length > 60 ? '…' : ''}</td>
                <td>{a.given}</td>
                <td>{a.correct ? '✅' : '❌'}{a.attempt_no > 1 ? ` (第${a.attempt_no}次)` : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>積分紀錄</h2>
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

// ---------------- 題庫 ----------------

const TOPIC_OPTIONS = ['multi_step', 'fractions', 'percent', 'ratio', 'rate', 'average', 'geometry', 'equations'];
const THEME_OPTIONS = ['volleyball', 'haikyuu', 'mha', 'general'];

const emptyQuestion = {
  id: 0, topic: 'multi_step', difficulty: 2, theme: 'general', prompt: '', answer: '',
  answer_type: 'number', hints: ['', '', ''], explanation: '', active: 1,
};

function GeneratePanel({ onDone }: { onDone: () => void }) {
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
      // start polling the new job
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
      setError(e instanceof Error ? e.message : '生成失敗');
    }
  }

  return (
    <div className="card">
      <h2>🤖 AI 出題</h2>
      <p className="muted">AI 生成後會由另一個獨立 AI「盲解」驗證答案（看不到出題者的答案），再進待審核區——你批准後才會出現在題目池裡。</p>
      <div className="row mt">
        <select value={topic} onChange={(e) => setTopic(e.target.value)}>
          <option value="auto">主題：自動（優先弱項）</option>
          {TOPIC_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option value="auto">難度：自動</option>
          {['1', '2', '3', '4', '5'].map((d) => <option key={d} value={d}>難度 {d}</option>)}
        </select>
        <select value={theme} onChange={(e) => setTheme(e.target.value)}>
          <option value="mixed">風格：隨機</option>
          {THEME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={count} onChange={(e) => setCount(parseInt(e.target.value, 10))}>
          {[1, 2, 3].map((n) => <option key={n} value={n}>{n} 題</option>)}
        </select>
        <button className="btn small" onClick={run} disabled={running}>{running ? '生成中…' : '生成'}</button>
      </div>
      {running && (
        <p className="muted mt">
          生成 + 盲解驗證中（{job.items.length}/{job.total} 完成）…本地模型每題約 1-3 分鐘，可以先去別的分頁，回來看結果。
        </p>
      )}
      {error && <div className="feedback bad">{error}</div>}
      {job && job.items.length > 0 && (
        <div className="mt">
          {job.items.map((it: any, i: number) => (
            <div key={i} className={`feedback ${it.ok ? (it.verified ? 'good' : 'hint') : 'bad'}`} style={{ marginTop: 8, fontWeight: 500 }}>
              {it.ok ? (
                <>
                  {it.verified
                    ? '✅ 盲解驗證通過'
                    : it.solverFailed
                      ? '⚠️ 盲解執行失敗（AI 連線問題）— 請自行驗算後再上架'
                      : `⚠️ 盲解不一致（出題者答 ${it.answer}，解題者答 ${it.solverAnswer}）— 建議自己算過或刪除`}
                  <div style={{ marginTop: 6 }}>{it.prompt}</div>
                  <div className="muted">答案：{it.answer}｜{it.topic}｜難度 {it.difficulty}</div>
                </>
              ) : (
                <>❌ 生成失敗：{it.error}</>
              )}
            </div>
          ))}
          {job.status === 'done' && <p className="muted mt">已放入下方題庫（待審核），確認沒問題後按「上架」。</p>}
        </div>
      )}
    </div>
  );
}

function Questions() {
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
      alert(`儲存失敗：${e instanceof Error ? e.message : e}`);
    }
  }

  async function remove(id: number) {
    if (!confirm('確定刪除這一題？作答紀錄會保留。')) return;
    try {
      await adminFetch(`/questions/${id}`, 'DELETE');
    } catch (e) {
      alert(`刪除失敗：${e instanceof Error ? e.message : e}`);
    }
    load();
  }

  if (editing) {
    const hints = [...editing.hints];
    while (hints.length < 3) hints.push('');
    return (
      <div className="card">
        <h2>{editing.id ? '編輯題目' : '新增應用題'}</h2>
        <div className="form-col mt">
          <label>題目（英文，Elena 用英文學數學）
            <textarea value={editing.prompt} onChange={(e) => setEditing({ ...editing, prompt: e.target.value })} />
          </label>
          <div className="form-grid">
            <label>答案
              <input value={editing.answer} onChange={(e) => setEditing({ ...editing, answer: e.target.value })} />
            </label>
            <label>答案格式
              <select value={editing.answer_type} onChange={(e) => setEditing({ ...editing, answer_type: e.target.value })}>
                <option value="number">數字</option>
                <option value="fraction">分數</option>
                <option value="text">文字（如 5:15 PM）</option>
              </select>
            </label>
            <label>主題
              <select value={editing.topic} onChange={(e) => setEditing({ ...editing, topic: e.target.value })}>
                {TOPIC_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label>難度 (1-5)
              <input type="number" min={1} max={5} value={editing.difficulty}
                onChange={(e) => setEditing({ ...editing, difficulty: parseInt(e.target.value, 10) || 2 })} />
            </label>
            <label>風格主題
              <select value={editing.theme} onChange={(e) => setEditing({ ...editing, theme: e.target.value })}>
                {THEME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label>啟用
              <select value={editing.active} onChange={(e) => setEditing({ ...editing, active: parseInt(e.target.value, 10) })}>
                <option value={1}>啟用</option>
                <option value={0}>停用</option>
              </select>
            </label>
          </div>
          {hints.map((h: string, i: number) => (
            <label key={i}>提示 {i + 1}（由淺到深）
              <input value={h} onChange={(e) => {
                const next = [...hints]; next[i] = e.target.value;
                setEditing({ ...editing, hints: next });
              }} />
            </label>
          ))}
          <label>詳解（答對後顯示）
            <textarea value={editing.explanation} onChange={(e) => setEditing({ ...editing, explanation: e.target.value })} />
          </label>
          <div className="row">
            <button className="btn" onClick={save} disabled={!editing.prompt.trim() || !editing.answer.trim()}>儲存</button>
            <button className="btn ghost" onClick={() => setEditing(null)}>取消</button>
          </div>
        </div>
      </div>
    );
  }

  async function approve(q: any) {
    if (!q.verified && !confirm('這一題「盲解驗證」沒有通過——建議先自己算一遍確認答案正確。仍要上架嗎？')) return;
    try {
      await adminFetch(`/questions/${q.id}/approve`, 'POST');
    } catch (e) {
      alert(`上架失敗：${e instanceof Error ? e.message : e}`);
    }
    load();
  }

  const pendingAi = list.filter((q) => q.source === 'ai' && !q.active).length;

  return (
    <>
      <GeneratePanel onDone={load} />
      <div className="card">
        <div className="row">
          <h2>應用題題庫（{list.length} 題{pendingAi ? `，${pendingAi} 題 AI 待審核` : ''}）</h2>
          <div className="spacer" />
          <button className="btn small" onClick={() => setEditing({ ...emptyQuestion })}>＋ 新增題目</button>
        </div>
        <table className="data mt">
          <thead><tr><th>題目</th><th>答案</th><th>主題</th><th>難度</th><th>狀態</th><th></th></tr></thead>
          <tbody>
            {list.map((q) => (
              <tr key={q.id} style={{ opacity: q.active ? 1 : 0.55 }}>
                <td>
                  {q.source === 'ai' && <span className="badge">{q.verified ? 'AI ✓已驗證' : 'AI ⚠️未驗證'}</span>}
                  {q.prompt.slice(0, 70)}{q.prompt.length > 70 ? '…' : ''}
                </td>
                <td>{q.answer}</td>
                <td>{q.topic}<br /><span className="muted">{q.theme}</span></td>
                <td>Lv {q.difficulty}</td>
                <td>{q.active ? '啟用' : (q.source === 'ai' ? '待審核' : '停用')}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  {!q.active && q.source === 'ai' && (
                    <><button className="btn small" onClick={() => approve(q)}>上架</button>{' '}</>
                  )}
                  <button className="btn small ghost" onClick={() => setEditing({ ...q, hints: [...q.hints] })}>編輯</button>{' '}
                  <button className="btn small danger" onClick={() => remove(q.id)}>刪除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ---------------- 獎品 ----------------

function RewardsAdmin() {
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
    if (!confirm('刪除這個獎品？')) return;
    await adminFetch(`/rewards/${id}`, 'DELETE');
    load();
  }

  return (
    <div className="card">
      <h2>獎品清單</h2>
      <div className="row mt">
        <input className="answer-input" style={{ maxWidth: 90, fontSize: 16 }} value={form.emoji}
          onChange={(e) => setForm({ ...form, emoji: e.target.value })} />
        <input className="answer-input" style={{ fontSize: 16 }} placeholder="獎品名稱（英文顯示給小孩）" value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="answer-input" style={{ maxWidth: 110, fontSize: 16 }} type="number" value={form.cost}
          onChange={(e) => setForm({ ...form, cost: parseInt(e.target.value, 10) || 0 })} />
        <button className="btn small" onClick={add}>新增</button>
      </div>
      <table className="data mt">
        <thead><tr><th></th><th>名稱</th><th>積分</th><th>狀態</th><th></th></tr></thead>
        <tbody>
          {list.map((r) => (
            <tr key={r.id} style={{ opacity: r.active ? 1 : 0.45 }}>
              <td style={{ fontSize: 22 }}>{r.emoji}</td>
              <td>{r.name}</td>
              <td>⭐ {r.cost}</td>
              <td>{r.active ? '上架' : '下架'}</td>
              <td style={{ whiteSpace: 'nowrap' }}>
                <button className="btn small ghost" onClick={() => toggle(r)}>{r.active ? '下架' : '上架'}</button>{' '}
                <button className="btn small danger" onClick={() => remove(r.id)}>刪除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------- 兌換審核 ----------------

function Redemptions() {
  const [list, setList] = useState<any[]>([]);
  const load = () => adminFetch<any[]>('/redemptions').then(setList).catch(() => {});
  useEffect(() => { load(); }, []);

  async function decide(id: number, action: 'approve' | 'reject') {
    await adminFetch(`/redemptions/${id}`, 'POST', { action });
    load();
  }

  const label: Record<string, string> = { pending: '⏳ 待審核', approved: '✅ 已批准', rejected: '↩️ 已退回' };

  return (
    <div className="card">
      <h2>兌換申請</h2>
      <table className="data mt">
        <thead><tr><th>時間</th><th>獎品</th><th>積分</th><th>狀態</th><th></th></tr></thead>
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
                    <button className="btn small" onClick={() => decide(r.id, 'approve')}>批准</button>{' '}
                    <button className="btn small ghost" onClick={() => decide(r.id, 'reject')}>退回並退還積分</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {list.length === 0 && <p className="muted mt">還沒有兌換申請。</p>}
    </div>
  );
}

// ---------------- AI 對話紀錄 ----------------

function ChatLogs() {
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
      <p className="muted" style={{ marginBottom: 12 }}>
        Elena 和 AI 夥伴的每一句對話都會記錄在這裡（最新在前）。AI 被設定為只談數學、不給答案、離題會轉回來。
      </p>
      {groups.length === 0 && <div className="card center muted">還沒有對話紀錄。</div>}
      {groups.map((g, gi) => (
        <div className="card" key={gi}>
          <p className="muted" style={{ marginBottom: 10 }}>
            📝 {g.question.slice(0, 90)}{g.question.length > 90 ? '…' : ''}
            <span style={{ float: 'right' }}>{g.rows[0].created_at.slice(5, 16)}</span>
          </p>
          {[...g.rows].reverse().map((r) => (
            <div key={r.id} style={{ marginBottom: 10 }}>
              <div><b>Elena：</b>{r.user_msg}</div>
              <div style={{ color: 'var(--teal)' }}>
                <b>AI{r.source === 'fallback' ? '（離線提示）' : `（${r.source}）`}：</b>{r.reply}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ---------------- 設定 ----------------

function Settings() {
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
      alert(`儲存失敗：${e instanceof Error ? e.message : e}`);
    }
  }

  async function addNote() {
    if (!newNote.trim()) return;
    await adminFetch('/notes', 'POST', { note: newNote });
    setNewNote('');
    loadNotes();
  }

  if (!s) return <div className="card center">載入中...</div>;
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setS({ ...s, [k]: e.target.value });
  const keyStatus: Record<string, boolean> = (s as any)._keyStatus ?? {};
  const curriculum: { key: string; label: string; topics: { key: string; label: string; kinds: string[] }[] }[] = (s as any)._curriculum ?? [];

  let enabledTopics: string[] = [];
  try { const arr = JSON.parse(s.enabled_topics || '[]'); if (Array.isArray(arr)) enabledTopics = arr; } catch { /* keep [] */ }
  const setTopics = (next: string[]) => setS({ ...s, enabled_topics: JSON.stringify(next) });
  const toggleTopic = (key: string) =>
    setTopics(enabledTopics.includes(key) ? enabledTopics.filter((k) => k !== key) : [...enabledTopics, key]);
  const kindLabel = (kinds: string[]) =>
    kinds.length === 2 ? '計算＋應用題' : kinds[0] === 'word' ? '應用題' : '計算';
  const PROVIDER_INFO: [string, string, string][] = [
    ['claude', 'Claude (Anthropic)', 'ai_model_claude'],
    ['gemini', 'Gemini (Google)', 'ai_model_gemini'],
    ['openai', 'ChatGPT (OpenAI)', 'ai_model_openai'],
    ['ollama', 'Ollama（本地，在家用）', 'ai_model_ollama'],
  ];

  return (
    <>
      <div className="card">
        <h2>📚 課程範圍</h2>
        <p className="muted">勾選 = Elena 目前會遇到的主題，全站生效（練習、應用題、挑戰關卡、AI 出題）。開學後可以把 Saxon 2 複習取消勾選，只留 Saxon 3 進度內的主題。記得按下方「儲存設定」。</p>
        {curriculum.map((g) => {
          const groupKeys = g.topics.map((t) => t.key);
          const allOn = groupKeys.every((k) => enabledTopics.includes(k));
          return (
            <div key={g.key} className="mt">
              <div className="row">
                <b>{g.label}</b>
                <button className="btn small ghost" onClick={() =>
                  setTopics(allOn
                    ? enabledTopics.filter((k) => !groupKeys.includes(k))
                    : [...new Set([...enabledTopics, ...groupKeys])])
                }>
                  {allOn ? '全部取消' : '全部勾選'}
                </button>
              </div>
              <div className="row mt" style={{ gap: '6px 18px' }}>
                {g.topics.map((t) => (
                  <label key={t.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={enabledTopics.includes(t.key)}
                      onChange={() => toggleTopic(t.key)}
                      style={{ width: 18, height: 18 }}
                    />
                    {t.label}
                    <span className="muted" style={{ fontSize: 12 }}>（{kindLabel(t.kinds)}）</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
        {enabledTopics.length === 0 && <div className="feedback bad mt">至少要勾選一個主題才能儲存。</div>}
      </div>

      <div className="card">
        <h2>AI 夥伴引擎</h2>
        <div className="form-grid mt">
          <label>使用的 AI
            <select value={s.ai_provider} onChange={set('ai_provider')}>
              {PROVIDER_INFO.map(([p, label]) => (
                <option key={p} value={p}>
                  {label}{p === 'ollama' ? '' : keyStatus[p] ? ' ✓ 已設定金鑰' : ' ✗ 未設定金鑰'}
                </option>
              ))}
            </select>
          </label>
          {PROVIDER_INFO.map(([p, label, modelKey]) => (
            <label key={p}>{label} 模型
              <input value={s[modelKey] ?? ''} onChange={set(modelKey)} />
            </label>
          ))}
        </div>
        <p className="muted mt">
          API 金鑰放在伺服器的 <code>server/.env</code>（ANTHROPIC_API_KEY / GEMINI_API_KEY / OPENAI_API_KEY / OLLAMA_BASE_URL），
          不會存進資料庫。目前狀態：{PROVIDER_INFO.map(([p]) => `${p} ${p === 'ollama' ? '（免金鑰）' : keyStatus[p] ? '✓' : '✗'}`).join('｜')}。
          切換後立即生效，不用重啟。
        </p>
      </div>

      <div className="card">
        <h2>基本設定</h2>
        <div className="form-grid mt">
          <label>小孩名字<input value={s.student_name} onChange={set('student_name')} /></label>
          <label>AI 夥伴名字<input value={s.buddy_name} onChange={set('buddy_name')} /></label>
          <label>基準難度 (1-5)
            <select value={s.target_difficulty} onChange={set('target_difficulty')}>
              {['1', '2', '3', '4', '5'].map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
          <label>AI 回覆語言<input value={s.tutor_language} onChange={set('tutor_language')} /></label>
          <label>興趣（給 AI 出題/鼓勵用）<input value={s.interests} onChange={set('interests')} /></label>
          <label>後台 PIN<input value={s.admin_pin} onChange={set('admin_pin')} /></label>
        </div>
        <div className="row mt">
          <button className="btn" onClick={save}>儲存設定</button>
          {saved && <span style={{ color: 'var(--green)', fontWeight: 700 }}>已儲存 ✓</span>}
        </div>
        <p className="muted mt">系統會依近期正確率自動微調難度（正確率 &gt;85% 升一級，&lt;50% 降一級）。</p>
      </div>

      <div className="card">
        <h2>給 AI 家教的備註</h2>
        <p className="muted">這些備註會提供給 AI 家教參考，例如：「最近在學分數除法，多鼓勵她畫圖」。</p>
        <div className="row mt">
          <input className="answer-input" style={{ fontSize: 16 }} value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addNote()} />
          <button className="btn small" onClick={addNote}>新增</button>
        </div>
        <table className="data mt">
          <tbody>
            {notes.map((n) => (
              <tr key={n.id}>
                <td>{n.note}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="btn small ghost" onClick={async () => { await adminFetch(`/notes/${n.id}`, 'DELETE'); loadNotes(); }}>刪除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
