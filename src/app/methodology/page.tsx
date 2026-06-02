import type { Metadata } from 'next';
import { CORE_METRICS, metaFor, Metric } from '@/lib/types';
import { DEFAULT_WEIGHTS } from '@/lib/leaderboard';
import { CTASection } from '@/components/CTA';

export const metadata: Metadata = {
  title: 'Methodology',
  description: 'How Recursiv Research measures models: real tasks, real dollars, confidence intervals, held-out and contamination-resistant.',
};

const PRINCIPLES = [
  { t: 'Real tasks, real tools', d: 'Models run as agents against live tools and repos. Completion is graded by outcomes, not preference.' },
  { t: 'Real dollars', d: 'Cost is actual provider spend per call, summed across the whole task including retries.' },
  { t: 'Reliability over peak', d: 'Each task runs many times. We report pass^k consistency, not a lucky best-of-N.' },
  { t: 'Show the uncertainty', d: 'Every number carries its sample size and a 95% CI. Hover any leaderboard cell.' },
  { t: 'Contamination resistant', d: 'Held-out tasks; the grader runs outside the agent sandbox, so a model cannot read the answer.' },
  { t: 'Reproducible', d: 'The harness runs on Recursiv. You can run it against your own tasks.' },
];

export default function MethodologyPage() {
  return (
    <>
      <article className="mx-auto max-w-4xl px-6 pb-8 pt-12">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Methodology</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">How we measure</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Most leaderboards measure models in a vacuum: one prompt, one turn, price per token. We measure
          them doing real, multi-step work, and we show our uncertainty.
        </p>

        {/* principles grid */}
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PRINCIPLES.map((p) => (
            <div key={p.t} className="rounded-lg border border-line bg-panel p-4">
              <div className="flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                <span className="font-medium text-ink">{p.t}</span>
              </div>
              <p className="mt-2 text-sm text-muted">{p.d}</p>
            </div>
          ))}
        </div>

        {/* metrics */}
        <h2 className="mt-14 text-2xl font-semibold tracking-tight text-ink">What we measure</h2>
        <p className="mt-2 max-w-2xl text-muted">
          Three numbers answer the only question that matters for shipping agents: does it work, is it good,
          what does it cost?
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {CORE_METRICS.map((m) => (
            <div key={m.key} className="rounded-lg border border-line bg-panel p-4">
              <span className="font-medium text-ink">{m.label}</span>
              <p className="mt-1.5 text-sm text-muted">{m.blurb}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-faint">
          Further agentic metrics (tool-use accuracy, self-correction, multi-agent coordination) are part of
          the broader program and roll out as experiments land.
        </p>

        {/* composite weights */}
        <h2 className="mt-14 text-2xl font-semibold tracking-tight text-ink">The Recursiv Score</h2>
        <p className="mt-3 max-w-2xl text-muted">
          One 0–100 composite. Each metric is normalized across the field and weighted as below. Cost-to-Done
          and completion dominate, because finishing reliably and cheaply is the point.
        </p>
        <div className="mt-6 overflow-hidden rounded-xl border border-line">
          {(Object.entries(DEFAULT_WEIGHTS) as [Metric, number][])
            .sort((a, b) => b[1] - a[1])
            .map(([k, w]) => (
              <div key={k} className="flex items-center gap-4 border-b border-line/60 bg-panel px-5 py-3 last:border-0">
                <span className="w-40 shrink-0 text-sm text-ink">{metaFor(k).label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-accent/10">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${w * 100 * 2.5}%` }} />
                </div>
                <span className="tabular w-12 text-right font-mono text-sm text-accent">{Math.round(w * 100)}%</span>
              </div>
            ))}
        </div>

        <p className="mt-8 text-sm text-faint">
          v1. Weights and tasks evolve as we add experiments; changes are versioned with each dataset update.
        </p>
      </article>
      <CTASection />
    </>
  );
}
