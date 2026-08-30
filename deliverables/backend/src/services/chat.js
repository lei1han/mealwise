// 会话编排主服务：取历史 + 取记忆 → 组装提示词 → 调 LLM → 解析 → 落库 → 返回
import { MemoryService } from '../memory/memory.js';
import { parseRaw } from '../llm/parser.js';
import { budgetRemaining, todayConsumption } from '../domain/budget.js';
import { dailyBudget, evaluateOnboarding, applyProfiling, estimateWeeks, makeOnboarding } from '../domain/onboarding.js';
import { HISTORY_ROUNDS, ONBOARDING_STATES } from '../domain/constants.js';

const ENV = Object.freeze({
  snark_level: '轻损',
  goal_stage: '执行',
});

export class ChatService {
  constructor({ db, llm, now = () => new Date() }) {
    this.db = db;
    this.llm = llm;
    this.now = now;
    this.mem = new MemoryService(db);
  }

  _today() {
    return this.now().toISOString().slice(0, 10);
  }

  _getOrCreateUser(userId) {
    let u = this.db.findOne('users', (d) => d.user_id === userId);
    if (!u) {
      const base = { ...makeOnboarding(userId), last_active_at: this.now().toISOString() };
      u = this.db.insert('users', base); // 用入库存的同一引用，后续字段更新才生效
    }
    u.last_active_at = this.now().toISOString();
    return u;
  }

  _todayDietRecords(userId) {
    const k = this._today();
    return this.db.find('diet_records', (r) => r.user_id === userId && r.date === k);
  }

  _historyPrompt(userId) {
    const msgs = this.db
      .find('messages', (m) => m.user_id === userId)
      .sort((a, b) => (a.created_at < b.created_at ? -1 : 1))
      .slice(-HISTORY_ROUNDS * 2);
    return msgs.map((m) => `${m.role === 'coach' ? '教练' : '用户'}：${m.content}`).join('\n');
  }

  _buildSystem(user, memoryCtx, budget) {
    const db = dailyBudget({
      weightKg: user.current_weight_kg,
      heightCm: user.height_cm,
      ageGroup: user.age_group,
      gender: user.gender,
    });
    const lines = [
      '你是一个陪伴式减重教练。用中文、口语化、简短回应；可用俏皮/毒舌但绝不羞辱身材。',
      `性别/年龄段：${user.gender ?? '未知'} / ${user.age_group ?? '未知'}`,
      `身高：${user.height_cm ?? '未知'}cm；当前：${user.current_weight_kg ?? '未知'}kg；目标：${user.target_weight_kg ?? '未定标'}kg`,
      `每日预算：${db ?? '未定标'} kcal；剩余：${budget ?? '未知'} kcal`,
      `阶段：${ENV.goal_stage}；毒舌档位：${ENV.snark_level}`,
    ].join('\n');
    return lines;
  }

  async send({ userId, text }) {
    const user = this._getOrCreateUser(userId);
    // 历史 + 记忆 + 预算
    const historyCtx = this._historyPrompt(userId);
    const memoryCtx = this.mem.readContext(userId);
    const todayDiet = this._todayDietRecords(userId);
    const calcBudget = (() => {
      const db = dailyBudget({ weightKg: user.current_weight_kg, heightCm: user.height_cm, ageGroup: user.age_group, gender: user.gender });
      return budgetRemaining(db, todayDiet);
    })();

    const system = this._buildSystem(user, memoryCtx, calcBudget);
    const llmMessages = [
      { role: 'system', content: system + (memoryCtx ? `\n\n## 已记录记忆\n${memoryCtx}` : '') },
    ];
    if (historyCtx) llmMessages.push({ role: 'system', content: `## 最近对话\n${historyCtx}` });
    llmMessages.push({ role: 'user', content: text });

    let parsed;
    try {
      const raw = await this.llm.complete({ messages: llmMessages });
      parsed = parseRaw(raw, { now: this.now() });
    } catch {
      parsed = { degraded: true, reply_text: text, intent: 'other', extracted: {}, budget_remaining_kcal: null };
    }

    // 服务端覆盖预算（单值）
    parsed.budget_remaining_kcal = calcBudget;

    this._persist(user, text, parsed);

    const remaining = this._subscribeRemaining(userId);
    return {
      reply_text: parsed.reply_text ?? '（我这里有点卡，你再说一遍？）',
      intent: parsed.intent,
      budget_remaining_kcal: calcBudget,
      degraded: !!parsed.degraded,
      subscribe_hint: user.onboarding_state === 'active' && remaining < 3,
    };
  }

  _persist(user, userText, parsed) {
    const now = this.now();
    const iso = now.toISOString();
    const date = iso.slice(0, 10);

    // 落消息（用户 + 教练双条）
    this.db.insert('messages', { user_id: user.user_id, role: 'user', content: userText, created_at: iso });
    this.db.insert('messages', { user_id: user.user_id, role: 'coach', content: parsed.reply_text ?? '', created_at: new Date(now.getTime() + 1).toISOString() });

    const x = parsed.extracted ?? {};
    // diet
    if (x.diet_record) {
      this.db.insert('diet_records', { user_id: user.user_id, date, ...x.diet_record });
    }
    // weight
    if (x.weight_record) {
      const existing = this.db.findOne('weight_records', (r) => r.user_id === user.user_id && r.date === date);
      if (existing) Object.assign(existing, x.weight_record);
      else this.db.insert('weight_records', { user_id: user.user_id, date, ...x.weight_record });
    }
    // memory
    if (Array.isArray(x.memory_points)) {
      this.mem.write(user.user_id, x.memory_points);
      applyProfiling(user, { memories: x.memory_points });
    }

    // profiling 派生 weight/height/target
    if (user.current_weight_kg == null && x.weight_record) user.current_weight_kg = x.weight_record.weight_kg;

    // 状态机转移
    const st = evaluateOnboarding(user);
    if (st.changed) {
      user.onboarding_state = st.state;
      if (st.state === 'active') {
        user.target_estimate_weeks = estimateWeeks(user.current_weight_kg, user.target_weight_kg);
        user.onboarding_completed_at = iso; // 执行期起点锚点，只写一次
      }
    }
    user.updated_at = iso;
  }

  _subscribeRemaining(userId) {
    return this.db.find('subscribe_auth', (a) => a.user_id === userId && a.status === 'authorized').length;
  }
}

export { ONBOARDING_STATES };
export { todayConsumption };