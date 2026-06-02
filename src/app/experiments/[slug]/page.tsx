import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getExperiment, getExperimentSlugs, getTranscript } from '@/lib/experiments';
import { loadLeaderboard } from '@/lib/leaderboard';
import { mdxComponents } from '@/components/mdx';
import { Transcript, TranscriptData } from '@/components/Transcript';
import { Frontier, FrontierPoint } from '@/components/Frontier';
import { CostBars } from '@/components/CostBars';
import { CTASection } from '@/components/CTA';

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

function Stat({ value, label, tone }: { value: string; label: string; tone?: 'agentic' }) {
  return (
    <div className="rounded-lg border border-line bg-panel p-4">
      <div className={`tabular font-mono text-2xl sm:text-3xl ${tone === 'agentic' ? 'text-agentic' : 'text-accent'}`}>
        {value}
      </div>
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
  const points: FrontierPoint[] = models.map((m) => ({
    modelId: m.modelId,
    displayName: m.displayName,
    vendor: m.vendor,
    cost: m.metrics.costToDone!.value,
    costLo: m.metrics.costToDone!.ci95?.[0],
    costHi: m.metrics.costToDone!.ci95?.[1],
    completion: m.metrics.completionRate!.value,
  }));
  const costRows = models.map((m) => ({ name: m.displayName, cost: m.metrics.costToDone!.value }));
  const costs = costRows.map((r) => r.cost);
  const cheapest = costs.length ? Math.min(...costs) : 0;
  const priciest = costs.length ? Math.max(...costs) : 0;
  const runs = models[0]?.metrics.costToDone?.nRuns;

  return (
    <>
      <article className="mx-auto max-w-4xl px-6 pb-8 pt-12">
        <Link href="/" className="font-mono text-xs text-faint transition-colors hover:text-accent">
          ← leaderboard
        </Link>

        <div className="mt-6 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-faint">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-good" />
          {exp.status ?? 'live'} · {date}
        </div>
        <h1 className="mt-4 text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          {exp.title}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">{exp.summary}</p>

        {/* visual stat row */}
        {models.length > 0 && (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat value={`$${cheapest.toFixed(2)}`} label="cheapest cost-to-done" />
            <Stat value={`${(priciest / cheapest).toFixed(1)}x`} label="cheapest vs priciest" tone="agentic" />
            <Stat value={`${models.length}`} label="models tested" />
            {runs ? <Stat value={`${runs}`} label="runs per model" /> : null}
          </div>
        )}

        {/* primary visual: frontier */}
        {points.length > 0 && (
          <section className="mt-10 rounded-xl border border-line bg-panel/40 p-5 sm:p-6">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">Cost-to-Done vs completion</h2>
            <p className="mt-1 text-sm text-faint">Efficiency frontier is up and to the left. Bars are 95% CI on cost.</p>
            <div className="mt-4">
              <Frontier points={points} />
            </div>
          </section>
        )}

        {/* secondary visual: cost bars */}
        {costRows.length > 0 && (
          <section className="mt-6 rounded-xl border border-line bg-panel/40 p-5 sm:p-6">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">Real cost to finish, by model</h2>
            <div className="mt-4">
              <CostBars rows={costRows} />
            </div>
          </section>
        )}

        {/* short narrative */}
        <div className="mt-10 max-w-2xl">
          <MDXRemote source={exp.content} components={mdxComponents} />
        </div>

        {transcript && (
          <section className="mt-12">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">The receipts</h2>
            <p className="mt-2 max-w-2xl text-muted">
              Not a synthetic benchmark. An actual agent run recorded on Recursiv: every tool call, every
              retry, and the real dollars it cost.
            </p>
            <Transcript data={transcript} />
          </section>
        )}

        <div className="mt-12 rounded-lg border border-line bg-panel p-5">
          <div className="font-mono text-[11px] uppercase tracking-wider text-accent">Methodology</div>
          <p className="mt-2 text-sm text-muted">
            Every model ran the same held-out task suite, N times, on Recursiv. Cost is real provider spend
            including retries. Numbers carry 95% confidence intervals.{' '}
            <Link href="/methodology" className="text-accent underline-offset-4 hover:underline">
              Full method →
            </Link>
          </p>
        </div>
      </article>

      <CTASection />
    </>
  );
}
