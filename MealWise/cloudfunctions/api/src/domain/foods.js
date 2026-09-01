// 食物库：加载 + 查询（food_ref = `food:${id}`）
// JSON 用 createRequire 加载（Node 12.2+ 通用），避免 import attributes（Node < 20.10 / 部分云函数运行时不可用）
import { createRequire } from 'node:module';

const requireJson = createRequire(import.meta.url);
const foodsData = requireJson('../data/foods.json');

export const RAW = foodsData.foods;

const byId = new Map(RAW.map((f) => [f.id, f]));
const byName = new Map();
for (const f of RAW) byName.set(f.name, f);

export function getById(id) {
  return byId.get(id) ?? null;
}

// 解析 food_ref，如 `food:rice`；未知返回 null
export function resolveRef(foodRef) {
  if (typeof foodRef !== 'string' || !foodRef.startsWith('food:')) return null;
  return byId.get(foodRef.slice(5)) ?? null;
}

export function search(keyword) {
  const k = (keyword ?? '').trim();
  if (!k) return RAW;
  return RAW.filter((f) => f.name.includes(k) || f.category.includes(k) || f.id.includes(k));
}

// 食物库概况（供外部脚本/调试打印）
export function summary() {
  return { total: RAW.length, byCategory: RAW.reduce((m, f) => ((m[f.category] = (m[f.category] || 0) + 1), m), {}) };
}