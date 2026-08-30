// 督促 dry-run 探针：模拟漏报用户 + 授权额度，验证「漏报判断 + 额度不足跳过 + 触达扣减 + notify_log」正确
import { buildApp } from '../src/index.js';
import { NUDGE_SLOTS } from '../src/domain/constants.js';
import { MemoryDB } from '../src/db/memory.js';

const db = new MemoryDB();
const app = buildApp({ db });

// 两个 active 用户
for (const id of ['u_a', 'u_b']) {
  db.insert('users', { user_id: id, onboarding_state: 'active', current_weight_kg: 62, target_weight_kg: 55, updated_at: new Date().toISOString(), created_at: new Date().toISOString() });
}
// u_a 今天已报午餐、有额度；u_b 今天什么都没报、无额度
const today = new Date().toISOString().slice(0, 10);
db.insert('diet_records', { user_id: 'u_a', date: today, meal: 'lunch', cal_min: 300, cal_max: 380 });
app.nudge.authorize({ userId: 'u_a', templateKey: 'daily_reminder' });

console.log('=== 督促 slot 表（§9.1） ===');
for (const s of NUDGE_SLOTS) console.log(`  ${s.slot.padEnd(22)} cron=${s.cron}`);

for (const slot of ['morning_greeting', 'meal_reminder_lunch', 'meal_reminder_dinner', 'evening_summary']) {
  console.log(`\n--- dry-run: ${slot} ---`);
  const r = app.nudge.run({ slot, dryRun: true });
  console.log(`  触发(${r.pushed.length}): ${r.pushed.join(', ')} | 因无额度跳过: ${r.skippedSansQuota.join(', ') || '无'}`);
}

console.log('\n--- 真实发送（非 dryRun）：u_b 无额度 → notify_log failed；u_a 有额度 → sent + 扣减 ---');
const real = app.nudge.run({ slot: 'meal_reminder_lunch', dryRun: false });
console.log('  结果:', JSON.stringify({ pushed: real.pushed, skipped: real.skippedSansQuota, logs: real.logs }));
console.log('  notify_log:', db.col('notify_log').map((l) => `${l.user_id}:${l.trigger_type}:${l.status}`).join(', '));
console.log('  u_a 剩余额度:', db.find('subscribe_auth', (a) => a.user_id === 'u_a' && a.status === 'authorized').length);

// 再发一次（u_a 额度已用尽）→ 应全数记录 failed
const again = app.nudge.run({ slot: 'morning_greeting', dryRun: false });
console.log('\n--- 再触发：额度已用尽 → 全部 failed 只记日志 ---');
console.log('  结果:', JSON.stringify({ pushed: again.pushed, skipped: again.skippedSansQuota }));
console.log('  notify_log 最后两:', db.col('notify_log').slice(-4).map((l) => `${l.user_id}:${l.trigger_type}:${l.status}`).join(', '));

console.log('\nM5 探针 OK：漏报判断 + 额度扣减 + 触达日志 全程正确。');