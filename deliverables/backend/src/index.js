// 云函数接入层包装：本地内核 ChatService + 统一 envelope
// 部署到微信云开发时，将本文件作为云函数入口，event.action 分发；本地用 scripts/demo-chat.js 跑通同一条流水线。
import { MemoryDB } from './db/memory.js';
import { createLlm } from './llm/client.js';
import { ChatService } from './services/chat.js';
import { NudgeService } from './services/nudge.js';

export function buildApp({ db = new MemoryDB(), llm } = {}) {
  const nudge = new NudgeService({ db });
  return {
    db,
    chat: new ChatService({ db, llm: llm ?? createLlm({ service: 'mock' }) }),
    nudge,
  };
}

export async function main(event = {}, _ctx, app = buildApp()) {
  const { action = 'chat.send', userId, text, slot, dryRun } = event;

  try {
    switch (action) {
      case 'chat.send':
        return wrap(await app.chat.send({ userId, text }));
      case 'scheduler.nudge':
        return wrap(app.nudge.run({ slot, dryRun: dryRun ?? true }));
      case 'subscribe.report': {
        const { accepted } = event;
        if (!accepted) return wrap({ recorded: false });
        return wrap({ recorded: true, auth: app.nudge.authorize({ userId, templateKey: event.template_key }) });
      }
      default:
        return { code: 400, message: `unknown action: ${action}` };
    }
  } catch (err) {
    return { code: 500, message: err?.message ?? 'internal error' };
  }
}

function wrap(data) {
  return { code: 0, data };
}

export default { buildApp, MemoryDB, ChatService, NudgeService, createLlm };