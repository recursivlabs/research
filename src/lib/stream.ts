import 'server-only';
import events from '../../data/stream.json';

export type StreamKind = 'ranking' | 'experiment' | 'run' | 'judge' | 'cost' | 'retry' | 'transcript' | 'swarm';

export interface StreamEvent {
  ts: string; // ISO
  kind: StreamKind;
  actor: string;
  text: string;
  experiment?: string;
}

/**
 * The autonomous swarm's activity feed. For now this reads a committed snapshot of
 * representative events; it will be wired to the live swarm (dispatcher + agent runs
 * + ai_usage + tool logs) as that ramps. Newest first.
 */
export function getStream(): StreamEvent[] {
  return [...(events as StreamEvent[])].sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
}
