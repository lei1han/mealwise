// 定标（Mifflin-St Jeor）与 Onboarding 状态机
import { AGE_GROUP_MID, CAL_FLOOR, ONBOARDING_STATES } from './constants.js';

const ACTIVITY_MULT = { low: 1.2, light: 1.375, moderate: 1.55, active: 1.725 }; // 对应久坐/轻/中/高

// 年龄段 → 组中值年龄
function midAge(ageGroup) {
  return AGE_GROUP_MID[ageGroup] ?? null;
}

// BMR：10×kg + 6.25×cm − 5×age + s（男+5 / 女−161）
export function bmr({ weightKg, heightCm, ageGroup, gender }) {
  const age = midAge(ageGroup);
  if (weightKg == null || heightCm == null || age == null) return null;
  return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + (gender === 'male' ? 5 : -161));
}

// 每日预算（维持热量）− 缺口。减重缺口默认 500，可定制。
export function dailyBudget({ weightKg, heightCm, ageGroup, gender, activity = 'light', deficit = 500 }) {
  const b = bmr({ weightKg, heightCm, ageGroup, gender });
  if (b == null) return null;
  const tdee = b * ACTIVITY_MULT[activity] === undefined ? b : b * ACTIVITY_MULT[activity];
  const floor = CAL_FLOOR[gender] ?? 1200;
  return Math.max(floor, Math.round(tdee - deficit));
}

// 预估周期周数：健康速率 0.3~0.75 kg/周，取中 0.5
export function estimateWeeks(currentKg, targetKg) {
  if (currentKg == null || targetKg == null || currentKg === targetKg) return null;
  return Math.max(1, Math.round(Math.abs(currentKg - targetKg) / 0.5));
}

// 判断定标是否就绪（gender、age_group、height、weight 齐 + 有目标）
export function isReady(user) {
  return !!(user.gender && user.age_group && user.height_cm && user.current_weight_kg && user.target_weight_kg);
}

// 状态机转移：仅在 onboarding 尚未完成时做转移
export function evaluateOnboarding(user) {
  const ready = isReady(user);
  if (ready) {
    return { state: 'active', changed: user.onboarding_state !== 'active' };
  }
  const hasSomeProfile = !!(
    user.gender || user.age_group || user.height_cm || user.current_weight_kg || user.target_weight_kg
  );
  const next = hasSomeProfile ? 'profiling' : 'new';
  return { state: next, changed: next !== user.onboarding_state };
}

// 从契约 B 的 memory_points / 摸底文本提取定标字段（demo 用简化版；真实场景由 LLM 抽取）
// profiling_progress：gender/age_group/height/weight/history/target 各字段是否已备齐
export function applyProfiling(user, { memories = [] } = {}) {
  for (const m of memories) {
    if (m.category !== 'static') continue;
    const c = m.content || '';

    if (user.gender == null) {
      if (/男|male/i.test(c)) user.gender = 'male';
      if (/女|female/i.test(c)) user.gender = 'female';
    }
    if (user.age_group == null) {
      const gm = c.match(/\d{2}\s*-\s*\d{2}/);
      if (gm && AGE_GROUP_MID[gm[0].replace(/\s/g, '')]) user.age_group = gm[0].replace(/\s/g, '');
    }
    if (user.height_cm == null) {
      const hm = c.match(/身高\s*(\d{3})\s*(?:厘米|cm)?/i);
      if (hm) {
        const v = parseInt(hm[1], 10);
        if (v >= 120 && v <= 230) user.height_cm = v;
      }
    }
    if (user.target_weight_kg == null) {
      const tm = c.match(/目标体重\s*(\d{2}(?:\.\d)?)\s*k?g?/);
      if (tm) user.target_weight_kg = parseFloat(tm[1]);
    }
  }
  return user;
}

export function makeOnboarding(userId) {
  return {
    user_id: userId,
    gender: null,
    age_group: null,
    height_cm: null,
    current_weight_kg: null,
    target_weight_kg: null,
    history_kg: null,
    onboarding_state: 'new',
    onboarding_completed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}