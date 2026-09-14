/**
 * 启动闪屏
 * 停留 1.5~2 秒后：未登录 → 授权页；已登录 → 资料完善或聊天
 */
const app = getApp();
const API = require('../../utils/api.js');
const AuthFlow = require('../../utils/auth-flow.js');

Page({
  data: {
    dots: [0, 1, 2]
  },

  onLoad() {
    wx.login({
      success: () => {
        console.log('wx.login success');
      }
    });

    this._timer = setTimeout(() => {
      this._navigateNext();
    }, 1800);
  },

  onUnload() {
    if (this._timer) clearTimeout(this._timer);
  },

  async _navigateNext() {
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.redirectTo({ url: '/pages/auth-login/auth-login' });
      return;
    }

    app.globalData.isLoggedIn = true;
    const cached = app.globalData.userInfo;
    if (cached && !AuthFlow.needsProfileCompletion(cached)) {
      wx.reLaunch({ url: AuthFlow.CHAT_URL });
      return;
    }

    const profile = await AuthFlow.fetchProfileForRouting(API);
    if (profile && !AuthFlow.needsProfileCompletion(profile)) {
      app.globalData.userInfo = profile;
      wx.reLaunch({ url: AuthFlow.CHAT_URL });
      return;
    }

    wx.reLaunch({ url: AuthFlow.PROFILE_SETUP_URL });
  }
});
