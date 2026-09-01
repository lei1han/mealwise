/**
 * 启动闪屏
 * 停留 1.5~2 秒后自动跳转授权登录页
 */
const app = getApp();

Page({
  data: {
    dots: [0, 1, 2]
  },

  onLoad() {
    // 静默调用 wx.login 获取 openid
    wx.login({
      success: () => {
        console.log('wx.login success');
      }
    });

    // 1.8 秒后跳转
    this._timer = setTimeout(() => {
      this._navigateNext();
    }, 1800);
  },

  onUnload() {
    if (this._timer) clearTimeout(this._timer);
  },

  /** 判断下一步跳转 */
  _navigateNext() {
    const token = wx.getStorageSync('token');
    if (token) {
      // 已授权 → 统一进聊天页；摸底/日常由页面按 onboarding_state 自渲染
      wx.reLaunch({ url: '/pages/chat-main/chat-main' });
    } else {
      wx.redirectTo({ url: '/pages/auth-login/auth-login' });
    }
  }
});