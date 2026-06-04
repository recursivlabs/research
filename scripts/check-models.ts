import { Recursiv } from '@recursiv/sdk';

const sdk = new Recursiv({ apiKey: process.env.RECURSIV_API_KEY!, baseUrl: process.env.NEXT_PUBLIC_RECURSIV_URL || 'https://api.recursiv.io/api/v1' });
const PID = process.env.RESEARCH_PROJECT_ID!;
const ids = [
  'anthropic/claude-opus-4.8', 'openai/gpt-5.5', 'google/gemini-3.5-flash',
  'x-ai/grok-4.3', 'deepseek/deepseek-v4-pro', 'moonshotai/kimi-k2.6', 'minimax/minimax-m3',
];

(async () => {
  for (const id of ids) {
    try {
      const a = await sdk.agents.create({ name: 'check', username: `chk_${Math.floor(Math.random() * 1e9).toString(36)}`, model: id, tool_mode: 'chat_only', project_id: PID });
      console.log('OK      ', id);
      try { await sdk.agents.delete(a.data.id); } catch {}
    } catch (e: any) {
      console.log('BLOCKED ', id, '·', e?.code || e?.message);
    }
  }
})();
