/**
 * API 封装层
 * 前期走 Mock，后续切换为真实云函数调用
 */

const Mock = require('./mock.js');

// 切换标志：true = Mock，false = 真实接口
const USE_MOCK = true;

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
    if (USE_MOCK) return Mock.getUserState();
    return callCloudFunction('user.state.get', {});
  },

  async getProfile() {
    if (USE_MOCK) return Mock.getProfile();
    return callCloudFunction('user.profile.get', {});
  },

  async updateProfile(fields) {
    if (USE_MOCK) return Mock.updateProfile(fields);
    return callCloudFunction('user.profile.update', { fields });
  },

  async setUserState(state) {
    if (USE_MOCK) return Mock.setUserState(state);
    return callCloudFunction('user.state.set', { state });
  },

  /* ==========================================
     聊天相关
     ========================================== */

  async sendMessage(text) {
    if (USE_MOCK) return Mock.sendMessage(text);
    return callCloudFunction('chat.send', { text });
  },

  async getHistory(cursor) {
    if (USE_MOCK) return Mock.getHistory(cursor);
    return callCloudFunction('conversation.history', { cursor });
  },

  /* ==========================================
     预算相关
     ========================================== */

  async getTodayBudget() {
    if (USE_MOCK) return Mock.getTodayBudget();
    return callCloudFunction('budget.today', {});
  },

  /* ==========================================
     全局配置（云端 app_config 公开配置）
     ========================================== */

  async getAppConfig() {
    if (USE_MOCK) return Mock.getAppConfig();
    try {
      return await callCloudFunction('app.config.get', {});
    } catch (e) {
      // 云函数未部署新 action / 读取失败：兜底默认配置，不影响聊天页
      return { coach_avatar_url: '' };
    }
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
    if (USE_MOCK) {
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