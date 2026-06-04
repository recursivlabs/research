// Canonical data contract for the leaderboard + experiments.
// Produced by the experiment harness (scripts/run-experiment.ts), consumed by the site.

export type Metric =
  // standard / table-stakes
  | 'quality'
  | 'costPerToken'
  | 'speed'
  // agentic — Recursiv-only
  | 'costToDone'
  | 'completionRate'
  | 'toolAccuracy'
  | 'selfCorrection';

export interface MetricStat {
  /** raw value in `unit` (e.g. dollars, tok/s, %) */
  value: number;
  unit: string;
  /** 95% confidence interval on the raw value, if measured */
  ci95?: [number, number];
  /** number of runs the stat is computed over */
  nRuns?: number;
  /** reliability: fraction of k consecutive successes (pass^k) where relevant */
  passK?: number;
}

export type UseCase = 'coding' | 'extraction' | 'reasoning' | 'sql';

export interface UseCaseMeta {
  key: UseCase;
  label: string;
  blurb: string;
}

export const USE_CASES: UseCaseMeta[] = [
  { key: 'coding', label: 'Coding', blurb: 'Bug fixes, refactors, and implementing functions with edge cases.' },
  { key: 'extraction', label: 'Extraction', blurb: 'Pulling clean structured data out of messy text.' },
  { key: 'reasoning', label: 'Reasoning', blurb: 'Multi-step logic and constraint problems.' },
  { key: 'sql', label: 'SQL & APIs', blurb: 'Schema design and API/endpoint design.' },
];

export interface ModelScore {
  modelId: string; // e.g. "anthropic/claude-opus-4.6"
  displayName: string; // "Claude Opus 4.6"
  vendor: string; // "Anthropic"
  /** aggregate metrics across all use cases */
  metrics: Partial<Record<Metric, MetricStat>>;
  /** per-use-case metric breakdown (drives the leaderboard tabs) */
  byCategory?: Partial<Record<UseCase, Partial<Record<Metric, MetricStat>>>>;
  /** 0–100 normalized scores for bar rendering (higher = better, direction-adjusted) */
  normalized: Partial<Record<Metric, number>>;
  /** composite, drives default sort */
  recursivScore: number;
  /** slugs of experiments that contributed to this row */
  experiments: string[];
}

export interface Leaderboard {
  updatedAt: string; // ISO timestamp
  /** weights used to compute recursivScore, published on /methodology */
  weights: Partial<Record<Metric, number>>;
  models: ModelScore[];
  /** true while seeded with sample data (shows a "preview" badge) */
  preview?: boolean;
}

// ---- metric presentation metadata -------------------------------------------

export type MetricGroup = 'standard' | 'agentic';

export interface MetricMeta {
  key: Metric;
  label: string;
  short: string;
  group: MetricGroup;
  /** which direction is "better" — drives ranking + color */
  better: 'up' | 'down';
  blurb: string;
  /** part of the simplified main leaderboard */
  core?: boolean;
  /** one plain-language line for the table legend */
  plain?: string;
}

export const METRIC_META: MetricMeta[] = [
  {
    key: 'costToDone',
    label: 'Cost-to-Done',
    short: 'Cost-to-Done',
    group: 'agentic',
    better: 'down',
    core: true,
    plain: 'real dollars to finish, retries included',
    blurb:
      'Real dollars to fully complete a verified task, retries and self-correction included. Not price-per-token.',
  },
  {
    key: 'completionRate',
    label: 'Reliability',
    short: 'Reliability',
    group: 'agentic',
    better: 'up',
    core: true,
    plain: 'how often it actually finishes the task',
    blurb: 'How reliably the model finishes the task across repeated runs (pass^k). The production-readiness number.',
  },
  {
    key: 'toolAccuracy',
    label: 'Tool-use accuracy',
    short: 'Tool acc.',
    group: 'agentic',
    better: 'up',
    blurb: 'Correct tool selection with well-formed arguments. The inverse of the malformed-call rate.',
  },
  {
    key: 'selfCorrection',
    label: 'Self-correction',
    short: 'Self-corr.',
    group: 'agentic',
    better: 'up',
    blurb: 'Recovery rate: tasks completed after an initial failed attempt. Does it know when it is wrong?',
  },
  {
    key: 'quality',
    label: 'Quality',
    short: 'Quality',
    group: 'standard',
    better: 'up',
    core: true,
    plain: 'how good the finished result is',
    blurb: 'Output correctness on completed tasks, graded by an independent judge model.',
  },
  {
    key: 'speed',
    label: 'Speed',
    short: 'Speed',
    group: 'standard',
    better: 'up',
    blurb: 'Throughput in tokens/sec during task execution.',
  },
  {
    key: 'costPerToken',
    label: 'Cost / 1M tok',
    short: '$/1M tok',
    group: 'standard',
    better: 'down',
    blurb: 'Blended provider price per million tokens. Shown for contrast with Cost-to-Done.',
  },
];

export const AGENTIC_METRICS = METRIC_META.filter((m) => m.group === 'agentic');
export const STANDARD_METRICS = METRIC_META.filter((m) => m.group === 'standard');

/** The simplified main leaderboard: the few numbers that actually matter, in display order. */
const CORE_ORDER: Metric[] = ['completionRate', 'costToDone', 'quality'];
export const CORE_METRICS: MetricMeta[] = CORE_ORDER.map((k) => METRIC_META.find((m) => m.key === k)!);

export function metaFor(key: Metric): MetricMeta {
  const m = METRIC_META.find((x) => x.key === key);
  if (!m) throw new Error(`unknown metric ${key}`);
  return m;
}

// ---- live research stream -----------------------------------------------------

export type StreamKind = 'ranking' | 'experiment' | 'run' | 'judge' | 'cost' | 'retry' | 'transcript' | 'swarm';

export interface StreamEvent {
  ts: string; // ISO
  kind: StreamKind;
  actor: string;
  text: string;
  experiment?: string;
}
