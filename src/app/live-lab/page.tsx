import type { Metadata } from 'next';
import { fetchStream } from '@/lib/stream';
import { timeAgo } from '@/lib/format';
import { ActivityFeed } from '@/components/ActivityFeed';
import { CTASection } from '@/components/CTA';

export const revalidate = 30;

export const metadata: Metadata = {
  title: 'Live Research',
  description: 'Watch the Recursiv research swarm test models in real time: agents running experiments, scoring results, and updating the power rankings. No humans in the loop.',
};

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-line bg-panel px-4 py-3">
      <div className="tabular font-mono text-2xl text-accent">{value}</div>
      <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-faint">{label}</div>
    </div>
  );
}

export default async function LiveResearchPage() {
  const events = await fetchStream();
  const last = events[0]?.ts;
  const runs = events.filter((e) => e.kind === 'run').length;

  return (
    <>
      <section className="relative border-b border-line">
        <div className="bg-grid-faint absolute inset-0 h-40" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-6 pb-12 pt-12">
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
            <Stat value="10" label="models under test" />
            <Stat value="4" label="use cases" />
            <Stat value={`${runs}`} label="runs in feed" />
            <Stat value={last ? timeAgo(last) : '—'} label="last event" />
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl px-6 py-10">
          <ActivityFeed initial={events} />
          <p className="mt-6 text-center font-mono text-[11px] text-faint">
            this feed pulls directly from the swarm and refreshes as new experiments run
          </p>
        </div>
      </section>

      <CTASection />
    </>
  );
}
