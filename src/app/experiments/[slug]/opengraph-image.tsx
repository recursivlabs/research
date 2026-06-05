import { ImageResponse } from 'next/og';
import { getExperiment } from '@/lib/experiments';
import { loadLeaderboard } from '@/lib/leaderboard';
import { fmtCost } from '@/lib/format';

export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// The card tells the whole story with no click: headline + the live scoreboard,
// cheapest winners on top, the expensive laggard called out at the bottom.
export default async function Image({ params }: { params: { slug: string } }) {
  const exp = getExperiment(params.slug);
  const title = exp?.title ?? 'Recursiv Research';
  const board = await loadLeaderboard();
  const ranked = board.models; // enriched: sorted by composite, best first
  const priciest = [...board.models].sort((a, b) => (b.metrics.costToDone?.value ?? 0) - (a.metrics.costToDone?.value ?? 0))[0];
  const priciestRank = ranked.findIndex((m) => m.modelId === priciest?.modelId) + 1;

  // top 3 winners + the expensive laggard (if not already shown)
  const rows = ranked.slice(0, 3).map((m, i) => ({ m, rank: i + 1, loser: false }));
  if (priciest && priciestRank > 3) rows.push({ m: priciest, rank: priciestRank, loser: true });

  const Row = ({ m, rank, loser }: any) => {
    const rel = m.metrics.completionRate?.value ?? 0;
    const cost = m.metrics.costToDone?.value ?? 0;
    const winner = rank === 1;
    return (
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px', borderRadius: 12,
          background: winner ? 'rgba(11,157,118,0.10)' : loser ? 'rgba(221,45,59,0.06)' : '#f7f9fb',
          border: winner ? '2px solid rgba(11,157,118,0.55)' : loser ? '2px solid rgba(221,45,59,0.35)' : '1px solid #e5e9ef',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ display: 'flex', width: 40, fontSize: 28, fontWeight: 700, color: winner ? '#0b9d76' : loser ? '#dd2d3b' : '#8a95a4' }}>{loser ? `#${rank}` : rank}</div>
          <div style={{ display: 'flex', fontSize: 30, fontWeight: 600, color: '#0e1726' }}>{m.displayName}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 34 }}>
          <div style={{ display: 'flex', fontSize: 26, color: rel >= 1 ? '#15a34a' : '#586273' }}>{Math.round(rel * 100)}%</div>
          <div style={{ display: 'flex', width: 150, justifyContent: 'flex-end', fontSize: 26, fontWeight: 700, color: loser ? '#dd2d3b' : '#0b9d76' }}>{fmtCost(cost)}</div>
        </div>
      </div>
    );
  };

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#ffffff', color: '#0e1726', padding: 56, fontFamily: 'monospace' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#0b9d76', fontSize: 22 }}>
            <div style={{ width: 13, height: 13, borderRadius: 999, background: '#0b9d76' }} />
            recursiv / research
          </div>
          <div style={{ display: 'flex', fontSize: 18, color: '#8a95a4' }}>reliability · cost-to-done</div>
        </div>

        <div style={{ display: 'flex', fontSize: 52, fontWeight: 700, lineHeight: 1.07, marginTop: 24, maxWidth: 1080 }}>{title}</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 'auto' }}>
          {rows.map((r) => <Row key={r.m.modelId} {...r} />)}
        </div>
      </div>
    ),
    size,
  );
}
