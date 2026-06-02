import type { Metadata } from 'next';
import { CTASection } from '@/components/CTA';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'About',
  description: 'Why an agent-orchestration platform is the right instrument for measuring agentic models.',
};

export default function AboutPage() {
  return (
    <>
      <article className="mx-auto max-w-3xl px-6 pb-8 pt-16">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">About</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Recursiv as a research instrument</h1>
        <p className="mt-4 text-lg text-muted">
          You cannot measure how a model performs at real work with a single API call. You need to put it to
          work: give it tools, multi-step tasks, the freedom to fail and retry, and a way to record what it
          actually cost. That is what Recursiv is.
        </p>

        <h2 className="mt-12 text-2xl font-semibold tracking-tight text-ink">Why us, and not a benchmark</h2>
        <p className="mt-4 text-muted">
          Recursiv is an agent-orchestration platform. Models run as agents against live tools, alone or in
          coordinated swarms. The platform meters the real dollar cost of every call, logs every tool
          invocation, and keeps the full run transcript. That instrumentation is exactly what agentic
          measurement requires, and it is why we can publish numbers no single-model benchmark can produce:
        </p>
        <ul className="mt-4 space-y-2 text-muted">
          <li><strong className="text-ink">Cost-to-Done</strong> — real dollars to finish, retries included.</li>
          <li><strong className="text-ink">Tool-use accuracy</strong> — from real, logged tool calls.</li>
          <li><strong className="text-ink">Self-correction</strong> — does it recover from its own mistakes.</li>
          <li><strong className="text-ink">Coordination</strong> — do swarms beat solo agents, and at what cost. (Coming next.)</li>
        </ul>

        <h2 className="mt-12 text-2xl font-semibold tracking-tight text-ink">The bias, stated plainly</h2>
        <p className="mt-4 text-muted">
          Recursiv makes this research possible, and we want you to use Recursiv. We keep the work honest the
          only way that survives scrutiny: held-out tasks, graders outside the agent sandbox, confidence
          intervals on every number, and full transcripts you can inspect. If a result makes a model we like
          look bad, it ships anyway.
        </p>

        <div className="mt-10">
          <a
            href={SITE.recursivUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-sm text-accent underline-offset-4 hover:underline"
          >
            Learn about the platform at recursiv.io ↗
          </a>
        </div>
      </article>
      <CTASection />
    </>
  );
}
