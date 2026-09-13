const API = require('../../utils/api.js');
const nav = require('../../utils/nav.js');

Page({
  data: {
    messages: [],
    inputText: '',
    /** 发送按钮是否可用（WXML 表达式不支持函数调用，trim 判断放 JS 里） */
    canSend: false,
    coachTyping: false,
    /** 摸底状态机（后端主导）：new / profiling / active */
    onboardingState: 'new',
    /** 今日预算（active 后加载） */
    budget: null,
    /** 毒舌档位（gentle/light/spicy，来源：user.profile.get + 设置页提交回写） */
    snarkLevel: 'light',
    /** 键盘高度 */
    keyboardHeight: 0,
    /** 自定义导航栏尺寸（px） */
    statusBarHeight: 20,
    navBarHeight: 44,
    menuPaddingRight: 96,
    /** 是否显示催报卡片 */
    showReminder: false,
    /** 今日是否已报体重（user.state.get 返回） */
    reportedWeightToday: true,
    /** 订阅引导本会话只提示一次 */
    subscribeHintShown: false,
    /** 摸底"问体重"环节是否已自动弹出过体质录入 sheet */
    weightSheetTriggered: false,
    /** 输入锁定：摸底弹出体质录入期间禁止聊天输入 */
    inputLocked: false,
    /** 教练头像（来源：云端 app_config 公开配置 coach_avatar_url；空则回退「教」字占位） */
    coachAvatarUrl: '',
    /** 功能菜单是否展开 */
    menuOpen: false,
    /** 今日饮食概览是否收起 */
    mealOverviewCollapsed: false,
    /** 今日四餐概览（未记录 recorded=false，kcal 为 null） */
    todayMeals: {
      breakfast: { kcal: null, recorded: false },
      lunch: { kcal: null, recorded: false },
      dinner: { kcal: null, recorded: false },
      snack: { kcal: null, recorded: false }
    },
    /** 今日剩余热量 */
    todayRemainingKcal: 0,
    /** 今日预算总量 */
    todayBudgetTotal: 0,
    /** 进度条填充百分比（0-100） */
    progressRatio: 0,
    /** 进度条状态文案 */
    progressText: '今天还没记录',
    /** 毒舌档位中文标签（gentle/light/spicy） */
    snarkBadgeText: '轻损',
    /** iconfont 码位（见 assets/build_iconfont.py） */
    icons: {
      more: '\ue001',
      bell: '\ue002',
      chart: '\ue003',
      target: '\ue004',
      activity: '\ue005',
      user: '\ue006',
      chevronUp: '\ue007',
      chevronDown: '\ue008',
      grid: '\ue009',
      keyboard: '\ue00a',
      send: '\ue00b',
      close: '\ue016'
    }
  },

  onLoad() {
    // 自定义导航栏：状态栏占位 + 胶囊对齐 + 右侧操作避让胶囊
    this.setData(nav.getNavInfo());
    this._initChat();
    // 服务号进度条/饮食概览：读取今日四餐与预算
    this._loadTodayProgress();

    // 键盘高度监听：保存引用，onUnload 精准解除，避免个别基础库失效
    this._onKeyboardHeightChange = (res) => {
      // 键盘弹出时收起功能菜单，避免遮挡
      if (res.height > 0 && this.data.menuOpen) {
        this.setData({ menuOpen: false });
      }
      this.setData({ keyboardHeight: res.height });
    };
    wx.onKeyboardHeightChange(this._onKeyboardHeightChange);
  },

  onUnload() {
    if (this._onKeyboardHeightChange) {
      wx.offKeyboardHeightChange(this._onKeyboardHeightChange);
    }
  },

  /**
   * 页面显示/返回：
   * - 未保存直接返回（取消）：仅恢复输入状态
   * - 摸底体质录入保存后返回：把结构化体质信息上报后端，产出下一轮对话再解锁，
   *   保证"保存前不出现下一轮对话、保存后自动产出新对话"
   */
  onShow() {
    // 每日报体重完成返回：追加教练回复气泡并解锁
    const weightReport = wx.getStorageSync('pendingWeightReport');
    if (weightReport) {
      wx.removeStorageSync('pendingWeightReport');
      this._handleWeightReported(weightReport);
      return;
    }
    const pending = wx.getStorageSync('pendingBodyInfo');
    if (pending && pending.target_weight != null) {
      wx.removeStorageSync('pendingBodyInfo');
      this._handleBodyInfoSubmitted(pending);
    } else {
      this.setData({ inputLocked: false });
    }
    // 毒舌档位调整返回：主动追加教练确认消息
    const snarkChange = wx.getStorageSync('pendingSnarkChange');
    if (snarkChange && snarkChange.snark_level) {
      wx.removeStorageSync('pendingSnarkChange');
      this._handleSnarkChanged(snarkChange.snark_level);
    }
  },

  /** 每日报体重完成（active 用户）：追加教练回复（挂预算卡）、收起催报卡、标记今日已报 */
  _handleWeightReported(reply) {
    // 预算卡：active 且本轮有剩余预算单值时挂到教练消息上（与 handleSend 规则 4 一致）
    let msgBudget = null;
    if (this.data.budget && reply.budget_remaining_kcal != null) {
      // 以最新剩余反推已消耗，使"已消耗/进度条"随对话推进实时更新；total 为 0 时避免 Infinity%，并钳制 [0, 100]
      const total = Number(this.data.budget.total) || 0;
      const remaining = Math.min(Math.max(Number(reply.budget_remaining_kcal) || 0, 0), total);
      const consumed = total > 0 ? total - remaining : 0;
      msgBudget = {
        ...this.data.budget,
        remaining,
        consumed,
        ratio: total > 0 ? consumed / total * 100 : 0
      };
      // 回写缓存，保证后续轮次卡片基于最新预算（_loadBudget 会话内只拉一次）
      this.setData({ budget: msgBudget });
    }
    const messages = [
      ...this.data.messages,
      { role: 'coach', text: reply.reply_text || '收到，记下了。', budget: msgBudget }
    ];
    this.setData({
      messages,
      showReminder: false,
      reportedWeightToday: true,
      inputLocked: false
    });
    this._scrollToBottom();
  },

  /** 上报体质信息并产出下一轮对话（由 onShow 在录制页保存返回后触发） */
  async _handleBodyInfoSubmitted(payload) {
    this.setData({ coachTyping: true });
    let reply;
    try {
      reply = await API.submitBodyInfo(payload);
    } catch (e) {
      this.setData({ inputLocked: false, coachTyping: false });
      return;
    }

    const nextState = reply.onboarding_state || this.data.onboardingState;
    const messages = [
      ...this.data.messages,
      { role: 'coach', text: reply.reply_text || '收到，先记下了。' }
    ];
    this.setData({
      messages,
      coachTyping: false,
      inputLocked: false,
      onboardingState: nextState
    });

    // 若因此进入 active：加载今日预算，并按规则展示催报卡（今日未报体重时）
    if (nextState === 'active') {
      if (!this.data.budget) this._loadBudget();
      if (!this.data.reportedWeightToday) this.setData({ showReminder: true });
    }
    this._scrollToBottom();
  },

  /** 毒舌档位调整完成（sheet-snark 返回）：主动追加教练确认消息（三档文案对齐提示词成品 §2） */
  _handleSnarkChanged(level) {
    const texts = {
      gentle: '行，温柔模式，我少损两句、多夸两句。',
      light: '轻损模式收到，损事不损人，放心聊。',
      spicy: '辛辣模式收到——行，那我可不客气了，破防了随时能调回来。'
    };
    const messages = [
      ...this.data.messages,
      { role: 'coach', text: texts[level] || texts.light }
    ];
    this.setData({ messages, snarkLevel: level });
    this._scrollToBottom();
  },

  /**
   * 首帧初始化：
   * 1. user.state.get 读 onboarding_state（状态机后端主导，前端不做本地判定）
   * 2. 拉历史；无历史时自动发 __start__ 触发摸底/回归开场
   */
  async _initChat() {
    wx.showLoading({ title: '加载中...' });
    try {
      const [stateRes, history, profileRes, appConfig] = await Promise.all([
        API.getUserState().catch(() => ({ onboarding_state: 'new' })),
        API.getHistory().catch(() => ({ messages: [] })),
        API.getProfile().catch(() => ({})),
        API.getAppConfig().catch(() => ({ coach_avatar_url: '' }))
      ]);

      // 用局部可变状态驱动全流程，避免 setData（异步更新 this.data）造成的同步读取偏差
      let onboardingState = stateRes.onboarding_state || 'new';
      const messages = (history && history.messages) || [];
      const reportedWeightToday = !!stateRes.reported_weight_today;
      this.setData({
        reportedWeightToday,
        snarkLevel: profileRes.snark_level || 'light',
        snarkBadgeText: this._snarkBadgeText(profileRes.snark_level || 'light'),
        coachAvatarUrl: (appConfig && appConfig.coach_avatar_url) || ''
      });

      if (messages.length > 0) {
        this.setData({ messages, onboardingState });
        if (onboardingState === 'active') await this._loadBudget();
      } else {
        // 无历史：自动开场（new → 摸底开场白；active → 回归问候）
        this.setData({ onboardingState, coachTyping: true });
        const reply = await API.sendMessage('__start__');
        onboardingState = reply.onboarding_state || onboardingState;
        this.setData({
          messages: [{ role: 'coach', text: reply.reply_text }],
          coachTyping: false,
          onboardingState
        });
        // 真实链路：开场即带 open_weight_sheet 指令（new/profiling 缺身高体重时），锁输入并自动弹体质录入
        if (reply.action === 'open_weight_sheet' && !this.data.weightSheetTriggered) {
          this.setData({ weightSheetTriggered: true, inputLocked: true, canSend: false });
          setTimeout(() => this.handleOpenWeight(), 400);
        }
      }

      // 催报卡：active 且今日尚未报体重时展示（用局部变量判断，紧跟其后的 setData 不再不同步）
      if (onboardingState === 'active' && !reportedWeightToday) {
        this.setData({ showReminder: true });
      }
    } catch (e) {
      this.setData({
        messages: [{ role: 'coach', text: '网络开小差了，退出重进试试？' }]
      });
    }
    wx.hideLoading();
    this._scrollToBottom();
  },

  /** 加载今日预算（仅 active 后） */
  async _loadBudget() {
    if (this.data.budget) return this.data.budget;
    try {
      const budget = await API.getTodayBudget();
      this.setData({ budget });
      return budget;
    } catch (e) {
      return null;
    }
  },

  /** 输入 */
  handleInput(e) {
    const value = e.detail.value;
    this.setData({ inputText: value, canSend: !!value.trim() });
  },

  /** 发送消息 */
  async handleSend() {
    if (this.data.inputLocked) return;
    const text = this.data.inputText.trim();
    if (!text || this.data.coachTyping) return;

    const messages = [...this.data.messages, { role: 'user', text }];
    this.setData({ messages, inputText: '', canSend: false, coachTyping: true });
    this._scrollToBottom();

    let reply;
    try {
      reply = await API.sendMessage(text);
    } catch (e) {
      reply = {
        // 42901 限流：透传后端文案；其余异常走本地兜底
        reply_text: e && e.code === 42901 ? e.message : '收到！我先记下来，回头给你算。',
        budget_remaining_kcal: null,
        degraded: true
      };
    }

    // 状态机：以后端返回的 onboarding_state 为准
    const nextState = reply.onboarding_state || this.data.onboardingState;
    const becameActive = nextState === 'active' && this.data.onboardingState !== 'active';

    // 进入 active 首次加载预算
    let budget = this.data.budget;
    if (becameActive || (nextState === 'active' && !budget)) {
      budget = await this._loadBudget();
    }

    // 预算卡：active 且本轮有剩余预算单值时挂到教练消息上
    let msgBudget = null;
    if (nextState === 'active' && budget && reply.budget_remaining_kcal != null) {
      // 以最新剩余反推已消耗，使"已消耗/进度条"随对话推进实时更新；total 为 0 时避免 Infinity%，并钳制 [0, 100]
      const total = Number(budget.total) || 0;
      const remaining = Math.min(Math.max(Number(reply.budget_remaining_kcal) || 0, 0), total);
      const consumed = total > 0 ? total - remaining : 0;
      const ratio = total > 0 ? consumed / total * 100 : 0;
      msgBudget = {
        ...budget,
        remaining,
        consumed,
        ratio,
        // 进度条宽度直接拼成带 % 的字符串，避免 WXML 中 {{expr}}% 触发 IDE CSS 校验报错
        ratioWidth: ratio + '%'
      };
      // 回写缓存，保证后续轮次卡片基于最新预算（_loadBudget 会话内只拉一次）
      this.setData({ budget: msgBudget });
    }

    // 本轮报了体重：催报卡可收起（状态性关闭）
    if (reply.intent === 'weight_report') {
      this.setData({ showReminder: false, reportedWeightToday: true });
    }
    // 本轮新进入 active 且今日未报体重：按规则展示催报卡（补齐"中途定标"场景）
    if (becameActive && !this.data.reportedWeightToday && reply.intent !== 'weight_report') {
      this.setData({ showReminder: true });
    }

    messages.push({
      role: 'coach',
      text: reply.reply_text,
      budget: msgBudget
    });

    this.setData({ messages, coachTyping: false, onboardingState: nextState });

    // 摸底"问体重"环节：先锁住输入（未保存前不出下一轮对话），再自动弹出体质录入 sheet
    if (reply.action === 'open_weight_sheet' && !this.data.weightSheetTriggered) {
      this.setData({ weightSheetTriggered: true, inputLocked: true, canSend: false });
      // 稍等教练气泡渲染与滚动落位后再跳转，避免视觉跳变
      setTimeout(() => this.handleOpenWeight(), 400);
    }

    // 订阅额度提示（本会话一次，不打断对话）
    if (reply.subscribe_hint && !this.data.subscribeHintShown) {
      this.setData({ subscribeHintShown: true });
      wx.showToast({ title: '记得开通知，漏报我可要催了', icon: 'none', duration: 2000 });
    }

    this._scrollToBottom();
  },

  /** 打开体质录入（摸底用：全量字段） */
  handleOpenWeight() {
    wx.navigateTo({ url: '/pages/sheet-weight/sheet-weight?mode=full' });
  },

  /** 每日报体重（active 用户催报卡用：仅体重字段） */
  handleReportWeight() {
    wx.navigateTo({ url: '/pages/sheet-weight/sheet-weight?mode=weight' });
  },

  /** 打开订阅 */
  handleOpenSubscribe() {
    wx.navigateTo({ url: '/pages/sheet-subscribe/sheet-subscribe' });
  },

  /* ==========================================
     v3 服务号模式：进度条 / 饮食概览 / 功能菜单
     ========================================== */

  /** 毒舌档位中文标签 */
  _snarkBadgeText(level) {
    const map = { gentle: '温柔', light: '轻损', spicy: '辛辣' };
    return map[level] || '轻损';
  },

  /** 加载今日进度条与饮食概览数据 */
  async _loadTodayProgress() {
    try {
      const meals = await API.getTodayMeals();
      // 归一化四餐：未记录 → recorded=false, kcal=null
      const keys = ['breakfast', 'lunch', 'dinner', 'snack'];
      const todayMeals = {};
      keys.forEach((k) => {
        const m = meals && meals.meals && meals.meals[k];
        todayMeals[k] = m && m.recorded
          ? { kcal: m.kcal, recorded: true }
          : { kcal: null, recorded: false };
      });

      // 预算：优先用已加载的 budget，否则用 mock 默认预算与今日已录入之和
      let total = (this.data.budget && this.data.budget.total) || 1450;
      let consumed = (this.data.budget && this.data.budget.consumed != null)
        ? this.data.budget.consumed
        : (meals && meals.total_kcal) || 0;
      const remaining = Math.max(0, total - consumed);
      const ratio = total > 0 ? Math.min(100, Number(((consumed / total) * 100).toFixed(0))) : 0;

      // 状态文案
      const hasBreakfast = todayMeals.breakfast.recorded;
      const hasLunch = todayMeals.lunch.recorded;
      const hasDinner = todayMeals.dinner.recorded;
      let progressText = '今天还没记录';
      if (hasDinner) progressText = '一天的热量都记上了';
      else if (hasBreakfast && hasLunch) progressText = '晚餐前还有余量';
      else if (hasBreakfast || hasLunch) progressText = '状态不错，继续加油';
      else if (ratio >= 100) progressText = '今日额度已用完，注意别超标';

      this.setData({
        todayMeals,
        todayRemainingKcal: Math.round(remaining),
        todayBudgetTotal: total,
        progressRatio: ratio,
        progressText
      });
    } catch (e) {
      // 网络/数据异常：保留默认展示，不影响聊天
    }
  },

  /** 切换功能菜单展开/收起 */
  handleToggleMenu() {
    this.setData({ menuOpen: !this.data.menuOpen });
  },

  /** 跳转数据统计页 */
  handleNavStats() {
    this.setData({ menuOpen: false });
    wx.navigateTo({ url: '/pages/stats-main/stats-main' });
  },

  /** 跳转目标管理页 */
  handleNavTarget() {
    this.setData({ menuOpen: false });
    wx.navigateTo({ url: '/pages/target-setting/target-setting' });
  },

  /** 跳转身体数据（体重录入） */
  handleNavBodyData() {
    this.setData({ menuOpen: false });
    wx.navigateTo({ url: '/pages/sheet-weight/sheet-weight?mode=weight' });
  },

  /** 跳转个人中心页 */
  handleNavProfile() {
    this.setData({ menuOpen: false });
    wx.navigateTo({ url: '/pages/profile-main/profile-main' });
  },

  /** 折叠/展开饮食概览 */
  handleToggleMealOverview() {
    this.setData({ mealOverviewCollapsed: !this.data.mealOverviewCollapsed });
  },

  /** 打开饮食详情 Sheet */
  handleOpenDietDetail() {
    wx.navigateTo({ url: '/pages/sheet-diet-detail/sheet-diet-detail' });
  },

  /** 关闭催报卡片（本会话） */
  handleCloseReminder() {
    this.setData({ showReminder: false });
  },

  _scrollToBottom() {
    setTimeout(() => {
      this.setData({
        scrollToView: 'msg-' + (this.data.messages.length - 1)
      });
    }, 100);
  }
});
