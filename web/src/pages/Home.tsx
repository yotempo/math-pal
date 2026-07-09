import { Link } from 'react-router-dom';
import type { AppState } from '../api';

export default function Home({ state }: { state: AppState | null }) {
  const name = state?.studentName || 'champ';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      <h1>{greeting}, {name}! 👋</h1>
      <p className="sub">Ready to rally? Pick your training for today.</p>

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
