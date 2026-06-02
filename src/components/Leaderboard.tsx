'use client';

import { useState } from 'react';
import { ModelScore, Metric, CORE_METRICS, metaFor } from '@/lib/types';
import { formatMetric, formatCI } from '@/lib/format';

type SortKey = 'recursivScore' | Metric;

const MEDAL = ['text-accent', 'text-ink', 'text-muted'];

export function Leaderboard({ models }: { models: ModelScore[] }) {
  const [sort, setSort] = useState<SortKey>('recursivScore');

  const sorted = [...models].sort((a, b) => {
    if (sort === 'recursivScore') return b.recursivScore - a.recursivScore;
    return (b.normalized[sort] ?? -1) - (a.normalized[sort] ?? -1);
  });

  const Th = ({ k, label, right = true }: { k: SortKey; label: string; right?: boolean }) => (
    <th
      onClick={() => setSort(k)}
      title={k === 'recursivScore' ? 'Overall composite. Click to sort.' : metaFor(k).blurb + ' Click to sort.'}
      className={`cursor-pointer select-none whitespace-nowrap px-4 py-3 font-mono text-[11px] font-medium uppercase tracking-wider transition-colors ${
        right ? 'text-right' : 'text-left'
      } ${sort === k ? 'text-accent' : 'text-faint hover:text-muted'}`}
    >
      {label}
      {sort === k ? ' ▾' : ''}
    </th>
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-panel/30">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[680px] border-separate border-spacing-0">
          <thead>
            <tr className="border-b border-line">
              <th className="px-5 py-3 text-left font-mono text-[11px] uppercase tracking-wider text-faint">#</th>
              <Th k="recursivScore" label="Model" right={false} />
              <Th k="recursivScore" label="Score" />
              {CORE_METRICS.map((m) => (
                <Th key={m.key} k={m.key} label={m.short} />
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((m, i) => {
              const top = i < 3;
              return (
                <tr key={m.modelId} className={`group border-b border-line/50 transition-colors hover:bg-panel ${top ? 'bg-panel/40' : ''}`}>
                  <td className={`px-5 py-5 font-mono text-sm ${top ? MEDAL[i] : 'text-faint'}`}>
                    {top ? <span className="inline-flex items-center gap-1.5"><span className="text-[10px]">●</span>{i + 1}</span> : i + 1}
                  </td>
                  <td className="py-5 pr-4">
                    <div className="text-[15px] font-semibold tracking-tight text-ink">{m.displayName}</div>
                    <div className="font-mono text-[11px] text-faint">{m.vendor}</div>
                  </td>
                  <td className="px-4 py-5">
                    <MetricCell value={`${m.recursivScore.toFixed(0)}`} norm={m.recursivScore} big />
                  </td>
                  {CORE_METRICS.map((meta) => (
                    <td key={meta.key} className="px-4 py-5">
                      <MetricCell
                        value={formatMetric(meta.key, m.metrics[meta.key])}
                        norm={m.normalized[meta.key]}
                        tone={meta.key === 'costToDone' ? 'agentic' : 'accent'}
                        title={ciTitle(m, meta.key)}
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* plain-language legend */}
      <div className="flex flex-wrap gap-x-6 gap-y-1.5 border-t border-line px-5 py-3 font-mono text-[11px] text-faint">
        <span><span className="text-muted">Score</span> overall</span>
        {CORE_METRICS.map((m) => (
          <span key={m.key}>
            <span className={m.key === 'costToDone' ? 'text-agentic' : 'text-muted'}>{m.short}</span> {m.plain}
          </span>
        ))}
        <span className="ml-auto">longer bar = better</span>
      </div>
    </div>
  );
}

function MetricCell({
  value,
  norm,
  tone = 'accent',
  big,
  title,
}: {
  value: string;
  norm?: number;
  tone?: 'accent' | 'agentic';
  big?: boolean;
  title?: string;
}) {
  const bar = tone === 'agentic' ? 'bg-agentic' : 'bg-accent';
  const track = tone === 'agentic' ? 'bg-agentic/10' : 'bg-accent/10';
  const text = big ? 'text-lg font-semibold text-accent' : tone === 'agentic' ? 'text-sm font-semibold text-agentic' : 'text-sm text-ink';
  return (
    <div className="flex flex-col items-end gap-1.5" title={title}>
      <span className={`tabular font-mono ${text}`}>{value}</span>
      <div className={`h-1 w-full max-w-[88px] overflow-hidden rounded-full ${track}`}>
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${Math.max(3, Math.min(100, norm ?? 0))}%` }} />
      </div>
    </div>
  );
}

function ciTitle(m: ModelScore, key: Metric): string | undefined {
  const stat = m.metrics[key];
  const ci = formatCI(key, stat);
  return [stat?.nRuns ? `n=${stat.nRuns}` : null, ci ? `95% CI ${ci}` : null].filter(Boolean).join(' · ') || undefined;
}
