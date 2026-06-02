import type { Metadata } from 'next';
import Link from 'next/link';
import { CORE_METRICS, metaFor, Metric } from '@/lib/types';
import { DEFAULT_WEIGHTS } from '@/lib/leaderboard';
import { CTASection } from '@/components/CTA';

export const metadata: Metadata = {
  title: 'How it works',
  description: 'Recursiv autonomously runs agents on real multi-step work, turns every run into a measured experiment, and synthesizes them into the power rankings in real time.',
};

const METRIC_COLOR: Record<string, string> = {
  completionRate: 'text-completion',
  quality: 'text-quality',
  costToDone: 'text-agentic',
};

const STEPS = [
  {
    n: '01',
    title: 'Agents do real work',
    body: 'Recursiv continuously runs fleets of agents on real, multi-step tasks. Models drive actual tools and repos, alone and in coordinated swarms, around the clock.',
    tag: 'autonomous · multi-agent',
  },
  {
    n: '02',
    title: 'Every run is an experiment',
    body: 'Each run is measured: did it finish, how good was the result, what did it really cost. The full agent transcript is saved. Browse them all on the experiments page.',
    tag: 'measured · transcripted',
    link: { href: '/experiments', label: 'See the experiments →' },
  },
  {
    n: '03',
    title: 'Synthesized into rankings',
    body: 'Results roll up into one overall score per model and refresh the power rankings. Continuously, in real time, with no human grading the work.',
    tag: 'real-time · self-running',
  },
];

export default function MethodologyPage() {
  return (
    <>
      {/* hero */}
      <section className="relative border-b border-line">
        <div className="bg-grid-faint absolute inset-0 h-40" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-6 pb-14 pt-12">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
            <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-accent" />
            Powered by Recursiv · autonomous &amp; real-time
          </div>
          <h1 className="mt-4 max-w-3xl text-balance text-3xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
            The rankings <span className="text-accent">run themselves</span>.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted sm:text-lg">
            No human graders, no synthetic quizzes. Recursiv runs agents on real work, measures what actually
            happens, and turns it into the power rankings. Here is the loop.
          </p>
        </div>
      </section>

      {/* the loop */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="grid items-stretch gap-4 lg:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="relative flex flex-col rounded-xl border border-line bg-panel p-6">
                <div className="flex items-center justify-between">
                  <span className="tabular font-mono text-3xl font-semibold text-accent">{s.n}</span>
                  <span className="rounded-full border border-line-bright px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-faint">
                    {s.tag}
                  </span>
                </div>
                <h2 className="mt-5 text-xl font-semibold tracking-tight text-ink">{s.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
                {s.link && (
                  <Link href={s.link.href} className="mt-4 font-mono text-xs text-accent underline-offset-4 hover:underline">
                    {s.link.label}
                  </Link>
                )}
              </div>
            ))}
          </div>
          <p className="mt-6 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
            agents → experiments → power rankings → repeat
          </p>
        </div>
      </section>

      {/* what each score means */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="text-2xl font-semibold tracking-tight text-ink">What each score means</h2>
          <p className="mt-2 max-w-2xl text-muted">
            Three numbers answer the only question that matters for shipping agents: does it work, is it good,
            what does it cost?
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {CORE_METRICS.map((m) => (
              <div key={m.key} className="rounded-xl border border-line bg-panel p-5">
                <div className="flex items-center gap-2">
                  <span className={`inline-block h-2 w-2 rounded-full ${METRIC_COLOR[m.key]?.replace('text-', 'bg-')}`} />
                  <span className={`font-semibold ${METRIC_COLOR[m.key]}`}>{m.label}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted">{m.blurb}</p>
              </div>
            ))}
          </div>

          {/* overall composite */}
          <div className="mt-6 rounded-xl border border-line bg-panel p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-lg font-semibold tracking-tight text-ink">Overall score</h3>
              <span className="font-mono text-[11px] uppercase tracking-wider text-faint">weighted blend</span>
            </div>
            <div className="mt-4 space-y-2.5">
              {(Object.entries(DEFAULT_WEIGHTS) as [Metric, number][])
                .sort((a, b) => b[1] - a[1])
                .map(([k, w]) => (
                  <div key={k} className="flex items-center gap-4">
                    <span className="w-36 shrink-0 text-sm text-ink">{metaFor(k).label}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-accent/10">
                      <div className="bar-grow h-full rounded-full bg-accent" style={{ width: `${w * 100 * 2.2}%` }} />
                    </div>
                    <span className="tabular w-10 text-right font-mono text-sm text-accent">{Math.round(w * 100)}%</span>
                  </div>
                ))}
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              ['Real dollars', 'Cost is actual provider spend per call, summed across the whole task including retries.'],
              ['Reliability over peak', 'Each task runs many times. We report pass^k consistency, not a lucky best-of-N.'],
              ['Contamination resistant', 'Held-out tasks; the grader runs outside the agent sandbox, so a model cannot read the answer.'],
            ].map(([t, d]) => (
              <div key={t} className="rounded-lg border border-line bg-panel/60 p-4">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                  <span className="text-sm font-medium text-ink">{t}</span>
                </div>
                <p className="mt-1.5 text-sm text-muted">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTASection />
    </>
  );
}
