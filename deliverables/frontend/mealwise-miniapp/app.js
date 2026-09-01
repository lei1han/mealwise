/**
 * 三餐教练 微信小程序
 * 纯对话减肥教练 MVP
 */
App({
  globalData: {
    // 用户状态: 'unstarted' | 'onboarding' | 'calibrating' | 'active'
    userState: 'unstarted',
    // 已登录标识
    isLoggedIn: false,
    // 用户信息
    userInfo: null,
    // 系统信息
    systemInfo: null
  },

  onLaunch() {
    // 获取系统信息（wx.getSystemInfo 已废弃，改用 wx.getWindowInfo）
    this.globalData.systemInfo = wx.getWindowInfo
      ? wx.getWindowInfo()
      : wx.getSystemInfoSync();

    // 检查登录状态
    const token = wx.getStorageSync('token');
    if (token) {
      this.globalData.isLoggedIn = true;
    }
  }
});