const API = require('../../utils/api.js');

Page({
  data: {
    mode: 'full', // 'full' 摸底全量录入 / 'weight' 每日报体重（仅体重字段）
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
    const mode = options.mode === 'weight' ? 'weight' : 'full';
    this.setData({ mode });
    // 摸底全量：加载已有资料预填；报体重模式无需（身高/目标已定标）
    if (mode === 'full') {
      API.getProfile().then((profile) => {
        this.setData({
          gender: profile.gender || 'female',
          ageGroup: profile.age_group || '25-34',
          weight: profile.initial_weight ? String(profile.initial_weight) : '',
          targetWeight: profile.target_weight ? String(profile.target_weight) : '',
          height: profile.height ? String(profile.height) : ''
        });
      });
    }
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
    if (!weight || weight <= 0) {
      wx.showToast({ title: '请填写体重', icon: 'none' });
      return;
    }

    // 每日报体重：走聊天链路（后端抽取 weight_record + 产出教练回复）
    if (this.data.mode === 'weight') {
      wx.showLoading({ title: '上报中...' });
      try {
        const reply = await API.reportWeight(weight);
        // 落地待展示的教练回复：返回聊天页后由 chat-main 追加气泡
        wx.setStorageSync('pendingWeightReport', reply);
        wx.hideLoading();
        wx.showToast({ title: '已上报', icon: 'success', duration: 1000 });
        setTimeout(() => wx.navigateBack(), 800);
      } catch (e) {
        wx.hideLoading();
        wx.showToast({ title: '上报失败', icon: 'none' });
      }
      return;
    }

    // 摸底全量：校验身高/目标体重
    const targetWeight = parseFloat(this.data.targetWeight);
    const height = parseFloat(this.data.height);
    if (!targetWeight || !height) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }
    if (targetWeight <= 0 || height <= 0) {
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
      // 落地待发送的结构化体质信息：返回聊天页后由 chat-main 上报后端并产出下一轮对话
      wx.setStorageSync('pendingBodyInfo', {
        gender: this.data.gender,
        age_group: this.data.ageGroup,
        height: height,
        initial_weight: weight,
        target_weight: targetWeight
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