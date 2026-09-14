# 板块 1：前端设计

- 文档类型：分板块实施计划（Frontend）
- 版本：v1.0
- 日期：2026-08-28
- 依赖：设计规格 `../specs/2026-08-28-xcoach-design.md`、总计划 `2026-08-28-xcoach-master-plan.md`
- 依赖契约：契约 C（前后端接口）、契约 A（数据模型）

---

## 1. 目标

产出一个"纯对话"微信小程序 MVP 的完整前端方案：页面、交互、视觉、订阅消息授权，以及按接口契约封装的调用层。

## 2. 交付物清单

> 已执行完毕，成品见 [`../../../deliverables/frontend/2026-08-29-xcoach-frontend-design-v1.md`](../../../deliverables/frontend/2026-08-29-xcoach-frontend-design-v1.md)（设计说明 v1.0）、[`../../../deliverables/frontend/mealwise-frontend-design/`](../../../deliverables/frontend/mealwise-frontend-design/)（HTML 原型 v3）、[`../../../deliverables/frontend/2026-09-14-xcoach-frontend-visual-version.md`](../../../deliverables/frontend/2026-09-14-xcoach-frontend-visual-version.md)（版本对齐）。**运行工程**在 [`../../../MealWise/`](../../../MealWise/)；[`mealwise-miniapp/`](../../../deliverables/frontend/mealwise-miniapp/) 为冻结快照。

- [x] 页面清单与信息架构（导航流）
- [x] 新用户 Onboarding 流程设计（摸底 → 定标 → 开始）
- [x] 主聊天页交互稿（气泡、输入框、催报状态展示）
- [x] 体重/目标录入、毒舌档位选择等子流程
- [x] 订阅消息授权引导与降级方案
- [x] 视觉规范与教练形象（头像/配色/语气化文案）
- [x] 接口调用层封装（按契约 C，可先用 mock 数据跑通）

## 3. 关键任务

1. 状态机：`未开始 → 摸底中 → 定标中 → 执行中`，前端据此切换引导与聊天。
2. 聊天体验：输入、历史加载、教练"正在输入"态、长文案分片。
3. 主动督促的呈现：小程序内催报卡片 + 订阅消息外链回流。
4. 视觉：贴"亦师亦友 + 一点毒舌"的人设（克制、可信、带一点损）。

## 4. 依赖与完成标准

- 依赖：契约 C（接口）、契约 A（字段）。
- 完成标准：核心链路（注册 → 摸底 → 定标 → 每日汇报 → 收到热量区间回复）可用 mock 走通；提交设计稿/说明文档。