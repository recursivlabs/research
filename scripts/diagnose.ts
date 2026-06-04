import { Recursiv } from '@recursiv/sdk';

const sdk = new Recursiv({ apiKey: process.env.RECURSIV_API_KEY!, baseUrl: process.env.NEXT_PUBLIC_RECURSIV_URL || 'https://api.recursiv.io/api/v1' });
const PID = process.env.RESEARCH_PROJECT_ID!;

const task = 'Write a regex matching ISO dates YYYY-MM-DD where month is 01-12 and day is 01-31. Return only the regex.';
const models = ['openai/gpt-4o-mini', 'moonshotai/kimi-k2.6'];

(async () => {
  const judge = (await sdk.agents.create({ name: 'dj', username: `dj_${Math.floor(Math.random()*1e9).toString(36)}`, model: 'anthropic/claude-sonnet-4.6', tool_mode: 'chat_only', project_id: PID })).data.id;
  for (const m of models) {
    console.log(`\n===== ${m} =====`);
    try {
      const a = (await sdk.agents.create({ name: 'd', username: `d_${Math.floor(Math.random()*1e9).toString(36)}`, model: m, tool_mode: 'chat_only', project_id: PID })).data.id;
      const r = await sdk.agents.chatStreamText(a, { message: task, new_conversation: true });
      console.log('MODEL OUTPUT >>>', JSON.stringify(r.content).slice(0, 300));
      const jr = await sdk.agents.chatStreamText(judge, { message: `Grade strictly. TASK: ${task}\nANSWER: ${r.content}\nReturn ONLY JSON {"pass":true|false,"quality":0-100}.`, new_conversation: true });
      console.log('JUDGE OUTPUT >>>', JSON.stringify(jr.content).slice(0, 300));
      await sdk.agents.delete(a).catch(() => {});
    } catch (e: any) {
      console.log('ERROR', e?.code || e?.message);
    }
  }
  await sdk.agents.delete(judge).catch(() => {});
})();
