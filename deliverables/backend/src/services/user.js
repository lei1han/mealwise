// 用户服务（契约 C §5.2）：user.profile.get / user.profile.update / user.target.update
// 契约 A：daily_calorie_budget_kcal 不入库（get 时服务端派生）；snark_level 入库持久化（2026-09-01 决策，替代 MVP 代码常量）。
import { dailyBudget, estimateWeeks } from '../domain/onboarding.js';

// 毒舌档位默认值与合法集合（gentle=温柔 / light=轻损 / spicy=辛辣；未设置或非法值回退默认）
export const SNARK_LEVEL = 'light';
export const SNARK_LEVELS = Object.freeze(['gentle', 'light', 'spicy']);

// 仅主动编辑可改的白名单字段（摸底画像由 chat.send + LLM 抽取 / onboarding.profile.submit 驱动）
// key = 前端 patch 字段名，value = users 落库字段名（前端 sheet 用 height，库字段为 height_cm）
const PROFILE_PATCH_WHITELIST = Object.freeze({
  nickname: 'nickname',
  gender: 'gender',
  age_group: 'age_group',
  height: 'height_cm',
  height_cm: 'height_cm',
  snark_level: 'snark_level',
});

export class UserService {
  constructor({ db, now = () => new Date() }) {
    this.db = db;
    this.now = now;
  }

  _user(userId) {
    return this.db.findOne('users', (d) => d.user_id === userId);
  }

  /** 初始体重锚点：首条体重记录；无记录回退当前体重 */
  _initialWeight(userId, user) {
    const first = this.db
      .find('weight_records', (r) => r.user_id === userId)
      .sort((a, b) => (a.date < b.date ? -1 : 1))[0];
    return first?.weight_kg ?? user?.current_weight_kg ?? null;
  }

  /** users 脱敏文档 + 服务端派生字段（对齐前端 Mock 消费结构） */
  getProfile({ userId } = {}) {
    const u = this._user(userId);
    if (!u) {
      return {
        nickname: null,
        gender: null,
        age_group: null,
        height: null,
        initial_weight: null,
        target_weight: null,
        estimate_weeks: null,
        daily_calorie_budget: null,
        snark_level: SNARK_LEVEL,
        onboarding_completed: false,
      };
    }
    return {
      nickname: u.nickname ?? null,
      gender: u.gender ?? null,
      age_group: u.age_group ?? null,
      height: u.height_cm ?? null,
      initial_weight: this._initialWeight(userId, u),
      target_weight: u.target_weight_kg ?? null,
      estimate_weeks: u.target_estimate_weeks ?? null,
      daily_calorie_budget: dailyBudget({
        weightKg: u.current_weight_kg,
        heightCm: u.height_cm,
        ageGroup: u.age_group,
        gender: u.gender,
      }),
      snark_level: u.snark_level ?? SNARK_LEVEL,
      onboarding_completed: u.onboarding_state === 'active',
    };
  }

  /** 主动编辑：白名单字段生效；白名单外字段（daily_calorie_budget 等）静默忽略；snark_level 校验合法集合 */
  updateProfile({ userId, patch = {} } = {}) {
    const u = this._user(userId);
    if (!u) return { ok: false, message: 'user not found' };
    const iso = this.now().toISOString();
    let touched = false;
    for (const [src, dst] of Object.entries(PROFILE_PATCH_WHITELIST)) {
      if (patch[src] === undefined) continue;
      if (dst === 'snark_level') {
        if (!SNARK_LEVELS.includes(patch[src])) continue;
        u[dst] = patch[src];
      } else {
        u[dst] = dst === 'height_cm' ? Number(patch[src]) || u[dst] : patch[src];
      }
      touched = true;
    }
    if (touched) u.updated_at = iso;
    return { ok: true };
  }

  /** 目标体重更新：重算预估周期 */
  updateTarget({ userId, target_weight_kg, target_estimate_weeks } = {}) {
    const u = this._user(userId);
    if (!u) return { ok: false, message: 'user not found' };
    const iso = this.now().toISOString();
    if (target_weight_kg != null) {
      const t = Number(target_weight_kg);
      if (Number.isFinite(t) && t > 0) u.target_weight_kg = t;
    }
    u.target_estimate_weeks =
      Number.isFinite(Number(target_estimate_weeks)) && target_estimate_weeks != null
        ? Number(target_estimate_weeks)
        : estimateWeeks(u.current_weight_kg, u.target_weight_kg);
    u.updated_at = iso;
    return { ok: true };
  }
}
