/**
 * Mock 数据层
 * 前期替代后端接口，供前端独立开发与走查
 */

const Mock = {
  /** 模拟网络延迟 */
  _delay(ms = 600) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  /** 用户状态 */
  _userState: 'unstarted',
  /** 用户资料 */
  _profile: {
    nickname: '',
    gender: 'female',
    age_group: '25-34',
    height: 165,
    initial_weight: 68,
    target_weight: 55,
    estimate_weeks: 26,
    daily_calorie_budget: 1450,
    snark_level: 'light',
    onboarding_completed: false
  },

  /** 聊天消息 */
  _messages: [],

  /** 今日预算 */
  _todayBudget: null,

  /* ==========================================
     用户相关
     ========================================== */

  /** 获取用户状态 */
  async getUserState() {
    await this._delay(200);
    return { state: this._userState, profile: this._profile };
  },

  /** 更新用户状态 */
  async setUserState(state) {
    await this._delay(100);
    this._userState = state;
  },

  /** 获取用户资料 */
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

  /* ==========================================
     聊天相关
     ========================================== */

  /**
   * 发送消息
   * @param {string} text 用户发送的文字
   * @returns {object} 教练回复 + 结构化结果
   */
  async sendMessage(text) {
    await this._delay(800);

    // 根据当前状态和消息内容做 mock 回复
    const reply = this._generateReply(text);
    this._messages.push({ role: 'user', text, time: Date.now() });
    this._messages.push({ role: 'coach', text: reply.reply_text, time: Date.now() });

    return reply;
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

    // 体重汇报
    if (/[\d.]+.*[k公斤g斤]/.test(lower) || /^[\d.]+$/.test(lower)) {
      return {
        reply_text: '收到，记下了。今天早饭吃了没？',
        intent: 'weight_report',
        extracted: {
          weight_record: { weight_kg: 67.8 },
          memory_points: []
        },
        budget_remaining_kcal: this._profile.daily_calorie_budget || 1450
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
    this._todayBudget = {
      total: 1450,
      consumed: 650,
      remaining: 800,
      target_weight: 55,
      current_weight: 67.5,
      weekly_change: -0.4
    };
    return { ...this._todayBudget };
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
     Onboarding 预设对话
     ========================================== */

  /** 获取摸底对话初始化消息 */
  getOnboardingFlow() {
    return [
      {
        role: 'coach',
        text: '嗨，我是 三餐教练。不教你基础，只盯着你瘦下来。先简单摸个底？',
        quickReplies: null
      },
      {
        role: 'user',
        text: '好',
        quickReplies: null
      },
      {
        role: 'coach',
        text: '怎么称呼你？',
        quickReplies: null
      }
    ];
  },

  /** 获取教练回复（基于用户回答的下一步） */
  getOnboardingNext(step, userInput) {
    const steps = {
      // step 0: 用户回答了"好"之后 → 问昵称
      'greeting_ok': {
        role: 'coach',
        text: '怎么称呼你？',
        quickReplies: null
      },
      // step 1: 昵称回答后 → 问身高体重
      'nickname': {
        role: 'coach',
        text: '身高、现在体重报一下，不许谎报。',
        quickReplies: null
      },
      // step 2: 身高体重后 → 问减肥史
      'height_weight': {
        role: 'coach',
        text: '减过几次？上次为什么放弃？',
        quickReplies: null
      },
      // step 3: 减肥史后 → 问目标
      'history': {
        role: 'coach',
        text: '了解。想减到多少？我给你算一个够得着的目标。',
        quickReplies: null
      },
      // step 4: 目标后 → 定标
      'target': {
        role: 'coach',
        text: '从 68 到 55，按每周 0.5kg 算，大概 26 周。中间会有平台期，我帮你调整。先确认这个目标？',
        quickReplies: [
          { text: '确认目标', type: 'primary', action: 'confirm_goal' },
          { text: '我想再快一点', type: 'secondary', action: 'faster' },
          { text: '有点长，能不能短点', type: 'secondary', action: 'shorter' }
        ]
      }
    };
    return steps[userInput] || null;
  },

  /* ==========================================
     重置 Mock 数据
     ========================================== */
  reset() {
    this._userState = 'unstarted';
    this._messages = [];
    this._todayBudget = null;
    this._profile = {
      nickname: '',
      gender: 'female',
      age_group: '25-34',
      height: 165,
      initial_weight: 68,
      target_weight: 55,
      estimate_weeks: 26,
      daily_calorie_budget: 1450,
      snark_level: 'light',
      onboarding_completed: false
    };
  }
};

module.exports = Mock;