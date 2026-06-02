import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 text-center">
      <div className="font-mono text-xs uppercase tracking-[0.2em] text-accent">404</div>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">This page isn&apos;t on the board.</h1>
      <p className="mt-3 text-muted">The experiment you&apos;re looking for moved or never existed.</p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-bg shadow-glow transition-colors hover:bg-accent/90"
      >
        Back to the rankings →
      </Link>
    </div>
  );
}
