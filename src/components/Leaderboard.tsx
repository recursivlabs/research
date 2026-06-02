'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ModelScore, Metric, STANDARD_METRICS, AGENTIC_METRICS, metaFor } from '@/lib/types';
import { formatMetric, formatCI } from '@/lib/format';
import { ScoreBar } from './ScoreBar';

type SortKey = 'recursivScore' | Metric;

export function Leaderboard({ models }: { models: ModelScore[] }) {
  const [sort, setSort] = useState<SortKey>('recursivScore');

  const sorted = [...models].sort((a, b) => {
    if (sort === 'recursivScore') return b.recursivScore - a.recursivScore;
    const na = a.normalized[sort] ?? -1;
    const nb = b.normalized[sort] ?? -1;
    return nb - na; // normalized is direction-adjusted, higher = better
  });

  const HeaderCell = ({ k, label, tone }: { k: SortKey; label: string; tone?: 'agentic' }) => (
    <th
      onClick={() => setSort(k)}
      className={`cursor-pointer whitespace-nowrap px-3 py-2 text-right font-mono text-[11px] font-medium uppercase tracking-wider transition-colors ${
        sort === k ? (tone === 'agentic' ? 'text-agentic' : 'text-accent') : 'text-faint hover:text-muted'
      }`}
      title={metaForLabel(k)}
    >
      {label}
      {sort === k ? ' ▾' : ''}
    </th>
  );

  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="w-full min-w-[860px] border-separate border-spacing-0">
        <thead>
          {/* group band */}
          <tr>
            <th className="sticky left-0 z-10 bg-bg" colSpan={2} />
            <th />
            <th
              colSpan={STANDARD_METRICS.length}
              className="px-3 pb-1 text-right font-mono text-[10px] uppercase tracking-[0.2em] text-faint"
            >
              Standard
            </th>
            <th
              colSpan={AGENTIC_METRICS.length}
              className="rounded-t-md border-x border-t border-agentic/30 bg-agentic/5 px-3 pb-1 pt-1 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-agentic"
            >
              Recursiv-only · agentic
            </th>
          </tr>
          <tr className="border-b border-line">
            <th className="sticky left-0 z-10 bg-bg px-3 py-2 text-left font-mono text-[11px] uppercase tracking-wider text-faint">
              #
            </th>
            <th className="sticky left-8 z-10 bg-bg px-3 py-2 text-left font-mono text-[11px] uppercase tracking-wider text-faint">
              Model
            </th>
            <HeaderCell k="recursivScore" label="Recursiv" />
            {STANDARD_METRICS.map((m) => (
              <HeaderCell key={m.key} k={m.key} label={m.short} />
            ))}
            {AGENTIC_METRICS.map((m) => (
              <HeaderCell key={m.key} k={m.key} label={m.short} tone="agentic" />
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((m, i) => (
            <tr key={m.modelId} className="group border-b border-line/60 hover:bg-panel/60">
              <td className="sticky left-0 z-10 bg-bg px-3 py-3 text-left font-mono text-sm text-faint group-hover:bg-panel/60">
                {i + 1}
              </td>
              <td className="sticky left-8 z-10 bg-bg px-3 py-3 group-hover:bg-panel/60">
                <div className="font-medium tracking-tight text-ink">{m.displayName}</div>
                <div className="font-mono text-[11px] text-faint">{m.vendor}</div>
              </td>
              <td className="px-3 py-3 text-right">
                <div className="tabular font-mono text-sm text-accent">{m.recursivScore.toFixed(1)}</div>
              </td>
              {STANDARD_METRICS.map((meta) => (
                <Cell key={meta.key} model={m} mkey={meta.key} />
              ))}
              {AGENTIC_METRICS.map((meta) => (
                <Cell key={meta.key} model={m} mkey={meta.key} tone="agentic" />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Cell({ model, mkey, tone }: { model: ModelScore; mkey: Metric; tone?: 'agentic' }) {
  const stat = model.metrics[mkey];
  const n = model.normalized[mkey];
  const ci = formatCI(mkey, stat);
  const title = [
    stat?.nRuns ? `n=${stat.nRuns}` : null,
    ci ? `95% CI ${ci}` : null,
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <td className={`px-3 py-3 text-right align-middle ${tone === 'agentic' ? 'bg-agentic/[0.03]' : ''}`} title={title || undefined}>
      <div className={`tabular font-mono text-sm ${tone === 'agentic' ? 'text-ink' : 'text-muted'}`}>
        {formatMetric(mkey, stat)}
      </div>
      <div className="mt-1.5">
        <ScoreBar value={n} tone={tone === 'agentic' ? 'agentic' : 'accent'} />
      </div>
    </td>
  );
}

function metaForLabel(k: SortKey): string {
  if (k === 'recursivScore') return 'Composite score across all metrics (weighted). Click to sort.';
  return metaFor(k).blurb + ' Click to sort.';
}
