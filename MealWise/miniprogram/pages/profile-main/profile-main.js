// 个人中心页脚本
// 职责：加载用户资料/统计摘要/连续打卡，渲染用户信息卡、三个圆形进度环与功能列表
const API = require('../../utils/api.js');
const nav = require('../../utils/nav.js');

/** 数值钳制到 [min, max] */
function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

Page({
  data: {
    // 自定义导航栏尺寸（px，由共享工具注入）
    statusBarHeight: 20,
    navBarHeight: 44,
    menuPaddingRight: 96,

    // 用户信息卡
    nickname: '未命名',
    avatarUrl: '',
    avatarInitial: '我',
    bio: '',

    // 毒舌档位（raw 用于跳转参数，text 用于展示）
    snarkRaw: 'light',
    snarkLevel: '轻损',

    // 三个圆形进度环（value/unit/label + 左右半环旋转角）
    rings: [],

    // 连续打卡
    streak: 0,
    streakText: '今天还没有打卡，别忘了报体重',

    // iconfont 码位（见 assets/build_iconfont.py）
    icons: {
      flame: '\ue00c',
      target: '\ue004',
      scale: '\ue00d',
      bell: '\ue002',
      info: '\ue00e',
      file: '\ue00f',
      chevronRight: '\ue010',
      chevronLeft: '\ue011'
    },

    loading: true
  },

  onLoad() {
    // 自定义导航栏：状态栏占位 + 胶囊对齐 + 右侧内容避让胶囊
    this.setData(nav.getNavInfo());
    this._loadAll();
  },

  /** 并行拉取资料、统计摘要、连续打卡 */
  async _loadAll() {
    wx.showLoading({ title: '加载中...' });
    try {
      const [profile, stats, streak] = await Promise.all([
        API.getProfile().catch(() => ({})),
        API.getStatsSummary().catch(() => ({})),
        API.getStreak().catch(() => ({}))
      ]);
      this._applyData(profile, stats, streak);
    } catch (e) {
      wx.showToast({ title: '加载失败，请稍后重试', icon: 'none' });
    }
    wx.hideLoading();
  },

  /** 组装页面数据（含进度环旋转角计算） */
  _applyData(profile, stats, streak) {
    const nickname = profile.nickname || '';
    const current = Number(stats.current_weight);
    const target = Number(stats.target_weight);
    const initial = Number(stats.initial_weight);

    // 目标进度：从 initial 向 target 完成的百分比（仅当两端都有值且不等时计算）
    let progress = 50;
    if (!isNaN(initial) && !isNaN(target) && initial !== target && !isNaN(current)) {
      progress = clamp(((initial - current) / (initial - target)) * 100, 0, 100);
    }

    const snarkMap = { gentle: '温柔', light: '轻损', spicy: '辛辣' };
    const snarkRaw = profile.snark_level || 'light';
    const curr = (streak && streak.current) || 0;

    this.setData({
      nickname: nickname || '未命名',
      avatarUrl: profile.avatar_url || '',
      avatarInitial: nickname ? nickname.charAt(0) : '我',
      bio: profile.bio || '',
      snarkRaw,
      snarkLevel: snarkMap[snarkRaw] || '轻损',
      rings: [
        this._makeRing('当前体重', this._num(current), 'kg', progress),
        this._makeRing('目标体重', this._num(target), 'kg', 100),
        this._makeRing('BMI', this._num(stats.bmi), '', this._bmiRatio(stats.bmi))
      ],
      streak: curr,
      streakText: curr > 0 ? '已连续打卡 ' + curr + ' 天，继续保持' : '今天还没打卡，别忘了报体重',
      loading: false
    });
  },

  /** 数值显示：非法值回退为 '--' */
  _num(v) {
    const n = Number(v);
    return isNaN(n) ? '--' : n;
  },

  /** BMI 进度比例：按距健康区间上限 24 的贴近度估算（经验值） */
  _bmiRatio(bmi) {
    const b = Number(bmi);
    if (isNaN(b) || b <= 0) return 50;
    return clamp(((24 - b) / (24 - 18.5)) * 100, 5, 100);
  },

  /**
   * 构造单个进度环：
   * 采用「左右双半环 + 旋转填充」实现（纯 CSS，无 canvas/svg）。
   * p 为 0-100 的百分比，拆成左右两段旋转角：
   * - 右半环负责 0~50%，右半填充从 0 转到 180°；
   * - 左半环负责 50~100%，左半填充从 180° 转到 360°。
   */
  _makeRing(label, value, unit, p) {
    p = clamp(p, 0, 100);
    const rightRot = Math.min(p, 50) * 3.6;
    const leftRot = 180 + Math.max(0, p - 50) * 3.6;
    return {
      label,
      value,
      unit,
      p: p.toFixed(0),
      rightRot: rightRot.toFixed(1),
      leftRot: leftRot.toFixed(1)
    };
  },

  /* ========== 导航动作 ========== */

  handleBack() {
    wx.navigateBack({
      fail: () => wx.reLaunch({ url: '/pages/chat-main/chat-main' })
    });
  },

  /** 编辑资料 */
  goEdit() {
    wx.navigateTo({ url: '/pages/profile-edit/profile-edit' });
  },

  /** 目标管理 */
  goTarget() {
    wx.navigateTo({ url: '/pages/target-setting/target-setting' });
  },

  /** 身体数据（体重录入） */
  goBodyData() {
    wx.navigateTo({ url: '/pages/sheet-weight/sheet-weight?mode=weight' });
  },

  /** 毒舌档位 */
  goSnark() {
    wx.navigateTo({ url: '/pages/sheet-snark/sheet-snark?selected=' + (this.data.snarkRaw || 'light') });
  },

  /** 通知设置 */
  goSubscribe() {
    wx.navigateTo({ url: '/pages/sheet-subscribe/sheet-subscribe' });
  },

  /** 关于我们（占位） */
  goAbout() {
    wx.showToast({ title: '敬请期待', icon: 'none' });
  },

  /** 用户协议（占位） */
  goAgreement() {
    wx.showToast({ title: '敬请期待', icon: 'none' });
  }
});