import { loadLeaderboard } from '@/lib/leaderboard';
import { getAllExperiments } from '@/lib/experiments';
import { Leaderboard } from '@/components/Leaderboard';
import { ExperimentCard } from '@/components/ExperimentCard';
import { CTASection, DemoButton } from '@/components/CTA';
import { timeAgo } from '@/lib/format';

export const revalidate = 60;

export default async function Home() {
  const board = await loadLeaderboard();
  const experiments = getAllExperiments();

  return (
    <>
      {/* leaderboard is the hero */}
      <section className="relative border-b border-line">
        <div className="bg-grid-faint absolute inset-0 h-40" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-6 pb-16 pt-12">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
                Agentic model leaderboard
              </div>
              <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                Ranked by <span className="text-accent">Cost-to-Done</span>: the real dollars to finish the job.
              </h1>
            </div>
            <div className="flex items-center gap-3 pb-1 font-mono text-[11px] text-faint">
              {board.preview && (
                <span className="rounded border border-warn/40 bg-warn/10 px-2 py-1 uppercase tracking-wider text-warn">
                  preview data
                </span>
              )}
              <span>updated {timeAgo(board.updatedAt)}</span>
            </div>
          </div>

          <Leaderboard models={board.models} />

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-2xl text-sm text-muted">
              Benchmarks test models in a vacuum. We run them on real, multi-step work and rank by what it
              actually costs to finish. The <span className="text-agentic">Recursiv-only</span> columns are
              ones no single-model benchmark can produce.
            </p>
            <div className="flex items-center gap-3">
              <a href="/methodology" className="font-mono text-xs text-faint transition-colors hover:text-accent">
                how we measure →
              </a>
              <DemoButton variant="ghost">Book a demo</DemoButton>
            </div>
          </div>
        </div>
      </section>

      {/* experiments */}
      {experiments.length > 0 && (
        <section className="border-b border-line">
          <div className="mx-auto max-w-6xl px-6 py-14">
            <h2 className="text-2xl font-semibold tracking-tight">Experiments</h2>
            <p className="mt-1 text-sm text-muted">Every number above comes from one of these runs.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {experiments.map((exp) => (
                <ExperimentCard key={exp.slug} exp={exp} />
              ))}
            </div>
          </div>
        </section>
      )}

      <CTASection />
    </>
  );
}
