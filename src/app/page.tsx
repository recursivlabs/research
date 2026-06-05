import { loadLeaderboard } from '@/lib/leaderboard';
import { getAllExperiments } from '@/lib/experiments';
import { Leaderboard } from '@/components/Leaderboard';
import { ExperimentCard } from '@/components/ExperimentCard';
import { CTASection } from '@/components/CTA';
import { timeAgo } from '@/lib/format';

export const revalidate = 60;

export default async function Home() {
  const board = await loadLeaderboard();
  const experiments = getAllExperiments();
  const nRuns = board.models.reduce((s, m) => s + (m.metrics.completionRate?.nRuns ?? 0), 0);
  const version = board.updatedAt.slice(0, 10).replace(/-/g, '.');

  return (
    <>
      {/* the index is the hero */}
      <section className="relative border-b border-line">
        <div className="bg-grid-faint absolute inset-0 h-40" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-10 sm:px-6 sm:pb-16 sm:pt-12">
          <div className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
            <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-accent" />
            Recursiv<span className="text-faint">//</span>Research · Power Rankings
          </div>
          <p className="mb-5 max-w-2xl text-base text-ink sm:text-lg">
            Autonomous agents run the top AI models on real tasks around the clock, then rank them by what actually ships: how reliably they finish, and what it really costs.
          </p>

          {/* instrument stamp */}
          <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-3 font-mono text-[11px] text-faint">
            <span className="inline-flex items-center gap-1.5 text-good">
              <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-good" />
              LIVE
            </span>
            <span>v{version}</span>
            <span className="text-line-bright">·</span>
            <span>n={nRuns} runs</span>
            <span className="text-line-bright">·</span>
            <span>{board.models.length} models</span>
            <span className="text-line-bright">·</span>
            <span>4 use-cases</span>
            <span className="text-line-bright">·</span>
            <span>held-out · judge-graded</span>
            <span className="ml-auto">updated {timeAgo(board.updatedAt)}</span>
          </div>

          <Leaderboard models={board.models} />

          <div className="mt-5">
            <a href="/methodology" className="font-mono text-xs text-faint transition-colors hover:text-accent">
              read the methods →
            </a>
          </div>
        </div>
      </section>

      {/* experiments */}
      {experiments.length > 0 && (
        <section className="border-b border-line">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
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
