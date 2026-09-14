# 三餐教练（MealWise）

微信小程序减肥教练：人格「亦师亦友 + 一点毒舌」，通过对话帮助有基础但缺监督的用户靠谱减重。MVP 为纯对话 + 后端记忆落库。

## 仓库怎么读

| 路径 | 用途 |
|------|------|
| [`docs/superpowers/`](docs/superpowers/) | **计划与规格**（要做什么、接口契约） |
| [`deliverables/`](deliverables/) | **各板块交付物**（设计稿、提示词、后端快照、商业计划） |
| [`MealWise/`](MealWise/) | **唯一运行工程**（微信开发者工具导入此目录） |
| [`AGENTS.md`](AGENTS.md) | Cursor / Cloud Agent 协作规则 |

新人建议阅读顺序：本页 → [设计规格](docs/superpowers/specs/2026-08-28-xcoach-design.md) → [实施总计划 §1 契约](docs/superpowers/plans/2026-08-28-xcoach-master-plan.md) → [交付物索引](deliverables/README.md) → [小程序工程说明](MealWise/README.md)。

## 文档入口（事实来源）

| 主题 | 文档 |
|------|------|
| 产品决策与人设 | `docs/superpowers/specs/2026-08-28-xcoach-design.md` |
| 跨板块接口契约 A/B/C | `docs/superpowers/plans/2026-08-28-xcoach-master-plan.md` §1 |
| 提示词与结构化输出（契约 B） | `deliverables/prompt/2026-08-28-xcoach-prompts.md` |
| 数据库 Schema（工程冻结） | `MealWise/cloudfunctions/api/src/db/schema.js` |
| 前端视觉版本对齐 | `deliverables/frontend/2026-09-14-xcoach-frontend-visual-version.md` |
| 联调与部署阶段计划 | `docs/superpowers/plans/2026-08-28-xcoach-dev-deploy-plan.md` |
| 商业与指标 | `deliverables/operations-business/2026-08-28-xcoach-business-plan.md` |

## 工程现状（摘要）

- **小程序**：`MealWise/miniprogram/` — 12 个页面（聊天、统计、个人资料、目标与各类 Sheet 等），见 `app.json`。
- **云函数**：`MealWise/cloudfunctions/api/` — 单函数 `api`，action 路由对齐契约 C；内核测试 `npm test` **32/32**。
- **前端联调**：`miniprogram/utils/api.js` 中 `REAL_ACTIONS` 已覆盖主要 action；`USE_MOCK` 为总开关，白名单内 action 可走真实云函数。
- **后端快照**：`deliverables/backend/` 为板块交付存档，**运行与改代码以 `MealWise/cloudfunctions/api/src` 为准**，合并后需手动同步快照（见 `deliverables/README.md`）。
- **食物库数据**：`MealWise/cloudfunctions/api/src/data/foods.json`（与 `deliverables/backend/src/data/` 同源设计；仓库未单独维护根目录 `data/`）。

## 发布前检查（人工）

- [ ] 订阅消息模板 ID 写入 `sheet-subscribe`（当前占位为空，见后端计划 M5）
- [ ] `subscribe.report` 上报 `template_key`（商业计划 §8 已记录）
- [ ] 模拟器 / 真机端到端走查（摸底、报餐、跨会话历史）
- [ ] 隐私政策覆盖体重/饮食/情绪及 LLM 处理说明
- [ ] 云函数环境变量 `DEEPSEEK_API_KEY`（真 LLM）

## 命名约定

- 产品中文名「三餐教练」，英文名 MealWise；用户可见文案用中文，代码标识用 `mealwise`。
- 计划文档：`docs/.../YYYY-MM-DD-xcoach-<主题>.md`；交付物目录用英文短横线。
