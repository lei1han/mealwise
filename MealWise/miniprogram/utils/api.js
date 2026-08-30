/**
 * API 封装层
 * 前期走 Mock，后续切换为真实云函数调用
 */

const Mock = require('./mock.js');

// 切换标志：true = Mock，false = 真实接口
const USE_MOCK = true;
// 白名单内的 action 无视 USE_MOCK 强制走真实云函数（逐个 action 灰度切换用）
// 已联调通过的真实 action：'chat.send'、'subscribe.report'（2026-08-30 云端测试 + 模拟器走查）
const REAL_ACTIONS = ['chat.send', 'subscribe.report'];

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

  async getProfile() {
    if (!useReal('user.profile.get')) return Mock.getProfile();
    return callCloudFunction('user.profile.get', {});
  },

  async updateProfile(fields) {
    if (!useReal('user.profile.update')) return Mock.updateProfile(fields);
    return callCloudFunction('user.profile.update', { fields });
  },

  async setUserState(state) {
    if (!useReal('user.state.set')) return Mock.setUserState(state);
    return callCloudFunction('user.state.set', { state });
  },

  /* ==========================================
     聊天相关
     ========================================== */

  async sendMessage(text) {
    if (!useReal('chat.send')) return Mock.sendMessage(text);
    return callCloudFunction('chat.send', { text });
  },

  async getHistory(cursor) {
    if (!useReal('conversation.history')) return Mock.getHistory(cursor);
    return callCloudFunction('conversation.history', { cursor });
  },

  /* ==========================================
     预算相关
     ========================================== */

  async getTodayBudget() {
    if (!useReal('budget.today')) return Mock.getTodayBudget();
    return callCloudFunction('budget.today', {});
  },

  /* ==========================================
     Onboarding
     ========================================== */

  getOnboardingFlow() {
    return Mock.getOnboardingFlow();
  },

  getOnboardingNext(step, userInput) {
    return Mock.getOnboardingNext(step, userInput);
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