import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getExperiment, getExperimentSlugs, getTranscript } from '@/lib/experiments';
import { loadLeaderboard } from '@/lib/leaderboard';
import { mdxComponents } from '@/components/mdx';
import { Transcript, TranscriptData } from '@/components/Transcript';
import { Leaderboard } from '@/components/Leaderboard';
import { CTASection } from '@/components/CTA';
import { fmtCost } from '@/lib/format';

export const dynamicParams = false;

export function generateStaticParams() {
  return getExperimentSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const exp = getExperiment(params.slug);
  if (!exp) return {};
  return {
    title: exp.title,
    description: exp.summary,
    openGraph: { title: exp.title, description: exp.summary, type: 'article' },
    twitter: { card: 'summary_large_image', title: exp.title, description: exp.summary },
  };
}

function Stat({ value, label, tone }: { value: string; label: string; tone?: 'agentic' | 'completion' }) {
  const color = tone === 'agentic' ? 'text-agentic' : tone === 'completion' ? 'text-completion' : 'text-accent';
  return (
    <div className="rounded-xl border border-line bg-panel p-4">
      <div className={`tabular font-mono text-2xl sm:text-3xl ${color}`}>{value}</div>
      <div className="mt-1 font-mono text-[11px] uppercase tracking-wider text-faint">{label}</div>
    </div>
  );
}

export default async function ExperimentPage({ params }: { params: { slug: string } }) {
  const exp = getExperiment(params.slug);
  if (!exp) notFound();
  const transcript = getTranscript(params.slug) as TranscriptData | null;
  const date = new Date(exp.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const board = await loadLeaderboard();
  const models = board.models.filter(
    (m) => m.experiments?.includes(params.slug) && m.metrics.costToDone && m.metrics.completionRate,
  );

  // headline numbers
  const value = (m: (typeof models)[number]) => {
    const r = m.metrics.completionRate!.value;
    const c = m.metrics.costToDone!.value;
    return c > 0 ? r / c : 0;
  };
  const best = [...models].sort((a, b) => value(b) - value(a))[0];
  const costs = models.map((m) => m.metrics.costToDone!.value);
  const cheapest = costs.length ? Math.min(...costs) : 0;
  const priciest = costs.length ? Math.max(...costs) : 0;
  const runsPer = models[0]?.metrics.costToDone?.nRuns ?? 0;
  const totalRuns = models.reduce((s, m) => s + (m.metrics.costToDone?.nRuns ?? 0), 0);

  return (
    <>
      <article className="mx-auto max-w-5xl px-6 pb-8 pt-12">
        <Link href="/experiments" className="font-mono text-xs text-faint transition-colors hover:text-accent">
          ← all experiments
        </Link>

        <div className="mt-6 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-faint">
          <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-good" />
          {exp.status ?? 'live'} · {date}
        </div>
        <h1 className="mt-4 max-w-3xl text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          {exp.title}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">{exp.summary}</p>

        {/* one-line verdict */}
        {best && (
          <div className="mt-8 inline-flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-xl border border-accent/30 bg-accent/[0.05] px-5 py-4 shadow-glow">
            <span className="font-mono text-[11px] uppercase tracking-wider text-accent">Verdict</span>
            <span className="text-lg text-ink">
              Best value: <span className="font-semibold text-accent">{best.displayName}</span> — finishes{' '}
              {Math.round(best.metrics.completionRate!.value * 100)}% of tasks at {fmtCost(best.metrics.costToDone!.value)} each.
            </span>
          </div>
        )}

        {/* key stats */}
        {models.length > 0 && (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat value={`${models.length}`} label="models tested" />
            <Stat value={`${totalRuns}`} label="graded runs" />
            <Stat value={fmtCost(cheapest)} label="cheapest cost-to-done" tone="agentic" />
            <Stat value={cheapest > 0 ? `${(priciest / cheapest).toFixed(1)}x` : '—'} label="cheapest vs priciest" />
          </div>
        )}

        {/* full results: verdict cards + use-case tabs + ranked table */}
        {models.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-2xl font-semibold tracking-tight text-ink">Full results</h2>
            <Leaderboard models={models} />
          </section>
        )}

        {/* short narrative */}
        {exp.content.trim() && (
          <div className="prose-research mt-12 max-w-2xl">
            <MDXRemote source={exp.content} components={mdxComponents} />
          </div>
        )}

        {transcript && transcript.runs?.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">The receipts</h2>
            <p className="mt-2 max-w-2xl text-muted">
              Real answers from this run: the actual task, exactly what the model returned, whether it passed,
              and what it cost. Proof, not a synthetic score.
            </p>
            <Transcript data={transcript} />
          </section>
        )}

        <div className="mt-12 rounded-xl border border-line bg-panel p-5">
          <div className="font-mono text-[11px] uppercase tracking-wider text-accent">How it was measured</div>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            {runsPer ? `Each model ran every task ${runsPer} times. ` : ''}Reliability is the share of runs that
            passed (pass^k); quality is graded by an independent judge model; Cost-to-Done is the tokens each run
            used, priced at published per-model rates. Run by the autonomous swarm on Recursiv.{' '}
            <Link href="/methodology" className="text-accent underline-offset-4 hover:underline">
              How it works →
            </Link>
          </p>
        </div>
      </article>

      <CTASection />
    </>
  );
}
