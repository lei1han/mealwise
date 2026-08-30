// M6：食物库热量校准 benchmark（后端计划 §8.3 交付标准）
// 逻辑：对每条校准用例，用食物库累加估算总热量（bill = Σ food.kcal × 份量），
//       与人工营养参考 anchor_kcal 比对，相对偏差 ≤ RANGE_PCT(默认 0.20) 为合格。
//       ref 全部能在食物库 resolveRef 命中 → 解析命中率 HIT%。
// 运行：npm run calib [RANGE_PCT]   例：npm run calib 0.15
import { resolveRef } from '../src/domain/foods.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const calib = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../src/data/food-calib.json'), 'utf8'));

const RANGE_PCT = Number(process.argv[2] ?? process.env.RANGE_PCT ?? 0.2);
const cases = calib.cases;

let pass = 0;
let fail = 0;
let hitTotal = 0;
let hitOk = 0;
let sumDev = 0;

console.log(`\n=== M6 食物库热量校准 benchmark（§8.3, 阈值 ±${(RANGE_PCT * 100).toFixed(0)}%） ===`);
console.log(`用例数: ${cases.length}\n`);
console.log(`#   | 结果 | 估算kcal | 标注anchor | 偏差%  | ref命中 | 描述`);

cases.forEach((c, i) => {
  const { desc, foods, anchor_kcal } = c;
  let bill = 0;
  let miss = 0;
  for (const [ref, fist] of foods) {
    const f = resolveRef(`food:${ref}`);
    hitTotal += 1;
    if (!f) { miss += 1; continue; }
    hitOk += 1;
    bill += f.kcal * fist;
  }
  const dev = Math.abs(bill - anchor_kcal) / anchor_kcal;
  sumDev += dev;
  const ok = dev <= RANGE_PCT;
  ok ? (pass += 1) : (fail += 1);
  const res = ok ? 'PASS' : 'FAIL';
  console.log(`${String(i + 1).padStart(2)} | ${res} | ${String(Math.round(bill)).padStart(4)} | ${String(anchor_kcal).padStart(6)} | ${(dev * 100).toFixed(1).padStart(4)}% | ${miss ? `${miss} miss` : 'ok'} | ${desc}`);
});

const hitRate = hitTotal ? (hitOk / hitTotal) * 100 : 0;
const devAvg = sumDev / cases.length;

console.log(`\n解析命中率: ${hitRate.toFixed(1)}%  (${hitOk}/${hitTotal})`);
console.log(`平均偏差: ${(devAvg * 100).toFixed(1)}%`);
console.log(`=== 结果: ${pass} 通过 / ${fail} 失败 ===`);
process.exit(fail ? 1 : 0);