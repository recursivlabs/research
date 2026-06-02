import { ImageResponse } from 'next/og';
import { loadLeaderboard } from '@/lib/leaderboard';
import { SITE } from '@/lib/site';

export const runtime = 'nodejs';
export const alt = SITE.tagline;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const board = await loadLeaderboard();
  const top = board.models.slice(0, 3);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#060709',
          color: '#e8ecf2',
          padding: 64,
          fontFamily: 'monospace',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: '#39e0c8', fontSize: 22 }}>
          <div style={{ width: 14, height: 14, borderRadius: 999, background: '#39e0c8' }} />
          recursiv / research
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 36 }}>
          <div style={{ fontSize: 60, fontWeight: 700, lineHeight: 1.05 }}>Benchmarks test models.</div>
          <div style={{ fontSize: 60, fontWeight: 700, lineHeight: 1.05, color: '#39e0c8' }}>
            Recursiv tests them at work.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 'auto' }}>
          {top.map((m, i) => (
            <div
              key={m.modelId}
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                border: '1px solid #1b1f27',
                borderRadius: 12,
                padding: 24,
                background: '#0c0e12',
              }}
            >
              <div style={{ color: '#5b6472', fontSize: 20 }}>{`#${i + 1}`}</div>
              <div style={{ fontSize: 30, fontWeight: 700, marginTop: 6 }}>{m.displayName}</div>
              <div style={{ color: '#39e0c8', fontSize: 26, marginTop: 8 }}>
                {`$${m.metrics.costToDone?.value.toFixed(2)} / task`}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
