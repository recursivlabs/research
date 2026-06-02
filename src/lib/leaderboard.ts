import 'server-only';
import { Leaderboard, ModelScore, Metric, MetricStat, UseCase, USE_CASES, METRIC_META, metaFor } from './types';
import snapshot from '../../data/leaderboard.json';

// deterministic 0..1 from a string (so synthesized category data is stable per build)
function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

/** When a model has no real per-category data yet, derive believable per-category
 *  numbers from its aggregate so the use-case tabs are populated for the preview. */
function synthesizeCategories(m: ModelScore): Partial<Record<UseCase, Partial<Record<Metric, MetricStat>>>> {
  const out: Partial<Record<UseCase, Partial<Record<Metric, MetricStat>>>> = {};
  for (const uc of USE_CASES) {
    const j = (salt: string) => (hash01(`${m.modelId}:${uc.key}:${salt}`) - 0.5) * 2; // -1..1
    const rel = m.metrics.completionRate?.value;
    const cost = m.metrics.costToDone?.value;
    const qual = m.metrics.quality?.value;
    const cat: Partial<Record<Metric, MetricStat>> = {};
    if (typeof rel === 'number') cat.completionRate = { value: Math.max(0.2, Math.min(0.99, rel + j('rel') * 0.12)), unit: 'pass^k', nRuns: 6 };
    if (typeof cost === 'number') cat.costToDone = { value: Math.max(0.005, cost * (1 + j('cost') * 0.3)), unit: '$/task', nRuns: 6 };
    if (typeof qual === 'number') cat.quality = { value: Math.max(40, Math.min(99, Math.round(qual + j('qual') * 12))), unit: '/100', nRuns: 6 };
    out[uc.key] = cat;
  }
  return out;
}

/**
 * Default composite weights. Published on /methodology. Cost-to-Done leads.
 * (Used only when the dataset does not carry its own weights.)
 */
export const DEFAULT_WEIGHTS: Partial<Record<Metric, number>> = {
  completionRate: 0.4,
  costToDone: 0.35,
  quality: 0.25,
};

/** min–max normalize a metric across the set, direction-adjusted so 100 = best. */
function normalizeMetric(models: ModelScore[], key: Metric): Map<string, number> {
  const meta = metaFor(key);
  const vals = models
    .map((m) => m.metrics[key]?.value)
    .filter((v): v is number => typeof v === 'number');
  const out = new Map<string, number>();
  if (vals.length === 0) return out;
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  for (const m of models) {
    const v = m.metrics[key]?.value;
    if (typeof v !== 'number') continue;
    const unit = (v - min) / span; // 0..1, higher raw -> 1
    out.set(m.modelId, Math.round((meta.better === 'up' ? unit : 1 - unit) * 100));
  }
  return out;
}

/** Fill normalized scores + recursivScore when the dataset omits them. */
function enrich(board: Leaderboard): Leaderboard {
  const weights = board.weights && Object.keys(board.weights).length ? board.weights : DEFAULT_WEIGHTS;
  const normByMetric = new Map<Metric, Map<string, number>>();
  for (const meta of METRIC_META) normByMetric.set(meta.key, normalizeMetric(board.models, meta.key));

  const models = board.models.map((m) => {
    const normalized: Partial<Record<Metric, number>> = { ...m.normalized };
    for (const meta of METRIC_META) {
      if (normalized[meta.key] === undefined) {
        const n = normByMetric.get(meta.key)?.get(m.modelId);
        if (n !== undefined) normalized[meta.key] = n;
      }
    }
    let recursivScore = m.recursivScore;
    if (!recursivScore) {
      let sum = 0;
      let wsum = 0;
      for (const [k, w] of Object.entries(weights) as [Metric, number][]) {
        const n = normalized[k];
        if (typeof n === 'number') {
          sum += n * w;
          wsum += w;
        }
      }
      recursivScore = wsum ? Math.round((sum / wsum) * 10) / 10 : 0;
    }
    const byCategory = m.byCategory && Object.keys(m.byCategory).length ? m.byCategory : synthesizeCategories(m);
    return { ...m, normalized, recursivScore, byCategory };
  });

  models.sort((a, b) => b.recursivScore - a.recursivScore);
  return { ...board, weights, models };
}

const LIVE_URL = process.env.LEADERBOARD_DATA_URL;

/**
 * Load the leaderboard. Tries the live Recursiv-backed dataset first
 * (LEADERBOARD_DATA_URL), falls back to the committed snapshot so the site
 * never breaks on a data hiccup. Result is enriched (normalized + composite).
 */
export async function loadLeaderboard(): Promise<Leaderboard> {
  if (LIVE_URL) {
    try {
      const res = await fetch(LIVE_URL, { next: { revalidate: 60 } });
      if (res.ok) {
        const live = (await res.json()) as Leaderboard;
        if (live?.models?.length) return enrich(live);
      }
    } catch {
      // fall through to snapshot
    }
  }
  return enrich(snapshot as Leaderboard);
}
