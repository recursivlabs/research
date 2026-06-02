import Link from 'next/link';
import { DemoButton } from './CTA';
import { SITE } from '@/lib/site';

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-accent shadow-glow" />
          <span className="font-mono text-sm font-medium tracking-tight text-ink">
            recursiv<span className="text-faint">/</span>research
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/#leaderboard"
            className="rounded-md px-3 py-1.5 text-sm text-muted transition-colors hover:text-ink"
          >
            Leaderboard
          </Link>
          <Link
            href="/methodology"
            className="rounded-md px-3 py-1.5 text-sm text-muted transition-colors hover:text-ink"
          >
            Methodology
          </Link>
          <Link
            href="/about"
            className="hidden rounded-md px-3 py-1.5 text-sm text-muted transition-colors hover:text-ink sm:block"
          >
            About
          </Link>
          <DemoButton className="ml-1">Book a demo</DemoButton>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 py-10 sm:flex-row sm:items-center">
        <div>
          <p className="font-mono text-sm text-ink">
            recursiv<span className="text-faint">/</span>research
          </p>
          <p className="mt-1 max-w-sm text-xs text-faint">{SITE.tagline}</p>
        </div>
        <div className="flex items-center gap-5 text-xs text-muted">
          <Link href="/methodology" className="hover:text-ink">
            Methodology
          </Link>
          <Link href="/about" className="hover:text-ink">
            About
          </Link>
          <a href={SITE.recursivUrl} target="_blank" rel="noopener noreferrer" className="hover:text-ink">
            recursiv.io ↗
          </a>
        </div>
      </div>
    </footer>
  );
}
