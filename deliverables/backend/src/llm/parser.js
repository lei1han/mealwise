// 契约 B 解析与校验/降级（对齐提示词成品 §7.3）
import { INTENTS, MEALS, MEMORY_CATEGORIES } from '../domain/constants.js';
import { resolveRef } from '../domain/foods.js';

function cleanInt(v, lo, hi) {
  if (typeof v !== 'number' || !Number.isFinite(v)) return null;
  return v >= lo && v <= hi ? Math.round(v) : null;
}

// 规范化 food_refs：库内用 food:xxx；库外/复合/未知归一为 food:external
function normalizeRefs(refs) {
  if (!Array.isArray(refs)) return [];
  return refs.map((r) => (resolveRef(r) ? r : 'food:external'));
}

// 解析原始模型输出；失败降级为纯文本（不落数据、不打断）
export function parseRaw(raw, { now = new Date() } = {}) {
  const text = String(raw ?? '').trim();
  if (text.startsWith('{')) {
    try {
      return validate(JSON.parse(text), { raw: text, now });
    } catch {
      return { degraded: true, reply_text: text, intent: 'other', extracted: {}, budget_remaining_kcal: null };
    }
  }
  // 尝试截取第一个 { 到最后一个 } 的 JSON 片段（模型偶发包裹文本）
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try {
      return validate(JSON.parse(text.slice(start, end + 1)), { raw: text, now });
    } catch {
      /* fall through to degrade */
    }
  }
  return { degraded: true, reply_text: text, intent: 'other', extracted: {}, budget_remaining_kcal: null };
}

function validate(o) {
  const out = { degraded: false, extracted: {} };

  out.reply_text = typeof o.reply_text === 'string' && o.reply_text.trim() ? o.reply_text.trim() : null;

  const intent = INTENTS.includes(o.intent) ? o.intent : 'other';
  out.intent = intent;

  // diet_record
  if (o.extracted && o.extracted.diet_record) {
    const d = o.extracted.diet_record;
    const meal = MEALS.includes(d.meal) ? d.meal : null;
    const calMin = cleanInt(d.cal_min, 0, 5000);
    let calMax = cleanInt(d.cal_max, 0, 5000);
    if (calMin != null && calMax != null && calMin > calMax) [calMin, calMax] = [calMax, calMin];
    const confidence = ['high', 'medium', 'low'].includes(d.confidence) ? d.confidence : d.confidence ?? null;
    const items = Array.isArray(d.items) ? d.items.filter((i) => typeof i === 'string') : [];
    const foodRefs = normalizeRefs(d.food_refs);
    const isEstimated = foodRefs.includes('food:external') || confidence === 'low';
    if (meal && calMin != null && calMax != null) {
      out.extracted.diet_record = { meal, items, cal_min: calMin, cal_max: calMax, food_refs: foodRefs, confidence, is_estimated: isEstimated };
    }
  }

  // weight_record（×10 取整到 0.1kg）
  if (o.extracted && o.extracted.weight_record) {
    const tenthKg = cleanInt(o.extracted.weight_record.weight_kg * 10, 20 * 10, 300 * 10);
    if (tenthKg != null) out.extracted.weight_record = { weight_kg: tenthKg / 10 };
  }

  // memory_points
  if (Array.isArray(o.extracted?.memory_points)) {
    const pts = [];
    for (const p of o.extracted.memory_points) {
      if (MEMORY_CATEGORIES.includes(p.category) && typeof p.content === 'string' && p.content.trim()) {
        pts.push({ category: p.category, content: p.content.trim() });
      }
    }
    if (pts.length) out.extracted.memory_points = pts;
  }

  out.budget_remaining_kcal = cleanInt(o.budget_remaining_kcal, 0, 10000);
  return out;
}