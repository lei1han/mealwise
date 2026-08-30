// setup-db：打印集合 schema / 索引，并用内存库初始化 + 预置一条用户，校验可正常读写
import { MemoryDB, COLLECTIONS } from '../src/db/memory.js';
import { describeSchema } from '../src/db/schema.js';
import { makeOnboarding } from '../src/domain/onboarding.js';
import { summary } from '../src/domain/foods.js';

const db = new MemoryDB();

console.log('=== 食物库 v0 ===');
const fs = summary();
console.log(`共 ${fs.total} 项：`, JSON.stringify(fs.byCategory));

console.log('\n=== 集合 schema（云开发建表参考） ===');
for (const col of describeSchema()) {
  console.log(`\n[${col.name}]`);
  console.log(`  字段: ${col.fields.join(', ')}`);
  console.log(`  索引: ${col.indexes.map((i) => `${i.name}(${i.fields.join('+')})${i.unique ? ' unique' : ''}`).join(' | ')}`);
  console.log(`  说明: ${col.note}`);
}

console.log('\n=== 写入自检 ===');
const u = db.insert('users', makeOnboarding('demo_user'));
u.height_cm = 165;
u.gender = 'female';
db.insert('weight_records', { user_id: 'demo_user', date: new Date().toISOString().slice(0, 10), weight_kg: 60.2 });
db.insert('messages', { user_id: 'demo_user', role: 'user', content: '你好', created_at: new Date().toISOString() });
const collState = COLLECTIONS.map((c) => `${c}=${db.col(c).length}`).join(' ');
console.log(`已写入 users / weight_records / messages。\n集合计数：${collState}`);
console.log(`\nOK：schema 与存储初始化完成。下一步运行 demo 或 test。`);