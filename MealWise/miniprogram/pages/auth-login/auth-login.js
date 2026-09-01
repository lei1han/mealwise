const app = getApp();
const API = require('../../utils/api.js');

Page({
  data: {
    loggingIn: false
  },

  onLoad() {
    // 已登录则直接进入
    if (app.globalData.isLoggedIn) {
      this._goNext();
    }
  },

  /** 微信手机号授权登录（open-type="getPhoneNumber"）：成功即直接进入聊天 */
  async handleLogin(e) {
    if (this.data.loggingIn) return;
    // code：成功回调携 code（云函数换手机号）；无 code 即拒绝/未授权，降级进入
    if (!(e.detail && e.detail.code)) {
      this.handleSkip();
      return;
    }
    this.setData({ loggingIn: true });
    try {
      // 授权登录落库（phone）；资料完善（昵称/头像）后续版本再设计，MVP 不启用
      const user = await API.login({ phoneCode: e.detail.code });
      app.globalData.isLoggedIn = true;
      app.globalData.userInfo = user;
      wx.setStorageSync('token', 'logged-in');

      wx.showToast({ title: '登录成功', icon: 'success', duration: 1200 });
      setTimeout(() => this._goNext(), 1200);
    } catch (err) {
      console.error('登录失败', err);
      wx.showToast({ title: '登录失败，请重试', icon: 'none' });
    } finally {
      this.setData({ loggingIn: false });
    }
  },

  /** 暂不授权，直接进入 */
  handleSkip() {
    app.globalData.isLoggedIn = true;
    wx.setStorageSync('token', 'logged-in');
    this._goNext();
  },

  /** 跳转下一步 */
  _goNext() {
    // 统一进聊天页；摸底/日常由页面按 onboarding_state 自渲染
    wx.reLaunch({ url: '/pages/chat-main/chat-main' });
  },

  /** 打开协议 */
  handleAgreement(e) {
    const type = e.currentTarget.dataset.type;
    wx.showToast({ title: type + '（待配置）', icon: 'none' });
  }
});
