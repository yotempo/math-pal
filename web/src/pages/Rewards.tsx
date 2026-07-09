import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet, apiPost } from '../api';

interface Reward { id: number; name: string; emoji: string; cost: number }
interface Redemption { id: number; reward_name: string; cost: number; status: string; created_at: string }
interface RewardsData { balance: number; rewards: Reward[]; recent: Redemption[] }

const STATUS_LABEL: Record<string, string> = {
  pending: '⏳ waiting for parent',
  approved: '✅ approved',
  rejected: '↩️ returned (points refunded)',
};

export default function Rewards({ onPointsChange }: { onPointsChange: () => void }) {
  const [data, setData] = useState<RewardsData | null>(null);
  const [message, setMessage] = useState('');

  const load = () => apiGet<RewardsData>('/rewards').then(setData).catch(() => {});
  useEffect(() => { load(); }, []);

  async function redeem(r: Reward) {
    setMessage('');
    try {
      const res = await apiPost<{ message: string }>(`/rewards/${r.id}/redeem`);
      setMessage(res.message);
      onPointsChange();
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not redeem');
    }
  }

  return (
    <div>
      <div className="row">
        <Link to="/" className="btn ghost small">← Home</Link>
        <h1 style={{ fontSize: 24 }}>🎁 Prize Locker</h1>
      </div>
      <p className="sub">You have <b>⭐ {data?.balance ?? 0}</b> points to spend.</p>

      {message && <div className="feedback good">{message}</div>}

      <div className="reward-grid mt">
        {data?.rewards.map((r) => (
          <div key={r.id} className="reward-card">
            <div className="emoji">{r.emoji}</div>
            <div className="name">{r.name}</div>
            <div className="cost">⭐ {r.cost}</div>
            <button className="btn small" disabled={(data?.balance ?? 0) < r.cost} onClick={() => redeem(r)}>
              {(data?.balance ?? 0) < r.cost ? 'Keep earning!' : 'Redeem'}
            </button>
          </div>
        ))}
      </div>

      {data && data.recent.length > 0 && (
        <div className="card mt">
          <h2>Recent redemptions</h2>
          <table className="data">
            <tbody>
              {data.recent.map((r) => (
                <tr key={r.id}>
                  <td>{r.reward_name}</td>
                  <td>⭐ {r.cost}</td>
                  <td>{STATUS_LABEL[r.status] ?? r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
