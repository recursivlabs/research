/**
 * Autonomous research swarm.
 *
 * Spins up a fleet of agents on Recursiv (one per model) + a judge agent, runs the
 * day's tasks across use-case categories within a hard dollar budget, measures real
 * cost from ai_usage (cumulative-diff), grades completion + quality, and writes
 * results in the app's exact format: data/leaderboard.json (overall + per use-case),
 * data/stream.json, content/experiments/<slug>.mdx, data/transcripts/<slug>.json.
 *
 * Env: RECURSIV_API_KEY, RESEARCH_PROJECT_ID, DAILY_BUDGET_USD (default 5),
 * RUNS_PER_TASK (default 2), TASKS_PER_CATEGORY (default 1), MODELS_LIMIT (test),
 * VALIDATE=1 (print-only, no writes).
 */
import { Recursiv } from '@recursiv/sdk';
import fs from 'node:fs';
import path from 'node:path';

type UseCase = 'coding' | 'extraction' | 'reasoning' | 'sql';
const CATEGORIES: UseCase[] = ['coding', 'extraction', 'reasoning', 'sql'];

const API_KEY = process.env.RECURSIV_API_KEY!;
const BASE_URL = process.env.NEXT_PUBLIC_RECURSIV_URL || 'https://api.recursiv.io/api/v1';
const PROJECT_ID = process.env.RESEARCH_PROJECT_ID!;
const BUDGET = Number(process.env.DAILY_BUDGET_USD || 5);
const RUNS_PER_TASK = Number(process.env.RUNS_PER_TASK || 2);
const TASKS_PER_CATEGORY = Number(process.env.TASKS_PER_CATEGORY || 1);
const JUDGE_MODEL = 'anthropic/claude-sonnet-4.6';
const MARKUP = 1.5; // ai_usage is billed at 1.5x provider cost; we report provider cost
const RUN_DATE = process.env.RUN_DATE || new Date().toISOString().slice(0, 10);
// Per-model mode: run a single model with no billing call, dump raw results.
// Real cost is metered out-of-band via the MCP billing read (the harness key
// intentionally has no billing scope — least privilege).
const NO_BILLING = process.env.NO_BILLING === '1';
const MODEL_ONLY = process.env.MODEL_ONLY || '';
const PARTIAL_OUT = process.env.PARTIAL_OUT || '';

// Latest flagship per provider (verified on OpenRouter). New ones require the
// platform allowlist update; enrollment is resilient, so any model not yet
// allowlisted is skipped until it lands, then auto-included.
const MODELS = [
  { id: 'anthropic/claude-opus-4.8', name: 'Claude Opus 4.8', vendor: 'Anthropic' },
  { id: 'anthropic/claude-sonnet-4.6', name: 'Claude Sonnet 4.6', vendor: 'Anthropic' },
  { id: 'openai/gpt-5.5', name: 'GPT-5.5', vendor: 'OpenAI' },
  { id: 'google/gemini-3.5-flash', name: 'Gemini 3.5 Flash', vendor: 'Google' },
  { id: 'google/gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro', vendor: 'Google' },
  { id: 'x-ai/grok-4.3', name: 'Grok 4.3', vendor: 'xAI' },
  { id: 'deepseek/deepseek-v4-pro', name: 'DeepSeek V4 Pro', vendor: 'DeepSeek' },
  { id: 'moonshotai/kimi-k2.6', name: 'Kimi K2.6', vendor: 'Moonshot' },
  { id: 'minimax/minimax-m3', name: 'MiniMax M3', vendor: 'MiniMax' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o mini', vendor: 'OpenAI' },
];

interface Task { id: string; title: string; category: UseCase; prompt: string; rubric: string }

const TASK_POOL: Task[] = [
  { id: 'pagination-bug', title: 'Find and fix a pagination bug', category: 'coding',
    prompt: "This function should paginate a list but returns wrong items on page 2+. Fix it and return only the corrected function.\n\nfunction paginate(items, page, perPage) {\n  const start = page * perPage;\n  return items.slice(start, perPage);\n}",
    rubric: 'Correct: end = start + perPage with consistent indexing, e.g. items.slice(start, start+perPage).' },
  { id: 'edge-case-fn', title: 'Implement chunk() with edge cases', category: 'coding',
    prompt: 'Write a JS function chunk(arr, size) splitting arr into chunks of length size. Handle size<=0 (return []), size>arr.length, and empty arr. Return only the function.',
    rubric: 'Handles size<=0 -> [], empty -> [], size>len -> one chunk, normal correct.' },
  { id: 'refactor-callback', title: 'Refactor callbacks to async/await', category: 'coding',
    prompt: 'Refactor to async/await with try/catch. Return only the function.\n\nfunction load(cb){ getUser((e,u)=>{ if(e) return cb(e); getPosts(u.id,(e2,p)=>{ if(e2) return cb(e2); cb(null,{u,p}); }); }); }',
    rubric: 'Awaits promisified calls, try/catch, returns {u,p}. Correct and clean.' },
  { id: 'regex', title: 'Write a precise ISO-date regex', category: 'coding',
    prompt: 'Write a regex matching ISO dates YYYY-MM-DD where month is 01-12 and day is 01-31. Return only the regex.',
    rubric: 'Anchors month 01-12 and day 01-31 (not just \\d{2}), anchored.' },
  { id: 'extract-json', title: 'Extract contacts to JSON', category: 'extraction',
    prompt: 'Extract every email and US phone number into JSON {emails:[],phones:[]}. Text: "Reach Ann at ann.lee@acme.co or (415) 555-0192. Backup: support@acme.co, 415.555.7766."',
    rubric: 'emails [ann.lee@acme.co, support@acme.co]; both phones; valid JSON; no hallucinations.' },
  { id: 'extract-fields', title: 'Normalize messy records', category: 'extraction',
    prompt: 'Convert to a JSON array of {name,role,years}. Text: "Jane Doe — Engineer, 5 yrs. Bob Smith, Designer (2 years). Carol, PM 11y."',
    rubric: 'Three objects with correct name/role/years as numbers. Valid JSON.' },
  { id: 'logic-puzzle', title: 'Solve a pet constraint puzzle', category: 'reasoning',
    prompt: 'Ada, Bo, Cy each have a different pet (cat, dog, fish). Ada does not have the cat. Bo has the dog. Who has the fish? Answer with just the name.',
    rubric: 'Answer is Ada.' },
  { id: 'schedule-puzzle', title: 'Resolve a scheduling constraint', category: 'reasoning',
    prompt: 'Three 1-hour meetings A,B,C, one each at 1pm, 2pm, 3pm. A is before C. B is not at 2pm. What time is each? Answer as A=?,B=?,C=?.',
    rubric: 'Distinct 1/2/3pm slots with A earlier than C and B not at 2pm. Valid example: A=1pm,B=3pm,C=2pm. Accept any assignment meeting all three constraints.' },
  { id: 'deduction', title: 'Order finishers from clues', category: 'reasoning',
    prompt: 'Four runners finished a race. Cara beat Dan. Dan beat Eve. Finn finished last. Who came first? Answer with just the name.',
    rubric: 'Answer is Cara.' },
  { id: 'word-problem', title: 'Multi-step arithmetic', category: 'reasoning',
    prompt: 'A store sells pens at 3 for $2. You buy 12 pens and pay with a $20 bill. How much change do you get? Answer with just the dollar amount.',
    rubric: '12 pens = 4 sets at $2 = $8; change = $12. Answer is $12.' },
  { id: 'extract-dates', title: 'Normalize dates to ISO', category: 'extraction',
    prompt: 'Convert every date to ISO YYYY-MM-DD in a JSON array. Text: "Born March 3, 1990. Hired 12/01/2020. Renewed on 2021-6-7." Return only JSON.',
    rubric: '["1990-03-03","2020-12-01","2021-06-07"], valid JSON, zero-padded.' },
  { id: 'extract-prices', title: 'Parse a price list to JSON', category: 'extraction',
    prompt: 'Extract to a JSON array of {item,price}. Text: "Widget $4.50, Gadget $12, Bolt 0.30 each, Cable - $3.25". Return only JSON.',
    rubric: 'Four items with numeric prices [4.50,12,0.30,3.25]. Valid JSON.' },
  { id: 'dedupe', title: 'Dedupe preserving order', category: 'coding',
    prompt: 'Write a JS function unique(arr) that returns arr with duplicates removed, preserving first-occurrence order. Return only the function.',
    rubric: 'Removes duplicates and preserves first-occurrence order, e.g. [...new Set(arr)] or equivalent.' },
  { id: 'sql-schema', title: 'Design a multi-tenant schema', category: 'sql',
    prompt: 'Design a minimal Postgres schema for a multi-tenant todo app (orgs, users, projects, tasks) with tenant isolation. Return CREATE TABLE statements only.',
    rubric: 'Tables with FKs and organization_id on tenant-scoped tables, PKs, sensible types.' },
  { id: 'sql-top-customers', title: 'Top customers by spend', category: 'sql',
    prompt: 'Tables: customers(id,name), orders(id,customer_id,total). Write a SQL query for the top 3 customers by total spend, returning name and total. Return only the SQL.',
    rubric: 'JOIN on customer_id, SUM(total), GROUP BY, ORDER BY total DESC, LIMIT 3. Correct.' },
  { id: 'sql-fix-groupby', title: 'Fix a broken GROUP BY', category: 'sql',
    prompt: 'Fix this query so it returns each status with its count. Return only the SQL.\nSELECT status, COUNT(*) FROM orders;',
    rubric: 'Adds GROUP BY status. Otherwise correct.' },
  { id: 'api-design', title: 'Design a paginated search API', category: 'sql',
    prompt: 'Design a REST API for paginated search over posts: method, path, query params, and JSON response shape with pagination metadata. Be concise.',
    rubric: 'GET with q + limit/offset or cursor; response has results + total/next. Complete.' },
];

function pickTasks(): Task[] {
  const day = Math.floor(new Date(RUN_DATE).getTime() / 86400000);
  const out: Task[] = [];
  for (const cat of CATEGORIES) {
    const pool = TASK_POOL.filter((t) => t.category === cat);
    const start = ((day % pool.length) + pool.length) % pool.length;
    for (let i = 0; i < Math.min(TASKS_PER_CATEGORY, pool.length); i++) out.push(pool[(start + i) % pool.length]);
  }
  return out;
}

const sdk = new Recursiv({ apiKey: API_KEY, baseUrl: BASE_URL });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let RUN_START = new Date().toISOString();

async function costTotal(): Promise<number> {
  if (NO_BILLING) return 0;
  const res = await sdk.billing.getProjectUsage(PROJECT_ID, { from: RUN_START });
  const ai = (res.data || []).find((i) => /ai/i.test(i.item));
  return (ai ? Number(ai.units) : 0) / MARKUP;
}

interface RunResult { model: string; category: UseCase; task: string; costUsd: number; ms: number; pass: boolean; quality: number; output: string }

const createdAgents: string[] = [];
async function ensureAgent(name: string, username: string, model: string, system: string): Promise<string> {
  const res = await sdk.agents.create({ name, username: `${username}_${Date.now().toString(36)}`.slice(0, 30), model, system_prompt: system, tool_mode: 'chat_only', project_id: PROJECT_ID });
  createdAgents.push(res.data.id);
  return res.data.id;
}
async function cleanup() { for (const id of createdAgents) { try { await sdk.agents.delete(id); } catch {} } }

// Returns a grade, or null if the judge could not produce a parseable verdict
// after retries (so the caller can EXCLUDE the run rather than score it 0).
async function judge(judgeAgentId: string, task: Task, output: string): Promise<{ pass: boolean; quality: number } | null> {
  const prompt = `Grade an AI model's answer. Be strict but fair.\n\nTASK: ${task.prompt}\n\nRUBRIC: ${task.rubric}\n\nANSWER: ${output}\n\nReturn ONLY compact JSON, nothing else: {"pass": true|false, "quality": 0-100}. pass = fully correct. quality = 0-100.`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await sdk.agents.chatStreamText(judgeAgentId, { message: prompt, new_conversation: true });
      const m = res.content.match(/\{[\s\S]*?\}/);
      if (m) {
        const j = JSON.parse(m[0]);
        if (j.quality !== undefined || j.pass !== undefined) {
          return { pass: !!j.pass, quality: Math.max(0, Math.min(100, Number(j.quality) || 0)) };
        }
      }
    } catch {
      /* retry */
    }
    await sleep(1500);
  }
  return null;
}

// Run a model with retries; empty/errored responses (transient provider issues,
// common right after a model is allowlisted) are retried before giving up.
async function runModel(agentId: string, prompt: string): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const c = (await sdk.agents.chatStreamText(agentId, { message: prompt, new_conversation: true })).content;
      if (c && c.trim()) return c;
    } catch {
      /* retry */
    }
    await sleep(2500);
  }
  return '';
}

const stream: { ts: string; kind: string; actor: string; text: string; experiment?: string }[] = [];
function emit(kind: string, actor: string, text: string, experiment?: string) {
  stream.push({ ts: new Date().toISOString(), kind, actor, text, experiment });
  console.log(`[${kind}] ${actor}: ${text}`);
}

function median(xs: number[]): number { if (!xs.length) return 0; const s = [...xs].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }
function ci95(xs: number[]): [number, number] | undefined { if (xs.length < 2) return undefined; const mean = xs.reduce((a, b) => a + b, 0) / xs.length; const sd = Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / (xs.length - 1)); const h = 1.96 * (sd / Math.sqrt(xs.length)); return [Math.max(0, mean - h), mean + h]; }

function metricsFrom(rs: RunResult[]) {
  const costs = rs.map((r) => r.costUsd);
  const quals = rs.map((r) => r.quality);
  const completion = rs.length ? rs.filter((r) => r.pass).length / rs.length : 0;
  const out: any = {
    completionRate: { value: Number(completion.toFixed(2)), unit: 'pass^k', nRuns: rs.length, passK: Number(completion.toFixed(2)) },
    costToDone: { value: Number(median(costs).toFixed(3)), unit: '$/task', nRuns: rs.length },
    quality: { value: Math.round(quals.reduce((a, b) => a + b, 0) / (quals.length || 1)), unit: '/100', nRuns: rs.length },
  };
  const cc = ci95(costs); if (cc) out.costToDone.ci95 = cc.map((x) => Number(x.toFixed(3)));
  const qc = ci95(quals); if (qc) out.quality.ci95 = qc.map((x) => Math.round(x));
  return out;
}

async function main() {
  const validate = process.env.VALIDATE === '1';
  const limit = process.env.MODELS_LIMIT ? Number(process.env.MODELS_LIMIT) : 0;
  const models = MODEL_ONLY ? MODELS.filter((m) => m.id === MODEL_ONLY) : limit ? MODELS.slice(0, limit) : MODELS;
  const tasks = pickTasks();
  const runs = RUNS_PER_TASK;

  emit('swarm', 'orchestrator', `Research cycle started for ${RUN_DATE}. ${models.length} models x ${tasks.length} tasks across ${CATEGORIES.length} use cases, budget $${BUDGET}.`);

  RUN_START = new Date(Date.now() - 5000).toISOString();
  const judgeId = await ensureAgent('Judge', 'eval_judge', JUDGE_MODEL, 'You are a strict, fair grader. Return only the requested JSON.');
  const baseline = await costTotal();
  let prevCost = baseline;
  let spent = 0;
  const results: RunResult[] = [];

  outer: for (const model of models) {
    let agentId: string;
    try {
      agentId = await ensureAgent(`Eval ${model.name}`, 'eval', model.id, 'Complete the task. Be correct and concise. Return only what is asked.');
    } catch (e: any) {
      emit('swarm', 'orchestrator', `Skipped ${model.id} — not available yet (${e?.code || 'error'}).`);
      continue;
    }
    emit('swarm', 'orchestrator', `Enrolled ${model.id}.`);
    for (const task of tasks) {
      for (let r = 0; r < runs; r++) {
        if (spent >= BUDGET) { emit('swarm', 'orchestrator', `Budget $${BUDGET} reached. Wrapping up.`); break outer; }
        const before = prevCost;
        const t0 = Date.now();
        const content = await runModel(agentId, task.prompt);
        const ms = Date.now() - t0;
        await sleep(5000);

        // genuine no-response after retries → real incomplete
        if (!content) {
          prevCost = await costTotal();
          spent = prevCost - baseline;
          emit('retry', `runner/${model.vendor.toLowerCase()}`, `${model.id} gave no response on '${task.title}' after retries — counts as incomplete.`);
          results.push({ model: model.id, category: task.category, task: task.id, costUsd: Math.max(0, prevCost - before), ms, pass: false, quality: 0, output: '(no response)' });
          continue;
        }

        const afterModel = await costTotal();
        const costUsd = Math.max(0, afterModel - before);
        emit('run', `runner/${model.vendor.toLowerCase()}`, `${model.id} finished '${task.title}' in ${(ms / 1000).toFixed(1)}s ($${costUsd.toFixed(3)}).`);

        const grade = await judge(judgeId, task, content);
        await sleep(3000);
        prevCost = await costTotal();
        spent = prevCost - baseline;

        // ungraded (judge couldn't produce a verdict) → EXCLUDE, don't score 0
        if (grade === null) {
          emit('retry', 'judge', `could not grade ${model.id} on '${task.title}' — excluded from results.`);
          continue;
        }
        emit('judge', 'judge', `Scored ${model.id} on '${task.title}': ${grade.pass ? 'pass' : 'fail'}, quality ${grade.quality}.`);
        results.push({ model: model.id, category: task.category, task: task.id, costUsd, ms, pass: grade.pass, quality: grade.quality, output: content });
      }
    }
  }

  emit('cost', 'cost-meter', `Experiment complete. Real spend: $${spent.toFixed(2)} across ${results.length} runs.`);

  if (PARTIAL_OUT) {
    fs.writeFileSync(PARTIAL_OUT, JSON.stringify({ model: models[0]?.id, name: models[0]?.name, vendor: models[0]?.vendor, results }, null, 2));
    console.log(`\n=== PARTIAL written: ${PARTIAL_OUT} (${results.length} runs) ===`);
    return;
  }

  if (validate) {
    console.log('\n=== VALIDATION (no writes) ===');
    console.log(`Total measured cost: $${spent.toFixed(4)}`);
    return;
  }

  writeOutputs(models, tasks, results, spent);
  emit('ranking', 'synthesizer', 'Power rankings recomputed and published.');
  persistStream();
}

function writeOutputs(models: typeof MODELS, tasks: Task[], results: RunResult[], spent: number) {
  const root = process.cwd();
  const slug = `${RUN_DATE}-power-rankings`;

  const modelScores = models.map((m) => {
    const rs = results.filter((r) => r.model === m.id);
    if (!rs.length) return null;
    const byCategory: any = {};
    for (const cat of CATEGORIES) { const rsc = rs.filter((r) => r.category === cat); if (rsc.length) byCategory[cat] = metricsFrom(rsc); }
    return { modelId: m.id, displayName: m.name, vendor: m.vendor, experiments: [slug], normalized: {}, recursivScore: 0, metrics: metricsFrom(rs), byCategory };
  }).filter(Boolean);

  fs.writeFileSync(path.join(root, 'data', 'leaderboard.json'), JSON.stringify({ updatedAt: new Date().toISOString(), preview: false, weights: {}, models: modelScores }, null, 2));

  const sample = results.find((r) => r.output && r.output !== '(no response)');
  if (sample) {
    const tk = TASK_POOL.find((t) => t.id === sample.task);
    fs.writeFileSync(path.join(root, 'data', 'transcripts', `${slug}.json`), JSON.stringify({
      model: models.find((m) => m.id === sample.model)?.name || sample.model,
      task: tk?.title || sample.task, costUsd: sample.costUsd,
      steps: [{ role: 'agent', text: tk?.prompt.slice(0, 160) || '' }, { role: 'result', text: sample.output.slice(0, 500) }],
    }, null, 2));
  }

  const ranked = (modelScores as any[]).slice().sort((a, b) => (b.metrics.completionRate.value / (b.metrics.costToDone.value || 1)) - (a.metrics.completionRate.value / (a.metrics.costToDone.value || 1)));
  const best = ranked[0];
  const mdx = `---\ntitle: "Power Rankings — ${RUN_DATE}"\nsummary: "The swarm ran ${models.length} models across ${CATEGORIES.length} use cases today. Best value: ${best?.displayName}."\ndate: "${RUN_DATE}"\nstatus: "live"\nheroStatLabel: "real spend, all models"\nheroStatValue: "$${spent.toFixed(2)}"\n---\n\nThe autonomous swarm benchmarked ${models.length} models on real ${CATEGORIES.join(', ')} tasks, grading completion and quality with an independent judge and metering real cost.\n\n<VerdictBox>\nBest value this run: ${best?.displayName} — finishes reliably at the lowest real cost.\n</VerdictBox>\n\n<Callout label="Autonomous">\nDesigned, run, judged, and published by the Recursiv research swarm.\n</Callout>\n`;
  fs.writeFileSync(path.join(root, 'content', 'experiments', `${slug}.mdx`), mdx);
}

function persistStream() {
  const file = path.join(process.cwd(), 'data', 'stream.json');
  let existing: any[] = [];
  try { existing = JSON.parse(fs.readFileSync(file, 'utf8')); } catch {}
  fs.writeFileSync(file, JSON.stringify([...stream.reverse(), ...existing].slice(0, 60), null, 2));
}

main().then(cleanup).catch(async (e) => { console.error(e); await cleanup(); process.exit(1); });
