// demo：用 mock LLM 跑通 "发消息 → 解析 → 落库 → 返回" 闭环（M2 完成标准）
import { buildApp } from '../src/index.js';
import { summary } from '../src/domain/foods.js';
import { parseRaw } from '../src/llm/parser.js';

const app = buildApp();
const { chat, db } = app;
const user = 'u_demo_1';

async function say(text) {
  const r = await chat.send({ userId: user, text });
  console.log(`\n[用户] ${text}`);
  console.log(`[教练] ${r.reply_text}  (intent=${r.intent} | 剩余预算=${r.budget_remaining_kcal ?? '未知'} | degraded=${r.degraded} | sub_hint=${r.subscribe_hint})`);
  return r;
}

console.log('=== 食物库 ===');
const fs = summary();
console.log(`v0 ${fs.total} 项：`, JSON.stringify(fs.byCategory));

console.log('\n========== 多轮对话 ==========');
await say('你好，我身高165，女，30岁，想从63减到58，之前节食减过几次都反弹了');
await say('我不吃香菜');
await say('今早体重 63 公斤');
await say('中午吃了半拳米饭、一拳青菜、半拳鸡腿肉');
await say('心情不好，想暴食甜食');
await say('下午吃了一块黑巧克力，加了杯无糖奶茶');

console.log('\n========== 落库结果 ==========');
console.log(`memories: ${db.col('memories').length} 条 ->`, db.col('memories').map((m) => `${m.category}:${m.content}`).join(' | '));
console.log(`diet_records: ${db.col('diet_records').length} 条 ->`, db.col('diet_records').map((d) => `${d.meal} [${d.cal_min}~${d.cal_max}] is_est=${d.is_estimated}`).join(' | '));
console.log(`weight_records: ${db.col('weight_records').length} 条`);
const usr = db.findOne('users', (u) => u.user_id === user);
console.log(`用户状态: state=${usr.onboarding_state} | 性别=${usr.gender} | 年龄段=${usr.age_group} | 初始体重=${usr.current_weight_kg}kg`);
console.log(`diabetes state 已转: onboarding_completed_at=${usr.onboarding_completed_at ? '已写入' : '未写入'}`);

console.log('\n========== 降级路径 ==========');
const fail = parseRaw('我忘记解析了，随便说点什么');
console.log('非 JSON 输入 →', JSON.stringify(fail));

console.log('\n闭环 OK：发消息 → LLM(mock) → 解析 → 落库 → 返回 全程跑通。');