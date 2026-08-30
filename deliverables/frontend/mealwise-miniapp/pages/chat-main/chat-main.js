const API = require('../../utils/api.js');
const nav = require('../../utils/nav.js');

Page({
  data: {
    messages: [],
    inputText: '',
    /** 自定义导航栏尺寸（px） */
    statusBarHeight: 20,
    navBarHeight: 44,
    menuPaddingRight: 96,
    coachTyping: false,
    /** 今日预算 */
    budget: null,
    /** 键盘高度 */
    keyboardHeight: 0,
    /** 聊天区底部 padding */
    inputBarHeight: 112,
    /** 是否显示催报卡片 */
    showReminder: false
  },

  onLoad() {
    // 自定义导航栏：状态栏占位 + 胶囊对齐 + 右侧操作避让胶囊
    this.setData(nav.getNavInfo());
    this._initChat();
    wx.onKeyboardHeightChange((res) => {
      this.setData({ keyboardHeight: res.height });
    });
  },

  onUnload() {
    wx.offKeyboardHeightChange();
  },

  async _initChat() {
    wx.showLoading({ title: '加载中...' });
    try {
      const [budget, history] = await Promise.all([
        API.getTodayBudget(),
        API.getHistory()
      ]);
      this.setData({
        budget,
        messages: history.messages.length > 0
          ? history.messages
          : this._getWelcomeMessages(budget)
      });
    } catch (e) {
      this.setData({
        messages: this._getWelcomeMessages(null)
      });
    }
    wx.hideLoading();
    this._scrollToBottom();
  },

  /** 欢迎消息 */
  _getWelcomeMessages(budget) {
    const msgs = [
      {
        role: 'coach',
        text: '早上好！今天也要加油，记住你的目标：55kg。',
        hasBudget: !!budget
      }
    ];
    if (budget) {
      msgs[0].budget = budget;
    }
    msgs.push({
      role: 'user',
      text: '今天早饭吃了两片全麦面包、一个鸡蛋、一杯牛奶'
    });

    msgs.push({
      role: 'coach',
      text: '这顿大概 350~420 大卡。蛋白质和碳水搭配挺好，牛奶补钙也到位。今天离预算还剩 1030 大卡，中午别吃太油。'
    });

    return msgs;
  },

  /** 输入 */
  handleInput(e) {
    this.setData({ inputText: e.detail.value });
  },

  /** 发送消息 */
  async handleSend() {
    const text = this.data.inputText.trim();
    if (!text || this.data.coachTyping) return;

    const messages = [...this.data.messages, { role: 'user', text }];
    this.setData({ messages, inputText: '', coachTyping: true });
    this._scrollToBottom();

    try {
      const reply = await API.sendMessage(text);
      messages.push({
        role: 'coach',
        text: reply.reply_text,
        budget: reply.budget_remaining_kcal
          ? { ...this.data.budget, remaining: reply.budget_remaining_kcal }
          : null
      });
      this.setData({ messages, coachTyping: false });
    } catch (e) {
      messages.push({
        role: 'coach',
        text: '收到！我先记下来，回头给你算。'
      });
      this.setData({ messages, coachTyping: false });
    }
    this._scrollToBottom();
  },

  /** 打开体质录入 */
  handleOpenWeight() {
    wx.navigateTo({ url: '/pages/sheet-weight/sheet-weight' });
  },

  /** 打开毒舌档位 */
  handleOpenSnark() {
    wx.navigateTo({ url: '/pages/sheet-snark/sheet-snark' });
  },

  /** 打开订阅 */
  handleOpenSubscribe() {
    wx.navigateTo({ url: '/pages/sheet-subscribe/sheet-subscribe' });
  },

  _scrollToBottom() {
    setTimeout(() => {
      this.setData({
        scrollToView: 'msg-' + (this.data.messages.length - 1)
      });
    }, 100);
  }
});