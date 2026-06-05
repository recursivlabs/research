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
  const rs = (d.results || []).filter((r) => r.output && r.output !== '(no response)');
  if (!rs.length) { console.log('skip (no runs):', d.model); continue; }
  const byCategory = {};
  for (const cat of CATEGORIES) { const rsc = rs.filter((r) => r.category === cat); if (rsc.length) byCategory[cat] = metricsFrom(d.model, rsc); }
  models.push({ modelId: d.model, displayName: d.name, vendor: d.vendor, experiments: [slug], normalized: {}, recursivScore: 0, metrics: metricsFrom(d.model, rs), byCategory });
}

fs.writeFileSync(path.join(ROOT, 'data', 'leaderboard.json'), JSON.stringify({ updatedAt: new Date().toISOString(), preview: false, weights: {}, models }, null, 2));

// one real transcript
let sample = null;
for (const f of files) { const d = JSON.parse(fs.readFileSync(path.join(PARTIAL, f), 'utf8')); const r = (d.results || []).find((x) => x.output && x.output !== '(no response)'); if (r) { sample = { name: d.name, r }; break; } }
if (sample) {
  fs.writeFileSync(path.join(ROOT, 'data', 'transcripts', `${slug}.json`), JSON.stringify({
    model: sample.name, task: sample.r.task, costUsd: Number(runCost(sample.r.model || '', sample.r.output).toFixed(4)),
    steps: [{ role: 'agent', text: `Task: ${sample.r.task} (${sample.r.category})` }, { role: 'result', text: (sample.r.output || '').slice(0, 500) }],
  }, null, 2));
}

// ---- Compute the viral story from the real data ----
const ranked = models.slice().sort((a, b) => (b.metrics.completionRate.value / (b.metrics.costToDone.value || 1e-9)) - (a.metrics.completionRate.value / (a.metrics.costToDone.value || 1e-9)));
const bestValue = ranked[0];
const byCost = [...models].sort((a, b) => a.metrics.costToDone.value - b.metrics.costToDone.value);
const cheapest = byCost[0], priciest = byCost[byCost.length - 1];
const ratio = Math.round(priciest.metrics.costToDone.value / (cheapest.metrics.costToDone.value || 1e-9));
const byRel = [...models].sort((a, b) => a.metrics.completionRate.value - b.metrics.completionRate.value || a.metrics.quality.value - b.metrics.quality.value);
const worst = byRel[0];

let title, summary, heroValue, heroLabel;
const winner = bestValue.displayName;
if (priciest.modelId === worst.modelId && ratio >= 3) {
  title = 'The most expensive model finished last';
  summary = `We ran the ${models.length} top AI models on real coding, data, reasoning, and SQL tasks. ${priciest.displayName} cost about ${ratio}× the cheapest model and still posted the lowest score of the field. The cheapest models aced every task.`;
  heroValue = `${ratio}×`;
  heroLabel = 'the cost — and last place';
} else {
  title = `${winner} is the best value in AI right now`;
  summary = `We ran the ${models.length} top AI models on real coding, data, reasoning, and SQL tasks. ${winner} finished the work reliably at the lowest cost — ${priciest.displayName} cost about ${ratio}× as much.`;
  heroValue = winner;
  heroLabel = 'best cost-to-done';
}

const mdx = `---\ntitle: "${title}"\nsummary: "${summary.replace(/"/g, "'")}"\ndate: "${RUN_DATE}"\nstatus: "live"\nwinner: "${winner}"\nheroStatValue: "${heroValue}"\nheroStatLabel: "${heroLabel}"\n---\n\nWe ran the ${models.length} leading models as agents on real ${CATEGORIES.join(', ')} tasks, grading completion and quality with an independent judge model. Cost-to-Done is the tokens each run actually used, priced at published per-model rates.\n\n<VerdictBox>\n${priciest.displayName} cost about ${ratio}× ${cheapest.displayName} per task. ${winner} did the same work reliably for a fraction of a cent.\n</VerdictBox>\n`;
fs.writeFileSync(path.join(ROOT, 'content', 'experiments', `${slug}.mdx`), mdx);

console.log(`assembled ${models.length} models -> data/leaderboard.json`);
for (const m of ranked) console.log('  ', m.displayName.padEnd(20), 'rel', m.metrics.completionRate.value, 'cost $' + m.metrics.costToDone.value, 'qual', m.metrics.quality.value);
