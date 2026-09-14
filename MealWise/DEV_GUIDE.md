# 三餐教练 — 微信开发者工具导入与调试指南

适用于仓库根目录 **`MealWise/`**（非 `deliverables/frontend/mealwise-miniapp/` 快照）。

## 一、环境准备

1. 安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)（稳定版）。
2. 使用项目 AppID：`wxd6def00245936b4c`（或团队分配的同主体 AppID）。
3. 开通云开发，环境 ID 与 `miniprogram/app.js` 中一致：`cloud1-d6gmjs12rfd5c3925`。
4. `project.config.json` 已配置 `miniprogramRoot`: `miniprogram/`、`cloudfunctionRoot`: `cloudfunctions/`。

## 二、导入项目

| 字段 | 值 |
|------|-----|
| 目录 | 仓库内 **`MealWise/`**（含 `project.config.json` 的目录） |
| 后端服务 | 微信云开发 |

导入后：

1. **绑定云环境（A3 必做）**：左侧文件树 **右键 `cloudfunctions`**（云函数根目录，不是 `api`）→ **切换环境 / 选择上传目标环境** → 选 `cloud1-d6gmjs12rfd5c3925`。
2. **部署**：右键 `cloudfunctions/api` → **上传并部署（云端安装依赖）**。

### A3 报错：请在 cloudfunctionRoot 选择一个云环境

这是**开发者工具里云函数目录与云端环境的绑定**，与 `miniprogram/app.js` 里 `wx.cloud.init({ env })` 是两件事。未绑定时上传云函数、打开云开发常会报此错。

**标准修复**：按上面「导入项目」步骤 1–2 操作。

**若右键没有可选环境**：

| 现象 | 处理 |
|------|------|
| 环境列表为空 / 显示「无」 | 用管理员微信开 **云开发**；管理员需绑定手机号 |
| AppID 与云环境不匹配 | 确认导入的是本小程序 AppID，环境在该 AppID 下创建 |
| `cloudfunctions` 是普通文件夹图标 | 确认导入的是 `MealWise/` 并重载项目 |
| 换电脑或新克隆 | 重复绑定步骤；必要时 **工具 → 清缓存 → 全部清除** |

可选：复制 `project.private.config.json.example` 为 `project.private.config.json`（本机文件，已 gitignore），仍建议在界面对 `cloudfunctions` **右键确认一次环境**。

## 三、Mock 与真实接口

编辑 `miniprogram/utils/api.js`：

- **全 Mock**：`USE_MOCK = true` 且 `REAL_ACTIONS = []`
- **当前默认（联调）**：`USE_MOCK = true`，但 `REAL_ACTIONS` 含主要 action → 这些 action 仍走云函数
- **全真实**：`USE_MOCK = false`

清除缓存：工具 → 清除缓存 → 数据缓存（重置登录与本地态）。

内核单测：在 `cloudfunctions/api` 下执行 `npm test`。

## 四、推荐走查路径（模拟器）

### 1. 闪屏 → 授权

- 启动 `pages/splash`，自动进入 `auth-login`
- 完成授权后进入 **`chat-main`**（摸底与日常已合并，无独立 `chat-onboarding` 页）

### 2. 摸底与聊天

- 首帧可触发 `chat.send` + `text: '__start__'` 开场
- 若返回 `action: 'open_weight_sheet'`，自动弹出体质录入 Sheet → 保存走 `onboarding.profile.submit`
- 日常报餐、报体重、预算卡：同一 `chat-main` 页

### 3. Sheet 子流程

从聊天页进入：

- `sheet-snark` — 毒舌档位（落库 `snark_level`）
- `sheet-subscribe` — 订阅消息（**模板 ID 待配置**）
- `sheet-weight` / `sheet-diet-detail` — 录入与详情

### 4. 其它主页面

`stats-main`、`profile-main`、`target-setting`、`profile-edit` 等可在编译模式中指定启动页单独调试。

## 五、编译模式快捷表

| 场景 | 启动页 |
|------|--------|
| 闪屏 | `pages/splash/splash` |
| 授权 | `pages/auth-login/auth-login` |
| 聊天主流程 | `pages/chat-main/chat-main` |
| 统计 | `pages/stats-main/stats-main` |
| 个人中心 | `pages/profile-main/profile-main` |

## 六、常见问题

**模拟器白屏**：重新编译；确认 `app.json` 首项为 `pages/splash/splash`；看 Console 报错。

**云函数 400/500**：确认已部署 `api` 且已绑定云环境；请求体为 `{ action, payload }`；对照总计划契约 C。

**与旧 DEV_GUIDE 差异**：快照目录 `mealwise-miniapp` 含已废弃的 `chat-onboarding` 双页流程，请以本文件与 `MealWise/miniprogram/app.json` 为准。

更多契约与发布检查见仓库根目录 [README.md](../README.md)。
