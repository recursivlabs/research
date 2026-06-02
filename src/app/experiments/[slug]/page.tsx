import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getExperiment, getExperimentSlugs, getTranscript } from '@/lib/experiments';
import { mdxComponents } from '@/components/mdx';
import { Transcript, TranscriptData } from '@/components/Transcript';
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

export default function ExperimentPage({ params }: { params: { slug: string } }) {
  const exp = getExperiment(params.slug);
  if (!exp) notFound();
  const transcript = getTranscript(params.slug) as TranscriptData | null;
  const date = new Date(exp.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <>
      <article className="mx-auto max-w-3xl px-6 pb-8 pt-16">
        <Link href="/" className="font-mono text-xs text-faint transition-colors hover:text-accent">
          ← all experiments
        </Link>

        <div className="mt-6 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-faint">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-good" />
          {exp.status ?? 'live'} · {date}
        </div>
        <h1 className="mt-4 text-balance text-4xl font-semibold leading-tight tracking-tight">{exp.title}</h1>
        <p className="mt-4 text-lg text-muted">{exp.summary}</p>

        {exp.heroStatValue && (
          <div className="mt-8 inline-flex items-baseline gap-3 rounded-lg border border-accent/30 bg-accent/[0.04] px-5 py-3 shadow-glow">
            <span className="tabular font-mono text-3xl text-accent">{exp.heroStatValue}</span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-faint">{exp.heroStatLabel}</span>
          </div>
        )}

        <div className="mt-10">
          <MDXRemote source={exp.content} components={mdxComponents} />
        </div>

        {transcript && (
          <>
            <h2 className="mt-12 text-2xl font-semibold tracking-tight text-ink">The receipts</h2>
            <p className="mt-2 text-muted">
              Not a synthetic benchmark. This is an actual agent run recorded on Recursiv — every tool call,
              every retry, and the real dollars it cost.
            </p>
            <Transcript data={transcript} />
          </>
        )}

        <div className="mt-12 rounded-lg border border-line bg-panel p-5">
          <div className="font-mono text-[11px] uppercase tracking-wider text-accent">Methodology</div>
          <p className="mt-2 text-sm text-muted">
            Every model ran the same held-out task suite, N times, on Recursiv. Cost is real provider spend
            including retries. Numbers carry 95% confidence intervals. Full method and weights:{' '}
            <Link href="/methodology" className="text-accent underline-offset-4 hover:underline">
              /methodology
            </Link>
            .
          </p>
        </div>
      </article>

      <CTASection />
    </>
  );
}
