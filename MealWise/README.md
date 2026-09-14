# 三餐教练（MealWise）小程序工程

微信小程序「三餐教练」的**唯一工程目录**（运行时代码单一事实来源）。前端页面 + 云函数在本地开发，通过微信开发者工具上传部署。

设计规格与契约见 [`docs/superpowers/README.md`](../docs/superpowers/README.md)；产品决策见 [`docs/superpowers/plans/2026-09-14-xcoach-product-decisions.md`](../docs/superpowers/plans/2026-09-14-xcoach-product-decisions.md)。

## 目录结构

```
MealWise/
├── miniprogram/
│   ├── pages/            # splash、auth-login、chat-main、stats/profile 系列、sheet-* 等（见 app.json）
│   ├── utils/
│   │   ├── api.js        # Mock / 云函数统一入口（USE_MOCK + REAL_ACTIONS 白名单）
│   │   ├── mock.js
│   │   └── nav.js
│   ├── app.js            # 云开发 env: cloud1-d6gmjs12rfd5c3925
│   ├── app.json
│   └── app.wxss          # 设计令牌（鼠尾草绿；视觉 v4 选型挂起）
├── cloudfunctions/
│   └── api/              # 单云函数：index.js 适配层 + src/ ESM 内核
│       ├── config.json   # 超时等（定时督促触发器未配，M5 非 MVP）
│       └── test/         # node --test（32 项，与 deliverables/backend 同源）
├── project.config.json   # appid: wxd6def00245936b4c
└── uploadCloudFunction.sh
```

## 快速开始

1. 微信开发者工具导入**本目录**（AppID：`wxd6def00245936b4c`）。
2. 云开发环境：`cloud1-d6gmjs12rfd5c3925`（`app.js` 已初始化）。
3. 右键 `cloudfunctions/api` →「上传并部署：云端安装依赖」。
4. 模拟器编译；联调见下文 Mock 开关。

## Mock / 真实云函数

`miniprogram/utils/api.js`：

```js
const USE_MOCK = true;   // 全局开关（产品决策：待定，E2E 后再确认是否改为 false）
const REAL_ACTIONS = [    // 2026-08-31 起：所列 action 强制走真实云函数
  'auth.login',
  'user.state.get',
  'chat.send',
  'onboarding.profile.submit',
  'budget.today',
  'conversation.current',
  'conversation.history',
  'user.profile.get',
  'user.profile.update',
  'user.target.update',
  'subscribe.report',
  'app.config.get',
];
```

云函数内核 action（契约 C）：`auth.login`、`chat.send`、`onboarding.profile.submit`、`conversation.*`、`user.state.get`、`user.profile.*`、`user.target.update`、`budget.today`、`subscribe.report`、`scheduler.nudge`、`app.config.get`、`db.ensure` 等，详见总计划 §1.3。

> `src/package.json` 的 `{"type":"module"}` 为 ESM 内核在 CJS 入口下运行所必需，勿删。

## MVP 范围提醒（2026-09-14）

| 纳入 MVP | 移出 MVP（代码保留） |
|----------|----------------------|
| 对话、摸底、记忆落库、资料完善（昵称/头像，**待接入登录动线**） | 订阅消息真推送、云定时督促（M5） |

## 相关文档

- 设计规格：`docs/superpowers/specs/2026-08-28-xcoach-design.md`
- 总计划（契约）：`docs/superpowers/plans/2026-08-28-xcoach-master-plan.md`
- 部署阶段计划：`docs/superpowers/plans/2026-08-28-xcoach-dev-deploy-plan.md`
- 前端交付快照（**不再维护**）：`deliverables/frontend/mealwise-miniapp/`
