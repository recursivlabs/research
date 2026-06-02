'use client';

import { useEffect, useRef, useState } from 'react';
import { ModelScore, Metric, CORE_METRICS } from '@/lib/types';
import { formatMetric, formatCI } from '@/lib/format';

type SortKey = 'recursivScore' | Metric;

const MEDAL = ['text-accent', 'text-ink', 'text-muted'];

// per-column color + plain-language tooltip
const COL: Record<string, { label: string; tip: string; text: string; bar: string; track: string }> = {
  recursivScore: {
    label: 'Overall',
    tip: 'Overall rank: a weighted blend of completion, quality, and cost-to-done.',
    text: 'text-accent',
    bar: 'bg-accent',
    track: 'bg-accent/10',
  },
  completionRate: {
    label: 'Completion %',
    tip: 'How reliably the model finishes real multi-step tasks end-to-end.',
    text: 'text-completion',
    bar: 'bg-completion',
    track: 'bg-completion/10',
  },
  quality: {
    label: 'Quality',
    tip: 'How good the finished result is, graded by an independent judge model.',
    text: 'text-quality',
    bar: 'bg-quality',
    track: 'bg-quality/10',
  },
  costToDone: {
    label: 'Cost-to-Done',
    tip: 'Real dollars to finish the task, retries included. Not price-per-token.',
    text: 'text-agentic',
    bar: 'bg-agentic',
    track: 'bg-agentic/10',
  },
};

const COLS: SortKey[] = ['recursivScore', 'completionRate', 'quality', 'costToDone'];

export function Leaderboard({ models }: { models: ModelScore[] }) {
  const [sort, setSort] = useState<SortKey>('recursivScore');

  const sorted = [...models].sort((a, b) => {
    if (sort === 'recursivScore') return b.recursivScore - a.recursivScore;
    return (b.normalized[sort] ?? -1) - (a.normalized[sort] ?? -1);
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-panel/30">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[760px] table-fixed border-separate border-spacing-0">
          <colgroup>
            <col style={{ width: '52px' }} />
            <col />
            {COLS.map((c) => (
              <col key={c} style={{ width: '150px' }} />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b border-line">
              <th className="px-4 py-3 text-left font-mono text-[11px] uppercase tracking-wider text-faint">#</th>
              <th className="py-3 pr-4 text-left font-mono text-[11px] uppercase tracking-wider text-faint">Model</th>
              {COLS.map((c) => (
                <th
                  key={c}
                  onClick={() => setSort(c)}
                  title={COL[c].tip}
                  className={`group cursor-pointer select-none whitespace-nowrap px-4 py-3 text-right font-mono text-[11px] font-medium uppercase tracking-wider transition-colors ${
                    sort === c ? COL[c].text : 'text-faint hover:text-muted'
                  }`}
                >
                  <span className="underline decoration-dotted decoration-line-bright underline-offset-4 group-hover:decoration-current">
                    {COL[c].label}
                  </span>
                  {sort === c ? ' ▾' : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((m, i) => {
              const top = i < 3;
              return (
                <tr
                  key={m.modelId}
                  className="row-in group border-b border-line/50 transition-colors hover:bg-panel"
                  style={{ animationDelay: `${i * 45}ms` }}
                >
                  <td className={`px-4 py-5 font-mono text-sm ${top ? MEDAL[i] : 'text-faint'}`}>
                    {top ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="text-[10px]">●</span>
                        {i + 1}
                      </span>
                    ) : (
                      i + 1
                    )}
                  </td>
                  <td className="py-5 pr-4">
                    <div className="truncate text-[15px] font-semibold tracking-tight text-ink">{m.displayName}</div>
                    <div className="font-mono text-[11px] text-faint">{m.vendor}</div>
                  </td>
                  {COLS.map((c, ci) => (
                    <td key={c} className="px-4 py-5" title={ciTitle(m, c)}>
                      <Cell
                        value={c === 'recursivScore' ? undefined : formatMetric(c as Metric, m.metrics[c as Metric])}
                        count={c === 'recursivScore' ? m.recursivScore : undefined}
                        norm={c === 'recursivScore' ? m.recursivScore : m.normalized[c as Metric]}
                        col={COL[c]}
                        big={c === 'recursivScore'}
                        delay={i * 45 + ci * 60}
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* clean color key */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line px-5 py-3 font-mono text-[11px] text-faint">
        {COLS.map((c) => (
          <span key={c} className="inline-flex items-center gap-1.5">
            <span className={`inline-block h-1.5 w-3 rounded-full ${COL[c].bar}`} />
            {COL[c].label}
          </span>
        ))}
        <span className="ml-auto text-faint/70">longer bar = better</span>
      </div>
    </div>
  );
}

function Cell({
  value,
  count,
  norm,
  col,
  big,
  delay,
}: {
  value?: string;
  count?: number;
  norm?: number;
  col: { text: string; bar: string; track: string };
  big?: boolean;
  delay: number;
}) {
  const counted = useCountUp(count ?? 0);
  const display = count !== undefined ? `${Math.round(counted)}` : value ?? '—';
  return (
    <div className="flex flex-col items-end gap-1.5">
      <span className={`tabular font-mono ${big ? 'text-lg font-semibold' : 'text-sm font-medium'} ${col.text}`}>
        {display}
      </span>
      <div className={`h-1 w-full max-w-[96px] overflow-hidden rounded-full ${col.track}`}>
        <div
          className={`bar-grow h-full rounded-full ${col.bar}`}
          style={{ width: `${Math.max(3, Math.min(100, norm ?? 0))}%`, animationDelay: `${delay}ms` }}
        />
      </div>
    </div>
  );
}

function useCountUp(target: number, ms = 900): number {
  const [v, setV] = useState(0);
  const ref = useRef(0);
  useEffect(() => {
    let raf = 0;
    let start = 0;
    const ease = (p: number) => 1 - Math.pow(1 - p, 3);
    const tick = (now: number) => {
      if (!start) start = now;
      const p = Math.min(1, (now - start) / ms);
      ref.current = target * ease(p);
      setV(ref.current);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

function ciTitle(m: ModelScore, key: SortKey): string | undefined {
  if (key === 'recursivScore') return undefined;
  const stat = m.metrics[key as Metric];
  const ci = formatCI(key as Metric, stat);
  return [stat?.nRuns ? `n=${stat.nRuns}` : null, ci ? `95% CI ${ci}` : null].filter(Boolean).join(' · ') || undefined;
}
