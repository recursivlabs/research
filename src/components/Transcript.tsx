'use client';

import { useState } from 'react';
import { fmtCost } from '@/lib/format';

export interface Receipt {
  model: string;
  task: string;
  category: string;
  answer: string;
  pass: boolean;
  quality: number;
  cost: number;
}

export interface TranscriptData {
  runs: Receipt[];
}

type Filter = 'all' | 'pass' | 'fail';

export function Transcript({ data }: { data: TranscriptData }) {
  const runs = data?.runs ?? [];
  const [open, setOpen] = useState<number | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  if (!runs.length) return null;

  const passed = runs.filter((r) => r.pass).length;
  const shown = runs.filter((r) => (filter === 'all' ? true : filter === 'pass' ? r.pass : !r.pass));

  const Chip = ({ k, label }: { k: Filter; label: string }) => (
    <button
      onClick={() => { setFilter(k); setOpen(null); }}
      className={`rounded-full border px-3 py-1 font-mono text-[11px] transition-colors ${filter === k ? 'border-accent/40 bg-accent/10 text-accent' : 'border-line text-faint hover:text-muted'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="mt-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="mr-1 font-mono text-xs text-faint">
          {runs.length} graded runs · <span className="text-completion">{passed} passed</span> · <span className="text-bad">{runs.length - passed} failed</span>
        </span>
        <Chip k="all" label={`All ${runs.length}`} />
        <Chip k="pass" label={`Passed ${passed}`} />
        <Chip k="fail" label={`Failed ${runs.length - passed}`} />
        <span className="ml-auto font-mono text-[11px] text-faint/70">tap a run to read the answer</span>
      </div>
      <div className="divide-y divide-line overflow-hidden rounded-xl border border-line">
        {shown.map((r, i) => {
          const isOpen = open === i;
          return (
            <div key={i}>
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-panel"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className={`shrink-0 font-mono text-[11px] font-semibold ${r.pass ? 'text-completion' : 'text-bad'}`}>{r.pass ? '✓' : '✗'}</span>
                  <span className="truncate text-[13px] text-ink">{r.task}</span>
                  <span className="hidden shrink-0 font-mono text-[10px] uppercase tracking-wider text-faint sm:inline">{r.category}</span>
                </div>
                <div className="flex shrink-0 items-center gap-2.5 font-mono text-[11px] text-faint sm:gap-3.5">
                  <span className="max-w-[88px] truncate text-muted sm:max-w-none">{r.model}</span>
                  <span className="hidden sm:inline">q{r.quality}</span>
                  <span className="text-agentic">{fmtCost(r.cost)}</span>
                  <span className="w-3 text-center">{isOpen ? '−' : '+'}</span>
                </div>
              </button>
              {isOpen && (
                <pre className="scrollbar-thin overflow-x-auto whitespace-pre-wrap border-t border-line bg-panel/40 px-4 py-3 font-mono text-[12px] leading-relaxed text-muted">{r.answer}</pre>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
