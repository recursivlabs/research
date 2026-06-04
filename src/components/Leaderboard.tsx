'use client';

import { useState } from 'react';
import { ModelScore, Metric, MetricStat, UseCase, USE_CASES, CORE_METRICS } from '@/lib/types';
import { formatMetric } from '@/lib/format';

type Cat = 'all' | UseCase;
type SortKey = 'value' | Metric;

const COL: Record<string, { label: string; tip: string; text: string; bar: string; track: string }> = {
  completionRate: { label: 'Reliability', tip: 'How often it actually finishes the task across repeated runs.', text: 'text-completion', bar: 'bg-completion', track: 'bg-completion/10' },
  costToDone: { label: 'Cost-to-Done', tip: 'Real dollars to finish the task, retries included. Not price-per-token.', text: 'text-agentic', bar: 'bg-agentic', track: 'bg-agentic/10' },
  quality: { label: 'Quality', tip: 'How good the finished result is, graded by an independent judge.', text: 'text-quality', bar: 'bg-quality', track: 'bg-quality/10' },
};

function metricsFor(m: ModelScore, cat: Cat): Partial<Record<Metric, MetricStat>> {
  return cat === 'all' ? m.metrics : m.byCategory?.[cat] ?? {};
}
const val = (mm: Partial<Record<Metric, MetricStat>>) => {
  const rel = mm.completionRate?.value ?? 0;
  const cost = mm.costToDone?.value ?? 0;
  return cost > 0 ? rel / cost : 0; // reliability per dollar
};

export function Leaderboard({ models }: { models: ModelScore[] }) {
  const [cat, setCat] = useState<Cat>('all');
  const [sort, setSort] = useState<SortKey>('value');

  const rows = models
    .map((m) => ({ m, mm: metricsFor(m, cat) }))
    .filter((r) => r.mm.completionRate && r.mm.costToDone);

  // normalized bars (direction-adjusted, 0..100) across visible rows per metric
  const norm: Record<Metric, Map<string, number>> = { completionRate: new Map(), costToDone: new Map(), quality: new Map() } as any;
  for (const meta of CORE_METRICS) {
    const vals = rows.map((r) => r.mm[meta.key]?.value).filter((v): v is number => typeof v === 'number');
    const min = Math.min(...vals), max = Math.max(...vals), span = max - min || 1;
    for (const r of rows) {
      const v = r.mm[meta.key]?.value;
      if (typeof v === 'number') norm[meta.key].set(r.m.modelId, Math.round(((meta.better === 'up' ? v - min : max - v) / span) * 100));
    }
  }

  const sorted = [...rows].sort((a, b) => {
    if (sort === 'value') return val(b.mm) - val(a.mm);
    return (norm[sort].get(b.m.modelId) ?? -1) - (norm[sort].get(a.m.modelId) ?? -1);
  });

  // verdicts
  const bestValue = [...rows].sort((a, b) => val(b.mm) - val(a.mm))[0];
  const mostReliable = [...rows].sort((a, b) => (b.mm.completionRate!.value - a.mm.completionRate!.value) || ((b.mm.quality?.value ?? 0) - (a.mm.quality?.value ?? 0)))[0];
  const works = rows.filter((r) => (r.mm.completionRate?.value ?? 0) >= 0.8);
  const cheapest = (works.length ? works : rows).sort((a, b) => a.mm.costToDone!.value - b.mm.costToDone!.value)[0];

  return (
    <div>
      {/* verdict cards */}
      <div className="mb-2 grid gap-3 sm:grid-cols-3">
        <Verdict
          label="Best value"
          why="most reliability per dollar"
          model={bestValue?.m.displayName}
          stat={bestValue ? `finishes ${formatMetric('completionRate', bestValue.mm.completionRate)} of tasks at ${formatMetric('costToDone', bestValue.mm.costToDone)} each` : ''}
          tone="accent"
        />
        <Verdict
          label="Most reliable"
          why="finishes the most tasks"
          model={mostReliable?.m.displayName}
          stat={mostReliable ? `${formatMetric('completionRate', mostReliable.mm.completionRate)} of tasks finished · ${formatMetric('costToDone', mostReliable.mm.costToDone)}/task` : ''}
          tone="completion"
        />
        <Verdict
          label="Cheapest that works"
          why="lowest cost above 80% reliable"
          model={cheapest?.m.displayName}
          stat={cheapest ? `${formatMetric('costToDone', cheapest.mm.costToDone)} per task · ${formatMetric('completionRate', cheapest.mm.completionRate)} finished` : ''}
          tone="agentic"
        />
      </div>
      <p className="mb-5 font-mono text-[11px] text-faint">
        Reliability = share of tasks finished across repeated runs. Cost-to-Done = real $ to finish one task.
      </p>

      {/* use-case tabs */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        <Tab active={cat === 'all'} onClick={() => setCat('all')}>All tasks</Tab>
        {USE_CASES.map((uc) => (
          <Tab key={uc.key} active={cat === uc.key} onClick={() => setCat(uc.key)}>{uc.label}</Tab>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-panel/30">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[680px] table-fixed border-separate border-spacing-0">
            <colgroup>
              <col style={{ width: '52px' }} />
              <col />
              {CORE_METRICS.map((m) => (<col key={m.key} style={{ width: '150px' }} />))}
            </colgroup>
            <thead>
              <tr className="border-b border-line">
                <th className="px-4 py-3 text-left font-mono text-[11px] uppercase tracking-wider text-faint">#</th>
                <th className="py-3 pr-4 text-left font-mono text-[11px] uppercase tracking-wider text-faint">Model</th>
                {CORE_METRICS.map((m) => (
                  <th
                    key={m.key}
                    onClick={() => setSort(m.key)}
                    title={COL[m.key].tip}
                    className={`group cursor-pointer select-none whitespace-nowrap px-4 py-3 text-right font-mono text-[11px] font-medium uppercase tracking-wider transition-colors ${sort === m.key ? COL[m.key].text : 'text-faint hover:text-muted'}`}
                  >
                    <span className="underline decoration-dotted decoration-line-bright underline-offset-4 group-hover:decoration-current">{COL[m.key].label}</span>
                    {sort === m.key ? ' ▾' : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((r, i) => {
                const top = i < 3;
                return (
                  <tr key={r.m.modelId} className="row-in group border-b border-line/50 transition-colors hover:bg-panel" style={{ animationDelay: `${i * 45}ms` }}>
                    <td className={`px-4 py-5 font-mono text-sm ${top ? ['text-accent', 'text-ink', 'text-muted'][i] : 'text-faint'}`}>
                      {top ? <span className="inline-flex items-center gap-1.5"><span className="text-[10px]">●</span>{i + 1}</span> : i + 1}
                    </td>
                    <td className="py-5 pr-4">
                      <div className="truncate text-[15px] font-semibold tracking-tight text-ink">{r.m.displayName}</div>
                      <div className="font-mono text-[11px] text-faint">{r.m.vendor}</div>
                    </td>
                    {CORE_METRICS.map((meta, ci) => (
                      <td key={meta.key} className="px-4 py-5" title={ciTitle(r.mm[meta.key])}>
                        <Cell value={formatMetric(meta.key, r.mm[meta.key])} norm={norm[meta.key].get(r.m.modelId)} col={COL[meta.key]} delay={i * 45 + ci * 60} />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line px-5 py-3 font-mono text-[11px] text-faint">
          {CORE_METRICS.map((m) => (
            <span key={m.key} className="inline-flex items-center gap-1.5">
              <span className={`inline-block h-1.5 w-3 rounded-full ${COL[m.key].bar}`} />
              {COL[m.key].label}
            </span>
          ))}
          <span className="ml-auto text-faint/70">ranked by value (reliability per dollar) · longer bar = better</span>
        </div>
      </div>
    </div>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors ${active ? 'border-accent/40 bg-accent/10 text-accent' : 'border-line text-faint hover:border-line-bright hover:text-muted'}`}
    >
      {children}
    </button>
  );
}

function Verdict({ label, why, model, stat, tone }: { label: string; why: string; model?: string; stat: string; tone: 'accent' | 'completion' | 'agentic' }) {
  const color = tone === 'completion' ? 'text-completion' : tone === 'agentic' ? 'text-agentic' : 'text-accent';
  const dot = tone === 'completion' ? 'bg-completion' : tone === 'agentic' ? 'bg-agentic' : 'bg-accent';
  return (
    <div className="rounded-xl border border-line bg-panel p-4">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-faint">
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${dot}`} />
        {label}
        <span className="font-normal normal-case tracking-normal text-faint/70">· {why}</span>
      </div>
      <div className={`mt-2 text-lg font-semibold tracking-tight ${color}`}>{model ?? '—'}</div>
      <div className="mt-1 text-[13px] leading-snug text-muted">{stat}</div>
    </div>
  );
}

function Cell({ value, norm, col, delay }: { value: string; norm?: number; col: { text: string; bar: string; track: string }; delay: number }) {
  return (
    <div className="flex flex-col items-end gap-1.5">
      <span className={`tabular font-mono text-sm font-medium ${col.text}`}>{value}</span>
      <div className={`h-1 w-full max-w-[96px] overflow-hidden rounded-full ${col.track}`}>
        <div className={`bar-grow h-full rounded-full ${col.bar}`} style={{ width: `${Math.max(3, Math.min(100, norm ?? 0))}%`, animationDelay: `${delay}ms` }} />
      </div>
    </div>
  );
}

function ciTitle(stat?: MetricStat): string | undefined {
  if (!stat) return undefined;
  const ci = stat.ci95 ? `95% CI ${stat.ci95[0]}–${stat.ci95[1]}` : null;
  return [stat.nRuns ? `n=${stat.nRuns}` : null, ci].filter(Boolean).join(' · ') || undefined;
}
