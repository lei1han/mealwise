// M6：食物库数据自省 + benchmark 校验脚本
// 校验：id 唯一 / 必填字段 / min<=kcal<=max / 五大类无缺类 / 数量统计 / 检索命中
// 运行：npm run foods-bench  （或 node scripts/foods-benchmark.js）
import { RAW, search, getById, resolveRef } from '../src/domain/foods.js';

const EXPECTED_CATEGORIES = ['主食', '蛋白', '肉禽水产蛋', '蔬果', '零食外卖'];
let pass = 0;
let fail = 0;

function check(name, ok, detail = '') {
  if (ok) { pass += 1; console.log(`  [PASS] ${name}${detail ? ` — ${detail}` : ''}`); }
  else { fail += 1; console.log(`  [FAIL] ${name}${detail ? ` — ${detail}` : ''}`); }
}

console.log(`\n=== M6 食物库 benchmark ===`);
console.log(`总数: ${RAW.length} 项`);
console.log(`分类分布:`);
const byCat = RAW.reduce((m, f) => ((m[f.category] = (m[f.category] || 0) + 1), m), {});
for (const c of EXPECTED_CATEGORIES) console.log(`  ${c}: ${byCat[c] ?? 0}`);

console.log(`\n--- 数据完整性校验 ---`);
check('数量 >= 50', RAW.length >= 50, `${RAW.length}`);
for (const c of EXPECTED_CATEGORIES) {
  check(`类别「${c}」非空`, (byCat[c] ?? 0) > 0);
}
const ids = new Set();
const idDup = RAW.filter((f) => (ids.has(f.id) ? true : (ids.add(f.id), false)));
check('id 唯一', idDup.length === 0, idDup.length ? `重复: ${idDup.map((f) => f.id).join(',')}` : '');

let badRange = 0;
let badField = 0;
for (const f of RAW) {
  if (!f.id || !f.name || !f.category) badField += 1;
  if (![f.kcal, f.min, f.max].every((n) => Number.isFinite(n))) { badField += 1; continue; }
  if (!(f.min <= f.kcal && f.kcal <= f.max)) badRange += 1;
}
check('必填字段齐全', badField === 0, badField ? `${badField} 项缺字段` : '');
check('min <= kcal <= max', badRange === 0, badRange ? `${badRange} 项区间非法` : '');

console.log(`\n--- 检索命中抽样 ---`);
for (const kw of ['米饭', '鸡', '蔬菜', '水饺']) {
  const hit = search(kw);
  console.log(`  搜「${kw}」: ${hit.length} 项` + (hit.length ? ` → ${hit.slice(0, 3).map((f) => f.name).join('、')}` : ''));
}
check('getById(resolveRef(food:rice)) 命中', getById('rice') && resolveRef('food:rice')?.id === 'rice');
check('未知 ref 返回 null', resolveRef('food:nope') === null);

console.log(`\n=== 结果: ${pass} 通过 / ${fail} 失败 ===`);
process.exit(fail ? 1 : 0);