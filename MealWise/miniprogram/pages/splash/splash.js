/**
 * 启动闪屏 → 未登录去授权页；已登录直接去聊天
 */
const app = getApp();
const AuthFlow = require('../../utils/auth-flow.js');

Page({
  data: {
    dots: [0, 1, 2]
  },

  onLoad() {
    wx.login({ success: () => console.log('wx.login success') });
    this._timer = setTimeout(() => this._navigateNext(), 1800);
  },

  onUnload() {
    if (this._timer) clearTimeout(this._timer);
  },

  _navigateNext() {
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.redirectTo({ url: '/pages/auth-login/auth-login' });
      return;
    }
    app.globalData.isLoggedIn = true;
    wx.reLaunch({ url: AuthFlow.CHAT_URL });
  }
});
