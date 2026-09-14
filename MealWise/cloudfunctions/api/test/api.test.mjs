// 本轮新增 action / 错误码 / 限流 / open_weight_sheet 指令验收（契约 C §5.2、§5.3 + 2026-09-01 增量）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp, main } from '../src/index.js';
import { MemoryDB } from '../src/db/memory.js';
import { createLlm } from '../src/llm/client.js';

function freshApp() {
  return buildApp({ db: new MemoryDB(), llm: createLlm({ service: 'mock' }) });
}

function call(app, event) {
  return main(event, {}, app);
}

test('__start__ 开场：新用户返回 open_weight_sheet 指令 + 落库教练消息', async () => {
  const app = freshApp();
  const r = await app.chat.send({ userId: 's1', text: '__start__' });
  assert.equal(r.onboarding_state, 'new');
  assert.equal(r.action, 'open_weight_sheet');
  assert.equal(app.db.find('messages', (m) => m.user_id === 's1').length, 1);
});

test('onboarding.profile.submit：结构化字段落库 + 状态机转 active + 产出教练对话', async () => {
  const app = freshApp();
  const r = await call(app, {
    action: 'onboarding.profile.submit',
    userId: 's2',
    fields: { gender: 'female', age_group: '25-34', height: 165, initial_weight: 63, target_weight: 58 },
  });
  assert.equal(r.code, 0);
  assert.equal(r.data.onboarding_state, 'active');
  assert.ok(r.data.reply_text.includes('定了'), '定标完成话术');
  assert.equal(r.data.action, undefined, '定标后不再弹 sheet');

  const u = app.db.findOne('users', (d) => d.user_id === 's2');
  assert.equal(u.gender, 'female');
  assert.equal(u.height_cm, 165);
  assert.equal(u.current_weight_kg, 63);
  assert.equal(u.target_weight_kg, 58);
  assert.equal(u.target_estimate_weeks, 10); // (63-58)/0.5
  assert.ok(u.onboarding_completed_at);
  const coachMsgs = app.db.find('messages', (m) => m.user_id === 's2' && m.role === 'coach');
  assert.equal(coachMsgs.length, 1);
});

test('conversation.current / history：cursor 分页向更早翻页', async () => {
  const app = freshApp();
  for (const t of ['第一轮', '第二轮', '第三轮']) {
    await app.chat.send({ userId: 's3', text: t });
  }
  // 6 条消息（3 轮 × user+coach），current 默认全量升序
  const cur = await call(app, { action: 'conversation.current', userId: 's3' });
  assert.equal(cur.code, 0);
  assert.equal(cur.data.items.length, 6);
  assert.equal(cur.data.items[0].role, 'user');
  assert.equal(cur.data.items[0].content, '第一轮');

  // 首页：最新 2 条 + next_cursor 指向更早
  const p1 = await call(app, { action: 'conversation.history', userId: 's3', limit: 2 });
  assert.equal(p1.data.items.length, 2);
  assert.equal(p1.data.items[0].content, '第三轮');
  assert.ok(p1.data.next_cursor);

  // 第二页：更早 2 条
  const p2 = await call(app, { action: 'conversation.history', userId: 's3', cursor: p1.data.next_cursor, limit: 2 });
  assert.equal(p2.data.items.length, 2);
  assert.equal(p2.data.items[0].content, '第二轮');
  assert.ok(p2.data.next_cursor);

  // 末页：剩 2 条，next_cursor 为 null
  const p3 = await call(app, { action: 'conversation.history', userId: 's3', cursor: p2.data.next_cursor, limit: 2 });
  assert.equal(p3.data.items.length, 2);
  assert.equal(p3.data.items[0].content, '第一轮');
  assert.equal(p3.data.next_cursor, null);
});

test('user.profile.get 派生字段 / update 白名单持久化 snark_level、忽略 daily_calorie_budget', async () => {
  const app = freshApp();
  // 未注册用户：返回默认骨架（snark_level 默认值、未完成摸底）
  const g0 = await call(app, { action: 'user.profile.get', userId: 's4' });
  assert.equal(g0.code, 0);
  assert.equal(g0.data.snark_level, 'light');
  assert.equal(g0.data.onboarding_completed, false);

  // 建用户：身高165，女，30岁，目标 58 → 体重 63 后 active
  await app.chat.send({ userId: 's4', text: '你好，我身高165，女，30岁，想从63减到58' });
  await app.chat.send({ userId: 's4', text: '今早体重 63 公斤' });

  const g1 = await call(app, { action: 'user.profile.get', userId: 's4' });
  assert.equal(g1.data.gender, 'female');
  assert.equal(g1.data.height, 165);
  assert.equal(g1.data.target_weight, 58);
  assert.equal(g1.data.initial_weight, 63); // 首条体重记录
  assert.ok(g1.data.daily_calorie_budget > 1200, '服务端派生预算');
  assert.equal(g1.data.onboarding_completed, true);

  // 主动编辑：白名单生效（snark_level 入库持久化）；非法档位静默忽略
  const up = await call(app, {
    action: 'user.profile.update',
    userId: 's4',
    patch: { nickname: '小明', snark_level: 'spicy', daily_calorie_budget: 999 },
  });
  assert.equal(up.data.ok, true);
  const u = app.db.findOne('users', (d) => d.user_id === 's4');
  assert.equal(u.nickname, '小明');
  assert.equal(u.snark_level, 'spicy', 'snark_level 已入库持久化');
  assert.equal(u.daily_calorie_budget_kcal, undefined, 'daily_calorie_budget_kcal 不入库');

  // 非法档位：不入库，保留原值
  await call(app, { action: 'user.profile.update', userId: 's4', patch: { snark_level: 'nuclear' } });
  assert.equal(app.db.findOne('users', (d) => d.user_id === 's4').snark_level, 'spicy');

  const g2 = await call(app, { action: 'user.profile.get', userId: 's4' });
  assert.equal(g2.data.snark_level, 'spicy', 'get 返回用户档位');
  assert.equal(g2.data.nickname, '小明');
});

test('user.target.update：写目标并重算预估周期', async () => {
  const app = freshApp();
  await app.chat.send({ userId: 's5', text: '你好，我身高165，女，30岁，想从63减到58' });
  await app.chat.send({ userId: 's5', text: '今早体重 63 公斤' });
  const r = await call(app, { action: 'user.target.update', userId: 's5', target_weight_kg: 55 });
  assert.equal(r.data.ok, true);
  const u = app.db.findOne('users', (d) => d.user_id === 's5');
  assert.equal(u.target_weight_kg, 55);
  assert.equal(u.target_estimate_weeks, 16); // (63-55)/0.5
});

test('budget.today：total/consumed/remaining/weekly_change 口径', async () => {
  const app = freshApp();
  await app.chat.send({ userId: 's6', text: '你好，我身高165，女，30岁，想从63减到58' });
  await app.chat.send({ userId: 's6', text: '今早体重 63 公斤' });
  await app.chat.send({ userId: 's6', text: '中午吃了半拳米饭' });

  // 补一条 6 天前的体重记录（64kg），weekly_change = 63-64 = -1
  const sixDaysAgo = new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  app.db.insert('weight_records', { user_id: 's6', date: sixDaysAgo, weight_kg: 64, created_at: sixDaysAgo });

  const r = await call(app, { action: 'budget.today', userId: 's6' });
  assert.equal(r.code, 0);
  assert.ok(r.data.total > 1200);
  assert.ok(r.data.consumed > 0);
  assert.equal(r.data.remaining, Math.round(r.data.total - r.data.consumed));
  assert.equal(r.data.target_weight, 58);
  assert.equal(r.data.current_weight, 63);
  assert.equal(r.data.weekly_change, -1);

  // 未定标用户：total/remaining 为 null
  const r2 = await call(app, { action: 'budget.today', userId: 'nobody' });
  assert.equal(r2.data.total, null);
  assert.equal(r2.data.remaining, null);
});

test('限流：近 1 分钟 6 条用户消息触发 42901，5 条不触发', async () => {
  const okApp = freshApp();
  const now = new Date().toISOString();
  for (let i = 0; i < 5; i++) {
    okApp.db.insert('messages', { user_id: 's7', role: 'user', content: `m${i}`, created_at: now });
  }
  const okR = await call(okApp, { action: 'chat.send', userId: 's7', text: '你好' });
  assert.equal(okR.code, 0);

  const badApp = freshApp();
  for (let i = 0; i < 6; i++) {
    badApp.db.insert('messages', { user_id: 's8', role: 'user', content: `m${i}`, created_at: now });
  }
  const badR = await call(badApp, { action: 'chat.send', userId: 's8', text: '你好' });
  assert.equal(badR.code, 42901);
});

test('错误码契约 §5.3：未知 action 与非法 payload 均 40001', async () => {
  const app = freshApp();
  const unknown = await call(app, { action: 'nope', userId: 's9' });
  assert.equal(unknown.code, 40001);
  const badText = await call(app, { action: 'chat.send', userId: 's9', text: 123 });
  assert.equal(badText.code, 40001);
  const badPatch = await call(app, { action: 'user.profile.update', userId: 's9', patch: 'not-object' });
  assert.equal(badPatch.code, 40001);
});

test('chat.send：前天报体重不落库并返回 record_date_rejected', async () => {
  const app = freshApp();
  const r = await app.chat.send({ userId: 'date1', text: '前天体重 70kg' });
  assert.equal(r.record_date_rejected, true);
  const weights = app.db.find('weight_records', (w) => w.user_id === 'date1');
  assert.equal(weights.length, 0);
});

test('chat.send 饮食汇报：返回 diet_card 食物热量明细表', async () => {
  const app = freshApp();
  const r = await app.chat.send({ userId: 'diet-ui', text: '午餐吃了一拳米饭和鸡胸肉' });
  assert.equal(r.intent, 'diet_report');
  assert.ok(r.diet_card, '应附带 diet_card');
  assert.equal(r.diet_card.meal_label, '午餐');
  assert.ok(r.diet_card.rows.length >= 2);
  assert.ok(r.diet_card.rows.some((row) => row.name.includes('米饭')));
});

test('毒舌档位：chat.send 系统提示词使用用户入库档位（2026-09-01 决策，替代代码常量）', async () => {
  const captured = [];
  const app = buildApp({
    db: new MemoryDB(),
    llm: {
      async complete({ messages }) {
        captured.push(messages);
        return JSON.stringify({ reply_text: '收到。', intent: 'other', extracted: {}, budget_remaining_kcal: null });
      },
    },
  });
  // 建档（默认 light）→ 调档 spicy → 日常对话
  await app.chat.send({ userId: 's10', text: '你好，我身高165，女，30岁，想从63减到58' });
  await call(app, { action: 'user.profile.update', userId: 's10', patch: { snark_level: 'spicy' } });
  await app.chat.send({ userId: 's10', text: '中午吃了半拳鸡胸肉' });
  const system = captured[captured.length - 1][0].content;
  assert.ok(system.includes('毒舌档位：辛辣'), `提示词应使用用户入库档位，实际：${system}`);

  // 未设置档位的新用户：回退默认「轻损」
  const captured2 = [];
  const app2 = buildApp({
    db: new MemoryDB(),
    llm: {
      async complete({ messages }) {
        captured2.push(messages);
        return JSON.stringify({ reply_text: '收到。', intent: 'other', extracted: {}, budget_remaining_kcal: null });
      },
    },
  });
  await app2.chat.send({ userId: 's11', text: '今天吃了点米饭' });
  assert.ok(captured2[captured2.length - 1][0].content.includes('毒舌档位：轻损'), '未设置时回退默认轻损');
});
