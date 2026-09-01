// 云数据库持久化回归：用「假云端存储」模拟 wx 云数据库集合读写，
// 验证 CloudDB 的 load→业务→commit 差分写回，能实现跨容器/跨会话可续。
//（不真实依赖 wx-server-sdk；部署到云上时同一代 CloudDB 走 wx-server-sdk 集合。）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/index.js';
import { CloudDB, CLOUD_COLLECTIONS } from '../src/db/cloud.js';
import { createLlm } from '../src/llm/client.js';
import { dailyBudget, bmr } from '../src/domain/onboarding.js';

// —— 假云端存储：与 wx-server-sdk 集合接口对齐 ——
// 简单匹配：等值 where
function matches(doc, where) {
  return Object.entries(where).every(([k, v]) => doc[k] === v);
}
// 用闭包绑定 store：返回与 wx-server-sdk 集合接口对齐的对象
function col(store) {
  return {
    where(filter) {
      return { get: async () => ({ data: [...store.values()].filter((d) => matches(d, filter)) }) };
    },
    add: async ({ data }) => {
      const id = Math.random().toString(36).slice(2, 12);
      store.set(id, { _id: id, ...data });
      return { _id: id };
    },
    doc(id) {
      return {
        set: async ({ data }) => {
          if (!store.has(id)) throw new Error(`doc ${id} not found`);
          store.set(id, { ...store.get(id), ...data });
        },
        remove: async () => {
          store.delete(id);
        },
      };
    },
  };
}

class FakeCloud {
  constructor() {
    this.colls = new Map(); // name -> Map(_id -> doc)
    for (const n of CLOUD_COLLECTIONS) this.colls.set(n, new Map());
  }
  database() {
    return {
      createCollection: async () => {},
      collection: (name) => col(this.colls.get(name)),
    };
  }
  list(name) {
    return [...this.colls.get(name).values()];
  }
}

function makeCloudDB(cloud, userId) {
  return new CloudDB({ db: cloud.database(), userId });
}

test('M7·云持久化：两个容器实例跨会话可续（报餐 → 画像 → 连续累积）', async () => {
  const cloud = new FakeCloud();
  const uid = 'local_smoke';
  const llm = createLlm({ service: 'mock' });

  // 容器 1：冷启动，首次报餐 + 画像
  const d1 = makeCloudDB(cloud, uid);
  await d1.load();
  const app1 = buildApp({ db: d1, llm });
  let r = await app1.chat.send({ userId: uid, text: '中午吃了半拳米饭、一拳青菜、半拳鸡胸肉' });
  assert.equal(r.degraded, false);
  r = await app1.chat.send({ userId: uid, text: '你好，我身高165，女，30岁，想从63减到58' });
  assert.equal(r.degraded, false);
  await d1.commit();

  // 云端确实写入
  assert.equal(cloud.list('users').length, 1);
  assert.ok(cloud.list('diet_records').length >= 1);
  assert.ok(cloud.list('messages').length >= 4);

  // 容器 2：新实例（模拟冷容器），从云端读回，应看到容器 1 的用户画像
  const d2 = makeCloudDB(cloud, uid);
  await d2.load();
  const app2 = buildApp({ db: d2, llm });
  const u = d2.findOne('users', (x) => x.user_id === uid);
  assert.ok(u, '容器2 应读到容器1创建的 user');
  assert.equal(u.gender, 'female');
  assert.equal(u.height_cm, 165);

  // 容器 2 继续追加一轮餐，commit 后容器 3 应看到餐次累积（不清零）
  r = await app2.chat.send({ userId: uid, text: '晚餐吃了半拳鸡胸肉' });
  assert.equal(r.degraded, false);
  await d2.commit();

  const d3 = makeCloudDB(cloud, uid);
  await d3.load();
  const meals = d3.find('diet_records', (x) => x.user_id === uid).map((x) => x.meal).sort();
  assert.ok(meals.includes('lunch') && meals.includes('dinner'), `餐次跨容器累积：${meals.join(',')}`);
});

test('M4·预算一致性：Mifflin 定标确定性 + 1200/1500 下限钳制（mock 与真 LLM 共用同一 server 预算）', () => {
  // 服务端统一覆盖 budget_remaining_kcal = calcBudget，与 mock/真 LLM 无关，天然一致；
  // 此处锁定 Mifflin 公式与性别下限的确定性，防止后续改动漂移。
  // 女性 50kg/165cm/25-34：BMR=500+1031.25-147.5-161=1222.75 → 1223
  assert.equal(bmr({ weightKg: 50, heightCm: 165, ageGroup: '25-34', gender: 'female' }), 1223);
  // light(1.375) 缺口 500：round(1223*1.375-500)=1182 → 触发女性下限 1200
  assert.equal(dailyBudget({ weightKg: 50, heightCm: 165, ageGroup: '25-34', gender: 'female' }), 1200);

  // 女性体重较大时预算明显 > 1200，验证钳制只在低位生效（公式一致性）
  assert.ok(dailyBudget({ weightKg: 63, heightCm: 165, ageGroup: '25-34', gender: 'female' }) > 1200);

  // 男性 80kg/180cm/25-34：BMR=800+1125-147.5+5=1782.5 → 1783
  assert.equal(bmr({ weightKg: 80, heightCm: 180, ageGroup: '25-34', gender: 'male' }), 1783);
  assert.ok(dailyBudget({ weightKg: 80, heightCm: 180, ageGroup: '25-34', gender: 'male' }) >= 1500, 'male 应 ≥1500 下限');

  // 缺参数 → 不定标 null（与 budgetRemaining 的 null 口径一致）
  assert.equal(dailyBudget({ weightKg: null, heightCm: 165, ageGroup: '25-34', gender: 'female' }), null);
});
