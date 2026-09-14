# 三餐教练（MealWise）Agent 执行计划

- 文档类型：Agent 可自动化任务顺序（代码 / 测试 / 文档）
- 版本：v1.0
- 日期：2026-09-14
- 人工清单（并行、不替代）：`deliverables/operations-business/2026-09-14-mealwise-human-checklist.md`
- 依据：调优报告 P0–P2、`docs/superpowers/plans/2026-08-28-xcoach-backend.md` §15、提示词成品 `deliverables/prompt/2026-08-28-xcoach-prompts.md`

> **范围**：仅 `MealWise/cloudfunctions/api/` 与必要的前端契约改动；改 action 或契约字段时回写总计划 §1。

---

## 执行状态总览

| 阶段 | 主题 | 状态 |
|------|------|------|
| 1 | P0 提示词与食物库注入 | 🔄 进行中 |
| 2 | P1 体重结构化 + 降级补记 + 子提示词挂载 | ⏳ 待开始 |
| 3 | P2 体验迭代（总结/摸底动线） | ⏳ 待开始 |
| 4 | 文档与快照同步 | ⏳ 待开始 |

---

## 阶段 1：P0（功能正确性，必须先做）

**目标**：饮食估算能用库内 `food_refs`；内容安全与 `off_topic` 对齐契约 B。

| 序 | 任务 | 产出 | 验收 |
|---|------|------|------|
| 1.1 | `foods.js` 增加 `formatFoodDbHint()`，从 `foods.json` 生成注入文本 | 函数 + 单测或现有测试覆盖 | 清单含 51 项、`food:{id}` 可解析 |
| 1.2 | 扩 `chat.js` 默认系统模板（对齐提示词 §2 人格/语气/话题边界） | `DEFAULT_CHAT_SYSTEM_TEMPLATE` | 与 §2 语义一致，占位符仍用 `{name}` |
| 1.3 | 挂载 §4 饮食估算段（含 `{food_db_hint}`）；`app_config` 覆盖时仍追加饮食+安全段（防漏注入） | `_buildSystem()` | 报午餐倾向 `food:rice` 等而非全 external |
| 1.4 | 挂载 §9.1 + §9.2 内容安全/跑题拒绝 | 常量块 | 跑题 intent=`off_topic` |
| 1.5 | `OUTPUT_CONTRACT` 增加 `off_topic` 枚举与口径 | 与总计划 §1.2 一致 | parser/既有测试通过 |
| 1.6 | 同步 `deliverables/backend/src` 同源文件；`npm test` 全绿 | commit | 32+ tests pass |
| 1.7 | 更新 `MealWise/README.md` action 列表（消除「仅 3 action」过时描述） | 文档 | 与契约 C 一致 |

**阶段 1 完成后通知人工**：重做人工清单 **B7** 三条回归 + **A4** 重新部署云函数。

---

## 阶段 2：P1（数据一致性与提示词完整性）

**目标**：体重不靠 LLM 抽数；降级可补记；场景子提示词按阶段挂载。

| 序 | 任务 | 产出 | 验收 |
|---|------|------|------|
| 2.1 | 新增 action `weight.report`（结构化体重落库 + 教练确认话术） | `index.js` + 服务方法 | 回写总计划 §1.3 契约 C |
| 2.2 | 前端 `sheet-weight`（日常体重模式）走 `weight.report` | `miniprogram/utils/api.js` + 页面 | 体重误差稳定 |
| 2.3 | LLM `degraded` 时存用户原文 + 标记；下轮成功时教练补记 | `chat.js` / `messages` 字段 | 坏 JSON 后可恢复 |
| 2.4 | 按 `onboarding_state` / `goal_stage` 挂 §3 摸底子提示词 | `_buildSystem` 或独立段 | profiling 话术加强 |
| 2.5 | 情绪关键词或 intent 预判挂 §5（轻量规则即可） | 同上 | mood_talk 更共情 |
| 2.6 | `app_config` 默认兜底与代码默认模板对齐（调优报告「额外建议」） | `config.js` 或文档说明 | 运营改配置无跳变 |
| 2.7 | 测试 + `deliverables/backend` 同步 + commit | — | `npm test` 全绿 |

**阶段 2 完成后通知人工**：**B4–B6** 全量走查。

---

## 阶段 3：P2（可首版后）

| 序 | 任务 | 说明 |
|---|------|------|
| 3.1 | `scheduler` 独立云函数 + cron（若仍合在 `api` 则补 `config.json` triggers） | 依赖人工 **C1** template_id |
| 3.2 | 22:00 一日总结（`scheduler.summary` 或扩 `nudge`） | 产品 §6 子提示词 |
| 3.3 | 摸底改气泡问卷，减少 `open_weight_sheet` 跳转 | 大改交互，单开 PR |
| 3.4 | 前端 `sheet-subscribe` template_id + `template_key` 上报 | 依赖 **C1** |

---

## 阶段 4：文档与计划维护

| 序 | 任务 |
|---|------|
| 4.1 | 部署计划 §1「已知待办」表中过时项标注已销项（9 action 已落地等） |
| 4.2 | 后端计划 §15.1 M5/M4 勾选状态随人工反馈更新 |
| 4.3 | 本执行计划「执行状态总览」随阶段更新 |

---

## Git / PR 约定

- 分支：`cursor/<主题>-9d7d`
- 每阶段至少 1 commit；阶段 1 完成即 push 并开/更新 PR
- 提交信息示例：`feat(mealwise): P0 食物库与内容安全提示词注入`

---

## 变更记录

| 日期 | 说明 |
|------|------|
| 2026-09-14 | 初版；阶段 1 启动 |
