export function ScoreBar({
  value,
  tone = 'accent',
}: {
  value?: number; // 0..100
  tone?: 'accent' | 'agentic';
}) {
  if (typeof value !== 'number') return <span className="text-faint">—</span>;
  const pct = Math.max(2, Math.min(100, value));
  const color = tone === 'agentic' ? 'bg-agentic' : 'bg-accent';
  const track = tone === 'agentic' ? 'bg-agentic/10' : 'bg-accent/10';
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full ${track}`}>
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
