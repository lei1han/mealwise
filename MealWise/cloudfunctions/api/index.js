const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

let kernel = null;

async function loadKernel() {
  if (!kernel) kernel = await import('./src/index.js');
  return kernel;
}

function resolveUserId() {
  try {
    const wxContext = cloud.getWXContext();
    return wxContext.OPENID || 'local_smoke';
  } catch (err) {
    return 'local_smoke';
  }
}

exports.main = async (event = {}, context = {}) => {
  const { action = 'chat.send', payload = {} } = event;
  const k = await loadKernel();
  const userId = resolveUserId();

  // auth.login：把 getPhoneNumber 返回的 code 换成手机号（云调用，失败静默 → phone=null，用户仍可登录）
  if (action === 'auth.login' && payload.phoneCode) {
    try {
      const res = await cloud.openapi.phonenumber.getPhoneNumber({ code: payload.phoneCode });
      payload.phone = (res && res.phoneInfo && res.phoneInfo.phoneNumber) || null;
    } catch (err) {
      console.warn('getPhoneNumber 换号失败', err && err.errMsg);
      payload.phone = null;
    }
  }

  // 每请求构建云数据库工作集：载入本用户数据 → 跑业务 → 差分写回，保证跨容器/跨会话持久化
  const { CloudDB } = await import('./src/db/cloud.js');
  const cdb = new CloudDB({ db: cloud.database(), userId });
  await cdb.load();
  const app = k.buildApp({ db: cdb });

  try {
    return await k.main({ action, userId, ...payload }, context, app);
  } finally {
    await cdb.commit();
  }
};