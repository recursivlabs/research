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

export function Transcript({ data }: { data: TranscriptData }) {
  const runs = data?.runs ?? [];
  if (!runs.length) return null;
  return (
    <div className="mt-5 space-y-3">
      {runs.map((r, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-line bg-panel">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 border-b border-line px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className={`shrink-0 font-mono text-[11px] font-semibold ${r.pass ? 'text-completion' : 'text-bad'}`}>
                {r.pass ? '✓ PASSED' : '✗ FAILED'}
              </span>
              <span className="truncate text-sm font-medium text-ink">{r.task}</span>
              <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-faint">{r.category}</span>
            </div>
            <div className="flex shrink-0 items-center gap-3 font-mono text-[11px] text-faint">
              <span className="text-ink">{r.model}</span>
              <span>quality {r.quality}</span>
              <span className="text-agentic">{fmtCost(r.cost)}</span>
            </div>
          </div>
          <pre className="scrollbar-thin overflow-x-auto whitespace-pre-wrap px-4 py-3 font-mono text-[12px] leading-relaxed text-muted">{r.answer}</pre>
        </div>
      ))}
    </div>
  );
}
