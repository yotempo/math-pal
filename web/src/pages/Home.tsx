import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet, type AppState, type QuestsData } from '../api';

function QuestCard() {
  const [data, setData] = useState<QuestsData | null>(null);

  useEffect(() => { apiGet<QuestsData>('/quests').then(setData).catch(() => {}); }, []);
  if (!data) return null;

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <div className="row">
        <h2 style={{ marginBottom: 0 }}>🎯 Today's Quests</h2>
        <div className="spacer" />
        {data.streak >= 2 && <span className="badge" style={{ fontSize: 15 }}>🔥 {data.streak}-day streak!</span>}
      </div>
      {data.quests.map((q) => (
        <div key={q.key} className="quest-row">
          <span className="quest-emoji">{q.emoji}</span>
          <div className="quest-body">
            <div className="quest-label">
              {q.label}
              <span className="muted" style={{ marginLeft: 8 }}>{q.done ? '✅' : `${q.progress}/${q.target}`}</span>
            </div>
            <div className="progress-bar" style={{ margin: '4px 0 0' }}>
              <div style={{ width: `${(q.progress / q.target) * 100}%` }} />
            </div>
          </div>
          <span className="quest-points">{q.awarded ? '⭐ paid!' : `+${q.points}⭐`}</span>
        </div>
      ))}
      {data.sweepDone && <div className="feedback good" style={{ marginTop: 10 }}>🎉 Daily sweep complete — all quests done today!</div>}
    </div>
  );
}

export default function Home({ state }: { state: AppState | null }) {
  const name = state?.studentName || 'champ';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      <h1>{greeting}, {name}! 👋</h1>
      <p className="sub">Ready to rally? Pick your training for today.</p>

      <QuestCard />

      <div className="big-menu">
        <Link className="tile" to="/practice/arithmetic">
          <span className="emoji">⚡</span>
          <span className="title">Number Ninja</span>
          <div className="desc">Quick math drills — serve them back fast!</div>
        </Link>
        <Link className="tile" to="/practice/word">
          <span className="emoji">📖</span>
          <span className="title">Story Solver</span>
          <div className="desc">Word problems with your favorite characters</div>
        </Link>
        <Link className="tile" to="/challenge">
          <span className="emoji">🏆</span>
          <span className="title">Challenge Court</span>
          <div className="desc">Beat levels, earn stars and bonus points</div>
        </Link>
        <Link className="tile" to="/rewards">
          <span className="emoji">🎁</span>
          <span className="title">Prize Locker</span>
          <div className="desc">Trade your points for real prizes</div>
        </Link>
      </div>

      <p className="muted center mt">
        {state?.aiAvailable
          ? `${state.buddyName} the study buddy is online and ready to help! 🤖`
          : 'Study buddy is offline — hints still work!'}
        {' · '}
        <Link to="/admin" style={{ color: 'inherit' }}>家長後台</Link>
      </p>
    </div>
  );
}
