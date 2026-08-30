// 云数据库适配：与 MemoryDB 保持同接口（find/findOne/insert/upsert/remove/getById），
// 但把数据真正读写在微信云开发集合上，实现跨容器/跨会话持久化。
// 用途：云函数 api 的 chat.send / subscribe.report 等按 user_id 落库。
// 设计：请求内先 load() 将本用户的各集合载入内存工作集（同步接口供 ChatService/NudgeService 使用），
//       业务跑完后 commit() 按"新增/更新/删除"差分写回云端。
// 注：不 import wx-server-sdk（保持内核纯函数可本地测试）；构造时传入 cloud.database() 实例。
import { MemoryDB } from './memory.js';

export const CLOUD_COLLECTIONS = Object.freeze([
  'users',
  'memories',
  'weight_records',
  'diet_records',
  'messages',
  'subscribe_auth',
  'notify_log',
]);

export class CloudDB {
  constructor({ db, userId, collections = CLOUD_COLLECTIONS }) {
    this.cdb = db; // wx cloud.database()
    this.userId = userId;
    this.collections = collections;
    this._mem = new MemoryDB(); // 内存工作集（同步接口）
    this._snap = new Map(); // name -> Map(_id -> 云端原始 doc)
    this._loaded = new Set(); // `${name}:${_id}` 已存在于云端
  }

  // —— 同步接口（对齐 MemoryDB，供内核调用）——
  col(name) {
    return this._mem.col(name);
  }
  insert(name, doc) {
    return this._mem.insert(name, doc);
  }
  upsert(name, predicate, update) {
    return this._mem.upsert(name, predicate, update);
  }
  find(name, predicate) {
    return this._mem.find(name, predicate);
  }
  findOne(name, predicate) {
    return this._mem.findOne(name, predicate);
  }
  getById(name, id) {
    return this._mem.getById(name, id);
  }
  remove(name, predicate) {
    return this._mem.remove(name, predicate);
  }

  // —— 异步：载入本用户数据到工作集（每请求开头调用一次）——
  async load() {
    await this._ensureCollections();
    for (const name of this.collections) {
      const snap = new Map();
      let list = [];
      try {
        const res = await this.cdb.collection(name).where({ user_id: this.userId }).get();
        list = res.data ?? [];
      } catch (err) {
        // 集合尚不存在或查询失败：仅当明显「集合不存在」时静默，其余抛出
        if (!/NOT_EXIST|not exist|collection.*exist/i.test(String(err?.errMsg ?? err))) throw err;
        list = [];
      }
      for (const d of list) {
        const doc = { ...d };
        snap.set(d._id, doc);
        this._loaded.add(`${name}:${d._id}`);
        this._mem.insert(name, doc); // 保留云端 _id
      }
      this._snap.set(name, snap);
    }
  }

  async _ensureCollections() {
    for (const name of this.collections) {
      try {
        if (typeof this.cdb.createCollection === 'function') await this.cdb.createCollection(name);
      } catch {
        /* 已存在或 SDK 不支持 → 忽略 */
      }
    }
  }

  // —— 异步：差分写回云端（每请求结尾调用一次）——
  async commit() {
    for (const name of this.collections) {
      const snap = this._snap.get(name) ?? new Map();
      const cur = this._mem.col(name);
      const active = new Set();
      const colRef = this.cdb.collection(name);
      for (const doc of cur) {
        const key = `${name}:${doc._id}`;
        const payload = CloudDB._payload(doc);
        if (this._loaded.has(key)) {
          await colRef.doc(doc._id).set({ data: payload });
        } else {
          await colRef.add({ data: payload });
        }
        active.add(key);
      }
      for (const id of snap.keys()) {
        if (!active.has(`${name}:${id}`)) {
          await colRef.doc(id).remove();
        }
      }
    }
  }

  static _payload(doc) {
    const { _id, _openid, ...rest } = doc;
    return rest;
  }
}