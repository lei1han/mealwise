// 目标管理页脚本
// 职责：加载当前目标（getGoal）与资料（getProfile），支持修改目标体重与减重速度并保存（updateGoal）。
const API = require('../../utils/api.js');
const nav = require('../../utils/nav.js');

// 减重速度档位：value 传给后端，label 用于展示，kgPerWeek 用于估算周期，desc 为说明文案
const SPEEDS = [
  { value: 'fast', label: '快', kgPerWeek: 0.75, desc: '每周约 0.75kg · 难度高' },
  { value: 'medium', label: '中', kgPerWeek: 0.5, desc: '每周约 0.5kg · 推荐' },
  { value: 'slow', label: '慢', kgPerWeek: 0.25, desc: '每周约 0.25kg · 轻松稳定' }
];

const SPEED_LABEL = { fast: '快', medium: '中', slow: '慢' };

/** 数值钳制到 [min, max] */
function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

/** 把 'YYYY-MM-DD' 格式化为「2026年12月15日」 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const p = String(dateStr).split('-');
  if (p.length !== 3) return dateStr;
  return p[0] + '年' + parseInt(p[1], 10) + '月' + parseInt(p[2], 10) + '日';
}

/** 安全转数字显示：非法值回退为 '--' */
function fmt(v) {
  const n = Number(v);
  return isNaN(n) ? '--' : n.toFixed(1);
}

Page({
  data: {
    // 自定义导航栏尺寸（px，由共享工具注入）
    statusBarHeight: 20,
    navBarHeight: 44,
    menuPaddingRight: 96,

    // 减重速度档位与当前选中值
    speeds: SPEEDS,
    speed: 'medium',

    // 当前目标卡（回显）
    targetWeightText: '--',
    currentWeightText: '',
    toLoseText: '',
    estimatedDateText: '',
    speedText: '',
    weeksText: '',
    progress: 0,

    // 目标体重输入值
    targetWeightInput: '',

    // 建议范围（基于当前体重 -15%~-5%）
    rangeText: '',
    suggestionMin: 0,
    suggestionMax: 0,
    // iconfont 码位（见 assets/build_iconfont.py）
    icons: {
      chevronLeft: '\ue011'
    },

    loading: true
  },

  onLoad() {
    // 自定义导航栏：状态栏占位 + 胶囊对齐 + 右侧内容避让胶囊
    this.setData(nav.getNavInfo());
    this._loadData();
  },

  /** 并行拉取目标与资料，组装页面 */
  async _loadData() {
    wx.showLoading({ title: '加载中...' });
    try {
      const [goal, profile] = await Promise.all([
        API.getGoal().catch(() => ({})),
        API.getProfile().catch(() => ({}))
      ]);
      this._applyData(goal, profile);
    } catch (e) {
      wx.showToast({ title: '加载失败，请稍后重试', icon: 'none' });
    }
    wx.hideLoading();
  },

  /** 用目标与资料数据回填页面 */
  _applyData(goal, profile) {
    // 当前体重：优先 current_weight，回退 initial_weight
    let current = Number(profile.current_weight != null ? profile.current_weight : profile.initial_weight);
    if (isNaN(current)) current = Number(goal.start_weight);
    const target = Number(goal.target_weight);

    // 建议范围：当前体重 -15% ~ -5%，四舍五入保留 1 位小数
    let suggestionMin = Math.round((current * 0.85) * 10) / 10;
    let suggestionMax = Math.round((current * 0.95) * 10) / 10;
    if (!isFinite(suggestionMin) || suggestionMin <= 0) {
      suggestionMin = 50; // 无有效体重时的兜底范围
      suggestionMax = 60;
    }
    const rangeText = '建议 ' + suggestionMin + ' ~ ' + suggestionMax + ' kg';

    // 速度档位
    const speed = (goal.weekly_speed && SPEED_LABEL[goal.weekly_speed]) ? goal.weekly_speed : 'medium';
    const speedKg = (SPEEDS.find((s) => s.value === speed) || SPEEDS[1]).kgPerWeek;

    // 预估周期（周）与目标进度（从 start_weight 向 target_weight 的方向）
    let weeksText = '';
    let progress = 0;
    const start = Number(goal.start_weight);
    if (!isNaN(target) && target > 0 && !isNaN(current)) {
      weeksText = Math.max(1, Math.round((current - target) / speedKg));
      if (!isNaN(start) && start !== target) {
        progress = clamp(((start - current) / (start - target)) * 100, 0, 100);
      }
    }

    this.setData({
      targetWeightText: fmt(target),
      // 当前体重：有值才展示「当前 xx kg」
      currentWeightText: isNaN(current) ? '' : current.toFixed(1),
      // 还需减重：当前与目标均有值且目标更低时展示
      toLoseText: (!isNaN(current) && !isNaN(target) && current > target)
        ? (current - target).toFixed(1)
        : '',
      estimatedDateText: formatDate(goal.estimated_date),
      speedText: SPEED_LABEL[speed] || '中',
      weeksText: weeksText ? String(weeksText) : '',
      progress: Math.round(progress),
      speed,
      targetWeightInput: isNaN(target) ? '' : target.toFixed(1),
      rangeText,
      suggestionMin,
      suggestionMax,
      loading: false
    });
  },

  /** 输入目标体重（回显到数值展示） */
  onTargetInput(e) {
    this.setData({ targetWeightInput: e.detail.value });
  },

  /** 切换减重速度 */
  onSpeedSelect(e) {
    const value = e.currentTarget.dataset.value;
    if (value) this.setData({ speed: value });
  },

  /** 保存修改：校验目标体重合法且在建议范围，然后调用 updateGoal */
  onSave() {
    const input = String(this.data.targetWeightInput || '').trim();
    const num = Number(input);
    const { suggestionMin, suggestionMax } = this.data;

    if (!input || isNaN(num) || num <= 0) {
      wx.showToast({ title: '请输入有效的目标体重', icon: 'none' });
      return;
    }
    if (num < suggestionMin || num > suggestionMax) {
      wx.showToast({
        title: '目标体重建议在 ' + suggestionMin + '~' + suggestionMax + ' kg 之间',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({ title: '保存中...' });
    API.updateGoal({ target_weight: num, weekly_speed: this.data.speed })
      .then(() => {
        wx.hideLoading();
        wx.showToast({ title: '已保存', icon: 'success' });
        // 稍作停留让用户看到成功提示，再返回
        setTimeout(() => wx.navigateBack(), 600);
      })
      .catch(() => {
        wx.hideLoading();
        wx.showToast({ title: '保存失败，请重试', icon: 'none' });
      });
  },

  /** 返回上一页；失败（如无上一页）则兜底回聊天主页 */
  handleBack() {
    wx.navigateBack({
      fail: () => wx.reLaunch({ url: '/pages/chat-main/chat-main' })
    });
  }
});