// 全局配置（app_config）验收：app.config.get 公开配置、prompt.* 提示词覆盖、render 占位符、集合缺失兜底
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp, main } from '../src/index.js';
import { MemoryDB } from '../src/db/memory.js';
import { createLlm } from '../src/llm/client.js';
import { render } from '../src/services/config.js';

function freshApp() {
  return buildApp({ db: new MemoryDB(), llm: createLlm({ service: 'mock' }) });
}

function call(app, event) {
  return main(event, {}, app);
}

/** 假云端：基于 MemoryDB（提供 findOne/insert 等业务接口），附加 .cdb（对齐 CloudDB 暴露的原始 cloud.database()），app_config 返回预设行 */
function fakeDb(rows, { failGet = false } = {}) {
  const mem = new MemoryDB();
  mem.cdb = {
    async createCollection() {},
    collection() {
      return {
        async get() {
          if (failGet) {
            const err = new Error('collection not exist');
            err.errMsg = 'collection app_config not exist';
            throw err;
          }
          return { data: rows };
        },
      };
    },
  };
  return mem;
}

test('app.config.get：本地（无云端）返回默认公开配置', async () => {
  const app = freshApp();
  const r = await call(app, { action: 'app.config.get' });
  assert.equal(r.code, 0);
  assert.deepEqual(r.data, { coach_avatar_url: '' });
});

test('app.config.get：云端仅暴露 public=true 的行，prompt.* 内部键不泄露；prompt.opening 覆盖生效', async () => {
  const app = buildApp({
    db: fakeDb([
      { key: 'coach_avatar_url', value: 'https://x/a.png', public: true },
      { key: 'prompt.opening.new', value: '自定义开场', public: false },
    ]),
    llm: createLlm({ service: 'mock' }),
  });
  const r = await call(app, { action: 'app.config.get' });
  assert.equal(r.code, 0);
  assert.deepEqual(r.data, { coach_avatar_url: 'https://x/a.png' });

  // 同一请求实例：ready() 已加载，__start__ 开场白走配置覆盖
  const o = await app.chat.send({ userId: 'c1', text: '__start__' });
  assert.equal(o.reply_text, '自定义开场');
});

test('render：{name} 占位符替换，缺失变量兜底为「未知」', () => {
  assert.equal(render('身高 {height_cm}cm', { height_cm: 165 }), '身高 165cm');
  assert.equal(render('目标 {target_weight_kg}kg', {}), '目标 未知kg');
  assert.equal(render(null), null);
  assert.equal(render('阶段 {goal_stage}', { goal_stage: '执行' }), '阶段 执行');
});

test('app.config.get：集合不存在时兜底默认公开配置，不抛错', async () => {
  const app = buildApp({ db: fakeDb([], { failGet: true }), llm: createLlm({ service: 'mock' }) });
  const r = await call(app, { action: 'app.config.get' });
  assert.equal(r.code, 0);
  assert.deepEqual(r.data, { coach_avatar_url: '' });
});

test('prompt.chat.system 覆盖：chat.send 系统提示词走自定义模板并渲染占位符', async () => {
  const captured = [];
  const app = buildApp({
    db: fakeDb([{ key: 'prompt.chat.system', value: '自定义系统：{gender} / {snark_label}', public: false }]),
    llm: {
      async complete({ messages }) {
        captured.push(messages);
        return JSON.stringify({ reply_text: '收到。', intent: 'other', extracted: {}, budget_remaining_kcal: null });
      },
    },
  });
  await app.config.ready();
  await app.chat.send({ userId: 'c2', text: '中午吃了半拳鸡胸肉' });
  const system = captured[captured.length - 1][0].content;
  assert.ok(system.includes('自定义系统：未知 / 轻损'), `实际：${system}`);
});

test('prompt.nudge 覆盖：formatSlotTemplate 走配置模板；未配置回退默认模板', async () => {
  const app = buildApp({
    db: fakeDb([{ key: 'prompt.nudge.morning_greeting', value: '早安 {budget}', public: false }]),
    llm: createLlm({ service: 'mock' }),
  });
  await app.config.ready();
  assert.equal(app.nudge.formatSlotTemplate('morning_greeting', { __budget: 1450 }), '早安 1450');

  const app2 = freshApp();
  const msg = app2.nudge.formatSlotTemplate('morning_greeting', { __budget: 1450, __remaining: 800 });
  assert.ok(msg.includes('1450') && msg.includes('800'), `实际：${msg}`);
});
