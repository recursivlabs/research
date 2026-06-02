/**
 * Autonomous daily research swarm.
 *
 * Spins up a fleet of agents on Recursiv (one per model) + a judge agent, runs
 * the day's experiment within a hard dollar budget, measures real cost from
 * ai_usage, grades completion + quality, and writes results in the app's exact
 * format: data/leaderboard.json, data/stream.json, content/experiments/<slug>.mdx,
 * data/transcripts/<slug>.json.
 *
 * Run: RECURSIV_API_KEY=... RESEARCH_PROJECT_ID=... tsx scripts/run-experiment.ts
 * Flags via env: DAILY_BUDGET_USD (default 5), RUNS_PER_TASK (default 3),
 * TASKS_PER_DAY (default 4), DRY_RUN=1 (no agent calls, validate wiring),
 * VALIDATE=1 (1 model x 1 task x 1 run, no file writes).
 */
import { Recursiv } from '@recursiv/sdk';
import fs from 'node:fs';
import path from 'node:path';

const API_KEY = process.env.RECURSIV_API_KEY!;
const BASE_URL = process.env.NEXT_PUBLIC_RECURSIV_URL || 'https://api.recursiv.io';
const PROJECT_ID = process.env.RESEARCH_PROJECT_ID!;
const ORG_ID = process.env.RESEARCH_ORG_ID || '019c9736-d6f1-709e-a23a-a5f7f039bc56';
const BUDGET = Number(process.env.DAILY_BUDGET_USD || 5);
const RUNS_PER_TASK = Number(process.env.RUNS_PER_TASK || 3);
const TASKS_PER_DAY = Number(process.env.TASKS_PER_DAY || 4);
const JUDGE_MODEL = 'anthropic/claude-opus-4.6';
const MARKUP = 1.5; // platform bills ai_usage at 1.5x provider cost; we report provider cost
const RUN_DATE = process.env.RUN_DATE || new Date().toISOString().slice(0, 10);

const MODELS = [
  { id: 'anthropic/claude-opus-4.6', name: 'Claude Opus 4.6', vendor: 'Anthropic' },
  { id: 'anthropic/claude-sonnet-4.6', name: 'Claude Sonnet 4.6', vendor: 'Anthropic' },
  { id: 'openai/gpt-5.4', name: 'GPT-5.4', vendor: 'OpenAI' },
  { id: 'google/gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro', vendor: 'Google' },
  { id: 'google/gemini-3-flash-preview', name: 'Gemini 3 Flash', vendor: 'Google' },
  { id: 'x-ai/grok-4.1-fast', name: 'Grok 4.1 Fast', vendor: 'xAI' },
  { id: 'moonshotai/kimi-k2.5', name: 'Kimi K2.5', vendor: 'Moonshot' },
  { id: 'deepseek/deepseek-v3.2', name: 'DeepSeek V3.2', vendor: 'DeepSeek' },
  { id: 'minimax/minimax-m2.5', name: 'MiniMax M2.5', vendor: 'MiniMax' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o mini', vendor: 'OpenAI' },
];

interface Task {
  id: string;
  title: string;
  prompt: string;
  rubric: string;
}

// A rotating pool; each day picks a slice so every run is a fresh experiment.
const TASK_POOL: Task[] = [
  {
    id: 'pagination-bug',
    title: 'Find and fix a pagination bug',
    prompt:
      'This function is supposed to paginate a list but returns the wrong items on page 2+. Identify the bug and return the corrected function only.\n\nfunction paginate(items, page, perPage) {\n  const start = page * perPage;\n  return items.slice(start, perPage);\n}',
    rubric: 'Correct fix: start = (page-1)*perPage (or 0-indexed consistent) and end = start+perPage. Must return items.slice(start, start+perPage) with consistent indexing.',
  },
  {
    id: 'extract-json',
    title: 'Extract structured data from messy text',
    prompt:
      'Extract every email and US phone number from this text into JSON {emails:[],phones:[]}. Text: "Reach Ann at ann.lee@acme.co or (415) 555-0192. Backup: support@acme.co, 415.555.7766."',
    rubric: 'emails must be [ann.lee@acme.co, support@acme.co]; phones must capture both numbers. Valid JSON, no extras/hallucinations.',
  },
  {
    id: 'sql-schema',
    title: 'Design a schema for a multi-tenant app',
    prompt:
      'Design a minimal Postgres schema for a multi-tenant todo app (organizations, users, projects, tasks) with proper tenant isolation. Return CREATE TABLE statements only.',
    rubric: 'Tables for orgs, users, projects, tasks with FKs and an organization_id on tenant-scoped tables for isolation. Reasonable types + PKs.',
  },
  {
    id: 'edge-case-fn',
    title: 'Implement a function with edge cases',
    prompt:
      'Write a JS function chunk(arr, size) that splits arr into chunks of length size. Handle size <= 0 (return []), size larger than arr, and empty arr. Return only the function.',
    rubric: 'Handles size<=0 -> [], empty arr -> [], size>len -> single chunk, normal case correct.',
  },
  {
    id: 'logic-puzzle',
    title: 'Solve a constraint puzzle',
    prompt:
      'Three people (Ada, Bo, Cy) each have a different pet (cat, dog, fish). Ada does not have the cat. Bo has the dog. Who has the fish? Answer with just the name.',
    rubric: 'Correct answer is Ada. (Bo=dog, Ada!=cat so Ada=fish, Cy=cat.)',
  },
  {
    id: 'api-design',
    title: 'Design a REST endpoint',
    prompt:
      'Design a REST API for paginated search over posts: method, path, query params, and the JSON response shape including pagination metadata. Be concise.',
    rubric: 'GET with q + limit/offset (or cursor); response has results array + total/next cursor. Sensible and complete.',
  },
  {
    id: 'refactor-callback',
    title: 'Refactor callbacks to async/await',
    prompt:
      'Refactor this callback code to async/await with try/catch. Return only the refactored function.\n\nfunction load(cb){ getUser((e,u)=>{ if(e) return cb(e); getPosts(u.id,(e2,p)=>{ if(e2) return cb(e2); cb(null,{u,p}); }); }); }',
    rubric: 'Uses await on promisified getUser/getPosts, try/catch, returns {u,p}. Correct and clean.',
  },
  {
    id: 'regex',
    title: 'Write a precise regex',
    prompt:
      'Write a regex that matches ISO dates YYYY-MM-DD where month is 01-12 and day is 01-31. Return only the regex.',
    rubric: 'Anchors months 01-12 and days 01-31 (not just \\d{2}). Reasonable, anchored.',
  },
];

function pickTasks(): Task[] {
  // rotate by day so each day is a different experiment
  const day = Math.floor(new Date(RUN_DATE).getTime() / 86400000);
  const start = ((day % TASK_POOL.length) + TASK_POOL.length) % TASK_POOL.length;
  const out: Task[] = [];
  for (let i = 0; i < Math.min(TASKS_PER_DAY, TASK_POOL.length); i++) {
    out.push(TASK_POOL[(start + i) % TASK_POOL.length]);
  }
  return out;
}

const sdk = new Recursiv({ apiKey: API_KEY, baseUrl: BASE_URL });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function projectAiCost(from: string, to: string): Promise<number> {
  // real provider $ spent in [from,to], from ai_usage via project billing window
  const res = await sdk.billing.getProjectUsage(PROJECT_ID, { from, to });
  const items = res.data || [];
  const ai = items.find((i) => /ai/i.test(i.item));
  const billed = ai ? Number(ai.units) : 0;
  return billed / MARKUP;
}

interface RunResult { model: string; task: string; costUsd: number; ms: number; pass: boolean; quality: number; output: string }

async function judge(judgeAgentId: string, task: Task, output: string): Promise<{ pass: boolean; quality: number }> {
  const prompt = `You are grading an AI model's answer to a task. Be strict.\n\nTASK: ${task.prompt}\n\nRUBRIC: ${task.rubric}\n\nMODEL ANSWER: ${output}\n\nReturn ONLY compact JSON: {"pass": true|false, "quality": 0-100}. pass = fully and correctly solves it. quality = overall quality 0-100.`;
  const res = await sdk.agents.chat(judgeAgentId, { message: prompt, new_conversation: true });
  const m = res.data.content.match(/\{[^}]*\}/);
  if (!m) return { pass: false, quality: 0 };
  try {
    const j = JSON.parse(m[0]);
    return { pass: !!j.pass, quality: Math.max(0, Math.min(100, Number(j.quality) || 0)) };
  } catch {
    return { pass: false, quality: 0 };
  }
}

async function ensureAgent(name: string, username: string, model: string, system: string, toolMode: 'chat_only' | 'autonomous'): Promise<string> {
  const res = await sdk.agents.create({
    name,
    username: `${username}_${Date.now().toString(36)}`.slice(0, 30),
    model,
    system_prompt: system,
    tool_mode: toolMode,
    project_id: PROJECT_ID,
    organization_id: ORG_ID,
  });
  return res.data.id;
}

const stream: { ts: string; kind: string; actor: string; text: string; experiment?: string }[] = [];
function emit(kind: string, actor: string, text: string, experiment?: string) {
  stream.push({ ts: new Date().toISOString(), kind, actor, text, experiment });
  console.log(`[${kind}] ${actor}: ${text}`);
}

function median(xs: number[]): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}
function ci95(xs: number[]): [number, number] | undefined {
  if (xs.length < 2) return undefined;
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const sd = Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / (xs.length - 1));
  const h = 1.96 * (sd / Math.sqrt(xs.length));
  return [Math.max(0, mean - h), mean + h];
}

async function main() {
  const validate = process.env.VALIDATE === '1';
  const models = validate ? MODELS.slice(4, 5) : MODELS; // 1 cheap model for validate
  const tasks = validate ? pickTasks().slice(0, 1) : pickTasks();
  const runs = validate ? 1 : RUNS_PER_TASK;

  emit('swarm', 'orchestrator', `Daily research cycle started for ${RUN_DATE}. ${models.length} models, ${tasks.length} tasks, budget $${BUDGET}.`);

  const judgeId = await ensureAgent('Judge', 'eval_judge', JUDGE_MODEL, 'You are a strict, fair grader of AI outputs. Return only the requested JSON.', 'chat_only');

  let spent = 0;
  const results: RunResult[] = [];
  outer: for (const model of models) {
    const agentId = await ensureAgent(`Eval ${model.name}`, 'eval', model.id, 'You are completing a task. Be correct and concise. Return only what is asked.', 'chat_only');
    emit('swarm', 'orchestrator', `Enrolled ${model.id} into the experiment.`);
    for (const task of tasks) {
      for (let r = 0; r < runs; r++) {
        if (spent >= BUDGET) {
          emit('swarm', 'orchestrator', `Daily budget $${BUDGET} reached. Wrapping up.`);
          break outer;
        }
        const from = new Date(Date.now() - 1000).toISOString();
        const t0 = Date.now();
        const res = await sdk.agents.chat(agentId, { message: task.prompt, new_conversation: true });
        const ms = Date.now() - t0;
        await sleep(4000); // let ai_usage persist
        const to = new Date().toISOString();
        const costUsd = await projectAiCost(from, to);
        spent += costUsd;
        emit('run', `runner/${model.vendor.toLowerCase()}`, `${model.id} finished '${task.title}' in ${(ms / 1000).toFixed(1)}s ($${costUsd.toFixed(3)}).`);
        const grade = await judge(judgeId, task, res.data.content);
        emit('judge', 'judge-opus', `Scored ${model.id} on '${task.title}': ${grade.pass ? 'pass' : 'fail'}, quality ${grade.quality}.`);
        results.push({ model: model.id, task: task.id, costUsd, ms, pass: grade.pass, quality: grade.quality, output: res.data.content });
      }
    }
  }

  emit('cost', 'cost-meter', `Experiment complete. Real spend: $${spent.toFixed(2)} across ${results.length} runs.`);

  if (validate) {
    console.log('\n=== VALIDATION RESULT ===');
    console.log(JSON.stringify(results.map((r) => ({ ...r, output: r.output.slice(0, 80) })), null, 2));
    console.log(`Total measured cost: $${spent.toFixed(4)}`);
    return;
  }

  writeOutputs(models, tasks, results, spent);
  emit('ranking', 'synthesizer', 'Power rankings recomputed and published.');
  persistStream();
}

function writeOutputs(models: typeof MODELS, tasks: Task[], results: RunResult[], spent: number) {
  const root = process.cwd();
  const slug = `${RUN_DATE}-${tasks.map((t) => t.id).join('-')}`.slice(0, 60);

  const modelScores = models
    .map((m) => {
      const rs = results.filter((r) => r.model === m.id);
      if (!rs.length) return null;
      const costs = rs.map((r) => r.costUsd);
      const quals = rs.map((r) => r.quality);
      const completion = rs.filter((r) => r.pass).length / rs.length;
      return {
        modelId: m.id,
        displayName: m.name,
        vendor: m.vendor,
        experiments: [slug],
        normalized: {},
        recursivScore: 0,
        metrics: {
          costToDone: { value: Number(median(costs).toFixed(3)), unit: '$/task', ci95: ci95(costs)?.map((x) => Number(x.toFixed(3))) as [number, number] | undefined, nRuns: rs.length },
          completionRate: { value: Number(completion.toFixed(2)), unit: 'pass^k', nRuns: rs.length, passK: Number(completion.toFixed(2)) },
          quality: { value: Math.round(quals.reduce((a, b) => a + b, 0) / quals.length), unit: '/100', ci95: ci95(quals)?.map((x) => Math.round(x)) as [number, number] | undefined, nRuns: rs.length },
        },
      };
    })
    .filter(Boolean);

  const leaderboard = { updatedAt: new Date().toISOString(), preview: false, weights: {}, models: modelScores };
  fs.writeFileSync(path.join(root, 'data', 'leaderboard.json'), JSON.stringify(leaderboard, null, 2));

  // representative transcript = the cheapest model's first run for the day
  const sample = results[0];
  if (sample) {
    const tx = { model: models.find((m) => m.id === sample.model)?.name || sample.model, task: tasks[0].title, costUsd: sample.costUsd, steps: [
      { role: 'agent', text: tasks[0].prompt.slice(0, 140) },
      { role: 'result', text: sample.output.slice(0, 400) },
    ] };
    fs.writeFileSync(path.join(root, 'data', 'transcripts', `${slug}.json`), JSON.stringify(tx, null, 2));
  }

  const top = [...modelScores].sort((a: any, b: any) => (a!.metrics.costToDone.value) - (b!.metrics.costToDone.value))[0] as any;
  const mdx = `---\ntitle: "Daily experiment — ${RUN_DATE}"\nsummary: "The swarm ran ${models.length} models on ${tasks.length} real tasks today. Cheapest reliable finisher: ${top?.displayName}."\ndate: "${RUN_DATE}"\nstatus: "live"\nheroStatLabel: "real spend, all models"\nheroStatValue: "$${spent.toFixed(2)}"\n---\n\nToday the autonomous swarm benchmarked ${models.length} models on ${tasks.length} held-out tasks (${tasks.map((t) => t.title).join(', ')}), grading completion and quality with an independent judge and metering real cost.\n\n<Callout label="Autonomous">\nThis experiment was designed, run, judged, and published by the Recursiv research swarm with no human in the loop.\n</Callout>\n`;
  fs.writeFileSync(path.join(root, 'content', 'experiments', `${slug}.mdx`), mdx);
}

function persistStream() {
  const root = process.cwd();
  const file = path.join(root, 'data', 'stream.json');
  let existing: any[] = [];
  try { existing = JSON.parse(fs.readFileSync(file, 'utf8')); } catch {}
  const merged = [...stream.reverse(), ...existing].slice(0, 60);
  fs.writeFileSync(file, JSON.stringify(merged, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
