// 饮食详情页脚本
// 底部抽屉 Sheet：展示今日四餐记录（早餐/午餐/晚餐/加餐），按 tab 切换查看各餐明细
const API = require('../../utils/api.js');

const MEAL_KEYS = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_LABELS = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐' };

Page({
  data: {
    // 四餐 tab 数据：{ key, label }
    tabs: MEAL_KEYS.map((k) => ({ key: k, label: MEAL_LABELS[k] })),
    // 当前选中餐次 key
    activeKey: 'lunch',
    // 当前餐次展示对象：{ name, kcal, recorded, items }，kcal 为数值或 null
    currentMeal: null,
    // 加载中/异常标记
    loading: true,
    loadError: false,
    // iconfont 码位（见 assets/build_iconfont.py）
    icons: {
      close: '\ue016'
    }
  },

  onLoad(options) {
    // 支持 query 传 date，缺省取今日
    const date = (options && options.date) || '';
    this._loadDiet(date);
  },

  /** 拉取饮食数据并默认选中午餐 */
  async _loadDiet(date) {
    this.setData({ loading: true, loadError: false });
    try {
      const data = date ? await API.getDietDetail(date) : await API.getTodayMeals();
      const meals = (data && data.meals) || {};
      // 归一化每餐：未记录/缺失 → recorded=false, kcal=null, items=[]
      const normalized = {};
      MEAL_KEYS.forEach((k) => {
        const m = meals[k];
        normalized[k] = m && m.recorded
          ? {
              name: m.name || MEAL_LABELS[k],
              kcal: m.kcal != null ? m.kcal : null,
              recorded: true,
              items: (m.items || []).map((it) => ({
                name: it.name || '',
                amount: it.amount || '',
                kcal: it.kcal != null ? it.kcal : null
              }))
            }
          : {
              name: MEAL_LABELS[k],
              kcal: null,
              recorded: false,
              items: []
            };
      });

      // 全量四餐快照存实例，供切换 tab 使用
      this._allMeals = normalized;

      // 默认选中午餐；若午餐未记录则回退到第一个已记录的餐次，否则保持午餐
      let activeKey = 'lunch';
      const recordedKey = MEAL_KEYS.find((k) => normalized[k].recorded);
      if (!normalized.lunch.recorded) {
        activeKey = recordedKey || 'lunch';
      }

      this.setData({
        activeKey,
        currentMeal: normalized[activeKey],
        totalKcal: (data && data.total_kcal) || 0,
        loading: false
      });
    } catch (e) {
      this.setData({ loading: false, loadError: true });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  /** 切换餐次 tab */
  handleSwitchTab(e) {
    const key = e.currentTarget.dataset.key;
    if (key === this.data.activeKey) return;
    this.setData({ activeKey: key, currentMeal: this._allMeals[key] });
  },

  /** 添加食物（占位：后续迭代接真实添加） */
  handleAddFood() {
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },

  // 全量四餐快照（onLoad 加载后写入，供切换 tab 使用；非 data 展示字段）
  _allMeals: {},

  /** 关闭抽屉：返回上一页 */
  handleClose() {
    wx.navigateBack({
      fail: () => wx.reLaunch({ url: '/pages/chat-main/chat-main' })
    });
  }
});