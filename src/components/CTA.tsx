import Link from 'next/link';
import { SITE } from '@/lib/site';

export function DemoButton({
  children = 'Book a demo',
  variant = 'solid',
  className = '',
}: {
  children?: React.ReactNode;
  variant?: 'solid' | 'ghost';
  className?: string;
}) {
  const base =
    'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium tracking-tight transition-colors';
  const styles =
    variant === 'solid'
      ? 'bg-accent text-bg hover:bg-accent/90 shadow-glow'
      : 'border border-line-bright text-ink hover:border-accent hover:text-accent';
  return (
    <a href={SITE.demoUrl} target="_blank" rel="noopener noreferrer" className={`${base} ${styles} ${className}`}>
      {children}
      <span aria-hidden>→</span>
    </a>
  );
}

export function CTASection() {
  return (
    <section className="border-t border-line">
      <div className="mx-auto max-w-6xl px-6 py-20 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Run it yourself</p>
        <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Stop guessing which model to ship.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted">
          Every number here was produced by running real agentic work on Recursiv. Book a demo and we will
          show you the platform these experiments run on.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <DemoButton>Book a demo</DemoButton>
          <Link
            href="/methodology"
            className="inline-flex items-center gap-2 rounded-md border border-line-bright px-4 py-2 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
          >
            How we measure
          </Link>
        </div>
      </div>
    </section>
  );
}
