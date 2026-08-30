const API = require('../../utils/api.js');

Page({
  data: {
    gender: 'female',
    ageGroup: '25-34',
    ageGroups: [
      { value: '18-24', label: '18-24' },
      { value: '25-34', label: '25-34' },
      { value: '35-44', label: '35-44' },
      { value: '45-54', label: '45-54' },
      { value: '55+', label: '55+' }
    ],
    weight: '',
    targetWeight: '',
    height: ''
  },

  onLoad(options) {
    // 加载已有资料
    API.getProfile().then((profile) => {
      this.setData({
        gender: profile.gender || 'female',
        ageGroup: profile.age_group || '25-34',
        weight: profile.initial_weight ? String(profile.initial_weight) : '',
        targetWeight: profile.target_weight ? String(profile.target_weight) : '',
        height: profile.height ? String(profile.height) : ''
      });
    });
  },

  handleGender(e) {
    this.setData({ gender: e.currentTarget.dataset.value });
  },

  handleAgeGroup(e) {
    this.setData({ ageGroup: e.currentTarget.dataset.value });
  },

  /** 输入框变更 */
  handleInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [field]: e.detail.value });
  },

  /** 保存 */
  async handleSave() {
    const weight = parseFloat(this.data.weight);
    const targetWeight = parseFloat(this.data.targetWeight);
    const height = parseFloat(this.data.height);

    if (!weight || !targetWeight || !height) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }
    if (weight <= 0 || targetWeight <= 0 || height <= 0) {
      wx.showToast({ title: '数值必须大于 0', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中...' });
    try {
      await API.updateProfile({
        gender: this.data.gender,
        age_group: this.data.ageGroup,
        initial_weight: weight,
        target_weight: targetWeight,
        height: height
      });
      wx.hideLoading();
      wx.showToast({ title: '已保存', icon: 'success', duration: 1000 });
      setTimeout(() => wx.navigateBack(), 1000);
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  handleCancel() {
    wx.navigateBack();
  }
});