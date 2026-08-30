const API = require('../../utils/api.js');

Page({
  data: {
    features: [
      { text: '每天早上 8:00 提醒你报体重' },
      { text: '漏报时教练会催你，不发垃圾消息' },
      { text: '随时可关闭，安静不打扰' }
    ]
  },

  async handleSubscribe() {
    // 调用微信订阅消息授权
    wx.requestSubscribeMessage({
      tmplIds: [], // TODO: 填入订阅消息模板 ID
      success: async (res) => {
        wx.showLoading({ title: '保存中...' });
        try {
          await API.reportSubscribe(true);
          wx.hideLoading();
          wx.showToast({ title: '已开启通知', icon: 'success', duration: 1000 });
          setTimeout(() => wx.navigateBack(), 1000);
        } catch (e) {
          wx.hideLoading();
          wx.navigateBack();
        }
      },
      fail: async () => {
        await API.reportSubscribe(false);
        wx.navigateBack();
      }
    });
  },

  handleSkip() {
    wx.navigateBack();
  }
});