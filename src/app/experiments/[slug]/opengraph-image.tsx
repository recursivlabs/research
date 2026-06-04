import { ImageResponse } from 'next/og';
import { getExperiment } from '@/lib/experiments';

export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image({ params }: { params: { slug: string } }) {
  const exp = getExperiment(params.slug);
  const title = exp?.title ?? 'Recursiv Research';
  const summary = exp?.summary ?? '';
  const stat = exp?.heroStatValue;
  const statLabel = exp?.heroStatLabel;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          color: '#0e1726',
          padding: 64,
          fontFamily: 'monospace',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: '#0b9d76', fontSize: 22 }}>
          <div style={{ width: 14, height: 14, borderRadius: 999, background: '#0b9d76' }} />
          recursiv / research
        </div>
        <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.08, marginTop: 32, maxWidth: 1000 }}>
          {title}
        </div>
        <div style={{ fontSize: 26, color: '#586273', marginTop: 20, maxWidth: 920, lineHeight: 1.4 }}>
          {summary.length > 160 ? summary.slice(0, 157) + '…' : summary}
        </div>
        {stat && (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginTop: 'auto' }}>
            <div style={{ fontSize: 72, fontWeight: 700, color: '#0b9d76' }}>{stat}</div>
            <div style={{ fontSize: 24, color: '#8a95a4' }}>{statLabel}</div>
          </div>
        )}
      </div>
    ),
    size,
  );
}
