import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSessionFocus, buildHistoryContext, inferRecentTopics } from '../src/domain/session-focus.js';

test('inferRecentTopics：识别饮食与体重', () => {
  const topics = inferRecentTopics([
    { role: 'user', content: '午饭吃了米饭' },
    { role: 'coach', content: 'ok' },
    { role: 'user', content: '今天体重 68' },
  ]);
  assert.ok(topics.includes('饮食记录'));
  assert.ok(topics.includes('体重'));
});

test('buildHistoryContext：超出窗口时带更早摘要', () => {
  const msgs = [];
  for (let i = 0; i < 30; i++) {
    msgs.push({ role: 'user', content: `用户消息${i}` });
    msgs.push({ role: 'coach', content: `教练回复${i}` });
  }
  const ctx = buildHistoryContext(msgs, 2);
  assert.match(ctx, /更早对话摘要/);
  assert.match(ctx, /用户消息29/);
  assert.ok(!ctx.includes('用户消息0'), '最早原文不应全文注入');
});

test('buildSessionFocus：执行期包含今日状态', () => {
  const focus = buildSessionFocus({
    user: { onboarding_state: 'active', current_weight_kg: 70, target_weight_kg: 65 },
    messages: [{ role: 'user', content: '晚饭吃了沙拉' }],
    memoryCtx: '',
    budgetRemaining: 800,
    reportedWeightToday: true,
    todayMealCount: 2,
  });
  assert.match(focus, /执行期/);
  assert.match(focus, /800/);
  assert.match(focus, /70.*65/);
});
