// 预算：计算今日已报餐累计与剩余（单值口径，对齐契约 B / 后端 §6.4）
// remaining = budget − 中位(Σcal_min, Σcal_max)；未定标/无预算时返回 null

function todayKey(date = new Date()) {
  const d = date.toISOString().slice(0, 10);
  return d;
}

// 从 diet_records（或内存态）累计今日热量
// 记录形如 { date, cal_min, cal_max, meal }
export function todayConsumption(records, date = new Date()) {
  const key = todayKey(date);
  let sumMin = 0;
  let sumMax = 0;
  for (const r of records) {
    if (r.date !== key) continue;
    if (typeof r.cal_min === 'number') sumMin += r.cal_min;
    if (typeof r.cal_max === 'number') sumMax += r.cal_max;
    else if (typeof r.cal_min === 'number') sumMax += r.cal_min;
  }
  return { min: sumMin, max: sumMax, median: Math.round((sumMin + sumMax) / 2) };
}

export function budgetRemaining(dailyBudgetKcal, records) {
  if (dailyBudgetKcal == null) return null;
  const c = todayConsumption(records);
  return Math.round(dailyBudgetKcal - c.median);
}