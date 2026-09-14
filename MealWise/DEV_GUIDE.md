# MealWise 微信开发者工具调试指南

## 导入项目

1. **目录必须是仓库内的 `MealWise/`**（含 `project.config.json` 的那一层），不要导入仓库根目录或 `deliverables/frontend/mealwise-miniapp/`。
2. AppID：`wxd6def00245936b4c`（与 `project.config.json` 一致）。
3. `project.config.json` 已配置：
   - `miniprogramRoot`: `miniprogram/`
   - `cloudfunctionRoot`: `cloudfunctions/`

## A3 报错：请在 cloudfunctionRoot 选择一个云环境

这是**开发者工具里云函数目录与云端环境的绑定**，与 `miniprogram/app.js` 里 `wx.cloud.init({ env })` 是两件不同的事。未绑定时上传云函数、打开云开发常会报此错。

### 标准修复（按顺序做）

1. 确认已用**小程序管理员或已授权开发者**账号登录开发者工具。
2. 顶部菜单 **云开发** → 若未开通，先按指引开通；已开通应能看到环境列表。
3. 在左侧文件树找到 **`cloudfunctions` 文件夹**（图标应为云开发样式；若是普通文件夹，说明 `cloudfunctionRoot` 未生效 → 检查是否导入了 `MealWise/` 并重载项目）。
4. **右键 `cloudfunctions`**（云函数根目录，不是 `api` 子目录）：
   - 选 **「当前环境」** / **「切换环境」** / **「选择想要上传的目标环境」**（文案因工具版本略有不同）
   - 选中 **`cloud1-d6gmjs12rfd5c3925`**（与 `app.js` 的 `cloudEnv` 一致）
5. 再右键 **`cloudfunctions/api`** → **上传并部署：云端安装依赖**。

### 若右键没有可选环境

| 现象 | 处理 |
|------|------|
| 环境列表为空 / 显示「无」 | 用管理员微信扫 **云开发** 面板开通；管理员需绑定手机号（见开放社区常见提示） |
| AppID 与云环境不匹配 | 确认导入的是本小程序 AppID，且该环境是在此 AppID 下创建的 |
| 换过电脑或新克隆仓库 | 重复步骤 4；必要时 **工具 → 清缓存 → 全部清除** 后重开项目 |
| 仍失败 | 云开发控制台复制环境 ID，与 `cloud1-d6gmjs12rfd5c3925` 核对；不一致则改 `miniprogram/app.js` 的 `cloudEnv` 或新建对齐环境（需 Agent 改文档） |

### 可选：本地记录环境（不提交 Git）

部分工具版本会把环境写在 `project.private.config.json`（个人本地文件）。可复制示例：

```bash
cp project.private.config.json.example project.private.config.json
```

然后仍建议在文件树对 `cloudfunctions` **右键确认一次环境**，以工具界面为准。

## 云函数与 Mock

- 联调开关：`miniprogram/utils/api.js` 的 `USE_MOCK` / `REAL_ACTIONS`。
- 内核测试：在 `cloudfunctions/api` 下执行 `npm test`。
