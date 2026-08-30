/**
 * 自定义导航栏尺寸工具
 * 解决 navigationStyle: custom 下的顶部适配：
 * 状态栏（刘海屏 / 灵动岛）占位 + 与微信胶囊按钮等高对齐 + 右侧内容避让胶囊
 * 所有尺寸单位为 px，可直接用于内联 style
 */
let cached = null;

function getNavInfo() {
  if (cached) return cached;

  // 状态栏高度与窗口宽度
  let win = {};
  try {
    win = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
  } catch (e) {
    win = wx.getSystemInfoSync ? wx.getSystemInfoSync() : {};
  }
  const statusBarHeight = win.statusBarHeight || 20;
  const windowWidth = win.windowWidth || 375;

  // 导航内容区高度：与微信胶囊按钮等高对齐（胶囊上下边距对称）
  let navBarHeight = 44;
  // 右侧避让宽度：胶囊按钮（含其右边距）+ 8px 间距
  let menuPaddingRight = 96;
  try {
    const menu = wx.getMenuButtonBoundingClientRect
      ? wx.getMenuButtonBoundingClientRect()
      : null;
    if (menu && menu.height) {
      navBarHeight = (menu.top - statusBarHeight) * 2 + menu.height;
      menuPaddingRight = windowWidth - menu.left + 8;
    }
  } catch (e) {
    // 老版本基础库使用兜底值
  }

  cached = {
    statusBarHeight,
    navBarHeight,
    navTotalHeight: statusBarHeight + navBarHeight,
    menuPaddingRight,
    windowWidth
  };
  return cached;
}

module.exports = {
  getNavInfo
};
