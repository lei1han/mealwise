import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildFoodDbHint, assembleSystemPrompt, shouldMountMoodScene } from '../src/services/promptAssembly.js';
import { buildApp } from '../src/index.js';
import { MemoryDB } from '../src/db/memory.js';
import { createLlm } from '../src/llm/client.js';

test('buildFoodDbHint 包含食物库 id 与拳基准', () => {
  const hint = buildFoodDbHint();
  assert.match(hint, /food:rice/);
  assert.match(hint, /米饭/);
  assert.ok(hint.split('\n').length >= 50);
});

test('assembleSystemPrompt 挂载饮食估算段与食物库', () => {
  const user = {
    onboarding_state: 'active',
    gender: 'female',
    age_group: '25-34',
    height_cm: 165,
    current_weight_kg: 63,
    target_weight_kg: 58,
    snark_level: 'light',
  };
  const sys = assembleSystemPrompt({
    user,
    budget: 600,
    dailyBudgetKcal: 1500,
    userText: '中午吃了米饭',
    snarkLabel: '轻损',
    config: null,
  });
  assert.match(sys, /饮食热量估算/);
  assert.match(sys, /food:rice/);
  assert.match(sys, /内容安全/);
  assert.match(sys, /off_topic/);
});

test('情绪关键词挂载陪伴子提示词', () => {
  assert.equal(shouldMountMoodScene('今天心情不好'), true);
  const user = { onboarding_state: 'active', snark_level: 'light' };
  const sys = assembleSystemPrompt({
    user,
    budget: null,
    dailyBudgetKcal: null,
    userText: '压力大想暴食',
    snarkLabel: '轻损',
    config: null,
  });
  assert.match(sys, /情绪兜底/);
});

test('mock off_topic：跑题编程', async () => {
  const app = buildApp({ db: new MemoryDB(), llm: createLlm({ service: 'mock' }) });
  const r = await app.chat.send({ userId: 'u_off', text: '帮我写一段 Python 代码' });
  assert.equal(r.intent, 'off_topic');
  assert.equal(r.degraded, false);
});

test('weight.report 结构化落库', async () => {
  const app = buildApp({ db: new MemoryDB(), llm: createLlm({ service: 'mock' }) });
  const { main } = await import('../src/index.js');
  const res = await main({ action: 'weight.report', userId: 'uw', weight_kg: 65.2 }, {}, app);
  assert.equal(res.code, 0);
  assert.equal(res.data.intent, 'weight_report');
  const wr = app.db.findOne('weight_records', (r) => r.user_id === 'uw');
  assert.equal(wr.weight_kg, 65.2);
  assert.equal(app.db.find('messages', (m) => m.user_id === 'uw' && m.role === 'user').length, 1);
});

test('降级时仍落库用户消息', async () => {
  const app = buildApp({ db: new MemoryDB(), llm: createLlm({ service: 'mock' }) });
  await app.chat.send({ userId: 'u4', text: '解析失败测试' });
  const userMsgs = app.db.find('messages', (m) => m.user_id === 'u4' && m.role === 'user');
  assert.equal(userMsgs.length, 1);
  assert.equal(userMsgs[0].content, '解析失败测试');
});
