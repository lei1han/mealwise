# 三餐教练（MealWise）文档索引

计划与规格的唯一目录（交付物代码在仓库根目录 [`deliverables/`](../../deliverables/) 与 [`MealWise/`](../../MealWise/)）。

## 必读（单一事实来源）

| 文档 | 用途 |
|------|------|
| [2026-08-28-xcoach-design.md](specs/2026-08-28-xcoach-design.md) | 产品设计规格 |
| [2026-08-28-xcoach-master-plan.md](plans/2026-08-28-xcoach-master-plan.md) | 实施总计划 + **契约 A/B/C** |
| [2026-09-14-xcoach-product-decisions.md](plans/2026-09-14-xcoach-product-decisions.md) | **产品决策与挂起待办**（2026-09-14 起） |

## 分板块计划

| 板块 | 计划 | 交付物 |
|------|------|--------|
| 前端 | [2026-08-28-xcoach-frontend.md](plans/2026-08-28-xcoach-frontend.md) | [`deliverables/frontend/`](../../deliverables/frontend/) |
| 提示词 | [2026-08-28-xcoach-prompt.md](plans/2026-08-28-xcoach-prompt.md) | [`deliverables/prompt/`](../../deliverables/prompt/) |
| 后端 | [2026-08-28-xcoach-backend.md](plans/2026-08-28-xcoach-backend.md) | [`deliverables/backend/`](../../deliverables/backend/)（快照；运行时代码以 `MealWise/cloudfunctions/api` 为准） |
| 运营商业 | [2026-08-28-xcoach-operations-business.md](plans/2026-08-28-xcoach-operations-business.md) | [`deliverables/operations-business/`](../../deliverables/operations-business/) |

## 落地联调

- [2026-08-28-xcoach-dev-deploy-plan.md](plans/2026-08-28-xcoach-dev-deploy-plan.md) — 微信开发者工具 / 云开发 / 提审阶段（**工程目录：`MealWise/`**）

## 视觉规范（历史层级）

| 版本 | 文件 | 说明 |
|------|------|------|
| v2 | [2026-08-28-xcoach-visual-design-v2.md](specs/2026-08-28-xcoach-visual-design-v2.md) | 已被 v3/v4 取代，仅作考古 |
| v3 | [2026-09-01-xcoach-visual-design-v3.md](specs/2026-09-01-xcoach-visual-design-v3.md) | 对齐 HTML 原型 v3 |
| v4 | [2026-09-01-xcoach-visual-design-v4.md](specs/2026-09-01-xcoach-visual-design-v4.md) | 低饱和暖调五方案；**选型挂起**，见决策记录 §2.1 |

当前小程序实现主题见 `MealWise/miniprogram/app.wxss`（鼠尾草绿），与 v4 未强制对齐。

## 过时内容处理原则

- 总计划 §1.3 内**带日期的增量注记**优先于旧段落；若 dev-deploy §1 与总计划冲突，以总计划 + [决策记录](plans/2026-09-14-xcoach-product-decisions.md) 为准。
- [`deliverables/frontend/mealwise-miniapp/`](../../deliverables/frontend/mealwise-miniapp/) 为冻结快照，**不再维护**；开发一律在 `MealWise/`。
