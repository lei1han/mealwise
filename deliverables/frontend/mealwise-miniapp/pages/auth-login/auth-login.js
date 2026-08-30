const app = getApp();

Page({
  data: {
    agreed: false
  },

  onLoad() {
    // 检查是否已登录
    if (app.globalData.isLoggedIn) {
      this._goNext();
    }
  },

  /** 微信授权登录 */
  handleLogin() {
    wx.getUserProfile({
      desc: '用于展示教练对你的称呼',
      success: (res) => {
        const userInfo = res.userInfo;
        app.globalData.isLoggedIn = true;
        app.globalData.userInfo = userInfo;
        wx.setStorageSync('token', 'mock-token-' + Date.now());

        wx.showToast({ title: '授权成功', icon: 'success', duration: 1200 });
        setTimeout(() => this._goNext(), 1200);
      },
      fail: () => {
        // 用户拒绝授权，仍然允许进入（降级）
        app.globalData.isLoggedIn = true;
        wx.setStorageSync('token', 'mock-token-anonymous-' + Date.now());
        this._goNext();
      }
    });
  },

  /** 暂不授权，直接进入 */
  handleSkip() {
    app.globalData.isLoggedIn = true;
    wx.setStorageSync('token', 'mock-token-skip-' + Date.now());
    this._goNext();
  },

  /** 跳转下一步 */
  _goNext() {
    const state = app.globalData.userState;
    if (state === 'active') {
      wx.reLaunch({ url: '/pages/chat-main/chat-main' });
    } else {
      wx.reLaunch({ url: '/pages/chat-onboarding/chat-onboarding' });
    }
  },

  /** 打开协议 */
  handleAgreement(e) {
    const type = e.currentTarget.dataset.type;
    wx.showToast({ title: type + '（待配置）', icon: 'none' });
  }
});