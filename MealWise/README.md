# 三餐教练（MealWise）小程序工程

微信小程序「三餐教练」的唯一工程目录（单一事实来源）。前端页面 + 云函数均在本地开发，通过微信开发者工具上传部署。

## 目录结构

```
MealWise/
├── miniprogram/          # 小程序前端（6 个页面）
│   ├── pages/            # splash / auth-login / auth-profile / chat-main / …（见 app.json）
│   ├── utils/
│   │   ├── api.js
│   │   ├── auth-flow.js  # 登录后资料完善路由与头像上传
│   │   ├── mock.js
│   │   └── nav.js        # 自定义导航栏尺寸工具（状态栏/胶囊按钮适配）
│   ├── app.js            # 云开发初始化（env: cloud1-d6gmjs12rfd5c3925）
│   ├── app.json
│   └── app.wxss          # 设计令牌（鼠尾草绿主题）
├── cloudfunctions/
│   └── api/              # 唯一云函数：CJS 适配入口 + src/ 后端内核
│       ├── index.js      # wx-server-sdk 适配层（单例 app、OPENID 注入、payload 展开）
│       ├── package.json  # 依赖 wx-server-sdk ~2.4.0
│       └── src/          # 后端内核（零第三方依赖，与 deliverables/backend/src 同源）
├── project.config.json   # appid: wxd6def00245936b4c
├── uploadCloudFunction.sh
└── DEV_GUIDE.md          # 调试指南
```

## 快速开始

1. 用微信开发者工具导入本目录（AppID：`wxd6def00245936b4c`）。
2. 云开发环境：`cloud1-d6gmjs12rfd5c3925`（已在 `app.js` 中初始化）。
3. 右键 `cloudfunctions/api` →「上传并部署：云端安装依赖」。
4. 模拟器编译运行。登录：**手机号授权即可进聊天**；昵称/头像可选，在 **个人中心 → 去完善** 补充。

**头像云存储**：见 [`docs/cloud-storage-setup.md`](docs/cloud-storage-setup.md)。

## Mock / 真实云函数切换

`miniprogram/utils/api.js` 顶部：

```js
const USE_MOCK = true;        // 全局总开关
const REAL_ACTIONS = [];      // 白名单内的 action 无视总开关，强制走真实云函数
```

后端内核当前支持 3 个 action：`chat.send`、`subscribe.report`、`scheduler.nudge`（详见总计划 §1.3 契约 C）。

> 注：`src/package.json` 的 `{"type":"module"}` 标记是 ESM 内核在 CJS 云函数入口下运行的必要条件，勿删。

**头像上传**：资料完善页将头像上传至云存储 `user-avatars/`。**开通与安全规则**见 [`docs/cloud-storage-setup.md`](docs/cloud-storage-setup.md)。

## 相关文档

- 设计规格：`docs/superpowers/specs/2026-08-28-xcoach-design.md`
- 实施总计划（接口契约）：`docs/superpowers/plans/2026-08-28-xcoach-master-plan.md`
- 迁移计划：`.trae/documents/mealwise-cloud-migration-plan.md`
- 前端快照（已冻结，不再维护）：`deliverables/frontend/mealwise-miniapp/`
