# 三餐教练 · 云存储开通与头像上传指南

适用工程：[`MealWise/`](../)（环境 ID 见 `miniprogram/app.js` 的 `cloudEnv`，当前为 `cloud1-d6gmjs12rfd5c3925`）。

资料完善页会将用户头像上传到云存储目录 **`user-avatars/`**，得到 `cloud://` 开头的 **fileID**，再经 `auth.login` 写入 `users.avatar_url`。

---

## 1. 开通云存储

1. 打开 **微信开发者工具**，导入 `MealWise/` 工程并登录与小程序 AppID 一致的账号。
2. 顶部工具栏点击 **云开发**，进入云开发控制台（或在开发者工具内嵌面板操作）。
3. 左侧选择 **存储**。
4. 若首次使用，按提示 **开通云存储**（与当前云环境绑定，需与 `app.js` 里 `wx.cloud.init({ env })` 一致）。

开通后无需手动建目录：小程序调用 `wx.cloud.uploadFile` 时指定 `cloudPath: 'user-avatars/xxx.jpg'` 会自动创建前缀。

---

## 2. 配置安全规则（必做）

默认「仅创建者可读写」在部分环境下会导致 **`wx.cloud.uploadFile` 失败**。建议为 MVP 使用下列规则（可在控制台 **存储 → 权限设置 → 自定义安全规则** 中粘贴）。

### 2.1 推荐规则（登录用户可写、全员可读头像）

```json
{
  "read": true,
  "write": "auth != null"
}
```

含义：

- **read: true**：小程序内用 fileID 展示头像需可读（教练/用户头像均为 cloud fileID）。
- **write: auth != null**：已走云开发鉴权的用户（含 `wx.cloud.init` + 用户访问小程序）可上传；防止未鉴权匿名写。

### 2.2 更收紧（仅允许写 `user-avatars/` 前缀）

若控制台支持按路径配置，可只对头像目录放开写权限（语法以当前云开发文档为准；以下为常见写法示例）：

```json
{
  "read": true,
  "write": "auth != null && resource.path.matches('user-avatars/.*')"
}
```

若规则编辑器报错，先使用 **§2.1** 跑通 MVP，再迭代收紧。

### 2.3 修改后

- 规则保存后 **通常立即生效**，无需重新上传云函数。
- 在开发者工具 **清缓存 → 重新编译**，再在 **个人中心 → 去完善** 重试上传。

---

## 3. 验证上传是否成功

### 3.1 小程序侧

1. 进入 **聊天页 → 个人中心**（或从聊天入口进 profile）。
2. 若顶部出现 **「补充昵称和头像」** 横幅，点 **去完善**。
3. 选择微信头像、填写昵称 → **保存资料**。
4. 成功：提示「资料已保存」，个人中心横幅消失，头像显示正常。

失败常见提示：**「头像上传失败，请检查云存储权限」** → 回到 §2 检查规则与环境 ID。

### 3.2 控制台侧

1. 云开发 → **存储** → 文件列表。
2. 应出现 `user-avatars/` 下新文件（jpg/png 等）。
3. 云开发 → **数据库** → `users` 集合，对应用户 `avatar_url` 字段应为 `cloud://...` fileID。

### 3.3 开发者工具调试

打开 **调试器 → Console**，保存资料时若失败会打印 `avatar upload failed` 及 errMsg，可对照：

| errMsg 关键词 | 处理方向 |
|---------------|----------|
| `permission denied` / 权限 | 检查 §2 安全规则 |
| `env not found` | `app.js` 的 env 与控制台环境不一致 |
| `request:fail` | 网络或基础库版本；确认基础库 ≥ 2.2.3 |

---

## 4. 与云函数的关系

- 头像 **上传** 在 **小程序端** 完成（`miniprogram/utils/auth-flow.js` → `wx.cloud.uploadFile`）。
- 云函数 **`api`** 只接收已上传的 **fileID**（`auth.login` 的 `avatarUrl`），不在云函数内再传文件。
- 因此云函数环境变量 **不需要** 配置存储密钥；但云函数与存储须属于 **同一云环境**。

---

## 5. 费用与配额

- 云存储按容量与下行流量计费，MVP 头像体量很小，一般远低于免费额度。
- 可在云开发控制台 **统计分析** 中查看存储用量；异常增长时检查是否误传大图（当前未做压缩，后续可在上传前 `compressImage` 优化）。

---

## 6. 纯 Mock 联调（不上云）

若暂时不开通存储，可在 `miniprogram/utils/api.js` 中从 **`REAL_ACTIONS` 暂时移除 `'auth.login'`**，资料保存走 Mock，头像为本地临时路径（**重启后可能失效**，仅适合 UI 走查）。

正式联调与提审前，必须按本文完成 §1～§3。

---

## 7. 相关代码

| 文件 | 作用 |
|------|------|
| `miniprogram/utils/auth-flow.js` | `uploadAvatarToCloud` |
| `miniprogram/utils/api.js` | `completeLoginProfile` |
| `miniprogram/pages/auth-profile/` | 资料完善 UI |
| `cloudfunctions/api/src/services/user.js` | `auth.login` 写入 `avatar_url` |

更多登录策略见仓库 `docs/superpowers/specs/2026-08-28-xcoach-design.md`（若已合并 §2.2 登录动线修订）。
