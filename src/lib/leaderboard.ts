import 'server-only';
import { Leaderboard, ModelScore, Metric, METRIC_META, metaFor } from './types';
import snapshot from '../../data/leaderboard.json';

// Real data only. Per-use-case numbers come straight from the harness runs that
// produced them; we never synthesize category data. If a model has no real numbers
// for a use-case yet, that tab is simply empty for it until a run fills it in.

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
    return { ...m, normalized, recursivScore, byCategory: m.byCategory };
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
