// 会话编排主服务：取历史 + 取记忆 → 组装提示词 → 调 LLM → 解析 → 落库 → 返回
import { MemoryService } from '../memory/memory.js';
import { parseRaw } from '../llm/parser.js';
import { budgetRemaining, todayConsumption } from '../domain/budget.js';
import { dailyBudget, evaluateOnboarding, applyProfiling, estimateWeeks, makeOnboarding } from '../domain/onboarding.js';
import { HISTORY_ROUNDS, ONBOARDING_STATES } from '../domain/constants.js';
import { formatFoodDbHint } from '../domain/foods.js';
import { render } from './config.js';

const ENV = Object.freeze({
  goal_stage: '执行',
});

// 毒舌档位中文映射（与提示词成品 §2 三档措辞对齐；user.snark_level 入库持久化，2026-09-01 起替代代码常量）
const SNARK_LABELS = Object.freeze({ gentle: '温柔', light: '轻损', spicy: '辛辣' });

// 开场白（__start__ 触发，按 onboarding 状态分发；契约 C §1.3；可被 app_config 的 prompt.opening.* 覆盖）
const OPENING_LINES = Object.freeze({
  new:
    '嗨，欢迎来～我是三餐教练。不跟你灌减肥大道理，就想陪你把节奏稳住、一点点瘦下来。先随便聊两句：你最近一次想认真减重，是被什么事触动的？',
  profiling: '咱们接着聊～还差一点点信息，我就能帮你把每日热量预算算准。',
  active: '来了？今天体重和吃了啥，记得报。',
});

// 聊天系统提示词默认模板（对齐提示词成品 §2；可被 app_config 的 prompt.chat.system 覆盖）
const DEFAULT_CHAT_SYSTEM_TEMPLATE = [
  '你是「三餐教练」，微信小程序里的减肥教练。用户懂热量但难坚持；你负责监督执行、戳破自欺、在崩溃边缘兜底，不重复教基础。',
  '',
  '## 人格',
  '专业（给数据与区间）+ 伙伴（共情不说教）+ 一点毒舌（轻损行为、立即给台阶，绝不羞辱人）。',
  '',
  '## 语气硬约束',
  '- 分量用半拳/一拳/两拳（以上），不要求上秤称重。',
  '- 热量输出区间，不编造精确单值；建议当天可落地，禁止空泛「少吃多动」。',
  '- 中文口语、简短有温度。',
  '',
  '## 毒舌边界（红线）',
  '- 严禁攻击外貌、身体羞辱、身材焦虑、羞辱饮食习惯、攻击性辱骂。',
  '- 禁止词及近似：胖成猪、肥得像、难看、恶心、废物、没救、loser、你这种人、活该、自找的等。',
  '- 用户情绪低落时停止毒舌，转共情（详见下方内容安全段）。',
  '',
  '## 话题边界',
  '- 只管身材：饮食、体重、运动、睡眠、情绪、目标与习惯。',
  '- 主题外（编程、工作学业、作业、通用问答、代写等）标 intent=off_topic，拒绝并拉回（见输出契约）。',
  '- 纯寒暄可回一句再拉回；医疗用药不诊断，建议咨询医生/营养师。',
  '',
  '## 当前用户状态',
  '性别/年龄段：{gender} / {age_group}',
  '身高：{height_cm} cm；当前体重：{current_weight_kg} kg；目标：{target_weight_kg} kg',
  '今日预算：{daily_budget} kcal；剩余约：{budget_remaining} kcal',
  '毒舌档位：{snark_label}；阶段：{goal_stage}',
  '{onboarding_hint}',
].join('\n');

// §4 饮食估算（始终追加，保证 food_db_hint 注入；运营覆盖主模板时仍生效）
const DEFAULT_DIET_ESTIMATE_PROMPT = [
  '## 当前任务：饮食热量估算（方案 C：食物库 + 拳换算）',
  '用户用半拳/一拳/两拳描述。优先把每种食物归到下方清单，food_refs 与 items 一一对应，库内写 food:{id}：',
  '',
  '{food_db_hint}',
  '',
  '拳换算：半拳=0.5×、一拳=1×、两拳=2×、两拳以上=2.5×（回复里可点一句量偏多）。',
  '库外/复合菜：拆成主食+主菜估区间，food_refs 写 food:external；拿不准 confidence=low，回复里诚实说粗略估。',
  '回复硬格式：热量写「这餐约 {min}~{max} 大卡」+ 一句预算对比 + 一句可执行建议。',
].join('\n');

// §9.1 + §9.2 内容安全与跑题（始终追加）
const DEFAULT_CONTENT_SAFETY_PROMPT = [
  '## 内容安全（最高优先级，凌驾毒舌人设）',
  '1. 不制造身材焦虑、不攻击外貌、不羞辱饮食习惯、不攻击人格。',
  '2. 禁止对「人」贬损（胖/肥/丑/恶心/废物/没救等）；可对具体行为温和吐槽。',
  '3. 用户自我攻击时不附和，否定后转到「今天能做的下一步」。',
  '4. 强烈负面情绪、疑似进食障碍、自伤念头：停止玩笑与毒舌，关切并建议寻求专业帮助。',
  '5. BMI 明显过低或极端节食：不给激进方案，建议就医。',
  '',
  '## 主题边界与跑题拒绝',
  '明确拒绝：编程/写代码、工作学业、作业、文档表格、修电脑、通用知识问答、创作代劳等。',
  '拒绝结构：共情或表明立场 → 明说不在专业范围 → 一句话拉回健康话题。',
  '语气按毒舌档位「{snark_label}」：温柔=委婉；轻损=轻调侃；辛辣=毒舌但不攻击人格。',
].join('\n');

// 摸底录入后的教练话术默认文案（可被 prompt.target_confirm / prompt.target_partial 覆盖）
const DEFAULT_TARGET_CONFIRM = '定了！按每周 0.5kg 的健康速度，我给你算好每日热量预算了。从今天开始记饮食，报体重，我盯着你。';
const DEFAULT_TARGET_PARTIAL = '记下了：{height_cm}cm，{current_weight_kg} → {target_weight_kg}kg。目标有点意思。以前减过几次？上次为什么放弃？';

// 输出契约：要求真实 LLM 仅返回一个可解析的 JSON（对齐契约 B / parser.js）。mock LLM 不读此段，仅真实链路生效。
// 属契约 B 冻结范围，默认不开放给运营配置。
const OUTPUT_CONTRACT = `
## 输出要求
只输出一个 JSON 对象，不要任何多余文字、Markdown 或代码块。字段如下（拿不准就留 null，别把已知数据写进说明文字）：
{
  "reply_text": "对用户这句的中文口语回复，简短；",
  "intent": "diet_report | weight_report | mood_talk | goal_setup | off_topic | other",
  "extracted": {
    "diet_record": { "meal": "breakfast|lunch|dinner|snack", "items": ["食物名"], "cal_min": 0, "cal_max": 0, "food_refs": ["food:库内id 或 food:external"], "confidence": "high|medium|low" },
    "weight_record": { "weight_kg": 60.0 },
    "memory_points": [ { "category": "static|dynamic|emotion", "content": "一句话记忆点" } ]
  },
  "budget_remaining_kcal": null
}
off_topic：用户请求与身材管理无关的任务/知识时选用，extracted 通常留 {}，reply_text 拒绝并拉回主题。`;

export class ChatService {
  constructor({ db, llm, config, now = () => new Date() }) {
    this.db = db;
    this.llm = llm;
    this.config = config ?? null; // ConfigService：提示词覆盖（无则回退代码默认）
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
    const food_db_hint = formatFoodDbHint();
    const vars = {
      gender: user.gender ?? '未知',
      age_group: user.age_group ?? '未知',
      height_cm: user.height_cm ?? '未知',
      current_weight_kg: user.current_weight_kg ?? '未知',
      target_weight_kg: user.target_weight_kg ?? '未定标',
      daily_budget: db ?? '未定标',
      budget_remaining: budget ?? '未知',
      goal_stage: user.onboarding_state !== 'active' ? '摸底' : ENV.goal_stage,
      snark_label: SNARK_LABELS[user.snark_level] ?? SNARK_LABELS.light,
      food_db_hint,
      onboarding_hint:
        user.onboarding_state !== 'active'
          ? '摸底阶段：先温馨问候、倾听动机与过往经历，循序渐进提问；至少一轮对话后再引导补充体质（性别、年龄段、身高、当前体重、目标体重）。需要结构化录入时再让用户打开体质录入卡片，首条开场不要催填表，不要编造数据。'
          : '',
    };
    const tpl = this.config?.getPrompt('prompt.chat.system') ?? DEFAULT_CHAT_SYSTEM_TEMPLATE;
    const core = render(tpl, vars).trimEnd();
    const diet = render(DEFAULT_DIET_ESTIMATE_PROMPT, vars);
    const safety = render(DEFAULT_CONTENT_SAFETY_PROMPT, vars);
    return `${core}\n\n${diet}\n\n${safety}`;
  }

  /** 今日是否已报过体重（weight_records 中当日有记录） */
  _reportedWeightToday(userId) {
    const k = this._today();
    return !!this.db.findOne('weight_records', (r) => r.user_id === userId && r.date === k);
  }

  /** 首帧状态读取（user.state.get）：不存在的用户按 new 返回，不建用户 */
  getState(userId) {
    const u = this.db.findOne('users', (d) => d.user_id === userId);
    return {
      onboarding_state: u ? u.onboarding_state : 'new',
      reported_weight_today: this._reportedWeightToday(userId),
    };
  }

  /**
   * 摸底期 UI 指令（契约 C 2026-09-01 增量）：缺身高/体重时引导体质录入 sheet。
   * 首帧 __start__ 仅问候，不弹表；至少已有 2 条教练消息（开场 + 一轮互动回复）后再下发。
   */
  _sheetAction(user) {
    if (user.onboarding_state === 'active') return undefined;
    if (user.height_cm != null && user.current_weight_kg != null) return undefined;
    const coachMsgs = this.db.find('messages', (m) => m.user_id === user.user_id && m.role === 'coach');
    if (coachMsgs.length < 2) return undefined;
    return 'open_weight_sheet';
  }

  /** 落消息：created_at 严格晚于该用户最后一条（同毫秒多轮时保持单调，避免历史排序错乱） */
  _appendMessage(userId, role, content, now = this.now()) {
    const last = this.db
      .find('messages', (m) => m.user_id === userId)
      .sort((a, b) => (a.created_at < b.created_at ? -1 : 1))
      .pop();
    const base = Math.max(now.getTime(), last ? Date.parse(last.created_at) + 1 : 0);
    return this.db.insert('messages', {
      user_id: userId,
      role,
      content,
      created_at: new Date(base).toISOString(),
    });
  }

  /** 摸底开场（__start__ 或空文本）：按状态返回确定性开场白，只落库教练消息 */
  _opening(user) {
    const state = user.onboarding_state;
    const reply_text =
      this.config?.getPrompt(`prompt.opening.${state}`) ?? OPENING_LINES[state] ?? OPENING_LINES.active;
    this._appendMessage(user.user_id, 'coach', reply_text);
    return {
      reply_text,
      intent: 'other',
      budget_remaining_kcal: null,
      degraded: false,
      subscribe_hint: false,
      onboarding_state: user.onboarding_state,
      action: this._sheetAction(user),
    };
  }

  async send({ userId, text }) {
    const user = this._getOrCreateUser(userId);

    // __start__（或空文本）：摸底/回归开场，不走 LLM
    const isStart = text == null || String(text).trim() === '' || String(text).trim() === '__start__';
    if (isStart) {
      return this._opening(user);
    }

    // 历史 + 记忆 + 预算（promptBudget 为"本轮回复前"的剩余，仅供 LLM 参考上下文）
    const historyCtx = this._historyPrompt(userId);
    const memoryCtx = this.mem.readContext(userId);
    const todayDiet = this._todayDietRecords(userId);
    const promptBudget = (() => {
      const db = dailyBudget({ weightKg: user.current_weight_kg, heightCm: user.height_cm, ageGroup: user.age_group, gender: user.gender });
      return budgetRemaining(db, todayDiet);
    })();

    const system = this._buildSystem(user, memoryCtx, promptBudget);
    const llmMessages = [
      { role: 'system', content: system + (memoryCtx ? `\n\n## 已记录记忆\n${memoryCtx}` : '') + OUTPUT_CONTRACT },
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

    this._persist(user, text, parsed);

    // 剩余预算在落库后重算：本轮抽取到的饮食立即反映到卡片（避免滞后一轮）
    const calcBudget = budgetRemaining(
      dailyBudget({ weightKg: user.current_weight_kg, heightCm: user.height_cm, ageGroup: user.age_group, gender: user.gender }),
      this._todayDietRecords(userId)
    );
    // 服务端覆盖预算（单值）
    parsed.budget_remaining_kcal = calcBudget;

    const remaining = this._subscribeRemaining(userId);
    return {
      reply_text: parsed.reply_text ?? '（我这里有点卡，你再说一遍？）',
      intent: parsed.intent,
      budget_remaining_kcal: calcBudget,
      degraded: !!parsed.degraded,
      subscribe_hint: user.onboarding_state === 'active' && remaining < 3,
      onboarding_state: user.onboarding_state,
      action: this._sheetAction(user),
    };
  }

  /**
   * 摸底体质录入 sheet 结构化上报（action: onboarding.profile.submit，契约 C 2026-09-01 增量）
   * fields = { gender, age_group, height, initial_weight, target_weight }（结构化字段，非聊天文本）
   * 落库 users → 状态机推进 → 产出一条教练确认对话；返回 { reply_text, onboarding_state, degraded }
   */
  submitProfile({ userId, fields = {} }) {
    const user = this._getOrCreateUser(userId);
    const now = this.now();
    const iso = now.toISOString();

    // 字段映射（initial_weight 落 current_weight_kg，schema 已冻结不新增字段）；已有值不覆盖（LLM 抽取优先保留）
    const mapping = {
      gender: 'gender',
      age_group: 'age_group',
      height: 'height_cm',
      initial_weight: 'current_weight_kg',
      target_weight: 'target_weight_kg',
    };
    for (const [src, dst] of Object.entries(mapping)) {
      if (fields[src] == null || user[dst] != null) continue;
      if (dst === 'height_cm' || dst === 'current_weight_kg' || dst === 'target_weight_kg') {
        const n = Number(fields[src]);
        if (Number.isFinite(n) && n > 0) user[dst] = n;
      } else {
        user[dst] = fields[src];
      }
    }

    // 状态机推进（齐备即转 active，写锚点与预估周期）
    const st = evaluateOnboarding(user);
    if (st.changed) {
      user.onboarding_state = st.state;
      if (st.state === 'active') {
        user.target_estimate_weeks = estimateWeeks(user.current_weight_kg, user.target_weight_kg);
        user.onboarding_completed_at = iso;
      }
    }
    user.updated_at = iso;

    // 教练确认对话：按推进结果分发话术（对齐 Mock submitBodyInfo / 定标话术；可被 prompt.target_* 覆盖）
    const body = {
      height_cm: user.height_cm ?? '?',
      current_weight_kg: user.current_weight_kg ?? '?',
      target_weight_kg: user.target_weight_kg ?? '?',
    };
    const confirmTpl = this.config?.getPrompt('prompt.target_confirm') ?? DEFAULT_TARGET_CONFIRM;
    const partialTpl = this.config?.getPrompt('prompt.target_partial') ?? DEFAULT_TARGET_PARTIAL;
    const reply_text =
      user.onboarding_state === 'active'
        ? render(confirmTpl, body)
        : render(partialTpl, body);
    this._appendMessage(user.user_id, 'coach', reply_text, now);

    return {
      reply_text,
      onboarding_state: user.onboarding_state,
      degraded: false,
      action: this._sheetAction(user),
    };
  }

  /**
   * 今日预算（action: budget.today，返回结构对齐前端消费口径）
   * weekly_change：近 7 天体重记录首末差值（不足 2 条为 null）
   */
  todayBudget({ userId }) {
    const user = this.db.findOne('users', (d) => d.user_id === userId);
    const total = user
      ? dailyBudget({ weightKg: user.current_weight_kg, heightCm: user.height_cm, ageGroup: user.age_group, gender: user.gender })
      : null;
    const records = this._todayDietRecords(userId);
    const consumed = todayConsumption(records).median;
    const remaining = total == null ? null : Math.round(total - consumed);

    const weekAgo = new Date(this.now().getTime() - 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    const weights = this.db
      .find('weight_records', (r) => r.user_id === userId && r.date >= weekAgo)
      .sort((a, b) => (a.date < b.date ? -1 : 1));
    const weekly_change =
      weights.length >= 2
        ? Math.round((weights[weights.length - 1].weight_kg - weights[0].weight_kg) * 10) / 10
        : null;

    return {
      total,
      consumed,
      remaining,
      target_weight: user?.target_weight_kg ?? null,
      current_weight: user?.current_weight_kg ?? null,
      weekly_change,
    };
  }

  _persist(user, userText, parsed) {
    const now = this.now();
    const iso = now.toISOString();
    const date = iso.slice(0, 10);

    // 落消息（用户 + 教练双条，created_at 单调递增）
    this._appendMessage(user.user_id, 'user', userText, now);
    this._appendMessage(user.user_id, 'coach', parsed.reply_text ?? '', new Date(now.getTime() + 1));

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