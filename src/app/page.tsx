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
          <div className="mb-6 max-w-3xl">
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
              <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-accent" />
              Official Power Rankings
            </div>
            <h1 className="mt-4 text-balance text-3xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
              Which model should you <span className="text-accent">actually use</span>?
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted sm:text-lg">
              We run frontier models on real tasks and rank them by what matters in production: how reliably
              they finish, and what it really costs. Run daily by an autonomous agent swarm on Recursiv.
            </p>
          </div>

          <div className="mb-3 flex items-center justify-end gap-2 font-mono text-[11px]">
            <span className="inline-flex items-center gap-1.5 rounded border border-good/30 bg-good/10 px-2 py-1 uppercase tracking-wider text-good">
              <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-good" />
              Live data
            </span>
            <span className="text-faint">updated by Recursiv&apos;s autonomous research swarm {timeAgo(board.updatedAt)}</span>
          </div>

          <Leaderboard models={board.models} />

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <a href="/methodology" className="font-mono text-xs text-faint transition-colors hover:text-accent">
              how we measure →
            </a>
            <DemoButton variant="ghost">Book a demo</DemoButton>
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
