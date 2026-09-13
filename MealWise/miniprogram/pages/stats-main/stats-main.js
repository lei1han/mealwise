// 数据统计页（数据主页）脚本
// 概览卡片 / 连续打卡 / 体重趋势折线图 / 热量趋势柱状图 / 详情入口
// 使用共享导航工具获取自定义导航栏尺寸（状态栏高度、导航栏高度、胶囊按钮避让宽度）
const nav = require('../../utils/nav.js');
const API = require('../../utils/api.js');

// canvas 使用的兜底色值（设计 token 的取值）：canvas 2d 的 ctx 在运行时
// 无法读取 CSS var(--xc-*)，因此先尝试通过 computedStyle 读取真值，读不到时使用兜底。
// 页面 WXSS 部分的颜色一律使用 var(--xc-*)。
const FALLBACK_COLORS = {
  line: '#7CB89E',      // --xc-chart-line
  grid: '#DCE6E0',      // --xc-chart-grid（= --xc-border）
  accent: '#D4754A',    // --xc-state-accent
  axis: '#5E7066'       // --xc-muted-foreground
};

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    menuPaddingRight: 96,

    // 概览统计摘要
    summary: {},
    // 连续打卡
    streak: {},

    // 体重趋势
    weightRange: '7d',
    weightHistory: [],
    weightChartReady: false,
    weightChartColors: {},

    // 热量趋势
    calorieTrend: [],
    calorieChartReady: false,
    calorieChartColors: {},

    // iconfont 码位（见 assets/build_iconfont.py）
    icons: {
      chevronLeft: '\ue011',
      chevronRight: '\ue010'
    }
  },

  onLoad() {
    this.setData(nav.getNavInfo());
    this._loadAll();
  },

  /** 首次进入并行加载全部数据 */
  async _loadAll() {
    try {
      const [summary, streak] = await Promise.all([
        API.getStatsSummary().catch(() => ({})),
        API.getStreak().catch(() => ({}))
      ]);
      this.setData({ summary, streak });
    } catch (e) {
      // 兜底：数据拿不到也不影响页面骨架
    }
    this._loadWeightHistory(this.data.weightRange);
    this._loadCalorieTrend();
  },

  /** 加载体重历史并绘制折线图 */
  async _loadWeightHistory(range) {
    this.setData({ weightChartReady: false });
    let history = [];
    try {
      history = (await API.getWeightHistory(range)) || [];
    } catch (e) {
      history = [];
    }
    if (!history.length) {
      this.setData({ weightHistory: [], weightChartReady: false });
      return;
    }
    this.setData({ weightHistory: history }, () => {
      // 等 canvas 节点渲染后再绘制
      setTimeout(() => this._renderWeightChart(), 0);
    });
  },

  /** 加载近 7 天热量趋势并绘制柱状图 */
  async _loadCalorieTrend() {
    this.setData({ calorieChartReady: false });
    let trend = [];
    try {
      trend = (await API.getCalorieTrend(7)) || [];
    } catch (e) {
      trend = [];
    }
    if (!trend.length) {
      this.setData({ calorieTrend: [], calorieChartReady: false });
      return;
    }
    this.setData({ calorieTrend: trend }, () => {
      setTimeout(() => this._renderCalorieChart(), 0);
    });
  },

  /** 近7天/近30天 切换 */
  onRangeChange(e) {
    const range = e.currentTarget.dataset.range;
    if (range === this.data.weightRange) return;
    this.setData({ weightRange: range });
    this._loadWeightHistory(range);
  },

  /** 把 WXML 颜色探针读出的 CSS 变量真值（rgb）转为对象，未读到用兜底 */
  _readChartColors(probeId) {
    return new Promise((resolve) => {
      const colors = { ...FALLBACK_COLORS };
      const query = wx.createSelectorQuery().in(this);
      query
        .select(probeId)
        .fields({ computedStyle: ['color', 'backgroundColor', 'borderColor'] })
        .exec((res) => {
          const style = res && res[0];
          if (style) {
            if (style.color && style.color.indexOf('(') !== -1) colors.line = style.color;
            if (style.backgroundColor && style.backgroundColor.indexOf('(') !== -1) colors.grid = style.backgroundColor;
            if (style.borderColor && style.borderColor.indexOf('(') !== -1) colors.accent = style.borderColor;
          }
          resolve(colors);
        });
    });
  },

  /** 绘制体重折线图（canvas 2d） */
  async _renderWeightChart() {
    try {
      const colors = await this._readChartColors('#chart-colors-probe');
      this.setData({ weightChartColors: colors });

      const query = wx.createSelectorQuery().in(this);
      const res = await new Promise((resolve, reject) => {
        query
          .select('#weightChart')
          .fields({ node: true, size: true })
          .exec((r) => (r && r[0] && r[0].node ? resolve(r[0]) : reject(new Error('no node'))));
      });
      const canvas = res.node;
      const w = res.width;
      const h = res.height;
      const dpr = (wx.getWindowInfo ? wx.getWindowInfo().pixelRatio : 2) || 2;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      this._clearCanvas(ctx, w, h);
      this._drawWeightChart(ctx, w, h, this.data.weightHistory, colors);
      this.setData({ weightChartReady: true });
    } catch (e) {
      // 降级：绘制失败也不白屏，weightHistory 数值在有需要时仍可展示
      this.setData({ weightChartReady: false });
    }
  },

  /** 绘制热量柱状图（canvas 2d） */
  async _renderCalorieChart() {
    try {
      const colors = await this._readChartColors('#chart-colors-probe');
      this.setData({ calorieChartColors: colors });

      const query = wx.createSelectorQuery().in(this);
      const res = await new Promise((resolve, reject) => {
        query
          .select('#calorieChart')
          .fields({ node: true, size: true })
          .exec((r) => (r && r[0] && r[0].node ? resolve(r[0]) : reject(new Error('no node'))));
      });
      const canvas = res.node;
      const w = res.width;
      const h = res.height;
      const dpr = (wx.getWindowInfo ? wx.getWindowInfo().pixelRatio : 2) || 2;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      this._clearCanvas(ctx, w, h);
      this._drawCalorieChart(ctx, w, h, this.data.calorieTrend, colors);
      this.setData({ calorieChartReady: true });
    } catch (e) {
      this.setData({ calorieChartReady: false });
    }
  },

  /** 清空画布为透明 */
  _clearCanvas(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
  },

  /** 将 #RRGGBB 或 rgb() 转为带透明度的 rgba 字符串 */
  _withAlpha(color, alpha) {
    if (typeof color === 'string' && color.indexOf('rgb') !== -1) {
      const m = color.match(/[\d.]+/g);
      if (m && m.length >= 3) {
        return `rgba(${m[0]}, ${m[1]}, ${m[2]}, ${alpha})`;
      }
    }
    const fallback = this.FALLBACK_COLORS || FALLBACK_COLORS;
    const base = fallback.line || '#7CB89E';
    const hex = (base || '#7CB89E').replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  },

  /** 体重折线图绘制：坐标网格 + 目标/渐变填充 + 平滑折线 + 数据点 */
  _drawWeightChart(ctx, w, h, data, colors) {
    if (!data || data.length < 2) return;

    const padTop = 10;
    const padRight = 10;
    const padBottom = 18;
    const padLeft = 10;
    const innerW = w - padLeft - padRight;
    const innerH = h - padTop - padBottom;

    const values = data.map((d) => Number(d.weight_kg));
    let min = Math.min.apply(null, values);
    let max = Math.max.apply(null, values);
    if (max - min < 0.5) {
      const mid = (max + min) / 2;
      min = mid - 0.5;
      max = mid + 0.5;
    }
    // 上下留一点缓冲，避免曲线贴边
    const range = max - min;
    min -= range * 0.1;
    max += range * 0.1;

    const stepX = innerW / (values.length - 1);
    const toX = (i) => padLeft + stepX * i;
    const toY = (v) => padTop + innerH * ((max - v) / (max - min));

    // 坐标网格（横向虚线）
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    for (let g = 0; g <= 3; g++) {
      const y = padTop + (innerH * g) / 3;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(padLeft + innerW, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // 数据点坐标
    const pts = data.map((d, i) => ({ x: toX(i), y: toY(Number(d.weight_kg)) }));

    // 渐变填充（从折线到 X 轴）
    const grad = ctx.createLinearGradient(0, padTop, 0, padTop + innerH);
    grad.addColorStop(0, this._withAlpha(colors.line, 0.15));
    grad.addColorStop(1, this._withAlpha(colors.line, 0));
    ctx.beginPath();
    ctx.moveTo(pts[0].x, padTop + innerH);
    pts.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.lineTo(pts[pts.length - 1].x, padTop + innerH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // 折线
    ctx.strokeStyle = colors.line;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();

    // 数据点
    ctx.fillStyle = colors.line;
    pts.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  },

  /** 热量柱状图：每日摄入（强调色），叠加预算参考线（主色） */
  _drawCalorieChart(ctx, w, h, data, colors) {
    if (!data || !data.length) return;

    const padTop = 10;
    const padRight = 6;
    const padBottom = 18;
    const padLeft = 6;
    const innerW = w - padLeft - padRight;
    const innerH = h - padTop - padBottom;

    const intakes = data.map((d) => Number(d.intake) || 0);
    const budget = data[0] ? Number(data[0].budget) || 0 : 0;
    const max = Math.max(Math.max.apply(null, intakes), budget, 1) * 1.15;

    const n = data.length;
    const slotW = innerW / n;
    const barW = Math.min(slotW * 0.55, 18);

    // 预算参考线
    const budgetY = padTop + innerH * ((max - budget) / max);
    ctx.strokeStyle = colors.line;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(padLeft, budgetY);
    ctx.lineTo(padLeft + innerW, budgetY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 摄入柱状
    const avgIntake = intakes.reduce((s, v) => s + v, 0) / intakes.length;
    data.forEach((d, i) => {
      const value = Number(d.intake) || 0;
      const barH = (value / max) * innerH;
      const x = padLeft + slotW * i + (slotW - barW) / 2;
      const y = padTop + innerH - barH;
      // 高于预算的柱子用强调色更醒目，否则用主色
      ctx.fillStyle = value > budget ? colors.accent : colors.line;
      ctx.fillRect(x, y, barW, barH);
    });
  },

  /** 查看体重趋势详情 */
  goWeightDetail() {
    wx.navigateTo({ url: '/pages/stats-weight-detail/stats-weight-detail' });
  },

  handleBack() {
    wx.navigateBack({
      fail: () => wx.reLaunch({ url: '/pages/chat-main/chat-main' })
    });
  }
});