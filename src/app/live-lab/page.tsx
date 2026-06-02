import type { Metadata } from 'next';
import Link from 'next/link';
import { getStream, StreamKind } from '@/lib/stream';
import { timeAgo } from '@/lib/format';
import { CTASection } from '@/components/CTA';

export const revalidate = 30;

export const metadata: Metadata = {
  title: 'Live Lab',
  description: 'Watch the Recursiv research swarm test models in real time: agents running experiments, scoring results, and updating the power rankings. No humans in the loop.',
};

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

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border border-line bg-panel px-4 py-3">
      <div className="tabular font-mono text-2xl text-accent">{value}</div>
      <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-faint">{label}</div>
    </div>
  );
}

export default function LiveLabPage() {
  const events = getStream();
  const last = events[0]?.ts;
  const runs = events.filter((e) => e.kind === 'run').length;
  const experiments = events.filter((e) => e.kind === 'experiment').length;

  return (
    <>
      <section className="relative border-b border-line">
        <div className="bg-grid-faint absolute inset-0 h-40" aria-hidden />
        <div className="relative mx-auto max-w-4xl px-6 pb-12 pt-12">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-good">
            <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-good" />
            Live · autonomous research swarm
          </div>
          <h1 className="mt-4 max-w-3xl text-balance text-3xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
            Watch the swarm <span className="text-accent">test models in real time</span>.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted sm:text-lg">
            A live audit trail of the agents running experiments, scoring results, and updating the power
            rankings. No humans in the loop. This is the research happening, as it happens.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat value="8" label="agents active" />
            <Stat value="10" label="models under test" />
            <Stat value={`${runs}+`} label="runs in feed" />
            <Stat value={last ? timeAgo(last) : '—'} label="last event" />
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-4xl px-6 py-10">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">Activity</h2>
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-good">
              <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-good" />
              streaming
            </span>
          </div>

          <ol>
            {events.map((e, i) => {
              const k = KIND[e.kind];
              return (
                <li
                  key={`${e.ts}-${i}`}
                  className="row-in flex items-start gap-3 border-b border-line/50 py-4 sm:gap-4"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
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
                          <Link
                            href={`/experiments/${e.experiment}`}
                            className="font-mono text-xs text-accent underline-offset-4 hover:underline"
                          >
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

          <p className="mt-6 text-center font-mono text-[11px] text-faint">
            this feed wires directly to the swarm as it scales to daily autonomous runs
          </p>
        </div>
      </section>

      <CTASection />
    </>
  );
}
