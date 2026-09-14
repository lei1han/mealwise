# 三餐教练（MealWise）小程序工程

微信小程序「三餐教练」的**唯一工程目录**（单一事实来源）。前端与云函数均在此开发，通过微信开发者工具上传部署。

> 设计稿 HTML 原型与冻结快照见 `deliverables/frontend/`；**不要**再把 `mealwise-miniapp/` 当作主工程导入。

## 目录结构

```
MealWise/
├── miniprogram/              # 小程序前端
│   ├── pages/                # 见下方「页面清单」
│   └── utils/
│       ├── api.js            # Mock / 云函数统一入口（REAL_ACTIONS 灰度）
│       ├── mock.js
│       └── nav.js
├── cloudfunctions/
│   └── api/                  # 单云函数：index.js 适配层 + src/ 内核
│       ├── index.js
│       └── src/              # 与 deliverables/backend/src 同源设计，以本目录为准改代码
├── project.config.json       # appid: wxd6def00245936b4c
└── DEV_GUIDE.md              # 开发者工具导入与走查
```

## 页面清单（`app.json`）

| 页面 | 路径 | 说明 |
|------|------|------|
| 闪屏 | `pages/splash` | 启动 |
| 授权登录 | `pages/auth-login` | `auth.login` |
| 聊天主流程 | `pages/chat-main` | 摸底 + 日常合并单页，`chat.send` / `__start__` |
| 统计首页 | `pages/stats-main` | M2 可视化（工程已建页） |
| 个人中心 | `pages/profile-main` | |
| 体重详情 | `pages/stats-weight-detail` | |
| 目标设置 | `pages/target-setting` | |
| 资料编辑 | `pages/profile-edit` | |
| 体质录入 Sheet | `pages/sheet-weight` | `onboarding.profile.submit` |
| 毒舌档位 Sheet | `pages/sheet-snark` | `user.profile.update`（snark_level） |
| 订阅授权 Sheet | `pages/sheet-subscribe` | 模板 ID 待填 |
| 饮食详情 Sheet | `pages/sheet-diet-detail` | |

## 快速开始

1. 用微信开发者工具**导入本目录**（AppID：`wxd6def00245936b4c`）。
2. 云开发环境：`cloud1-d6gmjs12rfd5c3925`（`miniprogram/app.js` 已 `wx.cloud.init`）。
3. 右键 `cloudfunctions/api` →「上传并部署：云端安装依赖」。
4. 详细走查步骤见 [DEV_GUIDE.md](./DEV_GUIDE.md)。

## Mock / 真实云函数

`miniprogram/utils/api.js`：

```js
const USE_MOCK = true;   // false = 全局走云函数（白名单仍生效）
const REAL_ACTIONS = [ /* auth.login, chat.send, … 见源码 */ ];
```

- `useReal(action)`：当 `USE_MOCK === false` **或** action 在 `REAL_ACTIONS` 中时走 `wx.cloud.callFunction({ name: 'api', data: { action, payload } })`。
- 当前仓库默认 **`REAL_ACTIONS` 已列出契约 C 主要 action**；联调时可设 `USE_MOCK = false`，或清空/缩减白名单以回退 Mock。
- 云函数 envelope：`{ code: 0, data }` 成功；`40001` / `42901` / `50000` 等见总计划 §1.3 与后端计划 §5.3。

## 后端内核与测试

```bash
cd cloudfunctions/api
npm test    # 期望 32/32
```

Schema 冻结文件：`cloudfunctions/api/src/db/schema.js`。

## 相关文档

- 设计规格：`../docs/superpowers/specs/2026-08-28-xcoach-design.md`
- 实施总计划（契约）：`../docs/superpowers/plans/2026-08-28-xcoach-master-plan.md`
- 联调部署计划：`../docs/superpowers/plans/2026-08-28-xcoach-dev-deploy-plan.md`
- 仓库总览：`../README.md`
