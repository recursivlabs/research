'use client';

import { useMemo, useState } from 'react';

export interface FrontierPoint {
  modelId: string;
  displayName: string;
  vendor: string;
  cost: number; // costToDone $, x (lower better)
  costLo?: number;
  costHi?: number;
  completion: number; // 0..1, y (higher better)
}

const W = 720;
const H = 420;
const PAD = { l: 56, r: 24, t: 24, b: 48 };

export function Frontier({ points }: { points: FrontierPoint[] }) {
  const [hover, setHover] = useState<string | null>(null);

  const { xScale, yScale, frontierPath, frontierIds, ticks } = useMemo(() => {
    const costs = points.flatMap((p) => [p.cost, p.costLo ?? p.cost, p.costHi ?? p.cost]);
    const minC = Math.min(...costs);
    const maxC = Math.max(...costs);
    const lminC = Math.log10(minC * 0.9);
    const lmaxC = Math.log10(maxC * 1.1);
    const innerW = W - PAD.l - PAD.r;
    const innerH = H - PAD.t - PAD.b;

    const xScale = (c: number) =>
      PAD.l + ((Math.log10(c) - lminC) / (lmaxC - lminC || 1)) * innerW;
    const yScale = (r: number) => PAD.t + (1 - r) * innerH;

    // Pareto frontier: minimize cost, maximize completion.
    const sorted = [...points].sort((a, b) => a.cost - b.cost);
    const frontier: FrontierPoint[] = [];
    let bestY = -Infinity;
    for (const p of sorted) {
      if (p.completion > bestY) {
        frontier.push(p);
        bestY = p.completion;
      }
    }
    const frontierIds = new Set(frontier.map((p) => p.modelId));
    const frontierPath = frontier
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.cost).toFixed(1)} ${yScale(p.completion).toFixed(1)}`)
      .join(' ');

    // x ticks at nice $ values within range
    const candidates = [0.1, 0.2, 0.3, 0.5, 0.75, 1, 1.5, 2];
    const ticks = candidates.filter((c) => c >= minC * 0.9 && c <= maxC * 1.1);

    return { xScale, yScale, frontierPath, frontierIds, ticks };
  }, [points]);

  return (
    <figure className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Cost-to-Done versus completion rate">
        {/* y gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((r) => (
          <g key={r}>
            <line x1={PAD.l} x2={W - PAD.r} y1={yScale(r)} y2={yScale(r)} stroke="#e5e9ef" strokeWidth={1} />
            <text x={PAD.l - 10} y={yScale(r) + 4} textAnchor="end" className="fill-faint" fontSize={11} fontFamily="var(--font-mono)">
              {Math.round(r * 100)}%
            </text>
          </g>
        ))}
        {/* x ticks */}
        {ticks.map((c) => (
          <g key={c}>
            <line x1={xScale(c)} x2={xScale(c)} y1={PAD.t} y2={H - PAD.b} stroke="#eef2f6" strokeWidth={1} />
            <text x={xScale(c)} y={H - PAD.b + 18} textAnchor="middle" className="fill-faint" fontSize={11} fontFamily="var(--font-mono)">
              ${c.toFixed(2)}
            </text>
          </g>
        ))}
        {/* axis labels */}
        <text x={(W) / 2} y={H - 8} textAnchor="middle" className="fill-muted" fontSize={11} fontFamily="var(--font-mono)">
          Cost-to-Done ($ / task, log) — cheaper →
        </text>
        <text x={16} y={H / 2} textAnchor="middle" transform={`rotate(-90 16 ${H / 2})`} className="fill-muted" fontSize={11} fontFamily="var(--font-mono)">
          Task completion (pass^3) — better ↑
        </text>

        {/* frontier line */}
        <path d={frontierPath} fill="none" stroke="#0b9d76" strokeWidth={1.5} strokeDasharray="2 3" opacity={0.7} />

        {/* points */}
        {points.map((p) => {
          const onFrontier = frontierIds.has(p.modelId);
          const isHover = hover === p.modelId;
          const x = xScale(p.cost);
          const y = yScale(p.completion);
          return (
            <g key={p.modelId} onMouseEnter={() => setHover(p.modelId)} onMouseLeave={() => setHover(null)} style={{ cursor: 'default' }}>
              {/* CI whisker on cost */}
              {p.costLo && p.costHi && (
                <line
                  x1={xScale(p.costLo)}
                  x2={xScale(p.costHi)}
                  y1={y}
                  y2={y}
                  stroke={onFrontier ? '#0b9d76' : '#d3dae3'}
                  strokeWidth={1}
                  opacity={isHover ? 0.9 : 0.4}
                />
              )}
              <circle
                cx={x}
                cy={y}
                r={isHover ? 6 : onFrontier ? 5 : 4}
                fill={onFrontier ? '#0b9d76' : '#ffffff'}
                stroke={onFrontier ? '#0b9d76' : '#8a95a4'}
                strokeWidth={1.5}
                opacity={onFrontier || isHover ? 1 : 0.65}
              />
              {(onFrontier || isHover) && (
                <text x={x + 9} y={y + 4} className="fill-ink" fontSize={11} fontFamily="var(--font-mono)">
                  {p.displayName}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-faint">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-accent" /> on the efficiency frontier
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full border border-line-bright" /> dominated
        </span>
        <span>horizontal bars = 95% CI on cost · hover a point for details</span>
      </figcaption>
    </figure>
  );
}
