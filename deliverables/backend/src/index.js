// 云函数接入层包装：本地内核 ChatService + 统一 envelope
// 部署到微信云开发时，将本文件作为云函数入口，event.action 分发；本地用 scripts/demo-chat.js 跑通同一条流水线。
import { MemoryDB } from './db/memory.js';
import { CLOUD_COLLECTIONS } from './db/cloud.js';
import { DEFAULT_CONFIG_COLLECTION } from './db/schema.js';
import { createLlm } from './llm/client.js';
import { ChatService } from './services/chat.js';
import { NudgeService } from './services/nudge.js';
import { ConversationService } from './services/conversation.js';
import { UserService } from './services/user.js';
import { ConfigService } from './services/config.js';

// LLM 服务按环境切换：显式指定 openai 或已配置 DEEPSEEK_API_KEY 时走真实 DeepSeek，否则回退 mock（便于本地/未配 key 时联调）
function resolveLlmService() {
  if (process.env.LLM_SERVICE === 'openai') return 'openai';
  if (process.env.DEEPSEEK_API_KEY) return 'openai';
  return 'mock';
}

export function buildApp({ db = new MemoryDB(), llm } = {}) {
  const config = new ConfigService({ db }); // 全局配置：公开配置 + 提示词覆盖（本地无云端时回退默认）
  const nudge = new NudgeService({ db, config });
  return {
    db,
    config,
    chat: new ChatService({ db, llm: llm ?? createLlm({ service: resolveLlmService() }), config }),
    nudge,
    conversation: new ConversationService({ db }),
    user: new UserService({ db }),
  };
}

// 错误码对齐契约 §5.3：40001 payload 校验失败 / 42901 限流 / 50000 内部错误
//（50010 LLM 解析降级维持 code=0 + degraded:true 语义）
const ERR = Object.freeze({
  BAD_PAYLOAD: 40001,
  RATE_LIMITED: 42901,
  INTERNAL: 50000,
});

// chat.send 限流：每用户每分钟 6 条（契约 §5.2；基于 messages 近 1 分钟计数，无额外存储）
const RATE_LIMIT_PER_MIN = 6;

function badPayload(message) {
  return { code: ERR.BAD_PAYLOAD, message };
}

function rateLimited(app, userId, now = new Date()) {
  const oneMinAgo = new Date(now.getTime() - 60 * 1000).toISOString();
  const recent = app.db.find(
    'messages',
    (m) => m.user_id === userId && m.role === 'user' && m.created_at > oneMinAgo
  );
  return recent.length >= RATE_LIMIT_PER_MIN;
}

export async function main(event = {}, _ctx, app = buildApp()) {
  const { action = 'chat.send', userId, text, slot, dryRun, limit, cursor, patch, fields, accepted } = event;
  const { target_weight_kg, target_estimate_weeks, template_key } = event;

  try {
    // 每请求加载一次全局配置（公开配置 + 提示词覆盖）；本地无云端时立即返回
    await app.config.ready();
    switch (action) {
      case 'chat.send': {
        if (text != null && typeof text !== 'string') return badPayload('chat.send: text must be a string');
        if (rateLimited(app, userId)) {
          return { code: ERR.RATE_LIMITED, message: '发送太频繁了，歇一分钟再来' };
        }
        return wrap(await app.chat.send({ userId, text }));
      }
      case 'conversation.current':
        return wrap(app.conversation.current({ userId, limit }));
      case 'conversation.history':
        return wrap(app.conversation.history({ userId, cursor, limit }));
      case 'user.state.get':
        return wrap(app.chat.getState(userId));
      case 'user.profile.get':
        return wrap(app.user.getProfile({ userId }));
      case 'user.profile.update': {
        if (patch != null && typeof patch !== 'object') return badPayload('user.profile.update: patch must be an object');
        return wrap(app.user.updateProfile({ userId, patch }));
      }
      case 'user.target.update': {
        if (target_weight_kg != null && !(Number.isFinite(Number(target_weight_kg)) && Number(target_weight_kg) > 0)) {
          return badPayload('user.target.update: target_weight_kg must be a positive number');
        }
        return wrap(app.user.updateTarget({ userId, target_weight_kg, target_estimate_weeks }));
      }
      case 'onboarding.profile.submit': {
        if (fields != null && typeof fields !== 'object') return badPayload('onboarding.profile.submit: fields must be an object');
        return wrap(app.chat.submitProfile({ userId, fields }));
      }
      case 'budget.today':
        return wrap(app.chat.todayBudget({ userId }));
      case 'app.config.get':
        return wrap(app.config.getPublic());
      case 'scheduler.nudge':
        return wrap(app.nudge.run({ slot, dryRun: dryRun ?? true }));
      case 'subscribe.report': {
        if (!accepted) return wrap({ recorded: false });
        return wrap({ recorded: true, auth: app.nudge.authorize({ userId, templateKey: template_key }) });
      }
      case 'db.ensure': {
        // 建表检查（幂等，可随时调用）：确保全部集合存在（含 app_config），返回各集合状态与条数。
        // 集合被删除后，任意一次 API 调用（含本 action）都会自动重建空表。
        // 注意：SDK 建表不建索引；正式环境需按 schema.js 在控制台重建索引。
        if (!app.db?.cdb) return badPayload('db.ensure 仅云端可用');
        const ensureTargets = [...CLOUD_COLLECTIONS, DEFAULT_CONFIG_COLLECTION];
        const collections = [];
        for (const name of ensureTargets) {
          let status = 'exists';
          try {
            await app.db.cdb.createCollection(name);
            status = 'created';
          } catch {
            /* 已存在 → status 保持 exists */
          }
          let count = null;
          try {
            count = (await app.db.cdb.collection(name).count()).total ?? 0;
          } catch {
            /* count 不可用 → 留 null */
          }
          collections.push({ collection: name, status, count });
        }
        return wrap({ collections });
      }
      default:
        return badPayload(`unknown action: ${action}`);
    }
  } catch (err) {
    return { code: ERR.INTERNAL, message: err?.message ?? 'internal error' };
  }
}

function wrap(data) {
  return { code: 0, data };
}

export { ONBOARDING_STATES } from './domain/constants.js';
export default { buildApp, MemoryDB, ChatService, NudgeService, ConversationService, UserService, createLlm };
