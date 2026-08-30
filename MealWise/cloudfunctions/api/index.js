const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

let kernel = null;
let app = null;

async function ensureApp() {
  if (!app) {
    kernel = await import('./src/index.js');
    app = kernel.buildApp();
  }
  return app;
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
  const currentApp = await ensureApp();
  const userId = resolveUserId();
  return kernel.main({ action, userId, ...payload }, context, currentApp);
};
