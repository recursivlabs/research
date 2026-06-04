import { SITE } from '@/lib/site';

export function DemoButton({
  children = 'Talk to us',
  variant = 'ghost',
  className = '',
}: {
  children?: React.ReactNode;
  variant?: 'solid' | 'ghost';
  className?: string;
}) {
  const base = 'inline-flex items-center gap-2 rounded-md px-4 py-2 font-mono text-xs uppercase tracking-wider transition-colors';
  const styles =
    variant === 'solid'
      ? 'bg-accent text-bg hover:bg-accent/90'
      : 'border border-line-bright text-muted hover:border-accent hover:text-accent';
  return (
    <a href={SITE.demoUrl} target="_blank" rel="noopener noreferrer" className={`${base} ${styles} ${className}`}>
      {children}
      <span aria-hidden>→</span>
    </a>
  );
}

/** Slim, understated footer band — credibility over salesmanship. */
export function CTASection() {
  return (
    <section className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 py-10 sm:flex-row sm:items-center">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">Run it yourself</div>
          <p className="mt-2 max-w-xl text-muted">
            Every number here came from running real agentic work on Recursiv. Point the same swarm at your
            own tasks.
          </p>
        </div>
        <DemoButton variant="ghost">Talk to us</DemoButton>
      </div>
    </section>
  );
}
