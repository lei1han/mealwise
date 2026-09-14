/**
 * API 封装层
 * 前期走 Mock，后续切换为真实云函数调用
 */

const Mock = require('./mock.js');
const { buildDietCard } = require('./diet-card.js');

// 切换标志：true = Mock，false = 真实接口
const USE_MOCK = true;
// 白名单内的 action 无视 USE_MOCK 强制走真实云函数（逐个 action 灰度切换用）
// 2026-08-31 后端全量落地：内核 9 个 action 补齐 + 错误码/限流对齐契约，云函数已重新部署，
// 全部 action 放开真实链路（模拟器走查中；如需回退 Mock，清空此数组即可）
const REAL_ACTIONS = [
  'auth.login',
  'user.state.get',
  'chat.send',
  'onboarding.profile.submit',
  'budget.today',
  'conversation.current',
  'conversation.history',
  'user.profile.get',
  'user.profile.update',
  'user.target.update',
  'subscribe.report',
  'app.config.get'
];

/**
 * 判断指定 action 是否走真实云函数
 */
function useReal(action) {
  return !USE_MOCK || REAL_ACTIONS.includes(action);
}

/**
 * 云函数调用（真实接口）
 */
function callCloudFunction(action, payload) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'api',
      data: { action, payload },
      success: (res) => {
        if (res.result && res.result.code === 0) {
          resolve(res.result.data);
        } else {
          reject(res.result || { message: '请求失败' });
        }
      },
      fail: reject
    });
  });
}

const API = {
  /* ==========================================
     用户相关
     ========================================== */

  async getUserState() {
    if (!useReal('user.state.get')) return Mock.getUserState();
    return callCloudFunction('user.state.get', {});
  },

  /**
   * 授权登录（auth.login）：手机号 code 换号 + 回填昵称/头像，建或更新用户
   * @param {object} payload { phoneCode?, nickname?, avatarUrl? } phoneCode 仅在首次授权时传
   * @returns {object} { is_new, phone, nickname, avatar_url }
   */
  async login(payload = {}) {
    if (!useReal('auth.login')) return Mock.login(payload);
    return callCloudFunction('auth.login', payload);
  },

  async getProfile() {
    if (!useReal('user.profile.get')) return Mock.getProfile();
    return callCloudFunction('user.profile.get', {});
  },

  async updateProfile(fields) {
    if (!useReal('user.profile.update')) return Mock.updateProfile(fields);
    // 契约 C：user.profile.update payload 为 { patch }（白名单字段，snark_level 等后端静默忽略）
    return callCloudFunction('user.profile.update', { patch: fields });
  },

  /**
   * 提交体质信息（摸底 sheet 保存）：结构化上报后端，产出下一轮对话
   */
  async submitBodyInfo(fields) {
    if (!useReal('onboarding.profile.submit')) return Mock.submitBodyInfo(fields);
    return callCloudFunction('onboarding.profile.submit', { fields });
  },

  /* ==========================================
     聊天相关
     ========================================== */

  async sendMessage(text) {
    if (!useReal('chat.send')) {
      const reply = await Mock.sendMessage(text);
      if (!reply.diet_card && reply.extracted && reply.extracted.diet_record) {
        reply.diet_card = buildDietCard(reply.extracted.diet_record);
      }
      return reply;
    }
    return callCloudFunction('chat.send', { text });
  },

  async getHistory(cursor) {
    if (!useReal('conversation.history')) return Mock.getHistory(cursor);
    const res = await callCloudFunction('conversation.history', { cursor });
    // 契约 C 返回 { items, next_cursor }，此处归一化为前端既有消费结构 { messages, hasMore, cursor }
    const items = (res && res.items) || [];
    return {
      messages: items.map((m) => ({ role: m.role, text: m.content, time: m.created_at })),
      hasMore: !!(res && res.next_cursor),
      cursor: (res && res.next_cursor) || null
    };
  },

  /* ==========================================
     预算相关
     ========================================== */

  async getTodayBudget() {
    if (!useReal('budget.today')) return Mock.getTodayBudget();
    return callCloudFunction('budget.today', {});
  },

  /* ==========================================
     P2 新增：数据/个人/目标/饮食
     ========================================== */

  /** 体重历史（stats-weight-detail / stats-main 折线图）
   * @param {string} range '7d' | '30d' | 'all'
   */
  async getWeightHistory(range = '30d') {
    if (!useReal('weight.history')) return Mock.getWeightHistory(range);
    return callCloudFunction('weight.history', { range });
  },

  /** 今日四餐概览（P1 饮食概览浮层 + P2 sheet-diet-detail） */
  async getTodayMeals() {
    if (!useReal('diet.today')) return Mock.getTodayMeals();
    return callCloudFunction('diet.today', {});
  },

  /** 某日饮食详情（sheet-diet-detail）
   * @param {string} date 'YYYY-MM-DD'
   */
  async getDietDetail(date) {
    if (!useReal('diet.detail')) return Mock.getDietDetail(date);
    return callCloudFunction('diet.detail', { date });
  },

  /** 热量趋势（stats-main 摄入 vs 预算）
   * @param {number} days 近 N 天
   */
  async getCalorieTrend(days = 7) {
    if (!useReal('calorie.trend')) return Mock.getCalorieTrend(days);
    return callCloudFunction('calorie.trend', { days });
  },

  /** 连续打卡天数（stats-main / profile-main） */
  async getStreak() {
    if (!useReal('streak.get')) return Mock.getStreak();
    return callCloudFunction('streak.get', {});
  },

  /** 目标管理（target-setting） */
  async getGoal() {
    if (!useReal('goal.get')) return Mock.getGoal();
    return callCloudFunction('goal.get', {});
  },

  /** 更新目标（target-setting 保存）
   * @param {object} fields { target_weight, weekly_speed }
   */
  async updateGoal(fields) {
    if (!useReal('goal.update')) return Mock.updateGoal(fields);
    return callCloudFunction('goal.update', fields);
  },

  /** 数据主页统计摘要（stats-main 概览卡片） */
  async getStatsSummary() {
    if (!useReal('stats.summary')) return Mock.getStatsSummary();
    return callCloudFunction('stats.summary', {});
  },

  /* ==========================================
     全局配置（云端 app_config 公开配置）
     ========================================== */

  async getAppConfig() {
    if (!useReal('app.config.get')) return Mock.getAppConfig();
    try {
      return await callCloudFunction('app.config.get', {});
    } catch (e) {
      // 云函数未部署新 action / 读取失败：兜底默认配置，不影响聊天页
      return { coach_avatar_url: '' };
    }
  },

  /* ==========================================
     订阅消息
     ========================================== */

  async reportSubscribe(accepted) {
    if (!useReal('subscribe.report')) {
      await Mock._delay(200);
      return { success: true, accepted };
    }
    return callCloudFunction('subscribe.report', { accepted });
  },

  /* ==========================================
     重置
     ========================================== */
  reset() {
    if (USE_MOCK) Mock.reset();
  }
};

module.exports = API;