# Recursiv Research

> Benchmarks test models. Recursiv tests them at work.

A public, no-auth research site that ranks frontier models by how they perform at
**real, multi-step agentic work** run on Recursiv. The signature metric is
**Cost-to-Done**: the real dollars it takes a model to actually finish a task,
retries and self-correction included.

## Stack

- Next.js 14 (App Router) + Tailwind, dark-technical design system
- Leaderboard pulled from a **live** dataset (`LEADERBOARD_DATA_URL`) with a
  committed snapshot fallback (`data/leaderboard.json`) so the site never breaks
- Experiments authored as MDX in `content/experiments/`
- Dynamic OG social cards via `next/og`

## Develop

```bash
npm install
npm run dev
```

## How content flows

Recursiv is the lab; this site is the journal. The experiment harness
(`scripts/run-experiment.ts`) runs each model on a held-out task suite, records real
cost + tool logs + transcripts, and emits the canonical leaderboard dataset. The site
reads that dataset and renders it. Publishing new numbers does not require a redeploy.

## Config

See `.env.example`. The book-a-demo CTA target is `NEXT_PUBLIC_DEMO_URL`.

Deployed at **research.on.recursiv.io**.
