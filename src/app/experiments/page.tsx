import type { Metadata } from 'next';
import { getAllExperiments } from '@/lib/experiments';
import { ExperimentCard } from '@/components/ExperimentCard';
import { CTASection } from '@/components/CTA';

export const metadata: Metadata = {
  title: 'Experiments',
  description: 'Every experiment behind the Recursiv model leaderboard. Real agentic runs, real cost, full transcripts.',
};

export default function ExperimentsPage() {
  const experiments = getAllExperiments();
  return (
    <>
      <section className="relative border-b border-line">
        <div className="bg-grid-faint absolute inset-0 h-40" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-6 pb-14 pt-12">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
            <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-accent" />
            The experiments
          </div>
          <h1 className="mt-4 max-w-3xl text-balance text-3xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
            Every ranking traces back to a <span className="text-accent">real experiment</span>.
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted sm:text-lg">
            We run frontier models on real, multi-step work on the Recursiv platform. Each study below is the
            receipts: the setup, the numbers with confidence intervals, and the actual agent transcripts.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {experiments.map((exp, i) => (
              <div key={exp.slug} className="row-in" style={{ animationDelay: `${i * 60}ms` }}>
                <ExperimentCard exp={exp} />
              </div>
            ))}
          </div>
        </div>
      </section>
      <CTASection />
    </>
  );
}
