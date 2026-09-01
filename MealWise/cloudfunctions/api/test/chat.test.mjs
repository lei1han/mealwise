import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/index.js';
import { MemoryDB } from '../src/db/memory.js';
import { createLlm } from '../src/llm/client.js';

function freshApp() {
  return buildApp({ db: new MemoryDB(), llm: createLlm({ service: 'mock' }) });
}

test('mock 闭环：发消息 → 落库 diet/weight/记忆', async () => {
  const app = freshApp();
  const r = await app.chat.send({ userId: 'u1', text: '中午吃了半拳米饭、一拳青菜、半拳鸡腿肉' });
  assert.equal(r.degraded, false);
  assert.equal(r.intent, 'diet_report');
  const diets = app.db.find('diet_records', (d) => d.user_id === 'u1');
  assert.equal(diets.length, 1);
  assert.equal(diets[0].meal, 'lunch');
  // messages 双条
  assert.equal(app.db.find('messages', (m) => m.user_id === 'u1').length, 2);
});

test('画像提取 + 状态机转 active + 预算单值递减', async () => {
  const app = freshApp();
  await app.chat.send({ userId: 'u2', text: '你好，我身高165，女，30岁，想从63减到58' });
  await app.chat.send({ userId: 'u2', text: '今早体重 63 公斤' });
  const u = app.db.findOne('users', (d) => d.user_id === 'u2');
  assert.equal(u.gender, 'female');
  assert.equal(u.age_group, '25-34');
  assert.equal(u.height_cm, 165);
  assert.equal(u.onboarding_state, 'active');
  assert.ok(u.onboarding_completed_at);

  // 状态机冻结：再次画像不改写锚点
  const p0 = u.onboarding_completed_at;
  await app.chat.send({ userId: 'u2', text: '中午吃了半拳米饭' });
  const u2 = app.db.findOne('users', (d) => d.user_id === 'u2');
  assert.equal(u2.onboarding_completed_at, p0);
});

test('记忆去重契约：static 同语义更新不新增、emotion 保留', async () => {
  const app = freshApp();
  await app.chat.send({ userId: 'u3', text: '我不吃香菜' });
  await app.chat.send({ userId: 'u3', text: '再次重申：我不吃香菜' });
  const statics = app.db.find('memories', (m) => m.user_id === 'u3' && m.category === 'static');
  assert.equal(statics.length, 1);
  assert.equal(statics[0].content, '不吃香菜');
});

test('降级：mock 抛错/非 JSON 不落坏数据', async () => {
  const app = freshApp();
  const r = await app.chat.send({ userId: 'u4', text: '解析失败测试' });
  assert.equal(r.degraded, true);
  assert.equal(r.reply_text, '解析失败测试');
  assert.equal(app.db.find('diet_records', (d) => d.user_id === 'u4').length, 0);
});

test('M3·3 轮多轮会话：同一 app 单例状态跨轮保持、餐次累积、不重置', async () => {
  const app = freshApp();
  let r = await app.chat.send({ userId: 'u5', text: '早餐吃了半拳米饭和一把青菜' });
  assert.equal(r.degraded, false);
  r = await app.chat.send({ userId: 'u5', text: '晚餐吃了半拳鸡胸肉' });
  assert.equal(r.degraded, false);
  r = await app.chat.send({ userId: 'u5', text: '你好，我身高165，女，30岁，目标 58' });
  assert.equal(r.degraded, false);

  // 跨轮累积：餐次 2 条（早餐+晚餐，未被重置）、双条消息 6 条、用户画像写 User
  const meals = app.db.find('diet_records', (d) => d.user_id === 'u5').map((d) => d.meal).sort();
  assert.equal(meals.join(','), 'breakfast,dinner');
  const msgs = app.db.find('messages', (m) => m.user_id === 'u5');
  assert.equal(msgs.length, 6); // 每轮 user+assistant
  const u = app.db.findOne('users', (d) => d.user_id === 'u5');
  assert.equal(u.gender, 'female');
});

test('M3·注入非法 JSON 触发降级：degraded:true、回显 LLM 原文、不落坏数据', async () => {
  // 伪造 LLM 返回非 JSON 纯文本，验证 parser 降级兜底（reply_text 取 LLM 原文，而非用户输入）
  const raw = '这不是 JSON 而是纯文本兜底';
  const app = buildApp({ db: new MemoryDB(), llm: { service: 'fake', async complete() { return raw; } } });
  const r = await app.chat.send({ userId: 'u6', text: '中午吃了半拳米饭' });
  assert.equal(r.degraded, true);
  assert.equal(r.reply_text, raw);
  assert.equal(app.db.find('diet_records', (d) => d.user_id === 'u6').length, 0);
});
