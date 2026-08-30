# X教练（代号）项目规则

## 项目是什么

X教练：微信小程序减肥教练，人格"亦师亦友 + 一点毒舌"，通过聊天帮助"屡减屡败、有基础但缺监督"的人群靠谱瘦下来。MVP 为纯对话小程序，后端记录关键记忆点。

## 文档入口（唯一事实来源）

- 设计规格：`docs/superpowers/specs/2026-08-28-xcoach-design.md`
- 实施总计划（含接口契约）：`docs/superpowers/plans/2026-08-28-xcoach-master-plan.md`

## 目录规划

两条主线：`docs/` 只放"计划与规格"（要做什么）；`deliverables/` 放"各板块交付物"（做出来的东西）。agent 各板块的产出统一落 `deliverables/`，不与计划混放。

| 路径 | 用途 | 归属板块 |
|---|---|---|
| `docs/superpowers/specs/` | 设计规格 | — |
| `docs/superpowers/plans/` | 总计划 + 分板块计划 | — |
| `deliverables/frontend/` | 前端设计稿 / 小程序代码 | 板块1 前端 |
| `deliverables/prompt/` | 提示词成品（各场景提示词、结构化输出 schema） | 板块2 提示词 |
| `deliverables/backend/` | 后端方案 / 代码 / 数据库脚本 / 食物库 | 板块3 后端 |
| `deliverables/operations-business/` | 商业计划 / 运营方案 / 指标与埋点 | 板块4 运营商业 |
| `data/` | 跨板块共享数据（食物库基准数据，后端与提示词共用） | 板块2/3 |

- 命名约定：文档 `YYYY-MM-DD-xcoach-<主题>.md`；交付物子目录用英文短横线命名。
- 已完成迁移：
  - 板块2 提示词成品 → `deliverables/prompt/2026-08-28-xcoach-prompts.md`。
  - 板块1 前端设计稿 HTML 原型 → `deliverables/frontend/xcoach-frontend-design/`（2026-08-28，板块 1 会话已收尾；工具产物 `runtime-*.json` 保留为历史快照，其硬编码绝对路径不再用于修复流程）。
- 待迁移：无。

## 协作规则

1. 接口契约（数据模型 / 结构化输出 / 前后端接口）以总计划第 1 节为准，任何改动必须回写该文档。
2. 四板块（前端 / 提示词 / 后端 / 运营商业）可并行推进，各自交付物落到对应 `deliverables/<板块>/`，最后在总计划"汇总方式"下集成对账。
3. 中文撰写所有文档与交付物。
4. 目标用户、调性等核心决策以设计规格为准；需要变更时先更新设计规格，再同步总计划与各板块文档。