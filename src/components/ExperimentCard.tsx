import Link from 'next/link';
import { Experiment } from '@/lib/experiments';

export function ExperimentCard({ exp }: { exp: Experiment }) {
  const date = new Date(exp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return (
    <Link
      href={`/experiments/${exp.slug}`}
      className="group relative flex h-full flex-col justify-between overflow-hidden rounded-lg border border-line bg-panel p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-line-bright hover:shadow-glow"
    >
      <div>
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-faint">
          <StatusDot status={exp.status} />
          <span className="text-accent">Experiment {exp.number ?? '—'}</span>
          <span className="text-line-bright">·</span>
          <span>{date}</span>
        </div>
        <h3 className="mt-3 text-lg font-semibold leading-snug tracking-tight text-ink group-hover:text-accent">
          {exp.title}
        </h3>
        <p className="mt-2 line-clamp-3 text-sm text-muted">{exp.test ?? exp.summary}</p>
      </div>
      {exp.heroStatValue && (
        <div className="mt-5 flex items-end justify-between border-t border-line pt-4">
          <div>
            <div className="tabular font-mono text-2xl text-accent">{exp.heroStatValue}</div>
            <div className="font-mono text-[11px] uppercase tracking-wider text-faint">{exp.heroStatLabel}</div>
          </div>
          <span className="font-mono text-sm text-faint transition-colors group-hover:text-accent">read →</span>
        </div>
      )}
    </Link>
  );
}

function StatusDot({ status }: { status?: string }) {
  const color = status === 'running' ? 'bg-warn' : status === 'planned' ? 'bg-faint' : 'bg-good';
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${color}`} />;
}
