# 前端与视觉 — 当前版本对齐说明

- 文档类型：资料索引（非设计定稿替换）
- 日期：2026-09-14
- 目的：消除「设计说明 v1 / HTML v3 / 视觉 v4 / 小程序工程」多条线并行时的误读

## 版本线概览

| 资产 | 版本 / 日期 | 路径 | 说明 |
|------|-------------|------|------|
| 设计交付说明 | v1.0 · 2026-08-29 | `2026-08-29-xcoach-frontend-design-v1.md` | 信息架构与交互定稿叙述；配色引用 **visual v2** |
| HTML 高保真原型 | v3 页面命名 | `mealwise-frontend-design/pages/*-v3.html` | 当前设计稿主目录；含 `colors_and_type_v3.css` |
| 视觉规格 | v2 / v3 / v4 | `docs/superpowers/specs/2026-08-28-xcoach-visual-design-v2.md` 等 | v2 为 v1 文档依赖；v3/v4 为后续配色迭代探索（`color-scheme-options-v3/v4.html`） |
| 小程序快照 | 冻结 · 2026-08 | `mealwise-miniapp/` | **不再维护**；页面少于工程 |
| 运行工程 | 持续迭代 | `MealWise/miniprogram/` | **唯一开发目录**；12 页，鼠尾草绿主题见 `app.wxss` |

## 以谁为准

| 问题 | 答案 |
|------|------|
| 接口与状态机 | 总计划 §1.3 契约 C + `MealWise/miniprogram/utils/api.js` |
| 页面有哪些 | `MealWise/miniprogram/app.json` |
| 视觉 Token | 工程 `app.wxss`；对照 HTML `mealwise-frontend-design/colors_and_type_v3.css` |
| 旧版双聊天页（onboarding + daily） | 已合并为 `chat-main`（2026-08-30 决策，见总计划 §1.3） |

## 后续文档维护建议

- 大改交互时：更新 `2026-08-29-xcoach-frontend-design-v1.md` 或新增 `v2` 设计说明，并在本文件增一行版本表。
- 仅改配色：优先更新 visual spec 与 HTML 原型，再同步 `MealWise/miniprogram/app.wxss`。
