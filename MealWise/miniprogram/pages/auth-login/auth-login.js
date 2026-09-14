const app = getApp();
const API = require('../../utils/api.js');
const AuthFlow = require('../../utils/auth-flow.js');

Page({
  data: {
    loggingIn: false
  },

  onLoad() {
    if (app.globalData.isLoggedIn) {
      this._goNext(app.globalData.userInfo);
    }
  },

  /** 微信手机号授权登录：成功后按资料是否齐全跳转 */
  async handleLogin(e) {
    if (this.data.loggingIn) return;
    if (!(e.detail && e.detail.code)) {
      this.handleSkip();
      return;
    }
    this.setData({ loggingIn: true });
    try {
      const user = await API.login({ phoneCode: e.detail.code });
      app.globalData.isLoggedIn = true;
      app.globalData.userInfo = user;
      wx.setStorageSync('token', 'logged-in');

      wx.showToast({ title: '登录成功', icon: 'success', duration: 1000 });
      setTimeout(() => this._goNext(user), 1000);
    } catch (err) {
      console.error('登录失败', err);
      wx.showToast({ title: '登录失败，请重试', icon: 'none' });
    } finally {
      this.setData({ loggingIn: false });
    }
  },

  /** 暂不授权手机号：仍可先体验聊天，资料稍后在个人中心补 */
  handleSkip() {
    app.globalData.isLoggedIn = true;
    wx.setStorageSync('token', 'logged-in');
    this._goNext(app.globalData.userInfo);
  },

  _goNext(user) {
    AuthFlow.routeAfterAuth();
  },

  handleAgreement(e) {
    const type = e.currentTarget.dataset.type;
    wx.showToast({ title: type + '（待配置）', icon: 'none' });
  }
});
