// 体重趋势详情页脚本
// 结构：自定义导航栏 / 时间分段切换（周·月·全部）/ 大尺寸折线图(canvas 2d) / 统计行 / 记录列表 / 右下角浮动记录按钮
// 使用共享导航工具获取自定义导航栏尺寸（状态栏高度、导航栏高度、胶囊按钮避让宽度）
const nav = require('../../utils/nav.js');
const API = require('../../utils/api.js');

// canvas 运行时无法读取 CSS 变量 var(--xc-*)，先通过颜色探针读真值，读不到时使用兜底值。
// 页面 WXSS 部分的颜色一律使用 var(--xc-*)。
const FALLBACK_COLORS = {
  line: '#7CB89E',      // --xc-chart-line
  grid: '#DCE6E0',      // --xc-chart-grid
  accent: '#D4754A',    // --xc-state-accent
  axis: '#5E7066'       // --xc-muted-foreground
};

// 时间维度分段选项
const RANGES = [
  { key: '7d', label: '周' },
  { key: '30d', label: '月' },
  { key: 'all', label: '全部' }
];

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    menuPaddingRight: 96,

    // 当前时间维度
    range: '7d',
    // iconfont 码位（见 assets/build_iconfont.py）
    icons: {
      chevronLeft: '\ue011'
    },
    ranges: RANGES,

    // 体重历史（折线图数据，升序）
    history: [],

    // 统计行：最高 / 最低 / 平均 / 减重总量（展示用字符串）
    stats: { max: '--', min: '--', avg: '--', lost: '--' },

    // 记录列表（日期倒序，含与上一条的变化量）
    records: []
  },

  onLoad() {
    this.setData(nav.getNavInfo());
    this._load();
  },

  /** 加载当前时间维度的体重历史与统计摘要，并重绘折线图 */
  async _load() {
    const range = this.data.range;
    let history = [];
    let summary = {};
    try {
      const res = await Promise.all([
        API.getWeightHistory(range).catch(() => []),
        API.getStatsSummary().catch(() => ({}))
      ]);
      history = (res[0] || []).slice();
      summary = res[1] || {};
    } catch (e) {
      // 兜底：数据拿不到也不影响页面骨架
      history = [];
    }

    const stats = this._computeStats(history, summary);
    const records = this._buildRecords(history);

    this.setData({ history, stats, records }, () => {
      // 等 canvas 节点渲染完成后再绘制
      setTimeout(() => this._renderChart(), 0);
    });
  },

  /** 时间维度切换：周 / 月 / 全部 */
  onRangeChange(e) {
    const range = e.currentTarget.dataset.range;
    if (range === this.data.range) return;
    this.setData({ range }, () => this._load());
  },

  /** 计算统计：优先使用 summary，缺失时从当前 range 数据内自行计算 */
  _computeStats(history, summary) {
    const values = history.map((d) => Number(d.weight_kg)).filter((v) => !isNaN(v));
    const s = { max: '', min: '', avg: '', lost: '' };

    if (summary.max_weight != null) s.max = Number(summary.max_weight);
    else if (values.length) s.max = Math.max.apply(null, values);

    if (summary.min_weight != null) s.min = Number(summary.min_weight);
    else if (values.length) s.min = Math.min.apply(null, values);

    if (summary.avg_weight != null) s.avg = Number(summary.avg_weight);
    else if (values.length) s.avg = values.reduce((a, b) => a + b, 0) / values.length;

    // 减重总量：优先 summary 全局口径，否则按当前时段首尾体重差
    if (summary.weight_lost != null) s.lost = Number(summary.weight_lost);
    else if (values.length >= 2) s.lost = values[0] - values[values.length - 1];

    return {
      max: this._fmt(s.max),
      min: this._fmt(s.min),
      avg: this._fmt(s.avg),
      lost: this._fmt(s.lost)
    };
  },

  /** 构建日期倒序的记录列表，每条附带与上一条（时间更早）的变化量 */
  _buildRecords(history) {
    // 日期倒序：新->旧
    const arr = history.slice().sort((a, b) => (a.date < b.date ? 1 : -1));
    const records = [];
    for (let i = 0; i < arr.length; i++) {
      const item = { date: arr[i].date, weight_kg: arr[i].weight_kg };
      const w = Number(item.weight_kg);
      item.weight = Number(w.toFixed(1));
      item.dateLabel = this._dateLabel(item.date);
      const next = arr[i + 1]; // 时间更早的一条为"上一条"
      if (next) {
        const diff = w - Number(next.weight_kg); // 正为增、负为减
        item.changeText = `${diff >= 0 ? '↑' : '↓'} ${Math.abs(diff).toFixed(1)}`;
        item.changeClass = diff >= 0 ? 'change-up' : 'change-down';
      } else {
        item.changeText = '';
        item.changeClass = '';
      }
      records.push(item);
    }
    return records;
  },

  /** 把 'YYYY-MM-DD' 格式化为 'M月D日 周X' */
  _dateLabel(date) {
    const d = new Date(String(date) + 'T00:00:00');
    if (isNaN(d.getTime())) return String(date);
    const week = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
    return `${d.getMonth() + 1}月${d.getDate()}日 周${week}`;
  },

  /** 把 'YYYY-MM-DD' 格式化为 'M/D'（折线图 X 轴标签） */
  _shortDate(date) {
    const d = new Date(String(date) + 'T00:00:00');
    if (isNaN(d.getTime())) return String(date || '').slice(5);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  },

  /** 数值展示格式化：保留 1 位小数，无效值显示 '--' */
  _fmt(v) {
    if (v === '' || v == null || isNaN(v)) return '--';
    return Number(v).toFixed(1);
  },

  /** 把 WXML 颜色探针读出的 CSS 变量真值（rgb）转为对象，未读到用兜底 */
  _readChartColors() {
    return new Promise((resolve) => {
      const colors = { ...FALLBACK_COLORS };
      const query = wx.createSelectorQuery().in(this);
      query
        .select('#chart-colors-probe')
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

  /** 绘制体重折线图（canvas 2d），失败时静默降级，不抛未捕获异常 */
  async _renderChart() {
    const history = this.data.history;
    if (!history || history.length < 2) return;
    try {
      const colors = await this._readChartColors();
      const res = await new Promise((resolve, reject) => {
        wx.createSelectorQuery()
          .in(this)
          .select('#weightChart')
          .fields({ node: true, size: true })
          .exec((r) => (r && r[0] && r[0].node ? resolve(r[0]) : reject(new Error('no canvas node'))));
      });
      const canvas = res.node;
      const w = res.width;
      const h = res.height;
      const dpr = (wx.getWindowInfo ? wx.getWindowInfo().pixelRatio : 2) || 2;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);
      this._drawChart(ctx, w, h, history, colors);
    } catch (e) {
      // 降级：绘制失败也保持统计与列表可用，不白屏、不抛异常
    }
  },

  /** 将 #RRGGBB 或 rgb() 转为带透明度的 rgba 字符串 */
  _withAlpha(color, alpha) {
    if (typeof color === 'string' && color.indexOf('rgb') !== -1) {
      const m = color.match(/[\d.]+/g);
      if (m && m.length >= 3) {
        return `rgba(${m[0]}, ${m[1]}, ${m[2]}, ${alpha})`;
      }
    }
    const base = (FALLBACK_COLORS.line || '#7CB89E').replace('#', '');
    const r = parseInt(base.slice(0, 2), 16);
    const g = parseInt(base.slice(2, 4), 16);
    const b = parseInt(base.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  },

  /** 折线图绘制：坐标网格 + Y 轴刻度 + 渐变填充 + 主色折线 + 数据点 + 日期下标签 */
  _drawChart(ctx, w, h, data, colors) {
    if (!data || data.length < 2) return;

    const padTop = 16;
    const padRight = 14;
    const padBottom = 30;
    const padLeft = 34;
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

    // 坐标网格（横向虚线）+ Y 轴刻度标签
    ctx.font = '10px sans-serif';
    ctx.textBaseline = 'middle';
    for (let g = 0; g <= 3; g++) {
      const v = max - (g / 3) * (max - min);
      const y = padTop + (innerH * g) / 3;
      ctx.fillStyle = colors.axis;
      ctx.textAlign = 'right';
      ctx.fillText(v.toFixed(1), padLeft - 6, y);
      ctx.strokeStyle = colors.grid;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
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
    grad.addColorStop(0, this._withAlpha(colors.line, 0.14));
    grad.addColorStop(1, this._withAlpha(colors.line, 0));
    ctx.beginPath();
    ctx.moveTo(pts[0].x, padTop + innerH);
    pts.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.lineTo(pts[pts.length - 1].x, padTop + innerH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // 主色折线
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

    // 每个数据点标注小圆点
    ctx.fillStyle = colors.line;
    pts.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // 日期下标签：数据点少时全量显示，多时按间隔抽样避免重叠
    ctx.fillStyle = colors.axis;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    if (data.length <= 8) {
      pts.forEach((p, i) => ctx.fillText(this._shortDate(data[i].date), p.x, padTop + innerH + 6));
    } else {
      const step = Math.max(1, Math.floor(data.length / 6));
      pts.forEach((p, i) => {
        if (i % step === 0 || i === pts.length - 1) {
          ctx.fillText(this._shortDate(data[i].date), p.x, padTop + innerH + 6);
        }
      });
    }
  },

  /** 右下角浮动按钮：去记录体重上报 */
  handleRecordWeight() {
    wx.navigateTo({ url: '/pages/sheet-weight/sheet-weight?mode=weight' });
  },

  handleBack() {
    wx.navigateBack({
      fail: () => wx.reLaunch({ url: '/pages/chat-main/chat-main' })
    });
  }
});