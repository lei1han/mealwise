/**
 * 登录后资料完善动线（设计规格 §2.2 / 决策 5B）
 */

const CHAT_URL = '/pages/chat-main/chat-main';
const PROFILE_SETUP_URL = '/pages/auth-profile/auth-profile';

/**
 * 是否仍缺 MVP 必填资料（昵称 + 头像）
 * @param {object} user 含 nickname、avatar_url（或 avatarUrl）
 */
function needsProfileCompletion(user) {
  if (!user) return true;
  const nickname = String(user.nickname || '').trim();
  const avatar = String(user.avatar_url || user.avatarUrl || '').trim();
  return !nickname || !avatar;
}

/**
 * 登录/闪屏后按资料是否齐全跳转
 */
function routeAfterAuth(user) {
  if (needsProfileCompletion(user)) {
    wx.reLaunch({ url: PROFILE_SETUP_URL });
  } else {
    wx.reLaunch({ url: CHAT_URL });
  }
}

/**
 * 将 chooseAvatar 临时路径上传云存储，返回 fileID（契约：avatar_url 存 cloud fileID）
 */
function uploadAvatarToCloud(tempFilePath) {
  const extMatch = tempFilePath && tempFilePath.match(/\.(\w+)(?:\?|$)/);
  const ext = (extMatch && extMatch[1]) || 'jpg';
  const cloudPath = `user-avatars/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  return new Promise((resolve, reject) => {
    wx.cloud.uploadFile({
      cloudPath,
      filePath: tempFilePath,
      success: (res) => resolve(res.fileID),
      fail: reject
    });
  });
}

/**
 * 拉取服务端资料并判断是否需要完善（闪屏续进用）
 */
async function fetchProfileForRouting(API) {
  try {
    const p = await API.getProfile();
    return {
      nickname: p.nickname,
      avatar_url: p.avatar_url || null
    };
  } catch (e) {
    return null;
  }
}

module.exports = {
  needsProfileCompletion,
  routeAfterAuth,
  uploadAvatarToCloud,
  fetchProfileForRouting,
  CHAT_URL,
  PROFILE_SETUP_URL
};
