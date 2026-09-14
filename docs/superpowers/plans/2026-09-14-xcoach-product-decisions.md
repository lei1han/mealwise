# 三餐教练 产品决策与待办挂起项

- 文档类型：产品决策记录（Decision Log）
- 版本：v1.0
- 日期：2026-09-14
- 决策者：产品负责人（会话确认）
- 消费方：各板块实施、[`MealWise/`](../../../MealWise/) 工程、后续 agent 会话

> 本文记录已确认决策与「挂起待办」；与总计划契约冲突时，以**本文 + 回写后的设计规格/总计划**为准。

---

## 1. 已确认决策

| # | 议题 | 决策 | 对工程的影响 |
|---|------|------|----------------|
| 1 | MVP 是否包含订阅消息 + 定时督促（M5） | **否（1B）** | M5 移出 MVP 上线门槛；[`dev-deploy-plan`](2026-08-28-xcoach-dev-deploy-plan.md) 阶段 4/5 标为「后续版本」；内核 `subscribe.report` / `scheduler.nudge` 保留，不删代码 |
| 2 | 视觉主题（v4 五方案 vs 当前鼠尾草绿） | **挂起** | 见 §2.1；在挂起解除前维持 `MealWise/miniprogram/app.wxss` 现有令牌 |
| 3 | 2026-09-02 调优报告（提示词/食物库 gap） | **挂起，另开专题** | 见 §2.2；提审（决策 6）前需专题结论，默认不自动开工 |
| 4 | `USE_MOCK` 全局开关 | **待定** | 维持现状：`USE_MOCK=true` + `REAL_ACTIONS` 全量白名单，直至 E2E 验收后单独确认 |
| 5 | 授权后资料完善 | **纳入 MVP（5B）** | 撤销总计划 2026-09-01「暂不启用资料完善步」；登录后须完成**昵称 + 头像**（微信 `chooseAvatar` + `input type="nickname"`）再进聊天；后端仍走 `auth.login` 回填（仅空字段写）。**实现待排期**，见 §3 |
| 6 | 上线与合规 | **6C** | 功能与调优专题（§2.2）完成后再提审；隐私/用户协议在提审前准备 |
| 7 | 文档治理 | **7A** | 设计规格/计划状态对齐、过时段落归档或更新、工程 README 与 dev-deploy §1 同步（2026-09-14 执行） |

---

## 2. 挂起待办（专题 / 待定）

### 2.1 视觉 v4 选型（挂起）

- **触发条件**：产品选定 v4 五方案之一（或维持现状并正式「不迁移」）。
- **参考**：[2026-09-01-xcoach-visual-design-v4.md](../specs/2026-09-01-xcoach-visual-design-v4.md)；HTML 备选 [`deliverables/frontend/color-scheme-options-v4.html`](../../../deliverables/frontend/color-scheme-options-v4.html)。
- **解除挂起时交付**：更新设计令牌 → `MealWise` 样式与原型对账。

### 2.2 调优报告实现债（已拍板 · 2026-09-14 推荐套餐已落地）

- **决策**：[调优专题议程 §5](2026-09-14-xcoach-tuning-topic-agenda.md)（S1+部分S2、P0/P1-Full、`weight.report` 等）。
- **工程**：`promptAssembly.js`、`chat.js` 提示词组装、`weight.report`、前端 `sheet-weight` 结构化上报；`npm test` 38/38。
- **提审前**：模拟器走查 T1–T5（见议程 §4）。

### 2.3 `USE_MOCK`（待定）

- 在模拟器/真机 E2E 通过后，选择 `USE_MOCK=false` 或保持灰度策略；变更时更新 [`MealWise/README.md`](../../../MealWise/README.md)。

---

## 3. MVP 资料完善（决策 5B · 待开发清单）

当前工程：`auth-login` 授权手机号后**直接进入聊天**；[`profile-edit`](../../../MealWise/miniprogram/pages/profile-edit/) 存在但未接入登录主路径。

**目标动线（设计规格已回写）**：

1. 闪屏 → 授权登录（手机号，可跳过策略保持与现网一致）。
2. **若** `nickname` 或 `avatar_url` 为空 → 资料完善步（昵称 + 头像，可选复用 `profile-edit` 精简版或独立页）。
3. 调用 `auth.login` 携带 `nickname` / `avatarUrl`（头像上传云存储 fileID）→ 进入聊天 / 摸底。

**验收**：新用户完成资料后教练侧可展示头像（`app.config` 教练头像与用户头像区分）；仅空字段写、不换绑手机号。

---

## 4. 文档变更索引（2026-09-14）

| 文档 | 变更摘要 |
|------|----------|
| [设计规格 v1.3](../specs/2026-08-28-xcoach-design.md) | 状态、MVP 范围、登录动线、§11 刷新 |
| [总计划](2026-08-28-xcoach-master-plan.md) | §2.1 汇总走查、契约 C 资料完善、M5 与 MVP 关系 |
| [dev-deploy v1.1](2026-08-28-xcoach-dev-deploy-plan.md) | §1 现状同步、工程目录改为 `MealWise/` |
| [后端计划](2026-08-28-xcoach-backend.md) | 状态、M5 与 MVP、auth 表述 |
| [MealWise/README.md](../../../MealWise/README.md) | 页面/action/联调说明 |
| [docs/superpowers/README.md](../README.md) | 文档索引与过时说明 |
