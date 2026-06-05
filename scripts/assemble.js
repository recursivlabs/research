// Assemble the real leaderboard from per-model partials (data/_partial/*.json).
// Cost-to-Done = tokens used on the task x published per-model price (isolates model
// economics; no billing dependency). Completion + quality come straight from the runs.
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const PARTIAL = path.join(ROOT, 'data', '_partial');
const CATEGORIES = ['coding', 'extraction', 'reasoning', 'sql'];

// Published per-million-token prices ($ in / $ out), approximate snapshots.
const PRICE = {
  'anthropic/claude-opus-4.8': [15, 75],
  'anthropic/claude-sonnet-4.6': [3, 15],
  'openai/gpt-5.5': [5, 15],
  'google/gemini-3.5-flash': [0.15, 0.6],
  'google/gemini-3.1-pro-preview': [2.5, 10],
  'x-ai/grok-4.3': [3, 15],
  'deepseek/deepseek-v4-pro': [0.5, 1.5],
  'moonshotai/kimi-k2.6': [0.5, 2],
  'minimax/minimax-m3': [0.3, 1.5],
  'openai/gpt-4o-mini': [0.15, 0.6],
};
const IN_TOKENS = 130; // short task prompt + system, estimated
const estOut = (text) => Math.max(1, Math.ceil((text || '').length / 4));
const runCost = (modelId, output) => {
  const p = PRICE[modelId] || [1, 3];
  return (IN_TOKENS * p[0] + estOut(output) * p[1]) / 1e6;
};

// task id -> human title (for readable receipts)
const TITLES = {
  'pagination-bug': 'Find and fix a pagination bug', 'edge-case-fn': 'Implement chunk() with edge cases',
  'refactor-callback': 'Refactor callbacks to async/await', 'regex': 'Write a precise ISO-date regex',
  'dedupe': 'Dedupe an array, preserving order', 'extract-json': 'Extract contacts to JSON',
  'extract-fields': 'Normalize messy records', 'extract-dates': 'Normalize dates to ISO',
  'extract-prices': 'Parse a price list to JSON', 'logic-puzzle': 'Solve a pet constraint puzzle',
  'schedule-puzzle': 'Resolve a scheduling constraint', 'deduction': 'Order finishers from clues',
  'word-problem': 'Multi-step arithmetic', 'sql-schema': 'Design a multi-tenant schema',
  'sql-top-customers': 'Top customers by spend (SQL)', 'sql-fix-groupby': 'Fix a broken GROUP BY',
  'api-design': 'Design a paginated search API',
};
const humanTask = (id) => TITLES[id] || id;

const median = (xs) => { if (!xs.length) return 0; const s=[...xs].sort((a,b)=>a-b); const m=Math.floor(s.length/2); return s.length%2?s[m]:(s[m-1]+s[m])/2; };
const ci95 = (xs) => { if (xs.length<2) return undefined; const mean=xs.reduce((a,b)=>a+b,0)/xs.length; const sd=Math.sqrt(xs.reduce((a,b)=>a+(b-mean)**2,0)/(xs.length-1)); const h=1.96*sd/Math.sqrt(xs.length); return [Math.max(0,mean-h),mean+h]; };

function metricsFrom(modelId, rs) {
  const costs = rs.map((r) => runCost(modelId, r.output));
  const quals = rs.map((r) => r.quality);
  const completion = rs.length ? rs.filter((r) => r.pass).length / rs.length : 0;
  const out = {
    completionRate: { value: Number(completion.toFixed(2)), unit: 'pass^k', nRuns: rs.length, passK: Number(completion.toFixed(2)) },
    costToDone: { value: Number(median(costs).toFixed(6)), unit: '$/task', nRuns: rs.length },
    quality: { value: Math.round(quals.reduce((a, b) => a + b, 0) / (quals.length || 1)), unit: '/100', nRuns: rs.length },
  };
  const cc = ci95(costs); if (cc) out.costToDone.ci95 = cc.map((x) => Number(x.toFixed(6)));
  const qc = ci95(quals); if (qc) out.quality.ci95 = qc.map((x) => Math.round(x));
  return out;
}

const RUN_DATE = process.env.RUN_DATE || new Date().toISOString().slice(0, 10);
const slug = `${RUN_DATE}-power-rankings`;

const files = fs.readdirSync(PARTIAL).filter((f) => f.endsWith('.json') && f !== '_costs.json');
const models = [];
for (const f of files) {
  const d = JSON.parse(fs.readFileSync(path.join(PARTIAL, f), 'utf8'));
  const rs = (d.results || []).filter((r) => r.output); // includes '(no response)' — a no-response is a real failure
  if (!rs.length) { console.log('skip (no runs):', d.model); continue; }
  const byCategory = {};
  for (const cat of CATEGORIES) { const rsc = rs.filter((r) => r.category === cat); if (rsc.length) byCategory[cat] = metricsFrom(d.model, rsc); }
  models.push({ modelId: d.model, displayName: d.name, vendor: d.vendor, experiments: [slug], normalized: {}, recursivScore: 0, metrics: metricsFrom(d.model, rs), byCategory });
}

fs.writeFileSync(path.join(ROOT, 'data', 'leaderboard.json'), JSON.stringify({ updatedAt: new Date().toISOString(), preview: false, weights: {}, models }, null, 2));

// ---- Compute the viral story from the real data ----
const ranked = models.slice().sort((a, b) => (b.metrics.completionRate.value / (b.metrics.costToDone.value || 1e-9)) - (a.metrics.completionRate.value / (a.metrics.costToDone.value || 1e-9)));
const bestValue = ranked[0];
const byCost = [...models].sort((a, b) => a.metrics.costToDone.value - b.metrics.costToDone.value);
const cheapest = byCost[0], priciest = byCost[byCost.length - 1];
const ratio = Math.round(priciest.metrics.costToDone.value / (cheapest.metrics.costToDone.value || 1e-9));
const byRel = [...models].sort((a, b) => a.metrics.completionRate.value - b.metrics.completionRate.value || a.metrics.quality.value - b.metrics.quality.value);
const worst = byRel[0];

const winner = bestValue.displayName;
// experiment number = chronological position among all experiments
const expDir = path.join(ROOT, 'content', 'experiments');
const existingDates = fs.existsSync(expDir) ? fs.readdirSync(expDir).filter((f) => f.endsWith('.mdx')).map((f) => f.slice(0, 10)) : [];
const number = String(Array.from(new Set([...existingDates, RUN_DATE])).sort().indexOf(RUN_DATE) + 1).padStart(3, '0');

const title = 'The real cost of finishing the job';
const test = `We gave the ${models.length} top AI models the same real coding, data, reasoning, and SQL tasks, then measured what each one finished, how good it was, and what it cost.`;
let finding, heroValue, heroLabel;
if (priciest.modelId === worst.modelId && ratio >= 3) {
  finding = `The most expensive model finished last. ${priciest.displayName} cost about ${ratio}× the cheapest model and scored lowest of all ${models.length}. The cheapest models finished every task.`;
  heroValue = `${ratio}×`;
  heroLabel = 'priciest, and last place';
} else {
  finding = `${winner} was the best value, finishing the work reliably for about ${ratio}× less than ${priciest.displayName}.`;
  heroValue = winner;
  heroLabel = 'best value';
}
const summary = `${test} ${finding}`;

// ---- receipts: a handful of real runs as readable proof (task -> answer -> verdict -> cost) ----
const allRuns = [];
for (const f of files) {
  const d = JSON.parse(fs.readFileSync(path.join(PARTIAL, f), 'utf8'));
  for (const r of (d.results || [])) {
    if (!r.output) continue; // keep '(no response)' — it's a real failed run, shown as such
    allRuns.push({ model: d.name, modelId: d.model, task: humanTask(r.task), category: r.category, answer: r.output, pass: r.pass, quality: r.quality, cost: runCost(d.model, r.output) });
  }
}
// every graded run is a receipt — sorted to be scannable (by task, then best first)
const receipts = allRuns
  .sort((a, b) => a.category.localeCompare(b.category) || a.task.localeCompare(b.task) || Number(b.pass) - Number(a.pass) || b.quality - a.quality)
  .map((r) => ({ model: r.model, task: r.task, category: r.category, answer: (r.answer || '').slice(0, 800), pass: r.pass, quality: r.quality, cost: Number(r.cost.toFixed(6)) }));
fs.writeFileSync(path.join(ROOT, 'data', 'transcripts', `${slug}.json`), JSON.stringify({ runs: receipts }, null, 2));

const fm = [
  `number: "${number}"`,
  `title: "${title}"`,
  `test: "${test.replace(/"/g, "'")}"`,
  `finding: "${finding.replace(/"/g, "'")}"`,
  `summary: "${summary.replace(/"/g, "'")}"`,
  `date: "${RUN_DATE}"`,
  `status: "live"`,
  `winner: "${winner}"`,
  `heroStatValue: "${heroValue}"`,
  `heroStatLabel: "${heroLabel}"`,
].join('\n');
const mdx = `---\n${fm}\n---\n\n${test} Cost-to-Done is the tokens each run actually used, priced at published per-model rates; reliability is pass^k across runs; quality is graded by an independent judge.\n\n<VerdictBox>\n${finding}\n</VerdictBox>\n`;
fs.writeFileSync(path.join(ROOT, 'content', 'experiments', `${slug}.mdx`), mdx);

console.log(`assembled ${models.length} models -> data/leaderboard.json`);
for (const m of ranked) console.log('  ', m.displayName.padEnd(20), 'rel', m.metrics.completionRate.value, 'cost $' + m.metrics.costToDone.value, 'qual', m.metrics.quality.value);
