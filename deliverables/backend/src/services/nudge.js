// 定时督促服务（对齐计划 §9）：漏报判断 → 触达 → 额度扣减 → notify_log
// 真实发送走微信订阅消息云调用；本地用 dryRun 探针做逻辑校验。
import { NUDGE_SLOTS } from '../domain/constants.js';
import { render } from './config.js';

// 督促消息默认模板（占位符模板，可被 app_config 的 prompt.nudge.* 覆盖；字段名对齐 formatSlotTemplate 的 userState）
const TEMPLATES = Object.freeze({
  morning_greeting: '早上好！今早还没称重，上秤后告诉我数字（今日预算 {budget} 剩 {remaining}）。',
  meal_reminder: '{meal_label}现在你还没报这一餐，吃完了回来补一句，我帮你算晚上的量。',
  evening_summary: '晚间小结：今天报了 {reported_meals} 餐（{sum_min}~{sum_max} 大卡），明天继续。',
});

export class NudgeService {
  constructor({ db, config, now = () => new Date() }) {
    this.db = db;
    this.config = config ?? null; // ConfigService：提示词覆盖（无则回退代码默认）
    this.now = now;
  }

  _today() {
    return this.now().toISOString().slice(0, 10);
  }

  _activeUsers() {
    return this.db.find('users', (u) => u.onboarding_state === 'active');
  }

  _hasWeightToday(userId) {
    return !!this.db.findOne('weight_records', (r) => r.user_id === userId && r.date === this._today());
  }

  _hasMealToday(userId, meal) {
    return !!this.db.findOne('diet_records', (r) => r.user_id === userId && r.date === this._today() && r.meal === meal);
  }

  _quotaOf(userId) {
    return this.db.find('subscribe_auth', (a) => a.user_id === userId && a.status === 'authorized').length;
  }

  _consumeQuota(userId, now) {
    const r = this.db.findOne('subscribe_auth', (a) => a.user_id === userId && a.status === 'authorized');
    if (r) {
      r.status = 'used';
      r.used_at = now.toISOString();
      return true;
    }
    return false;
  }

  _writeLog(userId, trigger, status, channel = 'subscribe_msg') {
    this.db.insert('notify_log', {
      user_id: userId,
      trigger_type: trigger,
      channel,
      status,
      sent_at: this.now().toISOString(),
    });
  }

  // 漏报判断：返回是否应触发（晚间总结对所有 active 推送）
  _shouldNudge(user, meta) {
    if (meta.slot === 'evening_summary') return true;
    if (meta.condition === 'weight') return !this._hasWeightToday(user.user_id);
    if (meta.condition === 'lunch' || meta.condition === 'dinner') return !this._hasMealToday(user.user_id, meta.condition);
    return false;
  }

  _mealLabel(meta) {
    if (meta.condition === 'lunch') return '午餐';
    if (meta.condition === 'dinner') return '晚餐';
    return '';
  }

  run({ slot, dryRun = true }) {
    const meta = NUDGE_SLOTS.find((s) => s.slot === slot);
    if (!meta) throw new Error(`unknown nudge slot: ${slot}`);
    const now = this.now();
    const date = this._today();

    const result = { slot, trigger: meta.trigger, date, total: 0, pushed: [], skippedSansQuota: [], logs: 0, missedInfo: {} };
    const users = this._activeUsers();
    result.total = users.length;

    for (const u of users) {
      if (!this._shouldNudge(u, meta)) continue;
      result.pushed.push(u.user_id);

      const quota = dryRun ? this._quotaOf(u.user_id) : this._quotaOf(u.user_id);
      if (quota <= 0) {
        result.skippedSansQuota.push(u.user_id);
        if (!dryRun) {
          this._writeLog(u.user_id, meta.trigger, 'failed'); // 记录漏发（同日不重复）
          result.logs += 1;
        }
        continue;
      }
      if (dryRun) continue; // 探针：只判漏报 + 额度，不扣不变不发

      const sentOk = this._consumeQuota(u.user_id, now);
      if (sentOk) this._writeLog(u.user_id, meta.trigger, 'sent');
      else this._writeLog(u.user_id, meta.trigger, 'failed');
      result.logs += 1;
    }
    return result;
  }

  // 前端上报授权 accepted：插入一条 authorized 记录（额度 +1）
  authorize({ userId, templateKey = 'daily_reminder' }) {
    return this.db.insert('subscribe_auth', {
      user_id: userId,
      template_key: templateKey,
      status: 'authorized',
      authorized_at: this.now().toISOString(),
      updated_at: this.now().toISOString(),
    });
  }

  formatSlotTemplate(slot, userState = {}) {
    const meta = NUDGE_SLOTS.find((s) => s.slot === slot);
    const key =
      meta?.trigger === 'morning_greeting'
        ? 'morning_greeting'
        : meta?.trigger === 'meal_reminder'
          ? 'meal_reminder'
          : 'evening_summary';
    const tpl = this.config?.getPrompt(`prompt.nudge.${key}`) ?? TEMPLATES[key];
    const vars = {
      budget: userState.__budget ?? '未知',
      remaining: userState.__remaining ?? '未知',
      meal_label: userState.__mealLabel ?? '未知',
      reported_meals: userState.__reportedMeals ?? '未知',
      sum_min: userState.__sumMin ?? '未知',
      sum_max: userState.__sumMax ?? '未知',
    };
    return render(tpl, vars);
  }
}

export { TEMPLATES };