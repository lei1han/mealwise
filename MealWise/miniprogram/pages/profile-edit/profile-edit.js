// 编辑资料页脚本
// 职责：加载用户资料回显昵称/性别/身高/出生日期/头像，支持本地头像选择预览并保存。
// 使用共享导航工具获取自定义导航栏尺寸（状态栏高度、导航栏高度、胶囊按钮避让宽度）
const nav = require('../../utils/nav.js');
const API = require('../../utils/api.js');

Page({
  data: {
    // 自定义导航栏尺寸（px，由共享工具注入）
    statusBarHeight: 20,
    navBarHeight: 44,
    menuPaddingRight: 96,

    // 表单项回显值
    nickname: '',
    gender: 'female',
    height: '',
    birthdate: '',
    birthdateText: '', // 展示用日期（无则显示占位提示）
    maxDate: '', // 出生日期允许的最大值（今天）

    // 头像：avatarUrl 为服务端原有头像；avatarTemp 为本次本地选择的预览图（base64 或临时路径）
    avatarUrl: '',
    avatarTemp: '',
    avatarInitial: '我',
    // iconfont 码位（见 assets/build_iconfont.py）
    icons: {
      chevronLeft: '\ue011',
      chevronRight: '\ue010'
    }
  },

  onLoad() {
    // 自定义导航栏：状态栏占位 + 胶囊对齐 + 右侧内容避让胶囊
    this.setData(nav.getNavInfo());
    // 出生日期选择上限为今天（YYYY-MM-DD）
    this.setData({ maxDate: new Date().toISOString().slice(0, 10) });
    this._loadProfile();
  },

  /** 拉取用户资料并回显 */
  async _loadProfile() {
    wx.showLoading({ title: '加载中...' });
    try {
      const p = await API.getProfile();
      const nickname = p.nickname || '';
      this.setData({
        nickname,
        gender: p.gender || 'female',
        height: p.height ? String(p.height) : '',
        birthdate: p.birthdate || '',
        birthdateText: p.birthdate ? p.birthdate : '请选择出生日期',
        avatarUrl: p.avatar_url || '',
        avatarInitial: nickname ? nickname.charAt(0) : '我'
      });
    } catch (e) {
      wx.showToast({ title: '加载失败，请稍后重试', icon: 'none' });
    }
    wx.hideLoading();
  },

  /** 输入昵称 */
  onNicknameInput(e) {
    this.setData({ nickname: e.detail.value });
  },

  /** 选择性别（男/女 pill） */
  onGenderSelect(e) {
    const g = e.currentTarget.dataset.value; // 'male' | 'female'
    if (g) this.setData({ gender: g });
  },

  /** 输入身高 */
  onHeightInput(e) {
    this.setData({ height: e.detail.value });
  },

  /** 选择出生日期 */
  onBirthdateChange(e) {
    const date = e.detail.value;
    this.setData({ birthdate: date, birthdateText: date });
  },

  /**
   * 选择头像：wx.chooseMedia 选图后读取为 base64 做本地预览。
   * 本项目暂未接入云存储，头像变更仅本地展示；保存时把图片数据放进 avatar 字段一并提交，
   * 正式接入云存储后应改为：先把图片上传云存储拿到 fileID/URL，再保存该 URL。
   */
  onChooseAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: (res) => {
        const filePath = res.tempFiles && res.tempFiles[0] ? res.tempFiles[0].tempFilePath : '';
        if (!filePath) return;
        // 优先用文件系统读取转 base64 用于本地预览（便于脱离临时文件路径存活）
        wx.getFileSystemManager().readFile({
          filePath,
          encoding: 'base64',
          success: (fRes) => {
            this.setData({ avatarTemp: 'data:image/jpeg;base64,' + fRes.data });
            this._avatarChanged = true;
          },
          fail: () => {
            // 读取失败则回退：直接用临时路径预览
            this.setData({ avatarTemp: filePath });
            this._avatarChanged = true;
          }
        });
      }
    });
  },

  /** 保存修改：校验昵称与身高，然后调用 updateProfile */
  onSave() {
    const nickname = String(this.data.nickname || '').trim();
    const heightStr = String(this.data.height || '').trim();
    const height = Number(heightStr);

    // 昵称非空校验
    if (!nickname) {
      wx.showToast({ title: '昵称不能为空', icon: 'none' });
      return;
    }
    // 身高必须为 100-250 的合理数字
    if (!heightStr || isNaN(height) || height < 100 || height > 250) {
      wx.showToast({ title: '请输入有效身高（100-250cm）', icon: 'none' });
      return;
    }

    // 组装待更新字段
    const fields = {
      nickname,
      gender: this.data.gender,
      height: height,
      birthdate: this.data.birthdate
    };
    // 头像有变更则附带 avatar 字段（base64 或临时路径；接入云存储后替换为云文件 URL）
    if (this._avatarChanged && this.data.avatarTemp) {
      fields.avatar = this.data.avatarTemp;
    }

    wx.showLoading({ title: '保存中...' });
    API.updateProfile(fields)
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