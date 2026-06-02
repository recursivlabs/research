'use client';

import { useState } from 'react';
import { ModelScore, Metric, STANDARD_METRICS, AGENTIC_METRICS, metaFor } from '@/lib/types';
import { formatMetric, formatCI } from '@/lib/format';

type SortKey = 'recursivScore' | Metric;

const RANK_COLORS = ['text-accent', 'text-ink', 'text-muted'];

export function Leaderboard({ models }: { models: ModelScore[] }) {
  const [sort, setSort] = useState<SortKey>('recursivScore');

  const sorted = [...models].sort((a, b) => {
    if (sort === 'recursivScore') return b.recursivScore - a.recursivScore;
    return (b.normalized[sort] ?? -1) - (a.normalized[sort] ?? -1);
  });

  const Th = ({ k, label, tone, lead }: { k: SortKey; label: string; tone?: 'agentic'; lead?: boolean }) => (
    <th
      onClick={() => setSort(k)}
      title={k === 'recursivScore' ? 'Composite score (weighted). Click to sort.' : metaFor(k).blurb + ' Click to sort.'}
      className={`cursor-pointer whitespace-nowrap px-3 py-2.5 text-right font-mono text-[11px] font-medium uppercase tracking-wider transition-colors ${
        lead ? 'border-l border-line-bright' : ''
      } ${sort === k ? (tone === 'agentic' ? 'text-agentic' : 'text-accent') : 'text-faint hover:text-muted'}`}
    >
      {label}
      {sort === k ? ' ▾' : ''}
    </th>
  );

  return (
    <div className="overflow-x-auto scrollbar-thin rounded-xl border border-line bg-panel/40">
      <table className="w-full min-w-[920px] border-separate border-spacing-0">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-panel/40" colSpan={3} />
            <th colSpan={STANDARD_METRICS.length} className="border-l border-line-bright px-3 pb-1 pt-3 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
              Standard
            </th>
            <th colSpan={AGENTIC_METRICS.length} className="border-l border-agentic/40 bg-agentic/[0.06] px-3 pb-1 pt-3 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-agentic">
              Recursiv-only · agentic
            </th>
          </tr>
          <tr className="border-b border-line">
            <th className="sticky left-0 z-10 bg-panel/40 px-4 py-2.5 text-left font-mono text-[11px] uppercase tracking-wider text-faint">#</th>
            <th className="sticky left-10 z-10 bg-panel/40 px-3 py-2.5 text-left font-mono text-[11px] uppercase tracking-wider text-faint">Model</th>
            <Th k="recursivScore" label="Score" />
            {STANDARD_METRICS.map((m, i) => (
              <Th key={m.key} k={m.key} label={m.short} lead={i === 0} />
            ))}
            {AGENTIC_METRICS.map((m, i) => (
              <Th key={m.key} k={m.key} label={m.short} tone="agentic" lead={i === 0} />
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((m, i) => {
            const top = i < 3;
            return (
              <tr key={m.modelId} className={`group transition-colors hover:bg-panel ${top ? 'bg-panel/50' : ''}`}>
                <td className={`sticky left-0 z-10 px-4 py-4 text-left font-mono text-sm ${top ? RANK_COLORS[i] : 'text-faint'} ${top ? 'bg-panel/60' : 'bg-bg'} group-hover:bg-panel`}>
                  {top ? <span className="inline-flex items-center gap-1.5"><span className="text-base">●</span>{i + 1}</span> : i + 1}
                </td>
                <td className={`sticky left-10 z-10 px-3 py-4 ${top ? 'bg-panel/60' : 'bg-bg'} group-hover:bg-panel`}>
                  <div className="text-[15px] font-semibold tracking-tight text-ink">{m.displayName}</div>
                  <div className="font-mono text-[11px] text-faint">{m.vendor}</div>
                </td>
                <td className="px-3 py-4 text-right">
                  <span className="tabular font-mono text-lg font-semibold text-accent">{m.recursivScore.toFixed(0)}</span>
                </td>
                {STANDARD_METRICS.map((meta, idx) => (
                  <Cell key={meta.key} model={m} mkey={meta.key} lead={idx === 0} />
                ))}
                {AGENTIC_METRICS.map((meta, idx) => (
                  <Cell key={meta.key} model={m} mkey={meta.key} tone="agentic" lead={idx === 0} />
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Cell({ model, mkey, tone, lead }: { model: ModelScore; mkey: Metric; tone?: 'agentic'; lead?: boolean }) {
  const stat = model.metrics[mkey];
  const ci = formatCI(mkey, stat);
  const title = [stat?.nRuns ? `n=${stat.nRuns}` : null, ci ? `95% CI ${ci}` : null].filter(Boolean).join(' · ');
  const hero = mkey === 'costToDone';
  return (
    <td
      title={title || undefined}
      className={`whitespace-nowrap px-3 py-4 text-right tabular font-mono text-sm ${
        lead ? (tone === 'agentic' ? 'border-l border-agentic/40' : 'border-l border-line-bright') : ''
      } ${tone === 'agentic' ? 'bg-agentic/[0.04]' : ''} ${
        hero ? 'font-semibold text-agentic' : tone === 'agentic' ? 'text-ink' : 'text-muted'
      }`}
    >
      {formatMetric(mkey, stat)}
    </td>
  );
}
