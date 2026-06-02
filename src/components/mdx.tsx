import Link from 'next/link';

// Custom components available inside experiment MDX files.

function Callout({ children, label = 'Note' }: { children: React.ReactNode; label?: string }) {
  return (
    <div className="my-6 rounded-lg border border-line bg-panel p-4">
      <div className="font-mono text-[11px] uppercase tracking-wider text-accent">{label}</div>
      <div className="mt-2 text-sm text-muted [&>p]:m-0">{children}</div>
    </div>
  );
}

function VerdictBox({ children, title = 'Verdict' }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="my-8 rounded-lg border border-accent/30 bg-accent/[0.04] p-5 shadow-glow">
      <div className="font-mono text-xs uppercase tracking-[0.2em] text-accent">{title}</div>
      <div className="mt-3 text-lg leading-relaxed text-ink [&>p]:m-0">{children}</div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border border-line bg-panel p-4">
      <div className="tabular font-mono text-3xl text-accent">{value}</div>
      <div className="mt-1 font-mono text-[11px] uppercase tracking-wider text-faint">{label}</div>
    </div>
  );
}

function StatRow({ children }: { children: React.ReactNode }) {
  return <div className="my-6 grid gap-3 sm:grid-cols-3">{children}</div>;
}

export const mdxComponents = {
  Callout,
  VerdictBox,
  Stat,
  StatRow,
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    const href = props.href ?? '';
    const internal = href.startsWith('/') || href.startsWith('#');
    if (internal) return <Link href={href} className="text-accent underline-offset-4 hover:underline" {...(props as any)} />;
    return <a className="text-accent underline-offset-4 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />;
  },
  h2: (p: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="mt-12 scroll-mt-20 text-2xl font-semibold tracking-tight text-ink" {...p} />
  ),
  h3: (p: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="mt-8 text-xl font-semibold tracking-tight text-ink" {...p} />
  ),
  p: (p: React.HTMLAttributes<HTMLParagraphElement>) => <p className="mt-4 leading-relaxed text-muted" {...p} />,
  ul: (p: React.HTMLAttributes<HTMLUListElement>) => <ul className="mt-4 list-disc space-y-2 pl-5 text-muted" {...p} />,
  ol: (p: React.HTMLAttributes<HTMLOListElement>) => <ol className="mt-4 list-decimal space-y-2 pl-5 text-muted" {...p} />,
  li: (p: React.HTMLAttributes<HTMLLIElement>) => <li className="leading-relaxed" {...p} />,
  strong: (p: React.HTMLAttributes<HTMLElement>) => <strong className="font-semibold text-ink" {...p} />,
  code: (p: React.HTMLAttributes<HTMLElement>) => (
    <code className="rounded bg-panel-2 px-1.5 py-0.5 font-mono text-sm text-accent" {...p} />
  ),
  blockquote: (p: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote className="mt-6 border-l-2 border-accent/40 pl-4 italic text-muted" {...p} />
  ),
};
