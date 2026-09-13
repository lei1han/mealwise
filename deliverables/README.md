# deliverables 目录说明

本目录存放三餐教练（MealWise）各板块的实际交付物（做出来的东西）。计划与规格类文档不在本目录，统一放在仓库根目录 `docs/superpowers/`（specs 为设计规格，plans 为实施计划）。

## 目录结构

| 目录 | 内容 | 归属板块 |
|---|---|---|
| `frontend/` | 前端设计稿与小程序代码 | 板块1 前端 |
| `prompt/` | 各场景提示词成品、结构化输出 schema | 板块2 提示词 |
| `backend/` | 后端方案、代码、数据库脚本、食物库 | 板块3 后端 |
| `operations-business/` | 商业计划、运营方案、指标与埋点 | 板块4 运营商业 |

跨板块共享数据（食物库基准数据，后端与提示词共用）放在仓库根目录 `data/`，不在本目录。

## frontend/（板块1 前端）

- `2026-08-29-xcoach-frontend-design-v1.md`：前端设计说明文档。
- `mealwise-frontend-design/`：HTML 高保真原型（v3），含设计系统（`colors_and_type*.css`）与各页面原型（登录、聊天、个人资料、统计、目标设置及各类底部弹层），`validation-report.json` 等工具产物为历史快照。
- `mealwise-frontend-design-v2-backup.zip`：v2 版设计稿备份。
- `mealwise-miniapp/`：微信小程序交付快照（页面、样式、工具函数等）。注意：实际开发运行的项目在仓库根目录 `MealWise/`（含 `miniprogram/` 与 `cloudfunctions/`），本目录为板块交付存档，前端样式改动需两边同步。

## prompt/（板块2 提示词）

- `2026-08-28-xcoach-prompts.md`：各场景提示词成品与结构化输出 schema（唯一事实来源）。

## backend/（板块3 后端）

- `2026-08-30-xcoach-db-verify.md`：数据库验证记录。
- `package.json`：依赖与脚本入口。
- `scripts/`：运维与演示脚本（数据库初始化 `setup-db.js`、聊天演示 `demo-chat.js`、食物库基准测试 `foods-benchmark.js` / `foods-calib-benchmark.js`、提醒推送空跑 `nudge-dryrun.js`）。
- `src/`：后端源码 —— 数据库适配（`db/`）、领域逻辑（`domain/`，含预算、食物、引导、常量）、LLM 客户端与解析（`llm/`）、对话记忆（`memory/`）、服务层（`services/`，聊天 / 配置 / 会话 / 提醒 / 用户）、入口 `index.js` 与调度器 `scheduler.js`。
- `src/data/`：食物库数据（`foods.json`）与食物校准数据（`food-calib.json`）。
- `test/`：自动化测试（API、聊天、云端、配置、数据库、解析器）。

## operations-business/（板块4 运营商业）

- `2026-08-28-xcoach-business-plan.md`：商业计划。
- `2026-08-28-xcoach-contract-a-proposal.md`：合同 A 提案。
- `2026-09-02-mealwise-tuning-report/`：小版本调优分析报告（HTML 版）。

## 命名约定

- 产品中文名「三餐教练」，英文名「MealWise」；客户侧文案用中文名，代码标识用 `mealwise`。
- 文档命名：`YYYY-MM-DD-xcoach-<主题>.md`；交付物子目录用英文短横线命名。
- 所有文档与交付物以中文撰写。
