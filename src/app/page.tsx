import { loadLeaderboard } from '@/lib/leaderboard';
import { getAllExperiments } from '@/lib/experiments';
import { Frontier, FrontierPoint } from '@/components/Frontier';
import { Leaderboard } from '@/components/Leaderboard';
import { ExperimentCard } from '@/components/ExperimentCard';
import { CTASection, DemoButton } from '@/components/CTA';
import { timeAgo } from '@/lib/format';

export const revalidate = 60;

export default async function Home() {
  const board = await loadLeaderboard();
  const experiments = getAllExperiments();
  const leader = board.models[0];

  const points: FrontierPoint[] = board.models
    .filter((m) => m.metrics.costToDone && m.metrics.completionRate)
    .map((m) => ({
      modelId: m.modelId,
      displayName: m.displayName,
      vendor: m.vendor,
      cost: m.metrics.costToDone!.value,
      costLo: m.metrics.costToDone!.ci95?.[0],
      costHi: m.metrics.costToDone!.ci95?.[1],
      completion: m.metrics.completionRate!.value,
    }));

  return (
    <>
      {/* hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="bg-grid-faint absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-6 pb-16 pt-20 sm:pt-28">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-accent">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            Agentic model research lab
          </div>
          <h1 className="mt-5 max-w-3xl text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            Benchmarks test models.
            <br />
            <span className="text-accent">Recursiv tests them at work.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted">
            We run frontier models on real, multi-step agentic work and rank them by the number that
            actually matters: the real dollars it takes to <span className="text-ink">finish the job</span>.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <DemoButton>Book a demo</DemoButton>
            <a
              href="#leaderboard"
              className="inline-flex items-center gap-2 rounded-md border border-line-bright px-4 py-2 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
            >
              See the leaderboard ↓
            </a>
          </div>
        </div>
      </section>

      {/* signature frontier */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-12">
            <div className="lg:w-72 lg:shrink-0">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">The signature metric</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">Cost-to-Done</h2>
              <p className="mt-3 text-sm text-muted">
                Real dollars to fully complete a verified task, retries and self-correction included. A model
                that is cheap per token but loops ten times is expensive. The efficiency frontier is up and to
                the left.
              </p>
              {leader && (
                <div className="mt-6 rounded-lg border border-line bg-panel p-4">
                  <div className="font-mono text-[11px] uppercase tracking-wider text-faint">Frontier leader</div>
                  <div className="mt-1 text-lg font-semibold text-ink">{leader.displayName}</div>
                  <div className="tabular mt-1 font-mono text-accent">
                    ${leader.metrics.costToDone?.value.toFixed(2)} / task
                  </div>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 rounded-lg border border-line bg-panel/40 p-4 sm:p-6">
              <Frontier points={points} />
            </div>
          </div>
        </div>
      </section>

      {/* leaderboard */}
      <section id="leaderboard" className="border-b border-line">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">The model leaderboard</h2>
              <p className="mt-1 text-sm text-muted">Sorted by composite Recursiv Score. Click any column to re-sort.</p>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px] text-faint">
              {board.preview && (
                <span className="rounded border border-warn/40 bg-warn/10 px-2 py-1 uppercase tracking-wider text-warn">
                  preview data
                </span>
              )}
              <span>updated {timeAgo(board.updatedAt)}</span>
            </div>
          </div>
          <Leaderboard models={board.models} />
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
