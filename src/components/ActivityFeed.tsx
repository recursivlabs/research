'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StreamEvent, StreamKind } from '@/lib/types';
import { timeAgo } from '@/lib/format';

const KIND: Record<StreamKind, { label: string; dot: string; pill: string }> = {
  ranking: { label: 'RANKING', dot: 'bg-accent', pill: 'text-accent border-accent/30' },
  experiment: { label: 'EXPERIMENT', dot: 'bg-accent', pill: 'text-accent border-accent/30' },
  run: { label: 'RUN', dot: 'bg-completion', pill: 'text-completion border-completion/30' },
  judge: { label: 'JUDGE', dot: 'bg-quality', pill: 'text-quality border-quality/30' },
  cost: { label: 'COST', dot: 'bg-agentic', pill: 'text-agentic border-agentic/30' },
  retry: { label: 'RETRY', dot: 'bg-warn', pill: 'text-warn border-warn/30' },
  transcript: { label: 'ARCHIVE', dot: 'bg-faint', pill: 'text-faint border-line-bright' },
  swarm: { label: 'SWARM', dot: 'bg-ink', pill: 'text-ink border-line-bright' },
};

export function ActivityFeed({ initial }: { initial: StreamEvent[] }) {
  const [events, setEvents] = useState<StreamEvent[]>(initial);
  const [, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    const pull = async () => {
      try {
        const res = await fetch('/api/stream', { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        if (alive && Array.isArray(json.events)) setEvents(json.events);
      } catch {
        /* keep last good */
      }
    };
    const poll = setInterval(pull, 20_000); // pull new swarm events
    const tick = setInterval(() => setTick((t) => t + 1), 30_000); // refresh relative times
    return () => {
      alive = false;
      clearInterval(poll);
      clearInterval(tick);
    };
  }, []);

  const last = events[0]?.ts;

  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">Activity</h2>
          {last && <span className="font-mono text-[11px] text-faint">last event {timeAgo(last)}</span>}
        </div>
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-good">
          <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-good" />
          live
        </span>
      </div>

      <ol>
        {events.map((e, i) => {
          const k = KIND[e.kind] ?? KIND.swarm;
          return (
            <li key={`${e.ts}-${i}`} className="flex items-start gap-3 border-b border-line/50 py-4 sm:gap-4">
              <span className="w-16 shrink-0 pt-0.5 text-right font-mono text-[11px] text-faint sm:w-20">
                {timeAgo(e.ts)}
              </span>
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${k.dot}`} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${k.pill}`}>
                    {k.label}
                  </span>
                  <span className="font-mono text-[11px] text-faint">{e.actor}</span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-ink">
                  {e.text}
                  {e.experiment && (
                    <>
                      {' '}
                      <Link href={`/experiments/${e.experiment}`} className="font-mono text-xs text-accent underline-offset-4 hover:underline">
                        view →
                      </Link>
                    </>
                  )}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
}
