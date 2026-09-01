// 记忆读写（对齐提示词 §8 去重契约 / 计划 §7）
// static 同语义更新、dynamic 按自然日覆盖、emotion 保留最近 EMOTION_KEEP 条
import { EMOTION_KEEP, MEMORY_TOKEN_BUDGET } from '../domain/constants.js';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}
function norm(s) {
  return String(s ?? '').replace(/\s+/g, '').trim();
}

export function dedupeKey(doc) {
  // static：category + content 归一化 视为同语义；dynamic：category + date；emotion：不入去重
  if (doc.category === 'dynamic') return `dynamic:${doc.date ?? todayKey()}`;
  if (doc.category === 'static') return `static:${norm(doc.content)}`;
  return null;
}

export class MemoryService {
  constructor(db) {
    this.db = db; // MemoryDB
  }

  // 写：按去重契约
  write(userId, points) {
    const now = new Date().toISOString();
    const date = todayKey();
    const written = [];
    for (const p of points) {
      const doc = { user_id: userId, category: p.category, content: p.content, source: 'chat_extract', created_at: now };
      const key = dedupeKey(doc);
      if (p.category === 'emotion') {
        this.db.insert('memories', doc);
        this._trimEmotion(userId);
        written.push(doc);
      } else if (key) {
        const existing = this.db.findOne('memories', (d) => d.user_id === userId && dedupeKey(d) === key);
        if (existing) {
          Object.assign(existing, { content: p.content, date, updated_at: now });
          written.push(existing);
        } else {
          doc.date = date;
          this.db.insert('memories', doc);
          written.push(doc);
        }
      } else {
        this.db.insert('memories', doc);
        written.push(doc);
      }
    }
    return written;
  }

  _trimEmotion(userId) {
    const emo = this.db
      .find('memories', (d) => d.user_id === userId && d.category === 'emotion')
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    for (const d of emo.slice(EMOTION_KEEP)) {
      this.db.remove('memories', (r) => r._id === d._id);
    }
  }

  // 读：组装已记录记忆（注入 token 预算内）
  readContext(userId) {
    const all = this.db.find('memories', (d) => d.user_id === userId);
    const staticList = all.filter((d) => d.category === 'static');
    const dynamicList = all.filter((d) => d.category === 'dynamic').sort((a, b) => (a.date < b.date ? -1 : 1));
    const emotionList = all
      .filter((d) => d.category === 'emotion')
      .sort((a, b) => (a.created_at < b.created_at ? -1 : 1))
      .slice(-5);

    const blocks = [
      ['静态记忆', staticList.slice(-8).map((d) => d.content).join('\n- ')],
      ['动态记忆', dynamicList.slice(-12).map((d) => d.content).join('\n- ')],
      ['情绪记忆', emotionList.map((d) => d.content).join('\n- ')],
    ];
    let out = [];
    let used = 0;
    for (const [label, body] of blocks) {
      if (!body) continue;
      if (used + body.length > MEMORY_TOKEN_BUDGET) break;
      out.push(`【${label}】\n- ${body}`);
      used += body.length;
    }
    return out.join('\n\n');
  }

  // 最近 days 天体重记录（按日期升序）
  latestWeightRecords(userId, days = 7) {
    const cutoff = new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);
    return this.db.find('weight_records', (r) => r.user_id === userId && r.date >= cutoff).sort((a, b) => (a.date < b.date ? -1 : 1));
  }
}