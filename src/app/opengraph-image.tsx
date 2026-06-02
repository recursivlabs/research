import { ImageResponse } from 'next/og';
import { loadLeaderboard } from '@/lib/leaderboard';

export const runtime = 'nodejs';
export const alt = 'Daily Model Power Rankings, by Recursiv';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const MEDAL = ['#39e0c8', '#e8ecf2', '#b9c2cf'];

export default async function Image() {
  const board = await loadLeaderboard();
  const top = board.models.slice(0, 5);

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
          padding: 56,
          fontFamily: 'monospace',
        }}
      >
        {/* top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 22, color: '#8a93a3' }}>
            <div style={{ width: 12, height: 12, borderRadius: 999, background: '#39e0c8' }} />
            recursiv / research
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 18,
              color: '#54d98c',
              border: '1px solid rgba(84,217,140,0.3)',
              background: 'rgba(84,217,140,0.1)',
              borderRadius: 6,
              padding: '6px 12px',
            }}
          >
            <div style={{ width: 10, height: 10, borderRadius: 999, background: '#54d98c' }} />
            LIVE
          </div>
        </div>

        {/* title */}
        <div style={{ display: 'flex', marginTop: 28, fontSize: 52, fontWeight: 700 }}>
          <span style={{ color: '#e8ecf2', marginRight: 18 }}>Daily Model</span>
          <span style={{ color: '#39e0c8' }}>Power Rankings</span>
        </div>
        <div style={{ display: 'flex', marginTop: 8, fontSize: 22, color: '#8a93a3' }}>
          How LLMs actually perform at real, multi-agent work
        </div>

        {/* rows */}
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 30, gap: 14 }}>
          {top.map((m, i) => (
            <div key={m.modelId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <div style={{ display: 'flex', width: 34, fontSize: 26, fontWeight: 700, color: i < 3 ? MEDAL[i] : '#5b6472' }}>
                  {`${i + 1}`}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', fontSize: 26, fontWeight: 700, color: '#e8ecf2' }}>{m.displayName}</div>
                  <div style={{ display: 'flex', fontSize: 15, color: '#5b6472' }}>{m.vendor}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ display: 'flex', width: 320, height: 12, background: '#11141a', borderRadius: 6 }}>
                  <div style={{ width: `${Math.max(4, m.recursivScore)}%`, height: 12, background: '#39e0c8', borderRadius: 6 }} />
                </div>
                <div style={{ display: 'flex', width: 56, justifyContent: 'flex-end', fontSize: 30, fontWeight: 700, color: '#39e0c8' }}>
                  {`${Math.round(m.recursivScore)}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
