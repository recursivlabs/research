import type { Metadata } from 'next';
import { METRIC_META, metaFor, Metric } from '@/lib/types';
import { DEFAULT_WEIGHTS } from '@/lib/leaderboard';
import { CTASection } from '@/components/CTA';

export const metadata: Metadata = {
  title: 'Methodology',
  description: 'How Recursiv Research measures models: held-out tasks, real cost, confidence intervals, and the composite Recursiv Score.',
};

export default function MethodologyPage() {
  return (
    <>
      <article className="mx-auto max-w-3xl px-6 pb-8 pt-16">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Methodology</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">How we measure</h1>
        <p className="mt-4 text-lg text-muted">
          Most leaderboards measure models in a vacuum: one prompt, one turn, price per token. We measure
          them doing real, multi-step work as agents, and we show our uncertainty.
        </p>

        <h2 className="mt-12 text-2xl font-semibold tracking-tight text-ink">Principles</h2>
        <ul className="mt-4 space-y-3 text-muted">
          <li>
            <strong className="text-ink">Real tasks, real tools.</strong> Models run on Recursiv against live
            tools and repos, not frozen sandboxes. Completion is graded by outcomes (tests pass, task done),
            not preference.
          </li>
          <li>
            <strong className="text-ink">Real dollars.</strong> Cost is the actual provider spend recorded per
            call, summed across the entire task including retries and self-correction.
          </li>
          <li>
            <strong className="text-ink">Reliability over peak.</strong> We run each task many times and report
            pass^k consistency, not a single lucky best-of-N.
          </li>
          <li>
            <strong className="text-ink">Show the uncertainty.</strong> Every number carries its sample size
            and a 95% confidence interval. Hover any cell on the leaderboard to see them.
          </li>
          <li>
            <strong className="text-ink">Contamination resistant.</strong> Tasks are held out and the grader
            runs outside the agent&apos;s sandbox, so a model cannot pass by reading the answer. Eight popular
            agent benchmarks have been shown to be gameable to ~100% without solving anything; we designed
            against that failure mode.
          </li>
          <li>
            <strong className="text-ink">Reproducible.</strong> The harness runs on Recursiv. You can run it
            against your own tasks.
          </li>
        </ul>

        <h2 className="mt-12 text-2xl font-semibold tracking-tight text-ink">The metrics</h2>
        <div className="mt-6 space-y-px overflow-hidden rounded-lg border border-line">
          {METRIC_META.map((m) => (
            <div key={m.key} className="bg-panel px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-ink">{m.label}</span>
                <span
                  className={`rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                    m.group === 'agentic' ? 'bg-agentic/15 text-agentic' : 'bg-line text-faint'
                  }`}
                >
                  {m.group === 'agentic' ? 'Recursiv-only' : 'standard'} · better {m.better}
                </span>
              </div>
              <p className="mt-1.5 text-sm text-muted">{m.blurb}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-12 text-2xl font-semibold tracking-tight text-ink">The Recursiv Score</h2>
        <p className="mt-4 text-muted">
          The composite ranks models on a single 0–100 scale. Each metric is normalized across the field
          (direction-adjusted so higher is always better) and combined with the weights below. Cost-to-Done
          and completion dominate, because finishing the job reliably and cheaply is the point.
        </p>
        <div className="mt-6 overflow-hidden rounded-lg border border-line">
          {(Object.entries(DEFAULT_WEIGHTS) as [Metric, number][])
            .sort((a, b) => b[1] - a[1])
            .map(([k, w]) => (
              <div key={k} className="flex items-center gap-4 border-b border-line/60 bg-panel px-5 py-2.5 last:border-0">
                <span className="w-40 shrink-0 text-sm text-ink">{metaFor(k).label}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-accent/10">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${w * 100 * 2.5}%` }} />
                </div>
                <span className="tabular w-12 text-right font-mono text-sm text-accent">{Math.round(w * 100)}%</span>
              </div>
            ))}
        </div>

        <p className="mt-8 text-sm text-faint">
          This is v1. Weights and tasks will evolve as we add experiments; changes are versioned with each
          dataset update.
        </p>
      </article>
      <CTASection />
    </>
  );
}
