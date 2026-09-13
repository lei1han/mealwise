/**
 * Mock 数据层
 * 前期替代后端接口，供前端独立开发与走查
 */

const Mock = {
  /** 模拟网络延迟 */
  _delay(ms = 600) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  /** 摸底状态机（后端主导，mock 模拟）：new / profiling / active */
  _onboardingState: 'new',
  /** 摸底对话轮次（仅 mock 走查用） */
  _onboardingTurns: 0,

  /** 用户资料（扩展 P2 所需字段） */
  _profile: {
    nickname: '',
    avatar_url: '',
    phone: '',
    gender: 'female',
    age_group: '25-34',
    birthdate: '1995-06-15',
    height: 165,
    initial_weight: 68,
    target_weight: 55,
    estimate_weeks: 26,
    daily_calorie_budget: 1450,
    snark_level: 'light',
    onboarding_completed: false,
    bio: '想瘦回大学体重的打工人'
  },

  /** 聊天消息 */
  _messages: [],

  /** 今日预算 */
  _todayBudget: null,

  /** 今日是否已报过体重（mock 走查用，对应 user.state.get 返回 reported_weight_today） */
  _reportedWeightToday: false,

  /** 目标与 streak（P2） */
  _goal: {
    target_weight: 55,
    weekly_speed: 'medium',
    start_weight: 68,
    start_date: '2026-06-01',
    estimated_date: '2026-12-15'
  },

  _streak: {
    current: 5,
    longest: 12,
    last_check_in_date: new Date().toISOString().slice(0, 10)
  },

  /** 体重记录（P2：趋势详情/统计） */
  _weightRecords: [],

  /** 饮食记录（P2：饮食详情/热量趋势） */
  _dietRecords: [],

  /** 连续打卡/热量趋势等派生数据初始化 */
  _initMockData() {
    if (this._weightRecords.length) return;
    this._weightRecords = this._generateWeightRecords(90);
    this._dietRecords = this._generateDietRecords(30);
    this._todayBudget = {
      total: 1450,
      consumed: 650,
      remaining: 800,
      target_weight: this._goal.target_weight,
      current_weight: this._weightRecords[this._weightRecords.length - 1].weight_kg,
      weekly_change: -0.4
    };
  },

  /** 生成体重记录：从 initial_weight 波动下降到 current_weight */
  _generateWeightRecords(days) {
    const records = [];
    const endDate = new Date();
    const endWeight = 67.5;
    const startWeight = 70.0;
    for (let i = days; i >= 0; i--) {
      const d = new Date(endDate);
      d.setDate(d.getDate() - i);
      const progress = (days - i) / days;
      const trend = startWeight + (endWeight - startWeight) * progress;
      const noise = (Math.random() - 0.5) * 0.8;
      records.push({
        date: d.toISOString().slice(0, 10),
        weight_kg: Math.max(50, Number((trend + noise).toFixed(1)))
      });
    }
    return records;
  },

  /** 生成近 N 天饮食记录（含每餐热量与食物列表） */
  _generateDietRecords(days) {
    const sampleMeals = {
      breakfast: {
        name: '早餐',
        kcal: 280,
        items: [
          { name: '全麦面包', amount: '2 片', kcal: 120 },
          { name: '煮鸡蛋', amount: '1 个', kcal: 70 },
          { name: '牛奶', amount: '250 ml', kcal: 90 }
        ]
      },
      lunch: {
        name: '午餐',
        kcal: 400,
        items: [
          { name: '米饭', amount: '1 碗', kcal: 200 },
          { name: '鸡腿肉', amount: '100 g', kcal: 130 },
          { name: '青菜', amount: '1 份', kcal: 70 }
        ]
      },
      dinner: {
        name: '晚餐',
        kcal: 350,
        items: [
          { name: '杂粮粥', amount: '1 碗', kcal: 150 },
          { name: '豆腐', amount: '100 g', kcal: 100 },
          { name: '凉拌黄瓜', amount: '1 份', kcal: 50 }
        ]
      },
      snack: {
        name: '加餐',
        kcal: 120,
        items: [
          { name: '苹果', amount: '1 个', kcal: 80 },
          { name: '无糖酸奶', amount: '100 g', kcal: 40 }
        ]
      }
    };
    const endDate = new Date();
    const records = [];
    for (let i = days; i >= 0; i--) {
      const d = new Date(endDate);
      d.setDate(d.getDate() - i);
      const date = d.toISOString().slice(0, 10);
      const meals = ['breakfast', 'lunch', 'dinner', 'snack'];
      const dailyMeals = {};
      let total = 0;
      meals.forEach((key) => {
        if (i > 2 || (i <= 2 && key !== 'dinner' && key !== 'snack')) {
          const meal = { ...sampleMeals[key], recorded: true };
          dailyMeals[key] = meal;
          total += meal.kcal;
        } else {
          dailyMeals[key] = { name: sampleMeals[key].name, kcal: null, recorded: false, items: [] };
        }
      });
      records.push({ date, meals: dailyMeals, total_kcal: total });
    }
    return records;
  },

  /* ==========================================
     用户相关
     ========================================== */

  /** 授权登录（auth.login）：模拟换号 + 回填昵称/头像 */
  async login({ phoneCode, nickname, avatarUrl } = {}) {
    await this._delay(300);
    if (phoneCode) this._profile.phone = this._profile.phone || '138****0000';
    if (nickname) this._profile.nickname = nickname;
    if (avatarUrl) this._profile.avatar_url = avatarUrl;
    return {
      is_new: !this._profile.phone,
      phone: this._profile.phone || null,
      nickname: this._profile.nickname || null,
      avatar_url: this._profile.avatar_url || null
    };
  },

  /** 获取用户状态（user.state.get） */
  async getUserState() {
    await this._delay(200);
    return { onboarding_state: this._onboardingState, reported_weight_today: this._reportedWeightToday };
  },

  /** 获取用户资料（P2 扩展 bio、birthdate 等字段） */
  async getProfile() {
    await this._delay(200);
    return { ...this._profile };
  },

  /** 更新用户资料 */
  async updateProfile(fields) {
    await this._delay(300);
    Object.assign(this._profile, fields);
    return { ...this._profile };
  },

  /**
   * 提交体质信息（摸底 sheet 保存后调用）：结构化上报后端，并产出下一轮对话
   * @param {object} fields { gender, age_group, height, initial_weight, target_weight }
   * @returns {object} 教练确认 + 下一个摸底问题
   */
  async submitBodyInfo(fields) {
    await this._delay(400);
    if (fields.gender) this._profile.gender = fields.gender;
    if (fields.age_group) this._profile.age_group = fields.age_group;
    if (fields.height) this._profile.height = Number(fields.height);
    if (fields.initial_weight) this._profile.initial_weight = Number(fields.initial_weight);
    if (fields.target_weight) this._profile.target_weight = Number(fields.target_weight);
    // sheet 已录入身高/体重/目标，推进摸底到"减肥史"环节，并产出本轮确认对话
    this._onboardingTurns = 3;
    return {
      reply_text:
        '记下了：' +
        this._profile.height +
        'cm，' +
        this._profile.initial_weight +
        ' → ' +
        this._profile.target_weight +
        'kg。目标有点意思。以前减过几次？上次为什么放弃？',
      onboarding_state: this._onboardingState,
      degraded: false
    };
  },

  /* ==========================================
     聊天相关
     ========================================== */

  /**
   * 发送消息（chat.send）
   * @param {string} text 用户发送的文字；'__start__'（或空文本）为摸底/回归开场
   * @returns {object} 教练回复 + 结构化结果 + onboarding_state
   */
  async sendMessage(text) {
    await this._delay(800);

    const raw = (text || '').trim();

    // 开场：只落教练消息，状态机不推进
    if (raw === '__start__' || raw === '') {
      const reply = this._openingReply();
      this._messages.push({ role: 'coach', text: reply.reply_text, time: Date.now() });
      return reply;
    }

    // 根据当前状态和消息内容做 mock 回复
    const reply = this._generateReply(raw);
    // 日常回复补齐契约 C 字段
    if (reply.onboarding_state == null) reply.onboarding_state = this._onboardingState;
    if (reply.subscribe_hint == null) reply.subscribe_hint = false;
    if (reply.degraded == null) reply.degraded = false;
    this._messages.push({ role: 'user', text: raw, time: Date.now() });
    this._messages.push({ role: 'coach', text: reply.reply_text, time: Date.now() });

    return reply;
  },

  /** 开场白（按状态分发，与后端 OPENING_LINES 对齐） */
  _openingReply() {
    const lines = {
      new: '嗨，我是三餐教练。不教你基础，只盯着你瘦下来。先简单摸个底？',
      profiling: '咱们接着来，还差一点信息就能给你定标了。',
      active: '来了？今天体重和吃了啥，记得报。'
    };
    return {
      reply_text: lines[this._onboardingState] || lines.active,
      intent: 'other',
      extracted: { memory_points: [] },
      budget_remaining_kcal: null,
      degraded: false,
      subscribe_hint: false,
      onboarding_state: this._onboardingState
    };
  },

  /**
   * 摸底中的脚本化回复（mock 用固定话术推进，真实环境由后端 LLM + 状态机主导）
   * @returns {object|null} 摸底期回复；已定标返回 null 走日常回复
   */
  _onboardingReply(text) {
    if (this._onboardingState === 'active') return null;

    this._onboardingTurns += 1;
    const turn = this._onboardingTurns;

    if (turn === 1) {
      return { reply_text: '怎么称呼你？', state: 'new' };
    }
    if (turn === 2) {
      this._profile.nickname = text.slice(0, 6);
      // 本轮正好"问体重"：下发标记，让前端弹出体质信息录入 sheet
      return {
        reply_text: '身高、现在体重报一下，目标一起填了，方便我给你算预算。',
        state: 'profiling',
        action: 'open_weight_sheet'
      };
    }
    if (turn === 3) {
      return { reply_text: '减过几次？上次为什么放弃？', state: 'profiling' };
    }
    if (turn === 4) {
      return { reply_text: '了解。想减到多少？我给你算一个够得着的目标。', state: 'profiling' };
    }
    // 第 5 轮：报目标体重 → 定标完成
    const target = (text.match(/[\d.]+/) || [])[0] || '55';
    this._profile.target_weight = parseFloat(target);
    this._profile.onboarding_completed = true;
    return {
      reply_text:
        '定了！按每周 0.5kg 的健康速度，我给你算好每日热量预算了。从今天开始记饮食，报体重，我盯着你。',
      state: 'active'
    };
  },

  /** 获取聊天历史 */
  async getHistory(cursor) {
    await this._delay(300);
    return {
      messages: this._messages.slice(-50),
      hasMore: this._messages.length > 50,
      cursor: null
    };
  },

  /**
   * Mock 回复生成
   */
  _generateReply(text) {
    const lower = text.toLowerCase().trim();

    // 摸底期：脚本化推进，状态机由"后端"（mock）主导
    const onboarding = this._onboardingReply(text);
    if (onboarding) {
      this._onboardingState = onboarding.state;
      const reply = {
        reply_text: onboarding.reply_text,
        intent: 'other',
        extracted: { memory_points: [] },
        budget_remaining_kcal: null,
        degraded: false,
        subscribe_hint: false,
        onboarding_state: this._onboardingState
      };
      // 透传摸底回复的可选动作标记（如打开体质录入）
      if (onboarding.action) reply.action = onboarding.action;
      return reply;
    }

    // 体重汇报
    if (/[\d.]+.*[k公斤g斤]/.test(lower) ||/^[\d.]+$/.test(lower)) {
      this._reportedWeightToday = true;
      return {
        reply_text: '收到，记下了。今天早饭吃了没？',
        intent: 'weight_report',
        extracted: {
          weight_record: { weight_kg: 67.8 },
          memory_points: []
        },
        // 剩余预算：与 getTodayBudget.remaining 对齐，供前端挂预算卡
        budget_remaining_kcal: this._todayBudget ? this._todayBudget.remaining : null
      };
    }

    // 饮食汇报
    if (/吃|饭|菜|肉|奶|茶|水果|零食|鸡|牛|猪|鱼|蛋|面|米|粥|汤/.test(lower)) {
      return {
        reply_text: '这餐大概 350~420 大卡。蛋白质选得不错，碳水也刚好。今天离预算还剩约 800 大卡，下午别点奶茶了啊。',
        intent: 'diet_report',
        extracted: {
          diet_record: {
            meal: 'lunch',
            items: ['米饭', '鸡腿肉', '青菜'],
            cal_min: 350,
            cal_max: 420,
            food_refs: ['food:rice', 'food:chicken_leg', 'food:green_veg'],
            confidence: 'medium'
          },
          memory_points: []
        },
        budget_remaining_kcal: 800
      };
    }

    // 心情 / 闲聊
    if (/心情|压力|烦|累|崩|想放弃|不想|坚持|加油/.test(lower)) {
      return {
        reply_text: '先抱一个。减肥路上谁没崩过。今天不用硬撑，跟我说说怎么了？',
        intent: 'mood_talk',
        extracted: {
          memory_points: [{ category: 'emotion', content: '情绪低落' }]
        },
        budget_remaining_kcal: this._todayBudget ? this._todayBudget.remaining : null
      };
    }

    // 默认回复
    return {
      reply_text: '收到！继续加油，今天离预算还早着呢。',
      intent: 'other',
      extracted: { memory_points: [] },
      budget_remaining_kcal: this._todayBudget ? this._todayBudget.remaining : null
    };
  },

  /* ==========================================
     预算相关
     ========================================== */

  /** 获取今日预算 */
  async getTodayBudget() {
    await this._delay(200);
    this._initMockData();
    return { ...this._todayBudget };
  },

  /* ==========================================
     P2 新增：数据/个人/目标/饮食
     ========================================== */

  /** 体重历史（P2 stats-weight-detail / stats-main 折线图）
   * @param {string} range '7d' | '30d' | 'all'
   */
  async getWeightHistory(range = '30d') {
    await this._delay(200);
    this._initMockData();
    let days = 30;
    if (range === '7d') days = 7;
    if (range === 'all') days = this._weightRecords.length;
    return this._weightRecords.slice(-days);
  },

  /** 今日四餐概览（P1 饮食概览浮层 + P2 sheet-diet-detail） */
  async getTodayMeals() {
    await this._delay(200);
    this._initMockData();
    const today = new Date().toISOString().slice(0, 10);
    const record = this._dietRecords.find((r) => r.date === today);
    if (!record) {
      return { date: today, meals: {}, total_kcal: 0 };
    }
    return { date: record.date, meals: record.meals, total_kcal: record.total_kcal };
  },

  /** 某日饮食详情（P2 sheet-diet-detail）
   * @param {string} date 'YYYY-MM-DD'，缺省为今天
   */
  async getDietDetail(date) {
    await this._delay(200);
    this._initMockData();
    const target = date || new Date().toISOString().slice(0, 10);
    const record = this._dietRecords.find((r) => r.date === target);
    if (!record) {
      return { date: target, meals: {}, total_kcal: 0 };
    }
    return { date: record.date, meals: record.meals, total_kcal: record.total_kcal };
  },

  /** 热量趋势（P2 stats-main 摄入 vs 预算）
   * @param {number} days 近 N 天
   */
  async getCalorieTrend(days = 7) {
    await this._delay(200);
    this._initMockData();
    const endDate = new Date();
    const trend = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(endDate);
      d.setDate(d.getDate() - i);
      const date = d.toISOString().slice(0, 10);
      const intake = Math.round(1100 + Math.random() * 700);
      trend.push({
        date,
        budget: this._profile.daily_calorie_budget,
        intake,
        remaining: Math.max(0, this._profile.daily_calorie_budget - intake)
      });
    }
    return trend;
  },

  /** 连续打卡天数（P2 stats-main / profile-main） */
  async getStreak() {
    await this._delay(100);
    return { ...this._streak };
  },

  /** 目标管理（P2 target-setting） */
  async getGoal() {
    await this._delay(200);
    return { ...this._goal };
  },

  /** 更新目标（P2 target-setting 保存）
   * @param {object} fields { target_weight, weekly_speed }
   */
  async updateGoal(fields) {
    await this._delay(300);
    const speedMap = { fast: 0.75, medium: 0.5, slow: 0.25 };
    const speed = speedMap[fields.weekly_speed] || speedMap[this._goal.weekly_speed];
    const currentWeight = this._profile.initial_weight;
    const targetWeight = fields.target_weight != null ? fields.target_weight : this._goal.target_weight;
    const weeks = Math.max(1, Math.ceil((currentWeight - targetWeight) / speed));
    const est = new Date();
    est.setDate(est.getDate() + weeks * 7);
    this._goal = {
      ...this._goal,
      ...fields,
      target_weight: targetWeight,
      estimated_date: est.toISOString().slice(0, 10)
    };
    this._profile.target_weight = this._goal.target_weight;
    return { ...this._goal };
  },

  /** 数据主页统计摘要（P2 stats-main 概览卡片） */
  async getStatsSummary() {
    await this._delay(200);
    this._initMockData();
    const current = this._todayBudget.current_weight;
    const start = this._profile.initial_weight;
    const target = this._goal.target_weight;
    const records = this._weightRecords;
    const bmi = Number((current / ((this._profile.height / 100) ** 2)).toFixed(1));
    return {
      current_weight: current,
      target_weight: target,
      initial_weight: start,
      weight_lost: Number((start - current).toFixed(1)),
      bmi,
      max_weight: Math.max(...records.map((r) => r.weight_kg)),
      min_weight: Math.min(...records.map((r) => r.weight_kg)),
      avg_weight: Number((records.reduce((s, r) => s + r.weight_kg, 0) / records.length).toFixed(1)),
      streak: this._streak.current,
      weekly_change: this._todayBudget.weekly_change
    };
  },

  /* ==========================================
     全局配置（对齐 app.config.get 返回结构）
     ========================================== */

  /** 获取全局公开配置（默认教练头像为空 → 前端回退「教」字占位） */
  async getAppConfig() {
    await this._delay(100);
    return { coach_avatar_url: '' };
  },

  /* ==========================================
     重置 Mock 数据
     ========================================== */
  reset() {
    this._onboardingState = 'new';
    this._onboardingTurns = 0;
    this._messages = [];
    this._todayBudget = null;
    this._reportedWeightToday = false;
    this._weightRecords = [];
    this._dietRecords = [];
    this._streak = {
      current: 5,
      longest: 12,
      last_check_in_date: new Date().toISOString().slice(0, 10)
    };
    this._goal = {
      target_weight: 55,
      weekly_speed: 'medium',
      start_weight: 68,
      start_date: '2026-06-01',
      estimated_date: '2026-12-15'
    };
    this._profile = {
      nickname: '',
      avatar_url: '',
      phone: '',
      gender: 'female',
      age_group: '25-34',
      birthdate: '1995-06-15',
      height: 165,
      initial_weight: 68,
      target_weight: 55,
      estimate_weeks: 26,
      daily_calorie_budget: 1450,
      snark_level: 'light',
      onboarding_completed: false,
      bio: '想瘦回大学体重的打工人'
    };
  }
};

module.exports = Mock;
