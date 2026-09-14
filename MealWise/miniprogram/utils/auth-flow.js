/**
 * 登录与资料完善（2026-09-14 决策 5B，2026-09-14 调整）
 * - 登录/闪屏后一律进聊天；昵称头像可选，在个人中心补
 * - needsProfileCompletion 仅用于个人中心提示条
 */

const CHAT_URL = '/pages/chat-main/chat-main';
const PROFILE_SETUP_URL = '/pages/auth-profile/auth-profile';

function needsProfileCompletion(user) {
  if (!user) return false;
  const nickname = String(user.nickname || '').trim();
  const avatar = String(user.avatar_url || user.avatarUrl || '').trim();
  return !nickname || !avatar;
}

/** 授权或续进后进入聊天（不拦截资料完善） */
function routeAfterAuth() {
  wx.reLaunch({ url: CHAT_URL });
}

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

module.exports = {
  needsProfileCompletion,
  routeAfterAuth,
  uploadAvatarToCloud,
  CHAT_URL,
  PROFILE_SETUP_URL
};
