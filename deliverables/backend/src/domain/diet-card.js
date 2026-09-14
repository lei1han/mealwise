// 将契约 B 的 diet_record 转为前端可渲染的餐次明细表（chat.send 可选 diet_card）
import { resolveRef } from './foods.js';

const MEAL_LABELS = Object.freeze({
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐',
});

function formatKcalRange(min, max) {
  const a = Number(min);
  const b = Number(max);
  if (!Number.isFinite(a) && !Number.isFinite(b)) return '--';
  if (!Number.isFinite(b) || a === b) return `${Math.round(a)}`;
  if (!Number.isFinite(a)) return `${Math.round(b)}`;
  return `${Math.round(a)}~${Math.round(b)}`;
}

/**
 * @param {object|null} dietRecord parser 归一化后的 diet_record
 * @returns {object|null} diet_card
 */
export function buildDietCard(dietRecord) {
  if (!dietRecord || typeof dietRecord !== 'object') return null;
  const items = Array.isArray(dietRecord.items) ? dietRecord.items.filter((n) => typeof n === 'string' && n.trim()) : [];
  const refs = Array.isArray(dietRecord.food_refs) ? dietRecord.food_refs : [];
  const calMin = Number(dietRecord.cal_min) || 0;
  const calMax = Number(dietRecord.cal_max) || calMin;
  const isEstimated = !!dietRecord.is_estimated;
  const confidence = dietRecord.confidence || 'medium';

  const rows = [];
  const n = items.length || 1;

  for (let i = 0; i < items.length; i++) {
    const name = items[i].trim();
    const ref = refs[i] ?? refs[0];
    const food = ref && ref !== 'food:external' ? resolveRef(ref) : null;
    let rowMin;
    let rowMax;
    let situation;
    if (food) {
      rowMin = food.min;
      rowMax = food.max;
      situation = food.note || '库内基准';
    } else {
      rowMin = Math.round(calMin / n);
      rowMax = Math.round(calMax / n);
      situation = ref === 'food:external' || isEstimated ? '库外/复合，粗略估' : '待细分';
    }
    if (confidence === 'low') situation = '置信度低，' + situation;
    rows.push({
      name,
      cal_min: rowMin,
      cal_max: rowMax,
      cal_text: formatKcalRange(rowMin, rowMax),
      situation,
    });
  }

  if (!items.length && (calMin || calMax)) {
    rows.push({
      name: '本餐',
      cal_min: calMin,
      cal_max: calMax,
      cal_text: formatKcalRange(calMin, calMax),
      situation: isEstimated ? '估算' : '—',
    });
  }

  const meal = dietRecord.meal || 'lunch';
  return {
    meal,
    meal_label: MEAL_LABELS[meal] || '本餐',
    total_min: calMin,
    total_max: calMax,
    total_text: formatKcalRange(calMin, calMax),
    is_estimated: isEstimated,
    rows,
  };
}
