// 会话读取服务（契约 C §5.2）：conversation.current 最近消息 / conversation.history cursor 分页
// cursor 语义：上一页最早一条的 created_at，向更早方向翻页；首页（cursor 为空）返回最新 limit 条（升序）。

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function pick(m) {
  return { role: m.role, content: m.content, created_at: m.created_at };
}

export class ConversationService {
  constructor({ db }) {
    this.db = db;
  }

  _messages(userId) {
    return this.db
      .find('messages', (m) => m.user_id === userId)
      .sort((a, b) => (a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0));
  }

  _normLimit(limit) {
    const n = Number(limit);
    if (!Number.isFinite(n) || n <= 0) return DEFAULT_LIMIT;
    return Math.min(Math.floor(n), MAX_LIMIT);
  }

  /** 最近消息（升序），供前端冷启动回显 */
  current({ userId, limit } = {}) {
    const k = this._normLimit(limit);
    const items = this._messages(userId).slice(-k).map(pick);
    return { items };
  }

  /** cursor 分页：首页返回最新 limit 条；next_cursor 指向下一页（更早），无更多为 null */
  history({ userId, cursor = null, limit } = {}) {
    const k = this._normLimit(limit);
    const all = this._messages(userId);
    const pool = cursor ? all.filter((m) => m.created_at < cursor) : all;
    if (pool.length === 0) return { items: [], next_cursor: null };
    const page = pool.slice(-k); // 升序，最新 limit 条
    const hasMore = pool.length > k;
    return {
      items: page.map(pick),
      next_cursor: hasMore ? page[0].created_at : null,
    };
  }
}
