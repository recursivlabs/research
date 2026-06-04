import 'server-only';
import events from '../../data/stream.json';
import type { StreamEvent } from './types';
export type { StreamEvent, StreamKind } from './types';

/**
 * The autonomous swarm's activity feed. For now this reads a committed snapshot of
 * representative events; it will be wired to the live swarm (dispatcher + agent runs
 * + ai_usage + tool logs) as that ramps. Newest first.
 */
function sortDesc(list: StreamEvent[]): StreamEvent[] {
  return [...list].sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
}

/** Committed snapshot (fallback / build-time initial). */
export function getStream(): StreamEvent[] {
  return sortDesc(events as StreamEvent[]);
}

const LIVE_URL = process.env.STREAM_DATA_URL;

/**
 * Pull the live activity feed from the Recursiv-backed source when available,
 * falling back to the committed snapshot so the page never breaks.
 */
export async function fetchStream(): Promise<StreamEvent[]> {
  if (LIVE_URL) {
    try {
      const res = await fetch(LIVE_URL, { cache: 'no-store' });
      if (res.ok) {
        const live = (await res.json()) as StreamEvent[];
        if (Array.isArray(live) && live.length) return sortDesc(live);
      }
    } catch {
      // fall through to snapshot
    }
  }
  return getStream();
}
