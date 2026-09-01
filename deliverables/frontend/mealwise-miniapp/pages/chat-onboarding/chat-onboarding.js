const API = require('../../utils/api.js');
const nav = require('../../utils/nav.js');
const app = getApp();

Page({
  data: {
    messages: [],
    inputText: '',
    /** 发送按钮是否可用（WXML 表达式不支持函数调用，trim 判断放 JS 里） */
    canSend: false,
    /** 自定义导航栏尺寸（px） */
    statusBarHeight: 20,
    navBarHeight: 44,
    /** 当前对话步骤 */
    onboardingStep: 'greeting',
    /** 是否正在等待教练回复 */
    coachTyping: false,
    /** 是否显示快速回复 */
    showQuickReplies: false,
    quickReplies: [],
    /** 是否已完成摸底 */
    completed: false,
    /** 已收集的数据 */
    collected: {
      nickname: '',
      height: null,
      weight: null,
      targetWeight: null,
      history: ''
    },
    /** 键盘高度 */
    keyboardHeight: 0
  },

  onLoad() {
    // 自定义导航栏：状态栏占位 + 胶囊对齐
    this.setData(nav.getNavInfo());
    this._initChat();
    // 监听键盘高度
    wx.onKeyboardHeightChange((res) => {
      this.setData({ keyboardHeight: res.height });
    });
  },

  onUnload() {
    wx.offKeyboardHeightChange();
  },

  /** 初始化对话 */
  _initChat() {
    const flow = API.getOnboardingFlow();
    this.setData({
      messages: flow,
      coachTyping: false
    });
    this._scrollToBottom();
  },

  /** 输入框内容 */
  handleInput(e) {
    const value = e.detail.value;
    this.setData({ inputText: value, canSend: !!value.trim() });
  },

  /** 发送消息 */
  async handleSend() {
    const text = this.data.inputText.trim();
    if (!text || this.data.coachTyping) return;

    // 添加用户消息
    const messages = [...this.data.messages, { role: 'user', text }];
    this.setData({ messages, inputText: '', canSend: false, coachTyping: true });
    this._scrollToBottom();

    // 模拟延迟显示教练回复
    await this._delay(1200);

    // 根据当前步骤生成教练回复
    const next = this._getCoachReply(text);
    if (next) {
      messages.push(next);
      this.setData({
        messages,
        coachTyping: false,
        showQuickReplies: !!next.quickReplies,
        quickReplies: next.quickReplies || []
      });
    } else {
      // 摸底完成
      this.setData({ coachTyping: false, completed: true });
      this._finishOnboarding();
    }
    this._scrollToBottom();
  },

  /** 获取教练回复 */
  _getCoachReply(userInput) {
    const step = this.data.onboardingStep;

    if (step === 'greeting') {
      // 用户说了"好" → 问昵称
      this.setData({ onboardingStep: 'nickname' });
      return {
        role: 'coach',
        text: '怎么称呼你？',
        quickReplies: null
      };
    }

    if (step === 'nickname') {
      // 收集昵称 → 问身高体重
      this.data.collected.nickname = userInput;
      this.setData({ onboardingStep: 'height_weight' });
      return {
        role: 'coach',
        text: '身高、现在体重报一下，不许谎报。',
        quickReplies: null
      };
    }

    if (step === 'height_weight') {
      // 解析身高体重 → 问减肥史
      this._parseHeightWeight(userInput);
      this.setData({ onboardingStep: 'history' });
      return {
        role: 'coach',
        text: '减过几次？上次为什么放弃？',
        quickReplies: null
      };
    }

    if (step === 'history') {
      // 收集减肥史 → 问目标
      this.data.collected.history = userInput;
      this.setData({ onboardingStep: 'target' });
      return {
        role: 'coach',
        text: '了解。想减到多少？我给你算一个够得着的目标。',
        quickReplies: null
      };
    }

    if (step === 'target') {
      // 收集目标 → 定标确认
      this.data.collected.targetWeight = parseFloat(userInput) || 55;
      this.setData({ onboardingStep: 'calibrate' });
      return {
        role: 'coach',
        text: '从 ' + this.data.collected.weight + ' 到 ' + this.data.collected.targetWeight + '，按每周 0.5kg 算，大概 26 周。中间会有平台期，我帮你调整。先确认这个目标？',
        quickReplies: [
          { text: '确认目标', type: 'primary', action: 'confirm' },
          { text: '我想再快一点', type: 'secondary', action: 'faster' },
          { text: '有点长，能不能短点', type: 'secondary', action: 'shorter' }
        ]
      };
    }

    return null;
  },

  /** 解析身高体重 */
  _parseHeightWeight(input) {
    const nums = input.match(/[\d.]+/g);
    if (nums && nums.length >= 2) {
      this.data.collected.height = parseFloat(nums[0]);
      this.data.collected.weight = parseFloat(nums[1]);
    } else if (nums && nums.length === 1) {
      this.data.collected.weight = parseFloat(nums[0]);
    }
  },

  /** 快速回复 */
  async handleQuickReply(e) {
    const action = e.currentTarget.dataset.action;
    const text = e.currentTarget.dataset.text;

    const messages = [...this.data.messages, { role: 'user', text }];
    this.setData({ messages, showQuickReplies: false, coachTyping: true });
    this._scrollToBottom();

    await this._delay(1000);

    if (action === 'confirm') {
      messages.push({
        role: 'coach',
        text: '定了！从今天开始，目标 55kg。我先帮你把基础信息设一下，然后开始第一天的记录。'
      });
      this.setData({ messages, coachTyping: false, completed: true });
      this._scrollToBottom();
      this._finishOnboarding();
    } else {
      messages.push({
        role: 'coach',
        text: '那就按这个进度来，先试试看。中间觉得不合适随时跟我说。先确认目标？',
        quickReplies: [
          { text: '确认目标', type: 'primary', action: 'confirm' },
          { text: '再想想', type: 'secondary', action: 'think' }
        ]
      });
      this.setData({
        messages,
        coachTyping: false,
        showQuickReplies: true,
        quickReplies: messages[messages.length - 1].quickReplies
      });
    }
    this._scrollToBottom();
  },

  /** 完成摸底 */
  async _finishOnboarding() {
    await API.updateProfile({
      nickname: this.data.collected.nickname,
      height: this.data.collected.height,
      initial_weight: this.data.collected.weight,
      target_weight: this.data.collected.targetWeight,
      onboarding_completed: true
    });

    await API.setUserState('calibrating');
    app.globalData.userState = 'calibrating';

    // 弹窗引导体重录入
    setTimeout(() => {
      wx.navigateTo({ url: '/pages/sheet-weight/sheet-weight' });
    }, 1500);
  },

  /** 滚动到底部 */
  _scrollToBottom() {
    setTimeout(() => {
      wx.createSelectorQuery()
        .select('.chat-scroll')
        .boundingClientRect()
        .select('.chat-bottom')
        .boundingClientRect()
        .exec((res) => {
          if (res[0] && res[1]) {
            wx.pageScrollTo({
              scrollTop: res[1].bottom - res[0].height,
              duration: 300
            });
          }
        });
    }, 100);
  },

  _delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
});