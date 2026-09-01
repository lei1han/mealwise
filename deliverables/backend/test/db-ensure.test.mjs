// db.ensure 验收：幂等建表检查——缺失集合自动创建、已存在保留、删表后自动重建，返回各集合状态与条数
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp, main } from '../src/index.js';
import { MemoryDB } from '../src/db/memory.js';
import { createLlm } from '../src/llm/client.js';
import { CLOUD_COLLECTIONS } from '../src/db/cloud.js';
import { DEFAULT_CONFIG_COLLECTION } from '../src/db/schema.js';

/** 假云端：基于 MemoryDB 附加 .cdb；createCollection 幂等（已存在抛错），支持 count/get/remove */
function ensureDb(seed = {}) {
  const mem = new MemoryDB();
  const stores = new Map();
  for (const [name, docs] of Object.entries(seed)) {
    stores.set(name, new Map(docs.map((d, i) => [String(i), { _id: String(i), ...d }])));
  }
  mem.cdb = {
    async createCollection(name) {
      if (stores.has(name)) throw new Error('collection already exists');
      stores.set(name, new Map());
    },
    collection(name) {
      const store = stores.get(name) ?? new Map();
      return {
        limit() { return this; },
        async get() { return { data: [...store.values()] }; },
        async count() { return { total: store.size }; },
        doc(id) { return { async remove() { store.delete(id); } }; },
      };
    },
  };
  return { db: mem, stores };
}

test('db.ensure：缺失集合自动创建，已存在保留并返回条数', async () => {
  const { db, stores } = ensureDb({ messages: [{ user_id: 'u1', content: 'hi' }] });
  const app = buildApp({ db, llm: createLlm({ service: 'mock' }) });
  const r = await main({ action: 'db.ensure' }, {}, app);
  assert.equal(r.code, 0);
  const names = r.data.collections.map((c) => c.collection);
  assert.equal(names.length, CLOUD_COLLECTIONS.length + 1);
  assert.ok(names.includes(DEFAULT_CONFIG_COLLECTION));

  const msg = r.data.collections.find((c) => c.collection === 'messages');
  assert.equal(msg.status, 'exists');
  assert.equal(msg.count, 1);
  const users = r.data.collections.find((c) => c.collection === 'users');
  assert.equal(users.status, 'created');
  assert.equal(users.count, 0);
  // 全部集合此刻均已存在
  for (const name of names) assert.ok(stores.has(name), `${name} 应已存在`);
});

test('db.ensure：删表后再次调用自动重建空表', async () => {
  const { db, stores } = ensureDb(); // 初始无任何集合
  const app = buildApp({ db, llm: createLlm({ service: 'mock' }) });
  const r = await main({ action: 'db.ensure' }, {}, app);
  assert.equal(r.code, 0);
  for (const name of CLOUD_COLLECTIONS) {
    const c = r.data.collections.find((x) => x.collection === name);
    assert.equal(c.status, 'created', `${name} 应被自动创建`);
    assert.equal(c.count, 0);
    assert.ok(stores.has(name));
  }
  assert.equal(stores.size, CLOUD_COLLECTIONS.length + 1, '含 app_config 共 8 个集合');
});

test('db.ensure：本地 MemoryDB（无 .cdb）拒绝', async () => {
  const app = buildApp({ db: new MemoryDB(), llm: createLlm({ service: 'mock' }) });
  const r = await main({ action: 'db.ensure' }, {}, app);
  assert.equal(r.code, 40001);
  assert.ok(r.message.includes('仅云端'));
});
