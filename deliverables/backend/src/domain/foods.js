// 食物库：加载 + 查询（food_ref = `food:${id}`）
import foodsData from '../data/foods.json' with { type: 'json' };

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

// 供 setup-db 打印
export function summary() {
  return { total: RAW.length, byCategory: RAW.reduce((m, f) => ((m[f.category] = (m[f.category] || 0) + 1), m), {}) };
}