/**
 * 三餐教练 微信小程序
 * 纯对话减肥教练 MVP
 */
App({
  globalData: {
    // 云开发环境 ID
    cloudEnv: 'cloud1-d6gmjs12rfd5c3925',
    // 已登录标识
    isLoggedIn: false,
    // 用户信息
    userInfo: null,
    // 系统信息
    systemInfo: null
  },

  onLaunch() {
    // 云开发初始化
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: this.globalData.cloudEnv,
        traceUser: true
      });
    }

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
