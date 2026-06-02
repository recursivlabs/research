interface Row {
  name: string;
  cost: number; // lower better
  cheapestPerToken?: boolean;
}

/** Horizontal Cost-to-Done comparison. Cheapest is highlighted; bars are direct $ widths. */
export function CostBars({ rows }: { rows: Row[] }) {
  const sorted = [...rows].sort((a, b) => a.cost - b.cost);
  const max = Math.max(...sorted.map((r) => r.cost));
  const best = sorted[0]?.cost ?? 0;
  return (
    <div className="space-y-2">
      {sorted.map((r, i) => {
        const pct = Math.max(4, (r.cost / max) * 100);
        const isBest = i === 0;
        return (
          <div key={r.name} className="flex items-center gap-3">
            <div className="w-36 shrink-0 truncate text-right text-sm text-muted" title={r.name}>
              {r.name}
            </div>
            <div className="relative h-7 flex-1 overflow-hidden rounded bg-panel-2">
              <div
                className={`h-full rounded ${isBest ? 'bg-accent' : 'bg-line-bright'}`}
                style={{ width: `${pct}%` }}
              />
              <span
                className={`absolute inset-y-0 flex items-center px-2 font-mono text-xs ${
                  isBest ? 'left-0 text-bg' : 'right-0 text-muted'
                }`}
              >
                {`$${r.cost.toFixed(2)}`}
                {!isBest && best > 0 ? `  ·  ${(r.cost / best).toFixed(1)}x` : ''}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
