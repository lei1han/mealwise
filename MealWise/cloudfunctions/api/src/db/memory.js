// 内存键值存储：本地/测试用内存态；亦作为 CloudDB 的内存工作集（集合见底部 COLLECTIONS）
export class MemoryDB {
  constructor() {
    this.colls = new Map();
  }

  col(name) {
    if (!this.colls.has(name)) this.colls.set(name, []);
    return this.colls.get(name);
  }

  _id() {
    let id = '';
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    for (let i = 0; i < 20; i++) id += chars.charAt(Math.floor(Math.random() * chars.length));
    return id;
  }

  insert(name, doc) {
    const rec = { _id: doc._id || this._id(), ...doc, created_at: doc.created_at || new Date().toISOString() };
    this.col(name).push(rec);
    return rec;
  }

  // 覆盖式更新匹配文档（去重用）
  upsert(name, predicate, update) {
    const arr = this.col(name);
    for (let i = 0; i < arr.length; i++) {
      if (predicate(arr[i])) {
        arr[i] = { ...arr[i], ...update };
        return arr[i];
      }
    }
    return this.insert(name, update);
  }

  find(name, predicate) {
    return this.col(name).filter(predicate);
  }

  findOne(name, predicate) {
    return this.col(name).find(predicate) ?? null;
  }

  // 按稳定 id 读（user/message 等有真实 _id 的场景）
  getById(name, id) {
    return this.findOne(name, (d) => d._id === id) ?? null;
  }

  remove(name, predicate) {
    const arr = this.col(name);
    const kept = [];
    let removed = 0;
    for (const d of arr) {
      if (predicate(d)) removed++;
      else kept.push(d);
    }
    this.colls.set(name, kept);
    return removed;
  }
}

export const COLLECTIONS = Object.freeze([
  'users',
  'memories',
  'weight_records',
  'diet_records',
  'messages',
  'subscribe_auth',
  'notify_log',
]);