const API = require('../../utils/api.js');

Page({
  data: {
    levels: [
      { value: 'gentle', label: '温柔', desc: '几乎不损，以鼓励为主', emoji: '😊' },
      { value: 'light', label: '轻损', desc: '吐槽一句 + 给台阶，损事不损人', emoji: '😏' },
      { value: 'spicy', label: '辛辣', desc: '损得更狠，但仍然有度', emoji: '😈' }
    ],
    selected: 'light'
  },

  onLoad(options) {
    if (options.selected) {
      this.setData({ selected: options.selected });
    }
  },

  handleSelect(e) {
    const value = e.currentTarget.dataset.value;
    this.setData({ selected: value });
  },

  async handleConfirm() {
    wx.showLoading({ title: '保存中...' });
    try {
      await API.updateProfile({ snark_level: this.data.selected });
      wx.hideLoading();
      wx.showToast({ title: '已保存', icon: 'success', duration: 1000 });

      const pages = getCurrentPages();
      const prevPage = pages[pages.length - 2];
      if (prevPage) {
        prevPage.setData({ snarkLevel: this.data.selected });
      }
      setTimeout(() => wx.navigateBack(), 1000);
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  }
});