/**
 * 饮食明细表（与云函数 domain/diet-card.js 口径一致；Mock 链路本地补齐 diet_card）
 */
const MEAL_LABELS = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐'
};

// 与食物库 id 对齐的常用项（Mock 演示；真实链路以云端 diet_card 为准）
const FOOD_BY_ID = {
  rice: { min: 180, max: 220, note: '一拳约一巴掌大小' },
  chicken_thigh: { min: 130, max: 180, note: '一拳，去皮热量更低' },
  greens: { min: 15, max: 35, note: '一拳，热量可忽略' },
  chicken_breast: { min: 110, max: 150, note: '一拳熟肉' }
};

function formatKcalRange(min, max) {
  const a = Number(min);
  const b = Number(max);
  if (!Number.isFinite(a) && !Number.isFinite(b)) return '--';
  if (!Number.isFinite(b) || a === b) return String(Math.round(a));
  if (!Number.isFinite(a)) return String(Math.round(b));
  return `${Math.round(a)}~${Math.round(b)}`;
}

function resolveRef(ref) {
  if (typeof ref !== 'string' || !ref.startsWith('food:')) return null;
  const id = ref.slice(5);
  if (id === 'external') return null;
  return FOOD_BY_ID[id] || null;
}

function buildDietCard(dietRecord) {
  if (!dietRecord || typeof dietRecord !== 'object') return null;
  const items = Array.isArray(dietRecord.items)
    ? dietRecord.items.filter((n) => typeof n === 'string' && n.trim())
    : [];
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
      cal_text: formatKcalRange(rowMin, rowMax),
      situation
    });
  }

  const meal = dietRecord.meal || 'lunch';
  return {
    meal,
    meal_label: MEAL_LABELS[meal] || '本餐',
    total_text: formatKcalRange(calMin, calMax),
    is_estimated: isEstimated,
    rows
  };
}

module.exports = { buildDietCard };
