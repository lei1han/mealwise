# 三餐教练（原代号 X教练）微信开发者工具接入调试与部署计划

- 文档类型：分阶段执行计划（板块 1/3 落地联调）
- 版本：v2.0（对齐 `MealWise/` 工程现状）
- 日期：2026-08-28（阶段定义）；现状表更新 2026-09-14
- 依赖：总计划契约 A/B/C、运行工程 [`MealWise/`](../../../MealWise/)、调试指南 [`MealWise/DEV_GUIDE.md`](../../../MealWise/DEV_GUIDE.md)
- 协作对象：程序开发者（人工，操作微信开发者工具与公众平台）+ agent（负责代码/配置/文档）

> **v1.0 §1 待办表**描述的是 2026-08-28 接入前缺口；**当前完成情况见下表**。未勾选项为发布前仍需人工处理的事项。

---

## 0. 目标与边界

本计划承接总计划 §3「推进顺序」的最后一公里：把已冻结的契约 A/B/C 落到**可运行的微信小程序 + 微信云开发**。

- 目标：Mock 验收 → 云开发接入 → 真 LLM → 订阅消息 → 定时督促 → 提审上线。
- 边界：只做「开发/调试/部署」层面，不改动已冻结的接口契约；确需改动契约必须先回写总计划第 1 节。
- 前提：微信开发者工具已安装；导入目录为 **`MealWise/`**；AppID `wxd6def00245936b4c`；云环境 `cloud1-d6gmjs12rfd5c3925`。

## 1. 现状盘点（2026-09-14）

| # | 项 | v1.0 缺口 | 当前状态 |
|---|---|---|---|
| 1 | **action 对齐** | 后端仅 3 action | ✅ 契约 C 主要 action 已在 `MealWise/cloudfunctions/api/src/index.js` 实现；前端 `REAL_ACTIONS` 已放开 |
| 2 | **模块格式** | ESM vs CJS | ✅ `api/index.js` CJS 适配 + `src/` ESM（`package.json` `"type":"module"`） |
| 3 | **持久化** | 仅 MemoryDB | ✅ `src/db/cloud.js` 云库适配；本地测试仍用 MemoryDB |
| 4 | **cloudfunctionRoot** | 未配置 | ✅ `MealWise/project.config.json` 指向 `cloudfunctions/` |
| 5 | **云环境 ID** | 未 init | ✅ `miniprogram/app.js` 已 init |
| 6 | **template_key** | 前端未传 | ⬜ 接真订阅前补齐；模板 ID 仍待申请（M5） |
| 7 | **定时触发器** | 无 cron | 🟡 `scheduler.nudge` action 与逻辑已就绪；云侧 cron / 独立 scheduler 函数按环境配置 |
| 8 | **DeepSeek key** | 未配置 | ✅ 支持环境变量 `DEEPSEEK_API_KEY`（部署项，见后端 §15.1） |

**仍待人工**：订阅模板 ID、`sheet-subscribe` 配置、端到端模拟器/真机走查、体验版提审（见 §3 阶段 4～6 与仓库 `README.md`）。

## 2. 协作模式（开发者 × agent）

### 2.1 角色与权限边界

| 能力 | agent | 开发者 |
|---|---|---|
| 代码 / 配置 / 文档改动、git 提交 | ✅ | — |
| 本地单元测试 / 静态检查（`npm test`、node 脚本） | ✅ | — |
| 微信开发者工具 GUI 操作（导入、编译、真机预览、扫码登录） | ❌（无法操控 GUI） | ✅ |
| 微信公众平台操作（开通云开发、申请订阅模板、提审、发布） | ❌（账号/审核强认证） | ✅ |
| 云端账号级验证（登录态、云环境配额、发布状态） | ❌ | ✅ |

**铁律**：涉及账号、密钥、审核、发布的操作一律由开发者执行；agent 只提供清单、指令与代码，不代为触碰。

### 2.2 协作循环

```
开发者操作 → 反馈给 agent（报错/截图/Console 输出/复现步骤）
   → agent 分析定位 → 产出修复代码或下一步指令 → 开发者验证 → 循环
```

- **开发者反馈格式**（减少来回）：
  1. 操作步骤（在哪个页面/点按了什么）
  2. 现象（页面白屏 / 报错弹窗 / 无反应 / 数据不对）
  3. Console / Network 面板报错原文（尽量完整拷贝）
  4. 出现该问题的代码位置猜测（如有）
- **agent 产出格式**：修改文件清单 → 改动说明 → 开发者验证步骤 → 预期结果 → 失败时的下一步排查点。

### 2.3 开发者工具 CLI 桥接（agent 可自动化的部分）

微信开发者工具支持命令行调用，开发者需先在「设置 → 安全设置 → 服务端口」**开启服务端口**。开启后 agent 可通过终端调用（Windows 默认路径 `C:\Program Files (x86)\Tencent\微信web开发者工具\cli.bat`）：

| 命令 | 用途 | 阶段 |
|---|---|---|
| `cli.bat open --project <MealWise路径>` | 打开/编译项目 | 1 |
| `cli.bat preview --project <路径>` | 生成预览二维码（需开发者扫码） | 3/4 |
| `cli.bat auto-preview --project <路径>` | 自动预览 | 3/4 |
| `cli.bat upload --project <路径> -v 1.0.0 -d "说明"` | 上传体验版（需开发者确认） | 6 |

CLI 仅能「触发」动作，**扫码/登录/审核确认仍是开发者的活**。CLI 可用性依安装路径而定，首次由开发者确认路径后回写本计划。

### 2.4 检查点与提交规范

- 每个阶段收尾以 **git commit** 为锚点，提交信息标注阶段号（如 `feat(deploy): 阶段2 云数据库适配层`）。
- 契约相关改动（action 命名、字段）必须同步回写总计划 §1，否则不得合并。
- 每阶段结束由开发者按「验证点」清单验收，agent 记录结果到本计划 §3 对应阶段。

## 3. 阶段计划

### 阶段 0：环境准备（开发者为主）

| 项 | 负责人 | 说明 |
|---|---|---|
| 确认开发者工具已登录并开启服务端口 | 开发者 | 供后续 CLI 使用 |
| 开通云开发环境（创建环境，如 `mealwise-prod`） | 开发者 | 控制台「云开发」开通，记录环境 ID |
| 申请订阅消息模板 | 开发者 | 公众平台 → 功能 → 订阅消息，选「饮食打卡/体重记录」类模板，记录 template_id |

**验证点**：环境 ID 与 template_id 回填到本计划 §3 与前端配置。

### 阶段 1：Mock 验收（开发者操作 + agent 修 bug）

目标：在开发者工具模拟器里把 `MealWise/DEV_GUIDE.md` 的完整用户旅程（闪屏→授权→**chat-main 合并流**→体质 Sheet→Sheet 子流程）全部走通。

- **开发者**：按 [`MealWise/DEV_GUIDE.md`](../../../MealWise/DEV_GUIDE.md) 逐步操作，记录每个失败点。
- **agent**：收到反馈后修复前端代码；无法在本机重现的（真机/云环境相关）给排查指引。
- **验证点**：`app.json` 所列页面可达、交互无阻断性报错；Mock 与真实云函数切换符合预期。

### 阶段 2：云开发接入（agent 编码为主，开发者配置环境）

目标：前端真正调用云函数，数据落云数据库。

1. **agent**：
   - 新增云数据库适配层，替换 `MemoryDB`（对齐后端 §4 七集合 + 索引）。
   - 补齐 `index.js` 缺失 action（见 §1 待办 1），统一 action 命名并回写契约 C。
   - `index.js` 转 CommonJS（或提供 esbuild 打包脚本）；本地 `npm test` 保持通过。
   - 建云函数目录 `cloudfunctions/api`、`cloudfunctions/scheduler`，各带 `package.json`（零依赖内核 + `wx-server-sdk`）；`scheduler` 加 `config.json` 定时触发器（对齐后端 §9.1：早 08:30 / 午 13:00 / 晚 20:00 / 21:30）。
   - `project.config.json` 加 `cloudfunctionRoot`。
2. **开发者**：在开发者工具右键云函数目录 →「上传并部署（云端安装依赖）」；云开发控制台确认七集合创建与索引。
3. **前端切换**：agent 改 `app.js` 的 `wx.cloud.init({ env })`，并把 `USE_MOCK` 置 `false`（建议保留 `USE_MOCK` 开关便于回退）。

**验证点**：模拟器登录 → 调用真实云函数返回 `{ code:0, data }`；云开发控制台能看到落库记录。

### 阶段 3：真 LLM 接入（agent 编码 + 开发者配 key）

1. **开发者**：申请 DeepSeek API key（后端 M3 待办），在云开发控制台 → 云函数 → `api` 的环境变量写入 `DEEPSEEK_API_KEY`。
2. **agent**：确认 `llm/client.js` 从环境变量读取 key、走 `deepseek-chat` + JSON mode；检查契约 B 解析降级路径（`budget_remaining_kcal` null 兜底、`off_topic` 拒绝等）。
3. **联调**：模拟器输入真实饮食/体重/情绪语句，核对 `extracted` 落库正确性；开发者可配 CLI `auto-preview` 真机验证。

**验证点**：真实 LLM 回复自然、结构化输出被正确解析落库、预算提示语一致。

### 阶段 4：订阅消息（开发者申请 + agent 接入）

1. **开发者**：确认阶段 0 申请的模板可用，提供 template_id。
2. **agent**：前端 `sheet-subscribe` 硬编码模板 ID；`reportSubscribe` 补齐 `template_key`（销项 §1 待办 6）；核对 `chat.send` 返回 `subscribe_hint` 触发授权的逻辑。
3. **真机验证**：开发者真机授权一次 → 触发一次推送，确认收到。

**验证点**：授权 1 次 = 收到 1 条；额度耗尽后 `subscribe_hint=true` 引导再次授权；拒绝授权（43101）时前端降级提示。

### 阶段 5：定时督促（agent 配置 + 开发者验证）

1. **agent**：确认 `scheduler` 云函数触发器 cron 正确；先用 `dryRun` 空跑一轮（后端已有 `scripts/nudge-dryrun.js`），核对 `notify_log` 落库。
2. **开发者**：真机跨日验证四个时段推送到达与文案。

**验证点**：定时触发正常、`notify_log` 有记录、失联分级（§3.2）在额度内执行。

### 阶段 6：上线（开发者为主）

1. **agent**：给出提审清单（隐私协议、用户协议、内容合规自查；`sitemap.json`、`project.config.json` 检查）。
2. **开发者**：开发者工具「上传」→ 公众平台提交审核 → 发布；建议先发体验版小范围灰度。
3. **agent**：上线后按商业计划 §2 指标核对埋点可用性（`users.onboarding_completed_at`、`diet_records.confidence` 等是否随业务落库）。

**验证点**：体验版/正式版可访问、订阅与云函数正常、埋点字段有数据。

## 4. 风险与回滚

| 风险 | 应对 |
|---|---|
| 云开发付费/配额超限 | 先按免费额度跑；监控消耗，超限即通知开发者评估 |
| 云函数冷启动慢 | 免费额度够 MVP 冷启；必要时预留并发或切换按量付费 |
| 真 LLM 结构化输出偶发不合 schema | 契约 B 已有降级解析；保留 Mock 开关 `USE_MOCK` 一键回退 |
| 订阅消息额度不足导致督促失效 | 按契约 C 的 `subscribe_hint` 引导再授权；额度耗尽降级小程序内催报卡片 |
| action 对齐遗漏导致部分接口 400 | 联调前先做「前端 api.js action 集合 × 后端 index.js action 集合」对照表，冻结后再动 |

## 5. 完成标准

- 7 页面全流程在模拟器与真机跑通，前端接真实云函数。
- 真 LLM 回复 + 结构化落库正确，记忆去重与预算口径符合契约 B/A。
- 订阅消息授权/发送、定时督促全链路验证通过。
- 体验版提审通过并发布；埋点字段随业务产生数据。
