import { Metric, MetricStat } from './types';

/** dollar amounts that span cents to sub-cent: adaptive precision, never a misleading $0. */
export function fmtCost(v: number): string {
  if (v === 0) return '$0';
  if (v < 0.0001) return '<$0.0001';
  if (v < 0.01) return `$${v.toFixed(4)}`;
  if (v < 1) return `$${v.toFixed(3)}`;
  return `$${v.toFixed(2)}`;
}

/** format a raw metric value for display, per metric semantics */
export function formatMetric(key: Metric, stat?: MetricStat): string {
  if (!stat) return '—';
  const v = stat.value;
  switch (key) {
    case 'costToDone':
    case 'costPerToken':
      return fmtCost(v);
    case 'completionRate':
    case 'toolAccuracy':
    case 'selfCorrection':
      return `${Math.round(v * 100)}%`;
    case 'speed':
      return `${Math.round(v)}`;
    case 'quality':
      return `${Math.round(v)}`;
    default:
      return String(v);
  }
}

export function formatCI(key: Metric, stat?: MetricStat): string | null {
  if (!stat?.ci95) return null;
  const [lo, hi] = stat.ci95;
  const pct = key === 'completionRate' || key === 'toolAccuracy' || key === 'selfCorrection';
  if (pct) return `${Math.round(lo * 100)}–${Math.round(hi * 100)}%`;
  if (key === 'costToDone' || key === 'costPerToken') return `${fmtCost(lo)}–${fmtCost(hi)}`;
  return `${lo}–${hi}`;
}

export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const s = Math.max(0, Math.floor((now - then) / 1000));
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  return `${mo}mo ago`;
}
