import Link from 'next/link';
import { DemoButton } from './CTA';
import { SITE } from '@/lib/site';

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="inline-block h-2 w-2 rounded-full bg-accent" />
          <span className="font-mono text-[13px] font-medium uppercase tracking-[0.18em] text-ink">
            RECURSIV<span className="text-faint">//</span>RESEARCH
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/"
            className="rounded-md px-3 py-1.5 text-sm text-muted transition-colors hover:text-ink"
          >
            Rankings
          </Link>
          <Link
            href="/live-lab"
            className="group inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted transition-colors hover:text-ink"
          >
            <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-good" />
            Live Research
          </Link>
          <Link
            href="/experiments"
            className="hidden rounded-md px-3 py-1.5 text-sm text-muted transition-colors hover:text-ink sm:block"
          >
            Experiments
          </Link>
          <Link
            href="/methodology"
            className="hidden rounded-md px-3 py-1.5 text-sm text-muted transition-colors hover:text-ink sm:block"
          >
            How It Works
          </Link>
          <DemoButton variant="ghost" className="ml-1">Talk to us</DemoButton>
        </nav>
      </div>
    </header>
  );
}

// Unified Recursiv footer — identical across research / sparklab / verify.
export function Footer() {
  return (
    <footer className="border-t border-[#e5e7eb]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-[12px]">
        <span className="font-mono text-[#586273]">
          Powered by{' '}
          <a href="https://recursiv.io" className="font-medium text-[#0e1726] hover:underline">
            Recursiv
          </a>
        </span>
        <div className="flex items-center gap-1 font-mono text-[#8a95a4]">
          <span className="text-[#0e1726]">Research</span>
          <span className="px-1.5">·</span>
          <a href="https://sparklab.on.recursiv.io" className="transition-colors hover:text-[#0e1726]">
            Lab
          </a>
          <span className="px-1.5">·</span>
          <a href="https://verify.on.recursiv.io" className="transition-colors hover:text-[#0e1726]">
            Verify
          </a>
        </div>
      </div>
    </footer>
  );
}
