const app = getApp();
const API = require('../../utils/api.js');
const AuthFlow = require('../../utils/auth-flow.js');

Page({
  data: {
    nickname: '',
    avatarTemp: '',
    submitting: false,
    fromProfile: false
  },

  _avatarTempPath: '',

  async onLoad(options) {
    const fromProfile = options.from === 'profile';
    this.setData({ fromProfile });

    try {
      const p = await API.getProfile();
      if (p && !AuthFlow.needsProfileCompletion(p) && !fromProfile) {
        wx.reLaunch({ url: AuthFlow.CHAT_URL });
        return;
      }
      if (p && p.nickname) {
        this.setData({ nickname: p.nickname });
      }
      if (p && p.avatar_url) {
        this.setData({ avatarTemp: p.avatar_url });
        this._avatarTempPath = p.avatar_url;
      }
    } catch (e) {
      console.warn('auth-profile preload', e);
    }
  },

  onChooseAvatar(e) {
    const path = e.detail && e.detail.avatarUrl;
    if (!path) return;
    this._avatarTempPath = path;
    this.setData({ avatarTemp: path });
  },

  onNicknameInput(e) {
    this.setData({ nickname: e.detail.value });
  },

  async onSubmit() {
    if (this.data.submitting) return;
    const nickname = String(this.data.nickname || '').trim();
    if (!nickname) {
      wx.showToast({ title: '请填写昵称', icon: 'none' });
      return;
    }
    if (nickname.length > 20) {
      wx.showToast({ title: '昵称不超过 20 字', icon: 'none' });
      return;
    }
    if (!this._avatarTempPath) {
      wx.showToast({ title: '请选择头像', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    try {
      const user = await API.completeLoginProfile({ nickname, avatarTempPath: this._avatarTempPath });
      app.globalData.userInfo = user;

      if (AuthFlow.needsProfileCompletion(user)) {
        wx.showToast({ title: '资料未保存完整，请重试', icon: 'none' });
        return;
      }

      wx.showToast({ title: '资料已保存', icon: 'success', duration: 900 });
      setTimeout(() => {
        if (this.data.fromProfile) {
          wx.navigateBack();
        } else {
          wx.reLaunch({ url: AuthFlow.CHAT_URL });
        }
      }, 900);
    } catch (err) {
      console.error('profile submit failed', err);
      wx.showToast({ title: (err && err.message) || '保存失败，请重试', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },

  onSkip() {
    if (this.data.fromProfile) {
      wx.navigateBack();
    } else {
      wx.reLaunch({ url: AuthFlow.CHAT_URL });
    }
  }
});
