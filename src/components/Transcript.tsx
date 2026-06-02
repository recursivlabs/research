'use client';

import { useState } from 'react';

export interface TranscriptStep {
  role: 'agent' | 'tool' | 'result';
  toolName?: string;
  text: string;
  status?: 'success' | 'error';
  durationMs?: number;
}

export interface TranscriptData {
  model: string;
  task: string;
  costUsd: number;
  steps: TranscriptStep[];
}

export function Transcript({ data }: { data: TranscriptData }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="my-8 overflow-hidden rounded-lg border border-line bg-panel">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-panel-2"
      >
        <div>
          <div className="font-mono text-[11px] uppercase tracking-wider text-accent">View the real agent run</div>
          <div className="mt-1 text-sm text-muted">
            <span className="text-ink">{data.model}</span> · {data.task} ·{' '}
            <span className="tabular font-mono text-accent">${data.costUsd.toFixed(2)} to done</span>
          </div>
        </div>
        <span className="font-mono text-faint">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <ol className="divide-y divide-line border-t border-line">
          {data.steps.map((s, i) => (
            <li key={i} className="flex gap-3 px-5 py-3 font-mono text-[13px]">
              <span className="select-none text-faint">{String(i + 1).padStart(2, '0')}</span>
              <div className="min-w-0 flex-1">
                {s.role === 'tool' && (
                  <span
                    className={`mr-2 rounded px-1.5 py-0.5 text-[11px] ${
                      s.status === 'error' ? 'bg-bad/15 text-bad' : 'bg-agentic/15 text-agentic'
                    }`}
                  >
                    {s.toolName}
                    {s.status === 'error' ? ' ✗' : ''}
                  </span>
                )}
                <span className={s.role === 'agent' ? 'text-ink' : 'text-muted'}>{s.text}</span>
                {s.durationMs ? <span className="ml-2 text-faint">{s.durationMs}ms</span> : null}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
