import { useCallback, useEffect, useState } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import { apiGet, type AppState } from './api';
import Home from './pages/Home';
import Practice from './pages/Practice';
import Challenge from './pages/Challenge';
import Rewards from './pages/Rewards';
import Admin from './pages/Admin';

export default function App() {
  const [state, setState] = useState<AppState | null>(null);

  const refresh = useCallback(() => {
    apiGet<AppState>('/state').then(setState).catch(() => {});
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <>
      <header className="topbar">
        <Link to="/" className="logo">🏐 Math Pal</Link>
        <div className="points-chip">⭐ {state?.points ?? 0}</div>
      </header>
      <main className="page">
        <Routes>
          <Route path="/" element={<Home state={state} />} />
          <Route path="/practice/:mode" element={<Practice onPointsChange={refresh} state={state} />} />
          <Route path="/challenge" element={<Challenge onPointsChange={refresh} />} />
          <Route path="/rewards" element={<Rewards onPointsChange={refresh} />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
    </>
  );
}
